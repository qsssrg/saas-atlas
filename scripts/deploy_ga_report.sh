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

# 2) GitHub Pages へ反映
cd "$REPORT_DIR"
if [ -n "$(git status --porcelain index.html)" ]; then
  git add index.html
  git -c user.email=noreply@local -c user.name=saas-atlas commit -q -m "GA daily report $(date '+%Y-%m-%d')" >> "$LOG" 2>&1
  git push origin main >> "$LOG" 2>&1
  echo "pushed." >> "$LOG"
else
  echo "No changes to deploy." >> "$LOG"
fi
echo "===== done =====" >> "$LOG"
