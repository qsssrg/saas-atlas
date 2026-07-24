#!/usr/bin/env python3
"""SaaS Atlas ブログ 半自動化オーケストレータ（3c）。

topic選定 → Claude執筆 → 2軸レビュー(内容/SEO、閾値まで最大N周改稿) →
専任ファクトチェック(high残存は1回改稿→再検証) → 重複チェック →
**人間承認ゲート**（data/review/pending_<slug>.md 保存 ＋ Slack #ai-daily 通知）。

自動公開はしない（BLOG_REQUIRE_APPROVAL 既定=1）。承認は blog_approve.py。
LaunchAgent com.lifelog.saas-atlas-blog から毎日呼ばれる想定。

閾値(env上書き可): CONTENT>=8.0 / SEO>=8.0 / 最大3周 / 類似度>=0.6で保留。
"""

import json
import os
import re
import subprocess
import sys
import urllib.request
from datetime import date

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE, "scripts"))
sys.path.insert(0, os.path.expanduser("~/claudecode"))

import blog_generate as gen          # noqa: E402
import blog_review as rev            # noqa: E402
import blog_factcheck as fc          # noqa: E402

REVIEW_DIR = os.path.join(BASE, "data", "review")
BLOG_DIR = os.path.join(BASE, "src", "content", "blog")

CONTENT_TH = float(os.environ.get("BLOG_CONTENT_THRESHOLD", "8.0"))
SEO_TH = float(os.environ.get("BLOG_SEO_THRESHOLD", "8.0"))
MAX_ROUNDS = int(os.environ.get("BLOG_MAX_ROUNDS", "3"))
SIM_TH = float(os.environ.get("BLOG_SIM_THRESHOLD", "0.6"))
REQUIRE_APPROVAL = os.environ.get("BLOG_REQUIRE_APPROVAL", "1") != "0"

SLACK_CHANNEL = os.environ.get("SAAS_BLOG_SLACK_CHANNEL", "#ai-daily")
SLACK_MENTION = os.environ.get("SAAS_BLOG_SLACK_MENTION", "<@U03CLR674N9>")


def log(m):
    print(m, flush=True)


