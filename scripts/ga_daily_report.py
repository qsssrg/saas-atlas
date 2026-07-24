#!/usr/bin/env python3
"""SaaS Atlas GA日次レポート → (任意でGitHub Pages HTML) + Slackサマリー。

seo-machine(なるほどラボ)の ga_daily_report.py を範に、SaaS Atlas 用に独立実装したもの。
- GA4プロパティ 543064912 を サービスアカウント(lifelog-survey@...) で読む（閲覧者権限）
- 前日 / 直近1週間 のKPI、outbound_click/click(アフィリ計測)、ページ別/流入元TOP10、
  直近24hのサイト更新(gitコミット) をまとめる
- HTMLを REPORT_DIR に出力（--publish 時にGitHub Pagesへpushする運用を想定）
- Slack へ サマリー(+全文リンク) または 全文 を投稿

依存: google-analytics-data。SLACK_BOT_TOKEN は macOS Keychain(account:lifelog)。
使い方:
  python3 ga_daily_report.py --dry-run     # GA4取得して整形結果を標準出力（Slack/書き込みなし）
  python3 ga_daily_report.py --slack-only   # 全文をSlackに投稿（HTML公開しない）
  python3 ga_daily_report.py                # HTML出力 + Slackサマリー+リンク（GitHub Pages運用）
"""

import argparse
import html
import json
import os
import subprocess
import sys
import urllib.request
from datetime import datetime, timedelta

# ────────────────────────── 設定 ──────────────────────────
PROPERTY_ID = os.environ.get("GA4_PROPERTY_ID", "543064912")  # SaaS Atlas
CREDENTIALS_PATH = os.environ.get(
    "GA4_CREDENTIALS_PATH",
    os.path.expanduser("~/.config/lifelog/survey-service-account.json"),
)
SITE_DOMAIN = "https://www.saas-atlas.uk"
REPO_DIR = os.path.expanduser("~/saas-atlas")                 # gitでサイト更新を検出する対象
REPORT_DIR = os.path.expanduser(os.environ.get("SAAS_GA_REPORT_DIR", "~/saas-atlas-ga-report"))
REPORT_URL = os.environ.get("SAAS_GA_REPORT_URL", "https://qsssrg.github.io/saas-atlas-ga-report/")
SLACK_CHANNEL = os.environ.get("SAAS_GA_SLACK_CHANNEL", "#reports")
SLACK_MENTION = os.environ.get("SAAS_GA_SLACK_MENTION", "<@U03CLR674N9>")  # rintaro sonoda

# アフィリ/計測イベント（saas-atlas 実測: click=拡張計測の外部リンク, outbound_click=自前計測）
CLICK_EVENTS = ["click", "outbound_click"]


# ────────────────────────── GA4 ──────────────────────────
def get_client():
    from google.analytics.data_v1beta import BetaAnalyticsDataClient
    if not os.path.exists(CREDENTIALS_PATH):
        raise SystemExit(f"認証ファイルが見つかりません: {CREDENTIALS_PATH}")
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = CREDENTIALS_PATH
    return BetaAnalyticsDataClient()


def _types():
    from google.analytics.data_v1beta.types import (
        DateRange, Dimension, Filter, FilterExpression, Metric, OrderBy, RunReportRequest,
    )
    return DateRange, Dimension, Filter, FilterExpression, Metric, OrderBy, RunReportRequest


def format_duration(seconds_str):
    try:
        s = float(seconds_str)
    except Exception:
        return "0:00"
    m, s = divmod(int(round(s)), 60)
    return f"{m}:{s:02d}"


def run_summary(client, pid, start, end):
    DateRange, Dimension, _F, _FE, Metric, _O, RunReportRequest = _types()
    req = RunReportRequest(
        property=f"properties/{pid}",
        date_ranges=[DateRange(start_date=start, end_date=end)],
        metrics=[Metric(name=n) for n in
                 ("activeUsers", "sessions", "screenPageViews",
                  "averageSessionDuration", "bounceRate")],
    )
    r = client.run_report(req)
    if not r.rows:
        return {}
    row = r.rows[0]
    return {r.metric_headers[i].name: row.metric_values[i].value
            for i in range(len(r.metric_headers))}


