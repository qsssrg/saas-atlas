#!/usr/bin/env python3
"""SaaS Atlas ブログ記事 生成パイプライン（3b: 生成のみ）。

topic選定（カタログ常緑 ＋ 任意でHN AIニュース）→ tools.ts の事実収集 →
Claude執筆 → frontmatter付き .md を生成。

このスクリプトは **生成だけ** を行う（公開しない）。既定の出力先は
data/review/draft_<slug>.md（人間承認ゲート前のドラフト置き場）。
2軸レビュー/ファクトチェック/承認/公開は後続（3c）で足す。

使い方:
  python3 scripts/blog_generate.py --dry-run          # 生成して要約を表示（ファイルも保存）
  python3 scripts/blog_generate.py --category ai-coding --angle "budget picks"
  python3 scripts/blog_generate.py --list-topics       # 候補トピックを列挙して終了

依存: Anthropic API（Keychain lifelog 経由 lifelog_config）。ゼロ依存方針のため
urllib で直接叩く（anthropic SDK は入れない）。
"""

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.request
from datetime import date

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # ~/saas-atlas
REVIEW_DIR = os.path.join(BASE, "data", "review")
BLOG_DIR = os.path.join(BASE, "src", "content", "blog")
sys.path.insert(0, os.path.expanduser("~/claudecode"))

WRITER_MODEL = os.environ.get("SAAS_WRITER_MODEL", "claude-sonnet-4-6")

CATEGORY_LABEL = {
    "ai-writing": "AI writing tools",
    "ai-image": "AI image generation tools",
    "ai-coding": "AI coding assistants",
    "ai-voice": "AI voice & audio tools",
    "ai-productivity": "AI productivity tools",
}

# Evergreen angles — the durable, catalog-driven article shapes. Each combines
# with a category to form a topic. These are SEO long-tail + revenue-linked.
ANGLES = [
    ("best for solo creators", "budget-first picks for individuals and freelancers"),
    ("best free", "tools with a genuine free plan and what you give up"),
    ("best for small teams", "collaboration-friendly picks under a sensible budget"),
    ("best for beginners", "easiest tools to start with, no steep learning curve"),
    ("cheapest that are actually good", "low-cost tools that don't compromise on quality"),
    ("enterprise-grade", "tools built for scale, security, and governance"),
]


