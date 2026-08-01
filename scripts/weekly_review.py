#!/usr/bin/env python3
"""weekly_review.py — SaaS Atlas の週次「収益改善ループ」判断層。

役割は**判断だけ**。データ収集は既存の仕組みに任せる:
  ・GA4     … ga_daily_report.py（毎日5:10）と同じサービスアカウント/プロパティを再利用
  ・GSC     … gsc_opportunities.py（月6:35）と同じサイト/認証、striking-distance の
              判定ロジックそのものを import して使う（基準を二重定義しない）
  ・事実源  … src/data/tools.ts を dump_tools.mjs 経由で読む（blog_generate と同じ）
新しい収集バッチもスナップショットDBも作らない。ここが増やすのは「今週どうだったか／
次に何をするか」の判断と、その履歴だけ。

2段階運用（オーナー合意済み）:
  Phase 1（流入がほぼゼロの今）… 先行指標だけ見る。
      インデックス到達 / 表示回数 / 平均掲載順位 / striking-distance件数 /
      公開本数 / 追跡リンク網羅率。
      **クリック率やCVRは母数不足なので評価しない**（0/173 を「CTR 0%」と読むと
      誤った打ち手に走るため、Phase 1 では意図的に見ない）。
  Phase 2（週30クリック超で自動移行）… 本来のループ。
      クエリ別CTR / ページ別 / アフィリンククリック率 を評価して良し悪しを判断する。

移行はヒステリシス付き（30以上で昇格、20未満に落ちるまで降格しない）。境界で
毎週フェーズが揺れて、指標の定義が週ごとに変わるのを防ぐ。

Usage:
  python3 scripts/weekly_review.py              # 分析してレポート表示＋履歴保存
  python3 scripts/weekly_review.py --slack      # 上に加えて Slack #reports へ通知
  python3 scripts/weekly_review.py --dry-run    # 履歴を保存しない（試し撃ち）
  python3 scripts/weekly_review.py --lag 3 --min-impr 5
"""

import argparse
import json
import os
import subprocess
import sys
import urllib.request
from datetime import date, datetime, timedelta

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS = os.path.join(BASE, "scripts")
if SCRIPTS not in sys.path:
    sys.path.insert(0, SCRIPTS)

import gsc_opportunities as gsc          # noqa: E402  striking判定/サニタイズを再利用

STATE_PATH = os.path.join(BASE, "data", "weekly_review_state.json")
SITEMAP_URL = "https://www.saas-atlas.uk/sitemap.xml"
SLACK_CHANNEL = os.environ.get("SAAS_WEEKLY_SLACK_CHANNEL", "#reports")
SLACK_MENTION = os.environ.get("SAAS_WEEKLY_SLACK_MENTION", "<@U03CLR674N9>")

# フェーズ移行の閾値（週クリック数）。昇格と降格をずらして境界での往復を防ぐ。
PHASE2_ENTER = 30
PHASE2_EXIT = 20
HISTORY_MAX = 26   # 半年分だけ保持


# ────────────────────────── GSC（1回の取得で2週間ぶんを賄う） ──────────────────────────
def fetch_two_weeks(lag_days, days=7):
    """[今週, 前週] の query×page×date 行を **1リクエストで**取得して返す。

    lag_days: GSC のデータ確定遅れ。既定3日。ここを0にすると「今週」の末尾だけが
    未確定になり、前週と条件が揃わないので**毎週みかけ上の減少**が出る。週次比較を
    するレポートでは、両方の窓を同じ成熟度に揃えることが正しさの前提。
    """
    from google.oauth2 import service_account
    from googleapiclient.discovery import build

    creds = service_account.Credentials.from_service_account_file(gsc.SA_FILE, scopes=gsc.SCOPES)
    svc = build("searchconsole", "v1", credentials=creds)
    cur_end = date.today() - timedelta(days=lag_days)
    cur_start = cur_end - timedelta(days=days - 1)
    prev_end = cur_start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=days - 1)

    row_limit = 25000
    body = {"startDate": prev_start.isoformat(), "endDate": cur_end.isoformat(),
            "dimensions": ["date", "query", "page"], "rowLimit": row_limit}
    rows = svc.searchanalytics().query(siteUrl=gsc.SITE, body=body).execute().get("rows", [])
    truncated = len(rows) >= row_limit
    if truncated:
        # 打ち切られると表示回数・掲載順位が静かに過小評価される。黙って出さない。
        print(f"[gsc] rowLimit({row_limit})に到達。データが打ち切られ数値が過小の可能性",
              file=sys.stderr)

    cur, prev = [], []
    for r in rows:
        d = r["keys"][0]
        (cur if d >= cur_start.isoformat() else prev).append(r)
    return {"cur": cur, "prev": prev, "truncated": truncated,
            "cur_period": (cur_start, cur_end), "prev_period": (prev_start, prev_end)}