def run_pages(client, pid, start, end, limit=10):
    DateRange, Dimension, _F, _FE, Metric, OrderBy, RunReportRequest = _types()
    req = RunReportRequest(
        property=f"properties/{pid}",
        date_ranges=[DateRange(start_date=start, end_date=end)],
        dimensions=[Dimension(name="pagePath")],
        metrics=[Metric(name="screenPageViews"), Metric(name="activeUsers"),
                 Metric(name="averageSessionDuration")],
        order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="screenPageViews"), desc=True)],
        limit=limit,
    )
    r = client.run_report(req)
    return [(row.dimension_values[0].value, row.metric_values[0].value,
             row.metric_values[1].value, format_duration(row.metric_values[2].value))
            for row in r.rows]


def run_sources(client, pid, start, end, limit=10):
    DateRange, Dimension, _F, _FE, Metric, OrderBy, RunReportRequest = _types()
    req = RunReportRequest(
        property=f"properties/{pid}",
        date_ranges=[DateRange(start_date=start, end_date=end)],
        dimensions=[Dimension(name="sessionSource"), Dimension(name="sessionMedium")],
        metrics=[Metric(name="sessions"), Metric(name="activeUsers")],
        order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="sessions"), desc=True)],
        limit=limit,
    )
    r = client.run_report(req)
    return [(f"{row.dimension_values[0].value} / {row.dimension_values[1].value}",
             row.metric_values[0].value, row.metric_values[1].value) for row in r.rows]


def run_clicks(client, pid, start, end):
    """click / outbound_click のイベント数を {event: count} で返す。"""
    DateRange, Dimension, Filter, FilterExpression, Metric, _O, RunReportRequest = _types()
    req = RunReportRequest(
        property=f"properties/{pid}",
        date_ranges=[DateRange(start_date=start, end_date=end)],
        dimensions=[Dimension(name="eventName")],
        metrics=[Metric(name="eventCount")],
        dimension_filter=FilterExpression(
            filter=Filter(field_name="eventName",
                          in_list_filter=Filter.InListFilter(values=CLICK_EVENTS))),
    )
    r = client.run_report(req)
    counts = {ev: 0 for ev in CLICK_EVENTS}
    for row in r.rows:
        counts[row.dimension_values[0].value] = int(row.metric_values[0].value or 0)
    return counts


# ────────────────────────── サイト更新（git） ──────────────────────────
def git_updates(since="24 hours ago"):
    """~/saas-atlas の直近コミット（件名＋変更ファイル数）を返す。"""
    try:
        out = subprocess.run(
            ["git", "-C", REPO_DIR, "log", f"--since={since}",
             "--pretty=format:%h\t%s", "--shortstat"],
            capture_output=True, text=True, check=True).stdout.strip()
    except Exception:
        return []
    commits = []
    cur = None
    for line in out.splitlines():
        if "\t" in line:
            if cur:
                commits.append(cur)
            h, s = line.split("\t", 1)
            cur = {"hash": h, "subject": s, "stat": ""}
        elif line.strip() and cur:
            cur["stat"] = line.strip()
    if cur:
        commits.append(cur)
    return commits


# ────────────────────────── 整形（共通） ──────────────────────────
def m(sm, key, default="0"):
    return sm.get(key, default)


def pct(v):
    try:
        return f"{float(v) * 100:.1f}%"
    except Exception:
        return "―"


def kpi_line(sm):
    return (f"ユーザー{m(sm,'activeUsers')} / セッション{m(sm,'sessions')} / "
            f"PV{m(sm,'screenPageViews')} / 平均滞在{format_duration(m(sm,'averageSessionDuration'))} / "
            f"直帰{pct(m(sm,'bounceRate'))}")