# ── util ────────────────────────────────────────────────────
def slugify(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def get_key(name: str) -> str:
    import lifelog_config
    v = lifelog_config.get(name)
    if not v:
        raise SystemExit(f"{name} 未取得（Keychain lifelog）")
    return v


def load_tools() -> list:
    out = subprocess.run(
        ["node", os.path.join(BASE, "scripts", "dump_tools.mjs")],
        capture_output=True, text=True, check=True,
    ).stdout
    return json.loads(out)


def existing_slugs() -> set:
    if not os.path.isdir(BLOG_DIR):
        return set()
    return {f[:-3] for f in os.listdir(BLOG_DIR) if f.endswith(".md")}


# ── topic 選定 ──────────────────────────────────────────────
def enumerate_topics(tools):
    cats = sorted({t["category"] for t in tools})
    topics = []
    for cat in cats:
        for angle, desc in ANGLES:
            label = CATEGORY_LABEL.get(cat, cat)
            title = f"The Best {label.title()} {angle.title()} in {date.today().year}"
            topics.append({
                "category": cat,
                "angle": angle,
                "angle_desc": desc,
                "title": title,
                "slug": slugify(f"best-{cat}-{angle}-{date.today().year}"),
            })
    return topics


def pick_topic(tools, category=None, angle=None):
    topics = enumerate_topics(tools)
    used = existing_slugs()
    cand = [t for t in topics if t["slug"] not in used]
    if category:
        cand = [t for t in cand if t["category"] == category]
    if angle:
        cand = [t for t in cand if angle.lower() in t["angle"].lower()]
    if not cand:
        cand = [t for t in topics if (not category or t["category"] == category)]
    return cand[0] if cand else None


# ── 事実収集 ────────────────────────────────────────────────
def facts_for(topic, tools):
    pool = [t for t in tools if t["category"] == topic["category"]]
    lines = []
    for t in pool:
        price = "free plan" if t["hasFreeplan"] else f"from ${t['startingPrice']}/mo"
        lines.append(
            f"- {t['name']} (slug: {t['slug']}): {t['tagline']}. Pricing: {price}. "
            f"Best for: {', '.join(t['bestFor'])}. Key features: {', '.join(t['features'][:5])}. "
            f"HQ: {t['headquarters']}."
        )
    return "\n".join(lines), pool


# ── Claude 執筆 ─────────────────────────────────────────────
WRITER_SYSTEM = """You are the editor of SaaS Atlas (saas-atlas.uk), an expert AI-tool comparison site.
Write a genuinely useful, honest buyer's-guide blog post in British English.

STRICT RULES:
- Use ONLY the facts provided about the tools. Never invent pricing, features, or companies.
  If a figure isn't given, don't state a number — say to check the official pricing.
- Be specific and opinionated but fair. Recommend the right tool for the reader's situation,
  not just the most expensive one.
- Structure: a short intro, 2–4 `##` sections, and a closing. Use markdown only
  (##, **bold**, - lists, [text](url) links). No MDX/JSX, no images, no HTML.
- Internal links you SHOULD use (relative URLs): each tool's review at /tools/<slug>,
  the category page /categories/<category>, and the quiz at /finder.
- End with a one-line CTA linking to /finder.
- Do NOT fabricate testimonials, star ratings, or user counts.
- Keep it ~600–900 words.

Return ONLY a JSON object (no prose, no code fences) with keys:
  title (string), description (string, <=155 chars, plain), tags (array of 3-5 short strings),
  body (string, the markdown body WITHOUT frontmatter and WITHOUT the H1 title)."""


def _claude(messages, system):
    key = get_key("ANTHROPIC_API_KEY")
    payload = json.dumps({
        "model": WRITER_MODEL,
        "max_tokens": 3000,
        "system": system,
        "messages": messages,
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=payload,
        headers={
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    text = "".join(block.get("text", "") for block in data.get("content", [])).strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-z]*\n?|\n?```$", "", text).strip()
    return json.loads(text)


def call_claude(topic, facts, category):
    user = f"""Topic: {topic['title']}
Angle: {topic['angle']} — {topic['angle_desc']}
Category: {category} (use /categories/{category} as the category link)

Tools available in this category (facts — use these only):
{facts}

Write the post now. Remember: JSON only."""
    return _claude([{"role": "user", "content": user}], WRITER_SYSTEM)


def revise_claude(article, facts, category, review_fixes=None, factcheck_issues=None):
    """Ask the writer to revise the article given review / fact-check feedback."""
    parts = []
    if review_fixes:
        parts.append("Editorial fixes to apply:\n- " + "\n- ".join(review_fixes))
    if factcheck_issues:
        fc = "\n".join(
            f"- [{i.get('severity')}] {i.get('claim')} → {i.get('fix')}" for i in factcheck_issues
        )
        parts.append(
            "Fact-check problems to FIX (do not state any figure that isn't in the facts; "
            "prefer 'check official pricing'):\n" + fc
        )
    user = f"""Revise the article below. Keep what works; apply the feedback exactly.
Use ONLY these facts (never invent numbers):
{facts}
Category link: /categories/{category}

{chr(10).join(parts)}

Current article JSON:
{json.dumps(article, ensure_ascii=False)}

Return the FULL revised article as JSON only (same keys: title, description, tags, body)."""
    return _claude([{"role": "user", "content": user}], WRITER_SYSTEM)


# ── 出力 ────────────────────────────────────────────────────
def to_markdown(article, topic):
    tags = article.get("tags") or [topic["category"]]
    tags_str = "[" + ", ".join(tags) + "]"
    fm = (
        "---\n"
        f"title: {article['title']}\n"
        f"description: {article['description']}\n"
        f"date: {date.today().isoformat()}\n"
        f"category: {topic['category']}\n"
        f"tags: {tags_str}\n"
        "---\n\n"
    )
    return fm + article["body"].strip() + "\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--category", choices=list(CATEGORY_LABEL.keys()))
    ap.add_argument("--angle")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--list-topics", action="store_true")
    args = ap.parse_args()

    tools = load_tools()

    if args.list_topics:
        for t in enumerate_topics(tools):
            mark = "  (exists)" if t["slug"] in existing_slugs() else ""
            print(f"{t['category']:16s} | {t['title']}{mark}")
        return

    topic = pick_topic(tools, args.category, args.angle)
    if not topic:
        raise SystemExit("候補トピックなし")
    print(f"Topic: {topic['title']}  (slug: {topic['slug']})")

    facts, pool = facts_for(topic, tools)
    print(f"Facts: {len(pool)} tools in {topic['category']}")

    print("Writing with Claude…")
    article = call_claude(topic, facts, topic["category"])
    md = to_markdown(article, topic)

    os.makedirs(REVIEW_DIR, exist_ok=True)
    out = os.path.join(REVIEW_DIR, f"draft_{topic['slug']}.md")
    with open(out, "w", encoding="utf-8") as f:
        f.write(md)

    print(f"\n=== DRAFT saved (NOT published): {out} ===")
    print(f"title: {article['title']}")
    print(f"description: {article['description']}")
    print(f"tags: {article.get('tags')}")
    body = article["body"].strip()
    print(f"body: {len(body.split())} words")
    print("\n--- preview (first 900 chars) ---")
    print(body[:900])
    if args.dry_run:
        print("\n[dry-run] 公開はしていません。中身を確認してください。")


if __name__ == "__main__":
    main()