def aggregate(date_rows):
    """date×query×page の行を query×page に畳んで、GSC と同じ行形式で返す。

    掲載順位は**表示回数で重み付けした平均**。単純平均だと 1表示の日と 50表示の日が
    同じ重みになり、実態とずれる。
    """
    agg = {}
    for r in date_rows:
        _, q, page = r["keys"]
        a = agg.setdefault((q, page), {"clicks": 0, "impressions": 0, "pos_w": 0.0})
        a["clicks"] += r["clicks"]
        a["impressions"] += r["impressions"]
        a["pos_w"] += r["position"] * r["impressions"]
    out = []
    for (q, page), a in agg.items():
        impr = a["impressions"]
        out.append({"keys": [q, page], "clicks": a["clicks"], "impressions": impr,
                    "position": (a["pos_w"] / impr) if impr else 0.0,
                    "ctr": (a["clicks"] / impr) if impr else 0.0})
    return out


def totals(agg_rows):
    impr = sum(r["impressions"] for r in agg_rows)
    clicks = sum(r["clicks"] for r in agg_rows)
    pos = (sum(r["position"] * r["impressions"] for r in agg_rows) / impr) if impr else 0.0
    return {"impressions": int(impr), "clicks": int(clicks),
            "avg_position": round(pos, 1),
            "pages_with_impressions": len({r["keys"][1] for r in agg_rows}),
            "queries": len({r["keys"][0] for r in agg_rows})}


# ────────────────────────── サイト側の事実 ──────────────────────────
def sitemap_page_count():
    """公開ページ総数（サイト自身の sitemap.xml）。取れなければ None。"""
    try:
        with urllib.request.urlopen(SITEMAP_URL, timeout=20) as r:
            return r.read().decode("utf-8", "replace").count("<loc>")
    except Exception as e:
        print(f"[sitemap] 取得失敗（ページ総数は不明として続行）: {type(e).__name__}: {e}",
              file=sys.stderr)
        return None


def _added_posts(since, until):
    """[since, until] に**追加された**記事スラッグ。until は排他境界に翌日を渡す。"""
    try:
        out = subprocess.run(
            ["git", "-C", BASE, "log", f"--since={since.isoformat()}",
             f"--until={until.isoformat()}", "--diff-filter=A",
             "--name-only", "--pretty=format:", "--", "src/content/blog"],
            capture_output=True, text=True, check=True).stdout
        return sorted({os.path.basename(l)[:-3] for l in out.splitlines()
                       if l.strip().endswith(".md")})
    except (subprocess.CalledProcessError, OSError) as e:
        # git 不在(FileNotFoundError=OSError)も含めて拾う。ここは落とさず「不明」で続ける。
        print(f"[git] 新規記事の検出に失敗: {e}", file=sys.stderr)
        return []


def posts_published(win_start, win_end):
    """公開記事の総数と、(a)集計窓に追加された記事 (b)窓より後＝GSC未反映の記事。

    窓は GSC 側と同じ [win_start, win_end] に揃える。ここを揃えないと「記事を出した週」と
    「その表示が出た週」がずれ、原因と結果を取り違える。GSCのラグぶん(既定3日)は
    まだ数字に現れないので、その期間の公開は (b) として別に出す。
    """
    blog_dir = os.path.join(BASE, "src", "content", "blog")
    total = len([f for f in os.listdir(blog_dir) if f.endswith(".md")]) if os.path.isdir(blog_dir) else 0
    in_window = _added_posts(win_start, win_end + timedelta(days=1))
    after = _added_posts(win_end + timedelta(days=1), date.today() + timedelta(days=1))
    return total, in_window, after