# ────────────────────────── HTML ──────────────────────────
def kpi_card(title, sm):
    return f"""
    <div class="card"><h3>{html.escape(title)}</h3><div class="kpis">
      <div class="kpi"><span class="n">{html.escape(m(sm,'activeUsers'))}</span><span class="l">ユーザー</span></div>
      <div class="kpi"><span class="n">{html.escape(m(sm,'sessions'))}</span><span class="l">セッション</span></div>
      <div class="kpi"><span class="n">{html.escape(m(sm,'screenPageViews'))}</span><span class="l">PV</span></div>
      <div class="kpi"><span class="n">{html.escape(format_duration(m(sm,'averageSessionDuration')))}</span><span class="l">平均滞在</span></div>
      <div class="kpi"><span class="n">{pct(m(sm,'bounceRate'))}</span><span class="l">直帰率</span></div>
    </div></div>"""


def clicks_table(windows_clicks):
    labels = list(windows_clicks.keys())
    head = "<tr><th>イベント</th>" + "".join(f"<th>{html.escape(l)}</th>" for l in labels) + "</tr>"
    rows = ""
    for ev in CLICK_EVENTS:
        cells = "".join(f"<td>{windows_clicks[l].get(ev,0)}</td>" for l in labels)
        name = "外部リンククリック(click)" if ev == "click" else "アフィリ計測(outbound_click)"
        rows += f"<tr><th>{html.escape(name)}</th>{cells}</tr>"
    return f"<table>{head}{rows}</table>"


def pages_table(rows, limit=10):
    if not rows:
        return "<p class='muted'>データなし</p>"
    trs = "".join(
        f"<tr><td class='path'>{html.escape(p)}</td><td>{html.escape(pv)}</td>"
        f"<td>{html.escape(uu)}</td><td>{html.escape(dur)}</td></tr>"
        for p, pv, uu, dur in rows[:limit])
    return f"<table><tr><th>ページ</th><th>PV</th><th>UU</th><th>滞在</th></tr>{trs}</table>"


def sources_table(rows, limit=10):
    if not rows:
        return "<p class='muted'>データなし</p>"
    trs = "".join(
        f"<tr><td class='path'>{html.escape(l)}</td><td>{html.escape(s)}</td><td>{html.escape(u)}</td></tr>"
        for l, s, u in rows[:limit])
    return f"<table><tr><th>ソース/メディア</th><th>セッション</th><th>UU</th></tr>{trs}</table>"


def updates_html(commits):
    if not commits:
        return "<p class='muted'>直近24時間のコミットはありません。</p>"
    lis = "".join(
        f"<li><code>{html.escape(c['hash'])}</code> {html.escape(c['subject'])}"
        f"<span class='muted'> — {html.escape(c['stat'])}</span></li>" for c in commits[:20])
    return f"<ul>{lis}</ul>"


