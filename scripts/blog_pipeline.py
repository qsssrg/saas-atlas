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
import blog_seo_facts as seo_facts   # noqa: E402  機械で測れるSEO要件（ハードゲート）

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
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--news", default="", help="ニュース本文（指定時はニュース起点で記事化）")
    ap.add_argument("--news-file", default=None)
    ap.add_argument("--url", default="")
    args, _ = ap.parse_known_args()
    news = args.news
    if args.news_file:
        news = open(os.path.expanduser(args.news_file), encoding="utf-8").read()

    if news:
        # ── ニュース起点（ai-daily選択→記事化）──
        # facts=ニュース本文。tools は使わない（SaaS比較と繋がらなくても記事化する方針）。
        topic = gen.news_topic(news, args.url)
        facts, pool = news, []
        rev_system = gen.WRITER_SYSTEM_NEWS  # 改稿もニュース用システムで（/tools/捏造を防ぐ）
        seo_th = float(os.environ.get("BLOG_NEWS_SEO_THRESHOLD", "7.5"))  # news記事はSEO閾値を緩める
        log(f"News topic: {topic['title']} (slug {topic['slug']})")
        log("執筆中(Claude・news-analysis)…")
        article = gen.call_claude_news(news, args.url, topic)
    else:
        # ── 常緑カタログ駆動（従来）──
        tools = gen.load_tools()
        topic = gen.pick_topic(tools)
        if not topic:
            log("候補トピックなし（全て公開済み？）")
            return
        log(f"Topic: {topic['title']} (slug {topic['slug']})")
        facts, pool = gen.facts_for(topic, tools)
        rev_system = None  # カタログ用（既定 WRITER_SYSTEM）
        seo_th = SEO_TH    # カタログ記事は従来閾値
        log("執筆中(Claude)…")
        article = gen.call_claude(topic, facts, topic["category"])

    # 2) 品質ゲート（2026-08-01 全面見直し）
    #
    # 旧: LLMの content_score/seo_score が閾値(8.0/8.0)を超えるまで最大3周改稿し、
    #     超えなければ escalated に捨てる。
    # 実測で判明した問題:
    #   ・content は観測全件が 8.0、seo は 7.0 か 9.0 の二値＝**判別力がない**
    #   ・落ちた原稿と通った記事で、リンク数・語数・見出し数が同一
    #   ・公開済み記事を再採点すると 7.0 で落ちる（＝合否が再現しない）
    #   ・毎回「内部リンクをもっと」と定型で言われ、既に11本あるので**改稿で直せない**
    #   ・当たりを決めていたのは**文体**（how-to/体験型=9.0、Q&A/エッセイ/物語=7.0）
    #     ＝「文体に幅を持たせる」方針とゲートが正面衝突していた
    # 新方針:
    #   ハードゲート = 機械で測れるSEO要件（blog_seo_facts）。落ちたら具体値を出して改稿。
    #   LLMレビュー  = 助言。must_fix を1回の改稿に使い、スコアは記録するが**合否に使わない**。
    #   本当の品質担保は この後の 専任ファクトチェック（誤情報を止める）と 人間承認 が担う。
    review = None
    mech_bad = []
    for r in range(1, MAX_ROUNDS + 1):
        md = gen.to_markdown(article, topic)
        mech = seo_facts.measure(md)
        mech_bad = seo_facts.check(mech)
        if review is None:                      # LLMレビューは1回だけ（助言用）
            review = rev.review(md)
            log(f"round {r}: content={review['content_score']} seo={review['seo_score']} "
                f"(参考値・合否には使わない) / 機械チェック未達={len(mech_bad)}件")
        else:
            log(f"round {r}: 機械チェック未達={len(mech_bad)}件")
        if not mech_bad:
            break
        for b in mech_bad:
            log(f"    - {b}")
        if r < MAX_ROUNDS:
            log("  改稿（機械チェックの実測値＋レビュー助言）…")
            article = gen.revise_claude(
                article, facts, topic["category"],
                review_fixes=(review.get("must_fix") or []) + mech_bad, system=rev_system)

    quality_note = ""  # 承認依頼に付ける品質注記
    if mech_bad:
        # 機械で測れる要件を満たせなかった＝直し方が明確なのに直らない。ここは止める。
        p = save("escalated", topic["slug"], gen.to_markdown(article, topic))
        slack(f":warning: *ブログ生成: SEO要件を満たせず保留* — {topic['title']}\n"
              + "\n".join(f"・{b}" for b in mech_bad)
              + f"\nドラフト: `{p}`")
        log("機械チェック未達 → escalated 保存・通知")
        return
    if review["content_score"] < CONTENT_TH or review["seo_score"] < seo_th:
        # 参考値が低いだけでは捨てない（再現しない指標で記事を殺さない）。
        # 人間が最終判断できるよう、承認依頼に注記として添える。
        quality_note = (f"参考スコア content={review['content_score']} / seo={review['seo_score']}"
                        f"（この指標は再現性が低いため合否には使っていません）。"
                        f"レビュー指摘: " + " / ".join(review.get("must_fix") or [])[:200])
        log(f"参考スコアは閾値未満だが機械チェック合格 → 承認ゲートへ（{quality_note[:60]}…）")

    # 3) 専任ファクトチェック（high残存は1回改稿→再検証）
    log("ファクトチェック(gpt-4o)…")
    result = fc.factcheck(article["body"], facts)
    highs = [i for i in result.get("issues", []) if i.get("severity") == "high"]
    if highs:
        log(f"  high {len(highs)}件 → 1回改稿")
        article = gen.revise_claude(article, facts, topic["category"], factcheck_issues=highs, system=rev_system)
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
        src_note = "ニュース起点" if news else f"{len(pool)}ツール素材"
        summary = (f"品質 content={review['content_score']}/seo={review['seo_score']}"
                   f"・事実確認OK・重複なし（{src_note}）")
        if quality_note:
            summary = quality_note + "\n" + summary
        appr_ts = None
        try:
            import appr_req_common
            appr_ts = appr_req_common.submit_request(
                project="saas-atlas", workdir=BASE, slug=topic["slug"],
                title=article["title"], summary=summary, pending_md=p)
        except Exception as e:
            log(f"[appr-req] 承認依頼の投稿に失敗、従来通知にフォールバック: {e}")
        if not appr_ts:
            # #appr-req 未解決(未作成/未招待)や失敗時のフォールバック
            slack(
                f":memo: *ブログ承認依頼* — {article['title']}\n{summary}\n"
                f"slug: `{topic['slug']}`\n"
                f"承認する場合は saas-atlas ワーカーに「{topic['slug']} を公開して」と、却下する場合は「{topic['slug']} を却下して」と依頼してください。"
            )
        log(f"承認待ち → {p} (appr_ts={appr_ts})")
    else:
        save("pending", topic["slug"], md)
        log("承認不要モード（未対応の自動公開は blog_approve に委譲）")


if __name__ == "__main__":
    main()