def affiliate_coverage():
    """tools.ts の実測: 追跡リンク配線済み / プログラム有だが未配線 / 総数。

    判定は blog_generate.TRACKED_RE を**そのまま参照**する（コピーすると片方だけ直して
    網羅率が静かに古い基準のままになるため）。
    """
    import blog_generate as bg
    tools = bg.load_tools()
    tracked, pending = [], []
    for t in tools:
        prog = ((t.get("affiliate") or {}).get("program") or "").strip()
        has_prog = bool(prog) and prog.lower() != "none"
        if bg.TRACKED_RE.search(t.get("website") or ""):
            tracked.append(t.get("name"))
        elif has_prog:
            pending.append((t.get("name"), prog, t.get("category")))
    return {"total": len(tools), "tracked": len(tracked),
            "pending": sorted(pending), "monetizable_categories": sorted(bg.monetizable_categories(tools))}


# ────────────────────────── Phase 2 用（GA4） ──────────────────────────
def ga_engagement(start, end):
    """Phase 2 でだけ使う GA4 指標。取得できなければ None（レポートは続行）。

    捕捉は `Exception` では足りない。ga_daily_report.get_client() は認証ファイル欠落時に
    **SystemExit**（BaseException直下＝Exceptionのサブクラスではない）を投げるため、
    `except Exception` だとすり抜けて週次レポートごと落ちる。GA4は Phase 2 の補助指標に
    すぎないので、ここは無くてもレポートを出し切る方が正しい。
    """
    try:
        import ga_daily_report as ga
        client = ga.get_client()
        pid = ga.PROPERTY_ID
        s, e = start.isoformat(), end.isoformat()
        summary = ga.run_summary(client, pid, s, e)
        clicks = ga.run_clicks(client, pid, s, e)
        sessions = int(float(summary.get("sessions") or 0))
        total_clicks = sum(clicks.values())
        return {"sessions": sessions, "click_events": clicks,
                "affiliate_click_rate": round(total_clicks / sessions * 100, 1) if sessions else None,
                "pages": ga.run_pages(client, pid, s, e, limit=10)}
    except (Exception, SystemExit) as ex:
        print(f"[ga4] 取得失敗（Phase2指標なしで続行）: {type(ex).__name__}: {ex}", file=sys.stderr)
        return None


# ────────────────────────── フェーズ判定と履歴 ──────────────────────────
def load_state():
    try:
        return json.load(open(STATE_PATH, encoding="utf-8"))
    except Exception:
        return {"phase": 1, "history": []}


def decide_phase(prev_phase, weekly_clicks):
    """ヒステリシス: 1→2 は 30クリック以上、2→1 は 20クリック未満で初めて戻す。"""
    if prev_phase == 1:
        return (2, True) if weekly_clicks >= PHASE2_ENTER else (1, False)
    return (1, True) if weekly_clicks < PHASE2_EXIT else (2, False)


def delta(cur, prev):
    d = cur - prev
    return f"{cur}（前週{prev} {'+' if d >= 0 else ''}{d}）"


