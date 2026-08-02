#!/usr/bin/env python3
"""gsc_opportunities.py — SaaS Atlas の検索流入「伸びしろ」を Search Console から抽出する。

seo-machine(なるほどラボ)の戦略A(GSC駆動のKW強化)の saas-atlas 版。過去28日の
Search Analytics(query×page)を取得し、以下の"伸びしろ"を検出してランキング表示＋
JSON保存＋(任意)Slack #reports 通知する:

1. striking-distance : 掲載5〜20位・表示は多いのにクリックが取れていないクエリ
                       → 既にランクしている該当ページを強化すれば上位化＝クリック増が狙える複利ネタ
2. cannibalization   : 同一クエリで自サイトの複数ページが競合(検索意図の食い合い)→統合/差別化候補

URL→ローカル資産を対応付ける。SaaS Atlas は構造が2種類:
  ・ブログ記事 /blog/<slug>       → src/content/blog/<slug>.md（1ページ=1md＝後段の自動強化が効く）
  ・pSEO       /tools /compare 等 → src/data/*.ts のデータ駆動（1md化されていない＝強化はレポート止まり）

Usage:
  python3 scripts/gsc_opportunities.py                 # レポート表示＋JSON保存
  python3 scripts/gsc_opportunities.py --slack         # 上に加えてSlack #reports 通知
  python3 scripts/gsc_opportunities.py --days 28 --min-impr 15 --top 15
"""

import argparse
import json
import os
import re
import sys
from datetime import date, timedelta

from google.oauth2 import service_account
from googleapiclient.discovery import build

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SA_FILE = os.path.expanduser("~/.config/lifelog/survey-service-account.json")
SITE = "sc-domain:saas-atlas.uk"
SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]
BLOG_DIR = os.path.join(BASE, "src", "content", "blog")
OUT_JSON = os.path.join(BASE, "data", "gsc_opportunities.json")

# 掲載順位別の概算CTR(伸びしろ試算用のベンチマーク)。上位化でどれだけクリックが増えるかの目安。
CTR_BY_POS = {1: 0.28, 2: 0.16, 3: 0.11, 4: 0.083, 5: 0.063,
              6: 0.049, 7: 0.039, 8: 0.032, 9: 0.027, 10: 0.024}
TARGET_POS = 4  # 「4位まで上げられたら」を目標CTRの基準にする


def _ctr_at(pos):
    p = max(1, min(10, int(round(pos))))
    return CTR_BY_POS.get(p, 0.02)


def fetch_rows(days):
    creds = service_account.Credentials.from_service_account_file(SA_FILE, scopes=SCOPES)
    svc = build("searchconsole", "v1", credentials=creds)
    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=days)
    body = {"startDate": start.isoformat(), "endDate": end.isoformat(),
            "dimensions": ["query", "page"], "rowLimit": 25000}
    r = svc.searchanalytics().query(siteUrl=SITE, body=body).execute()
    return r.get("rows", []), start, end


def url_to_asset(url):
    """公開URL → (kind, file, strengthenable)。

    /blog/<slug>            → ("blog", src/content/blog/<slug>.md, True)   ※後段の自動強化が効く
    /tools /compare 等 pSEO → ("pseo", "", False)                          ※data駆動・強化は要別対応
    トップ/その他           → ("other", "", False)
    """
    path = re.sub(r"^https?://[^/]+", "", url).strip("/")
    if not path:
        return "other", "", False
    m = re.match(r"^blog/([A-Za-z0-9._-]+)$", path)
    if m:
        cand = os.path.join(BLOG_DIR, m.group(1) + ".md")
        exists = os.path.exists(cand)
        return "blog", (cand if exists else ""), exists
    if re.match(r"^(tools|compare|categories|countries|finder)(/|$)", path):
        return "pseo", "", False
    return "other", "", False


def analyze(rows, min_impr):
    striking, by_query = [], {}
    for x in rows:
        q, page = x["keys"]
        by_query.setdefault(q, []).append(x)
        pos, impr, clicks, ctr = x["position"], x["impressions"], x["clicks"], x["ctr"]
        if 4.5 <= pos <= 20.5 and impr >= min_impr:
            kind, file, strengthenable = url_to_asset(page)
            # striking の pos は常に >=4.5。「TARGET_POS(4位)まで上げられたら」の期待クリックを
            # 基準に、現状クリックとの差分を伸びしろ(potential)とする。potential は常に pos4 基準
            # （到達難易度は織り込まない簡略モデル。実質 impressions 順のランキングになる）。
            potential = impr * _ctr_at(TARGET_POS)
            gain = max(0.0, potential - clicks)
            striking.append({
                "query": q, "page": page, "kind": kind, "file": file,
                "strengthenable": strengthenable,
                "position": round(pos, 1), "impressions": int(impr),
                "clicks": int(clicks), "ctr": round(ctr * 100, 1),
                "potential_clicks": round(gain, 1),
            })
    striking.sort(key=lambda d: d["potential_clicks"], reverse=True)
    # cannibalization: 同一クエリで表示>=10 のページが2つ以上
    cannibal = []
    for q, items in by_query.items():
        pages = [i for i in items if i["impressions"] >= 10]
        if len({i["keys"][1] for i in pages}) >= 2:
            cannibal.append({
                "query": q,
                "pages": sorted(({"page": i["keys"][1], "position": round(i["position"], 1),
                                  "impressions": int(i["impressions"])} for i in pages),
                                key=lambda d: d["position"]),
            })
    cannibal.sort(key=lambda d: sum(p["impressions"] for p in d["pages"]), reverse=True)
    return striking, cannibal