def render_html(gen_dt, ydate, wk_start, wk_end, yday, week, wclicks, commits):
    style = """
    :root{color-scheme:light dark}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Hiragino Sans',sans-serif;
      margin:0;padding:24px;background:#0d1117;color:#c9d1d9;line-height:1.5}
    h1{font-size:1.35rem;margin:0 0 4px}
    .meta{color:#8b949e;font-size:.85rem;margin-bottom:20px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    @media(max-width:640px){.grid{grid-template-columns:1fr}}
    .card{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:16px 18px;margin-bottom:16px}
    .card h3{margin:0 0 12px;font-size:1rem;color:#58a6ff}
    .kpis{display:flex;flex-wrap:wrap;gap:14px}
    .kpi{display:flex;flex-direction:column;min-width:70px}
    .kpi .n{font-size:1.4rem;font-weight:700;color:#e6edf3}.kpi .l{font-size:.72rem;color:#8b949e}
    table{width:100%;border-collapse:collapse;font-size:.82rem}
    th,td{text-align:left;padding:5px 8px;border-bottom:1px solid #21262d}
    th{color:#8b949e;font-weight:600}
    td.path{font-family:ui-monospace,Menlo,monospace;font-size:.78rem;color:#adbac7}
    td:not(.path),th:not(:first-child){text-align:right}
    .muted{color:#6e7681;font-size:.82rem}
    ul{margin:0;padding-left:20px}li{font-size:.82rem;margin:3px 0}
    code{font-family:ui-monospace,Menlo,monospace;color:#58a6ff}
    a{color:#58a6ff;text-decoration:none}a:hover{text-decoration:underline}
    .full{grid-column:1/-1}
    """
    top = (f'<h1>SaaS Atlas GA日次レポート</h1>'
           f'<div class="meta">生成: {html.escape(gen_dt)}　|　前日: {html.escape(ydate)}　|　'
           f'直近1週間: {html.escape(wk_start)}〜{html.escape(wk_end)}　|　'
           f'<a href="{SITE_DOMAIN}" target="_blank" rel="noopener">saas-atlas.uk</a></div>')
    kpis = f'<div class="grid">{kpi_card("① 前日 ("+ydate+")", yday["summary"])}{kpi_card("② 直近1週間", week["summary"])}</div>'
    clicks_c = f'<div class="card full"><h3>③ クリック計測（前日/7日/28日）</h3>{clicks_table(wclicks)}</div>'
    updates = f'<div class="card full"><h3>④ 直近24hのサイト更新（gitコミット）</h3>{updates_html(commits)}</div>'
    tables = (f'<div class="grid">'
              f'<div class="card"><h3>ページ別（直近1週間 TOP10）</h3>{pages_table(week["pages"])}</div>'
              f'<div class="card"><h3>流入元（直近1週間 TOP10）</h3>{sources_table(week["sources"])}</div></div>')
    return (f'<!doctype html><html lang="ja"><head><meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<meta name="robots" content="noindex"><title>SaaS Atlas GA日次レポート</title>'
            f'<style>{style}</style></head><body>{top}{kpis}{clicks_c}{updates}{tables}</body></html>')


# ────────────────────────── Slack ──────────────────────────
def get_slack_token():
    try:
        return subprocess.run(
            ["security", "find-generic-password", "-a", "lifelog", "-s", "SLACK_BOT_TOKEN", "-w"],
            capture_output=True, text=True, check=True).stdout.strip()
    except subprocess.CalledProcessError:
        return ""