# ────────────────────────── レポート ──────────────────────────
def build_report(ctx):
    cur, prev = ctx["cur_totals"], ctx["prev_totals"]
    cs, ce = ctx["cur_period"]
    ps, pe = ctx["prev_period"]
    aff = ctx["affiliate"]
    L = [f"🔁 SaaS Atlas 週次レビュー（{cs}〜{ce} / 前週 {ps}〜{pe}）",
         f"フェーズ: Phase {ctx['phase']}"
         + ("  ⚠️今回昇格/降格しました" if ctx["phase_changed"] else "")]
    if ctx["phase"] == 1:
        L.append(f"（週クリック {cur['clicks']} < {PHASE2_ENTER} のため先行指標のみ評価。"
                 "CTR/CVRは母数不足につき意図的に見ていません）")
    L.append("")

    L.append("■ 先行指標（前週比）")
    L.append(f"・表示回数: {delta(cur['impressions'], prev['impressions'])}")
    L.append(f"・クリック: {delta(cur['clicks'], prev['clicks'])}")
    L.append(f"・平均掲載順位: {cur['avg_position']}（前週{prev['avg_position']}）"
             "  ※小さいほど上位")
    pc = ctx["sitemap_pages"]
    # 取得失敗を黙って省略すると「0件」と見分けがつかない。読む面(Slack)にも必ず出す。
    denom = f" / 公開{pc}ページ" if pc is not None else " / 公開ページ数は取得失敗"
    L.append(f"・表示が発生したページ数: {delta(cur['pages_with_impressions'], prev['pages_with_impressions'])}"
             + denom
             + "  ※GSCのインデックス数そのものではなく「実際に検索結果に出た」ページ数（下限値）")
    L.append(f"・表示が発生したクエリ数: {delta(cur['queries'], prev['queries'])}")
    L.append(f"・striking-distance(5〜20位・表示{ctx['min_impr']}以上): "
             f"{delta(len(ctx['striking']), ctx['prev_striking_n'])}")
    L.append(f"・公開記事: 累計{ctx['posts_total']}本"
             + (f"（集計窓内 +{len(ctx['posts_new'])}: {', '.join(ctx['posts_new'])}）"
                if ctx["posts_new"] else "（集計窓内の新規なし）")
             + (f" ＋窓の後に{len(ctx['posts_after'])}本公開（GSC未反映: "
                f"{', '.join(ctx['posts_after'])}）" if ctx["posts_after"] else ""))
    L.append(f"・追跡リンク網羅率: {aff['tracked']}/{aff['total']}"
             f"（プログラム有だが未配線 {len(aff['pending'])}件）")

    if ctx["striking"]:
        L.append("")
        L.append("■ 上位化でクリックが取れそうなKW")
        for d in ctx["striking"][:8]:
            tag = "📝blog" if d["strengthenable"] else ("🗂pSEO" if d["kind"] == "pseo" else "・")
            L.append(f"・[{tag}]「{gsc._mq(d['query'])}」pos{d['position']} 表示{d['impressions']} "
                     f"→ +{d['potential_clicks']}期待 | {d['page']}")

    if ctx["truncated"]:
        L.append("・⚠️ GSCの取得行数が上限に達しました。上の数値は過小評価の可能性があります。")

    if ctx["phase"] == 2 and not ctx["ga"]:
        L.append("")
        L.append("■ Phase 2 指標（GA4）: ⚠️取得に失敗したため今週は出せていません"
                 "（「特筆なし」ではなく「測れていない」）。logs/weekly_review_stderr.log を確認。")
    if ctx["phase"] == 2 and ctx["ga"]:
        g = ctx["ga"]
        L.append("")
        L.append("■ Phase 2 指標（GA4）")
        L.append(f"・セッション: {g['sessions']} / 計測クリック: {sum(g['click_events'].values())}"
                 + (f"（クリック率 {g['affiliate_click_rate']}%）"
                    if g["affiliate_click_rate"] is not None else ""))
        worst = sorted((d for d in ctx["cur_agg"] if d["impressions"] >= ctx["min_impr"]),
                       key=lambda d: d["ctr"])[:5]
        if worst:
            L.append("・CTRが低いクエリ（見出し/titleの見直し候補）:")
            for d in worst:
                L.append(f"　- 「{gsc._mq(d['keys'][0])}」pos{round(d['position'],1)} "
                         f"表示{d['impressions']} CTR{round(d['ctr']*100,1)}%")

    L.append("")
    L.append("■ 今週の打ち手")
    for i, a in enumerate(ctx["actions"], 1):
        L.append(f"{i}. {a}")
    return "\n".join(L)


