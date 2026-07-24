#!/usr/bin/env python3
"""SaaS Atlas ブログ 承認→公開（3c）。

data/review/pending_<slug>.md を承認して公開する。
  1. pending 原稿を src/content/blog/<slug>.md へ移動（日付を今日に打ち直し）
  2. next build で検証（壊れる原稿は公開しない）
  3. git add/commit/push → Vercel 自動デプロイ

使い方:
  python3 scripts/blog_approve.py --list          # 承認待ち一覧
  python3 scripts/blog_approve.py <slug>          # 承認して即公開
  python3 scripts/blog_approve.py <slug> --queue-only   # content へ置くだけ（push しない）
"""

import argparse
import os
import re
import subprocess
import sys
from datetime import date

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REVIEW_DIR = os.path.join(BASE, "data", "review")
BLOG_DIR = os.path.join(BASE, "src", "content", "blog")


def pendings():
    if not os.path.isdir(REVIEW_DIR):
        return []
    return sorted(
        f[len("pending_"):-3]
        for f in os.listdir(REVIEW_DIR)
        if f.startswith("pending_") and f.endswith(".md")
    )


def run(cmd, **kw):
    return subprocess.run(cmd, cwd=BASE, text=True, capture_output=True, **kw)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug", nargs="?")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--queue-only", action="store_true")
    args = ap.parse_args()

    if args.list or not args.slug:
        ps = pendings()
        print("承認待ち:" if ps else "承認待ちなし")
        for s in ps:
            print(f"  {s}")
        return

    slug = args.slug
    if not re.fullmatch(r"[a-z0-9-]+", slug):
        raise SystemExit(f"不正なslug: {slug}")
    src = os.path.join(REVIEW_DIR, f"pending_{slug}.md")
    if not os.path.exists(src):
        raise SystemExit(f"pending が見つからない: {src}")
    dst = os.path.join(BLOG_DIR, f"{slug}.md")
    if os.path.exists(dst):
        raise SystemExit(f"同名の公開記事が既に存在（二重公開防止）: {dst}")

    md = open(src, encoding="utf-8").read()
    # 公開日を今日に打ち直し
    md = re.sub(r"(?m)^date:.*$", f"date: {date.today().isoformat()}", md, count=1)
    os.makedirs(BLOG_DIR, exist_ok=True)
    with open(dst, "w", encoding="utf-8") as f:
        f.write(md)
    os.remove(src)
    print(f"moved → {dst}")

    # ビルド検証（壊れる原稿は公開しない）
    print("next build で検証中…")
    b = run(["npm", "run", "build"])
    if b.returncode != 0:
        # ロールバック
        os.remove(dst)
        with open(src, "w", encoding="utf-8") as f:
            f.write(md)
        print(b.stdout[-2000:])
        print(b.stderr[-1000:])
        raise SystemExit("ビルド失敗 → 公開中止・pending へ戻した")
    print("build OK")

    if args.queue_only:
        print("--queue-only: content に配置のみ（push なし）")
        return

    run(["git", "add", "src/content/blog", "src/app/sitemap.ts"])
    run(["git", "-c", "user.email=noreply@local", "-c", "user.name=saas-atlas",
         "commit", "-q", "-m", f"blog: publish {slug}"])
    p = run(["git", "push", "origin", "main"])
    print(p.stdout, p.stderr)
    print(f"published: https://www.saas-atlas.uk/blog/{slug}")


if __name__ == "__main__":
    main()
