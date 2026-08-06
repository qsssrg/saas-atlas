#!/bin/bash
# SaaS Atlas GA日次レポート デプロイ
#   1. ga_daily_report.py で ~/saas-atlas-ga-report/index.html を生成し Slack #reports にサマリー投稿
#   2. レポートリポ(qsssrg/saas-atlas-ga-report)へ commit & push → GitHub Pages 公開
# LaunchAgent com.lifelog.saas-atlas-ga-report から毎朝呼ばれる想定。
set -e

SAAS_DIR="$HOME/saas-atlas"
REPORT_DIR="$HOME/saas-atlas-ga-report"
LOG="$SAAS_DIR/logs/ga_report_deploy.log"
mkdir -p "$SAAS_DIR/logs"

echo "===== $(date '+%Y-%m-%d %H:%M:%S') deploy start =====" >> "$LOG"

# 1) レポート生成 + Slack
/usr/local/bin/python3 "$SAAS_DIR/scripts/ga_daily_report.py" >> "$LOG" 2>&1

# 2) Cloudflare Pages + Access へ反映（2026-08-06 変更）
# 旧: GitHub Pages。無料プランだと公開リポジトリでしか使えず**サイトも必ず公開**になるため、
# アクセス解析の数値が誰でも見られる状態だった。Accessなら本人だけがログインして見る。
/usr/bin/python3 "$HOME/claudecode/cf_publish.py" "$REPORT_DIR" "saas-atlas-ga-report" "SaaS Atlas GAレポート" >> "$LOG" 2>&1
echo "===== done =====" >> "$LOG"