def build_actions(ctx):
    """打ち手。**人間の判断・作業が要るものは「#saas-atlas で相談」と明示**して、
    ワーカーが勝手に進めない境界をレポート上でも固定する。"""
    acts = []
    aff = ctx["affiliate"]
    if aff["pending"]:
        names = ", ".join(f"{n}({p})" for n, p, _ in aff["pending"][:5])
        more = f" ほか{len(aff['pending'])-5}件" if len(aff["pending"]) > 5 else ""
        acts.append(f"【最優先・オーナー作業】追跡リンク未配線 {len(aff['pending'])}件の申請/リンク取得: "
                    f"{names}{more} → 承認メールかダッシュボードのリンクを貰えれば tools.ts へ即配線します。"
                    "記事をいくら増やしても、リンクが素URLのままだと1円も発生しません。")
    strengthenable = [d for d in ctx["striking"] if d["strengthenable"]]
    if strengthenable:
        acts.append(f"ブログ強化候補 {len(strengthenable)}件（"
                    + ", ".join(os.path.basename(d["file"]) for d in strengthenable[:3])
                    + "）。※saas-atlas には gsc_strengthen 相当の自動強化がまだ無いため、"
                      "現状は手動改稿→#appr-req 承認。自動化の要否は #saas-atlas で相談。")
    pseo = [d for d in ctx["striking"] if d["kind"] == "pseo"]
    if pseo:
        acts.append(f"pSEOページが {len(pseo)}件 striking に入っています（"
                    + ", ".join(d["page"].replace("https://www.saas-atlas.uk", "") for d in pseo[:3])
                    + "）。これは記事ではなく tools.ts/テンプレ側の改善なので、"
                      "何を足すかは #saas-atlas で相談してから着手します。")
    other = [d for d in ctx["striking"] if d["kind"] == "other"]
    if other:
        acts.append("トップページ等（記事でもpSEOでもないページ）が "
                    f"{len(other)}件 striking に入っています: "
                    # クエリは外部由来。Slackの制御シーケンス化を防ぐためコードスパンで包む。
                    + ", ".join(f"「{gsc._mq(d['query'])}」pos{d['position']}" for d in other[:3])
                    + "。ブランド名クエリなら伸ばす価値は薄いので、深追いするかは "
                      "#saas-atlas で判断。")
    if ctx["cur_totals"]["impressions"] == 0:
        acts.append("表示が0。インデックスがまだ進んでいない可能性が高いので、"
                    "施策の追加より先に Search Console のカバレッジ確認を優先。")
    elif not ctx["striking"]:
        acts.append(f"striking-distance が0件（表示{ctx['cur_totals']['impressions']}）。"
                    "強化対象がまだ育っていないため、今週は収益カテゴリ("
                    + ", ".join(ctx["affiliate"]["monetizable_categories"])
                    + ")の記事追加でクエリ面を増やすのが妥当。")
    if ctx["phase"] == 2:
        g = ctx["ga"]
        if not g:
            acts.append("Phase 2 に居るのに GA4 指標が取れていません。CTR/クリック率の判断が"
                        "できないので、まず認証(survey-service-account.json のGA4閲覧権限)を復旧する。")
        else:
            rate = g.get("affiliate_click_rate")
            if rate is not None and rate < 5:
                acts.append(f"アフィリンククリック率 {rate}% はセッション数に対して低い。"
                            "記事内のリンク位置・CTA文言の見直し候補。どこを変えるかは "
                            "#saas-atlas で相談。")
            low = [d for d in ctx["cur_agg"]
                   if d["impressions"] >= max(ctx["min_impr"] * 4, 20)
                   and d["position"] <= 10 and d["ctr"] < 0.02]
            if low:
                acts.append(f"10位以内なのにCTR2%未満のクエリが {len(low)}件（"
                            + ", ".join(f"「{gsc._mq(d['keys'][0])}」" for d in low[:3])
                            + "）。順位ではなく title/meta が負けているので、"
                              "該当ページの title・説明文の書き換えが最優先。")
    if not ctx["posts_new"]:
        acts.append("今週の新規記事が0本。blog パイプラインが承認待ちで詰まっていないか "
                    "data/review/pending_*.md を確認。")
    if not acts:
        acts.append("特記なし。現状の運用を継続。")
    return acts