def _mq(s):
    """検索クエリは外部由来データ。Slack/Discord の制御シーケンス(<!channel>,<@U..>,<url|text>等)を
    無効化するためコードスパン(backtick)で包む。クエリ内の backtick は ' に置換して span を守る。"""
    return "`" + str(s).replace("`", "'") + "`"


def build_report(striking, cannibal, start, end, tot_clicks, tot_impr, top):
    def tag(d):
        if d["kind"] == "blog":
            return "📝blog" if d["strengthenable"] else "📝blog(md無)"
        return "🗂pSEO" if d["kind"] == "pseo" else "・"
    # 何のレポートで次に何が起きるかを**冒頭**に置く（末尾だと読まれず、
    # 「実施済みの報告」と読み違えられていた・2026-08-03 指摘）
    lines = [f"📈 SaaS Atlas GSC伸びしろレポート（{start}〜{end}）",
             "これは**未着手の候補**です。ここから強化原稿の案を作り、"
             "#appr-req に承認依頼としてお送りします（承認で本番反映）。",
             "💬 **このスレッドに返信いただければ、そのままDiscordに引き継いで続けます**"
             "（狙いたいKW・除外したいページ・優先順位など、自由に書いてください）。",
             "──────────",
             f"全体: {int(tot_clicks)}クリック / {int(tot_impr)}表示",
             "",
             f"■ striking-distance（上位化でクリック増が狙えるKW）上位{top}:"]
    if striking:
        for d in striking[:top]:
            lines.append(f"・[{tag(d)}]「{_mq(d['query'])}」pos{d['position']} 表示{d['impressions']} "
                         f"クリック{d['clicks']}(CTR{d['ctr']}%) → +{d['potential_clicks']}期待 | {d['page']}")
    else:
        lines.append("・該当なし（データ蓄積が進めば出ます／閾値 --min-impr を下げても可）")
    if cannibal:
        lines.append("")
        lines.append("■ キーワード食い合い（統合/差別化候補）:")
        for c in cannibal[:8]:
            ps = " / ".join(f"pos{p['position']}({p['impressions']}表示)" for p in c["pages"])
            lines.append(f"・「{_mq(c['query'])}」: {ps}")
    n_blog = sum(1 for d in striking if d["strengthenable"])
    lines.append("")
    lines.append(f"※ うちブログ強化対象(md有): {n_blog}件 → 自動強化フロー(#appr-req)の候補。"
                 f"pSEOはデータ駆動のため強化は別途。")
    return "\n".join(lines)


def slack_post(report):
    import subprocess
    import urllib.request
    try:
        token = subprocess.run(["security", "find-generic-password", "-a", "lifelog",
                                "-s", "SLACK_BOT_TOKEN", "-w"],
                               capture_output=True, text=True, check=True).stdout.strip()
    except subprocess.CalledProcessError:
        print("[slack] token取得失敗、通知スキップ")
        return
    payload = json.dumps({"channel": "#reports", "text": "<@U03CLR674N9>\n" + report,
                          "unfurl_links": False}).encode("utf-8")
    req = urllib.request.Request("https://slack.com/api/chat.postMessage", data=payload,
                                 headers={"Authorization": f"Bearer {token}",
                                          "Content-Type": "application/json; charset=utf-8"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            res = json.loads(r.read().decode("utf-8"))
            print(f"[slack] #reports: {res.get('ok')}")
        # スレッド返信をDiscordへ引き継ぐため投稿先を中継に登録する。
        # 失敗してもレポート自体は成立するので警告だけ出して続行。
        if res.get("ok"):
            try:
                import sys as _sys
                _sys.path.insert(0, os.path.expanduser("~/claudecode"))
                import report_thread_relay
                report_thread_relay.register(res.get("channel"), res.get("ts"),
                                             "GSC伸びしろレポート（SaaS Atlas）",
                                             "SaaS Atlas GSC伸びしろレポート")
            except Exception as e:
                print(f"[slack] スレッド中継の登録に失敗（レポートは投稿済み）: {e}")
    except Exception as e:
        print(f"[slack] 通知失敗: {e}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=28)
    ap.add_argument("--min-impr", type=int, default=15)
    ap.add_argument("--top", type=int, default=15)
    ap.add_argument("--slack", action="store_true")
    args = ap.parse_args()

    try:
        rows, start, end = fetch_rows(args.days)
    except Exception as e:
        # GSC権限未付与/API障害/SA欠落時にサイレントに落ちず「毎週来るはずのレポートが無音」を検知可能に。
        msg = f"[gsc_opportunities] GSCデータ取得に失敗: {type(e).__name__}: {e}"
        print(msg, file=sys.stderr)
        if args.slack:
            slack_post(f":warning: SaaS Atlas GSC伸びしろレポート生成失敗\n{type(e).__name__}: {e}")
        sys.exit(1)
    striking, cannibal = analyze(rows, args.min_impr)
    tot_clicks = sum(x["clicks"] for x in rows)
    tot_impr = sum(x["impressions"] for x in rows)

    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    json.dump({"period": [start.isoformat(), end.isoformat()],
               "total_clicks": int(tot_clicks), "total_impressions": int(tot_impr),
               "striking_distance": striking, "cannibalization": cannibal},
              open(OUT_JSON, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    report = build_report(striking, cannibal, start, end, tot_clicks, tot_impr, args.top)
    print(report)
    print(f"\n[saved] {OUT_JSON}")

    if args.slack:
        slack_post(report)


if __name__ == "__main__":
    main()