def slack(text):
    try:
        token = subprocess.run(
            ["security", "find-generic-password", "-a", "lifelog", "-s", "SLACK_BOT_TOKEN", "-w"],
            capture_output=True, text=True, check=True).stdout.strip()
    except subprocess.CalledProcessError:
        log("Slack token なし、通知スキップ")
        return
    payload = json.dumps({"channel": SLACK_CHANNEL, "text": f"{SLACK_MENTION}\n{text}",
                          "unfurl_links": False}).encode("utf-8")
    req = urllib.request.Request("https://slack.com/api/chat.postMessage", data=payload,
                                 headers={"Authorization": f"Bearer {token}",
                                          "Content-Type": "application/json; charset=utf-8"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            ok = json.loads(r.read().decode("utf-8")).get("ok")
            log(f"Slack {SLACK_CHANNEL}: {ok}")
    except Exception as e:
        log(f"Slack error: {e}")


def save(kind, slug, md):
    os.makedirs(REVIEW_DIR, exist_ok=True)
    p = os.path.join(REVIEW_DIR, f"{kind}_{slug}.md")
    with open(p, "w", encoding="utf-8") as f:
        f.write(md)
    return p


# ── 重複チェック（既存記事とのタイトル/タグ Jaccard）──────────
def jaccard(a, b):
    a, b = set(a), set(b)
    return len(a & b) / len(a | b) if (a | b) else 0.0


def similar_to_existing(title, tags):
    if not os.path.isdir(BLOG_DIR):
        return None
    tset = set(re.findall(r"[a-z0-9]+", title.lower())) | {t.lower() for t in tags}
    for f in os.listdir(BLOG_DIR):
        if not f.endswith(".md"):
            continue
        raw = open(os.path.join(BLOG_DIR, f), encoding="utf-8").read()
        m = re.search(r"title:\s*(.+)", raw)
        tg = re.search(r"tags:\s*\[([^\]]*)\]", raw)
        ex = set()
        if m:
            ex |= set(re.findall(r"[a-z0-9]+", m.group(1).lower()))
        if tg:
            ex |= {x.strip().lower() for x in tg.group(1).split(",")}
        if jaccard(tset, ex) >= SIM_TH:
            return f
    return None


def main():
    tools = gen.load_tools()
    topic = gen.pick_topic(tools)
    if not topic:
        log("候補トピックなし（全て公開済み？）")
        return
    log(f"Topic: {topic['title']} (slug {topic['slug']})")
    facts, pool = gen.facts_for(topic, tools)

    # 1) 執筆
    log("執筆中(Claude)…")
    article = gen.call_claude(topic, facts, topic["category"])

    # 2) 2軸レビュー → 閾値まで改稿
    best = None
    for r in range(1, MAX_ROUNDS + 1):
        md = gen.to_markdown(article, topic)
        review = rev.review(md)
        cs, ss = review["content_score"], review["seo_score"]
        log(f"round {r}: content={cs} seo={ss}")
        if best is None or (cs + ss) > best[0]:
            best = (cs + ss, article, review)
        if cs >= CONTENT_TH and ss >= SEO_TH:
            break
        if r < MAX_ROUNDS:
            log("  改稿(review fixes)…")
            article = gen.revise_claude(article, facts, topic["category"],
                                        review_fixes=review.get("must_fix"))
    _, article, review = best
    if not (review["content_score"] >= CONTENT_TH and review["seo_score"] >= SEO_TH):
        p = save("escalated", topic["slug"], gen.to_markdown(article, topic))
        slack(f":warning: *ブログ生成: 品質未達で保留* — {topic['title']}\n"
              f"content={review['content_score']} seo={review['seo_score']}（閾値 {CONTENT_TH}/{SEO_TH}）\n"
              f"ドラフト: `{p}`")
        log("品質未達 → escalated 保存・通知")
        return

    # 3) 専任ファクトチェック（high残存は1回改稿→再検証）
    log("ファクトチェック(gpt-4o)…")
    result = fc.factcheck(article["body"], facts)
    highs = [i for i in result.get("issues", []) if i.get("severity") == "high"]
    if highs:
        log(f"  high {len(highs)}件 → 1回改稿")
        article = gen.revise_claude(article, facts, topic["category"], factcheck_issues=highs)
        result = fc.factcheck(article["body"], facts)
        highs = [i for i in result.get("issues", []) if i.get("severity") == "high"]
    if highs:
        p = save("factcheck", topic["slug"], gen.to_markdown(article, topic))
        detail = "\n".join(f"・{i['claim']} → {i['fix']}" for i in highs[:5])
        slack(f":warning: *ブログ生成: 事実確認で保留* — {topic['title']}\n{detail}\nドラフト: `{p}`")
        log("ファクトチェックhigh残存 → factcheck 保存・通知")
        return

    # 4) 重複チェック
    dup = similar_to_existing(article["title"], article.get("tags", []))
    if dup:
        p = save("held_similar", topic["slug"], gen.to_markdown(article, topic))
        slack(f":warning: *ブログ生成: 既存記事と類似で保留* — {topic['title']}\n類似: `{dup}`\nドラフト: `{p}`")
        log(f"類似({dup}) → held_similar 保存・通知")
        return

    # 5) 人間承認ゲート
    md = gen.to_markdown(article, topic)
    if REQUIRE_APPROVAL:
        p = save("pending", topic["slug"], md)
        slack(
            f":memo: *ブログ承認依頼* — {article['title']}\n"
            f"品質 content={review['content_score']}/seo={review['seo_score']}・事実確認OK・重複なし（{len(pool)}ツール素材）\n"
            f"承認: `cd ~/saas-atlas && python3 scripts/blog_approve.py {topic['slug']}`\n"
            f"却下: `rm {p}`\n"
            f"ドラフト: `{p}`"
        )
        log(f"承認待ち → {p}")
    else:
        save("pending", topic["slug"], md)
        log("承認不要モード（未対応の自動公開は blog_approve に委譲）")


if __name__ == "__main__":
    main()