def slack_post(text):
    try:
        token = subprocess.run(["security", "find-generic-password", "-a", "lifelog",
                                "-s", "SLACK_BOT_TOKEN", "-w"],
                               capture_output=True, text=True, check=True).stdout.strip()
    except subprocess.CalledProcessError:
        print("[slack] token取得失敗、通知スキップ", file=sys.stderr)
        return
    payload = json.dumps({"channel": SLACK_CHANNEL, "text": f"{SLACK_MENTION}\n{text}",
                          "unfurl_links": False}).encode("utf-8")
    req = urllib.request.Request("https://slack.com/api/chat.postMessage", data=payload,
                                 headers={"Authorization": f"Bearer {token}",
                                          "Content-Type": "application/json; charset=utf-8"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            print(f"[slack] {SLACK_CHANNEL}: {json.loads(r.read().decode('utf-8')).get('ok')}")
    except Exception as e:
        print(f"[slack] 通知失敗: {e}", file=sys.stderr)


def _fail(args, where, e):
    """失敗はSlackにも出して終わる。#reports に何も来ない週を「異常なし」と誤読させない。"""
    print(f"[weekly_review] {where}に失敗: {type(e).__name__}: {e}", file=sys.stderr)
    if args.slack:
        slack_post(f":warning: SaaS Atlas 週次レビュー生成失敗（{where}）\n{type(e).__name__}: {e}")
    sys.exit(1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lag", type=int, default=3, help="GSCデータ確定遅れ(日)。両週を同条件に揃えるため")
    ap.add_argument("--min-impr", type=int, default=5, help="striking-distance の最低表示回数(週次なので28日版より低い)")
    ap.add_argument("--slack", action="store_true")
    ap.add_argument("--dry-run", action="store_true", help="履歴を保存しない")
    args = ap.parse_args()

    try:
        w = fetch_two_weeks(args.lag)
    except (Exception, SystemExit) as e:
        _fail(args, "GSC取得", e)

    cur_agg, prev_agg = aggregate(w["cur"]), aggregate(w["prev"])
    cur_t, prev_t = totals(cur_agg), totals(prev_agg)
    striking, _ = gsc.analyze(cur_agg, args.min_impr)
    prev_striking, _ = gsc.analyze(prev_agg, args.min_impr)

    state = load_state()
    phase, changed = decide_phase(state.get("phase", 1), cur_t["clicks"])
    cs, ce = w["cur_period"]

    # tools.ts の読み込み(node)や記事カウントが壊れたときも、GSC失敗と同じく明示的に落とす。
    # ここで黙って例外を投げると「今週は#reportsに何も来なかった」でしか気づけない。
    try:
        posts_total, posts_new, posts_after = posts_published(cs, ce)
        affiliate = affiliate_coverage()
    except (Exception, SystemExit) as e:
        _fail(args, "サイト側の事実収集(tools.ts/git)", e)

    ctx = {
        "cur_period": w["cur_period"], "prev_period": w["prev_period"],
        "cur_totals": cur_t, "prev_totals": prev_t, "cur_agg": cur_agg,
        "striking": striking, "prev_striking_n": len(prev_striking),
        "min_impr": args.min_impr, "phase": phase, "phase_changed": changed,
        "truncated": w.get("truncated", False),
        "posts_total": posts_total, "posts_new": posts_new, "posts_after": posts_after,
        "affiliate": affiliate,
        "sitemap_pages": sitemap_page_count(),
        "ga": ga_engagement(cs, ce) if phase == 2 else None,
    }
    ctx["actions"] = build_actions(ctx)

    report = build_report(ctx)
    print(report)

    if not args.dry_run:
        entry = {"period": [cs.isoformat(), ce.isoformat()], "phase": phase,
                 **cur_t, "striking": len(striking), "posts_total": posts_total,
                 "posts_new": posts_new, "posts_after": posts_after,
                 "tracked": ctx["affiliate"]["tracked"], "tools": ctx["affiliate"]["total"],
                 "generated_at": datetime.now().astimezone().isoformat()}
        hist = [h for h in state.get("history", []) if h.get("period") != entry["period"]]
        hist.append(entry)
        state = {"phase": phase, "history": hist[-HISTORY_MAX:]}
        os.makedirs(os.path.dirname(STATE_PATH), exist_ok=True)
        json.dump(state, open(STATE_PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        print(f"\n[saved] {STATE_PATH}")

    if args.slack:
        slack_post(report)


if __name__ == "__main__":
    main()