def post_slack(text):
    token = get_slack_token()
    if not token:
        print("Warning: SLACK_BOT_TOKEN not found, skip Slack.")
        return False
    def post(channel):
        payload = json.dumps({"channel": channel, "text": f"{SLACK_MENTION}\n{text}",
                              "unfurl_links": False}).encode("utf-8")
        req = urllib.request.Request("https://slack.com/api/chat.postMessage", data=payload,
                                     headers={"Authorization": f"Bearer {token}",
                                              "Content-Type": "application/json; charset=utf-8"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    r = post(SLACK_CHANNEL)
    if not r.get("ok"):
        print(f"Slack API error: {r.get('error')}")
        if r.get("error") in ("not_in_channel", "channel_not_found"):
            r = post("#system-alerts")
            print("fallback #system-alerts:", r.get("ok"))
    return r.get("ok", False)


def slack_summary(ydate, yday, week, wclicks, commits):
    ys, ws = yday["summary"], week["summary"]
    c7 = wclicks.get("7日", {})
    upd = f"{len(commits)}コミット" if commits else "更新なし"
    return (f":bar_chart: *SaaS Atlas GA日次レポート*（{ydate}）\n"
            f"・前日: {kpi_line(ys)}\n"
            f"・直近1週間: ユーザー{m(ws,'activeUsers')} / セッション{m(ws,'sessions')} / PV{m(ws,'screenPageViews')}\n"
            f"・クリック(7日): click {c7.get('click',0)} / outbound_click {c7.get('outbound_click',0)}\n"
            f"・直近24hのサイト更新: {upd}\n"
            f"<{REPORT_URL}|▶ レポート全文（前日/週次/クリック/更新）>")


def slack_fulltext(ydate, wk_start, wk_end, yday, week, wclicks, commits):
    ys, ws = yday["summary"], week["summary"]
    lines = [f":bar_chart: *SaaS Atlas GA日次レポート*（{ydate}）", ""]
    lines.append(f"*① 前日 ({ydate})*\n{kpi_line(ys)}")
    lines.append(f"*② 直近1週間 ({wk_start}〜{wk_end})*\n{kpi_line(ws)}")
    c = wclicks
    lines.append("*③ クリック計測（前日/7日/28日）*\n"
                 f"・click: {c['前日'].get('click',0)} / {c['7日'].get('click',0)} / {c['28日'].get('click',0)}\n"
                 f"・outbound_click: {c['前日'].get('outbound_click',0)} / {c['7日'].get('outbound_click',0)} / {c['28日'].get('outbound_click',0)}")
    if week["pages"]:
        top = "\n".join(f"  {p}  PV{pv}/UU{uu}" for p, pv, uu, _ in week["pages"][:5])
        lines.append(f"*ページ別 直近1週間 TOP5*\n{top}")
    if week["sources"]:
        top = "\n".join(f"  {l}  {s}sess" for l, s, _ in week["sources"][:5])
        lines.append(f"*流入元 直近1週間 TOP5*\n{top}")
    upd = "\n".join(f"  {co['hash']} {co['subject']}" for co in commits[:8]) if commits else "  なし"
    lines.append(f"*④ 直近24hのサイト更新*\n{upd}")
    return "\n\n".join(lines)


# ────────────────────────── main ──────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="Slack/書き込みせず標準出力のみ")
    ap.add_argument("--slack-only", action="store_true", help="全文をSlackに投稿（HTML公開しない）")
    args = ap.parse_args()

    client = get_client()
    pid = PROPERTY_ID
    today = datetime.now().date()
    yday_d = today - timedelta(days=1)
    ydate = yday_d.strftime("%Y-%m-%d")
    wk_start = (today - timedelta(days=7)).strftime("%Y-%m-%d")
    wk_end = ydate
    d28 = (today - timedelta(days=28)).strftime("%Y-%m-%d")

    yday = {"summary": run_summary(client, pid, ydate, ydate),
            "pages": run_pages(client, pid, ydate, ydate),
            "sources": run_sources(client, pid, ydate, ydate)}
    week = {"summary": run_summary(client, pid, wk_start, wk_end),
            "pages": run_pages(client, pid, wk_start, wk_end),
            "sources": run_sources(client, pid, wk_start, wk_end)}
    wclicks = {"前日": run_clicks(client, pid, ydate, ydate),
               "7日": run_clicks(client, pid, wk_start, wk_end),
               "28日": run_clicks(client, pid, d28, wk_end)}
    commits = git_updates()

    gen_dt = datetime.now().strftime("%Y-%m-%d %H:%M")

    if args.dry_run:
        print("=== SaaS Atlas GA日次レポート (dry-run) ===")
        print(f"前日 {ydate}: {kpi_line(yday['summary'])}")
        print(f"週次 {wk_start}〜{wk_end}: {kpi_line(week['summary'])}")
        print(f"クリック 7日: {wclicks['7日']}")
        print(f"ページTOP: {week['pages'][:5]}")
        print(f"流入元TOP: {week['sources'][:5]}")
        print(f"直近24hコミット: {len(commits)}件")
        print("--- Slackサマリー案 ---")
        print(slack_summary(ydate, yday, week, wclicks, commits))
        return

    if args.slack_only:
        ok = post_slack(slack_fulltext(ydate, wk_start, wk_end, yday, week, wclicks, commits))
        print("slack:", ok)
        return

    doc = render_html(gen_dt, ydate, wk_start, wk_end, yday, week, wclicks, commits)
    os.makedirs(REPORT_DIR, exist_ok=True)
    out = os.path.join(REPORT_DIR, "index.html")
    open(out, "w", encoding="utf-8").write(doc)
    print(f"wrote {out} ({len(doc)} bytes)")
    ok = post_slack(slack_summary(ydate, yday, week, wclicks, commits))
    print("slack:", ok)


if __name__ == "__main__":
    main()
