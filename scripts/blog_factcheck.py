#!/usr/bin/env python3
"""SaaS Atlas ブログ 専任ファクトチェック工程（3c）。

完成原稿を、**提供した事実（tools.ts 由来の構造化データ）を唯一の真実源**として
独立AIが検証する。提供事実に無い数値・仕様・断定（＝ハルシネーション）を high/
medium/low で洗い出す。読みやすさ・SEO・文体は評価しない（別工程）。

seo-machine の blog_factcheck を範に、saas-atlas 用（明示 facts 突合）に独立実装。
OpenAI gpt-4o を既定バックエンドにする（執筆= Claude と別主体にして相互検証性を上げる）。

使い方（単体）:
  python3 scripts/blog_factcheck.py --draft data/review/draft_xxx.md --facts-cat ai-coding
戻り値: JSON {verdict, issues[], summary} を stdout。ライブラリとしても import 可。
"""

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.request

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.expanduser("~/claudecode"))

FACTCHECK_MODEL = os.environ.get("SAAS_FACTCHECK_MODEL", "gpt-4o")

FACTCHECK_SYSTEM = """You are a professional fact-checker for a SaaS comparison site. Your ONLY job is
to verify the factual claims in the article below AGAINST THE PROVIDED FACTS, and flag anything
that is wrong, unverifiable, or overconfident. You do NOT judge readability, structure, SEO, or
tone — other stages own those.

The PROVIDED FACTS are the single source of truth: pricing, free-plan availability, best-for
audiences, features, HQ, taglines for each tool. Rules:
- Any specific NUMBER, spec, metric, limit, date, or capability claim in the article that is NOT
  present in the provided facts is a hallucination risk — flag it (severity high if it's a
  concrete figure like "2,000 completions", "10x faster", "$29/mo", a user count, or a %).
- Any pricing/free-vs-paid statement that CONTRADICTS the provided facts is high severity.
- Vague, well-hedged, or clearly-provided statements are fine — do NOT over-flag.
- Marketing adjectives ("powerful", "popular") are fine unless they assert a measurable fact.

Return ONLY this JSON (no prose, no code fences):
{
  "verdict": "ok" or "revise" (revise if ANY high-severity issue exists),
  "issues": [
    {"claim": "the claim in the article (may paraphrase)",
     "problem": "why it's a factual problem (not in facts / contradicts facts / overconfident)",
     "severity": "high" | "medium" | "low",
     "fix": "recommended fix (hedge / remove the figure / say 'check official pricing')"}
  ],
  "summary": "1-2 sentence overall assessment"
}
If nothing is wrong, issues is [] and verdict is "ok"."""


def get_key(name):
    import lifelog_config
    v = lifelog_config.get(name)
    if not v:
        raise SystemExit(f"{name} 未取得")
    return v


def load_facts_for_category(category):
    out = subprocess.run(
        ["node", os.path.join(BASE, "scripts", "dump_tools.mjs")],
        capture_output=True, text=True, check=True,
    ).stdout
    tools = [t for t in json.loads(out) if t["category"] == category]
    lines = []
    for t in tools:
        price = "free plan" if t["hasFreeplan"] else f"from ${t['startingPrice']}/mo"
        lines.append(
            f"- {t['name']} (slug {t['slug']}): {t['tagline']}. Pricing: {price}. "
            f"Best for: {', '.join(t['bestFor'])}. Features: {', '.join(t['features'])}. HQ: {t['headquarters']}."
        )
    return "\n".join(lines)


def call_openai(system, user, model=FACTCHECK_MODEL):
    key = get_key("OPENAI_API_KEY")
    payload = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0,
        "response_format": {"type": "json_object"},
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=payload,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data["choices"][0]["message"]["content"]


def factcheck(body_markdown, facts):
    user = f"""PROVIDED FACTS (single source of truth):
{facts}

ARTICLE TO CHECK (markdown body):
{body_markdown}

Fact-check now. JSON only."""
    raw = call_openai(FACTCHECK_SYSTEM, user)
    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```[a-z]*\n?|\n?```$", "", raw).strip()
    result = json.loads(raw)
    # normalise: high present -> revise
    issues = result.get("issues", [])
    if any((i.get("severity") == "high") for i in issues):
        result["verdict"] = "revise"
    return result


def strip_frontmatter(md):
    m = re.match(r"^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$", md)
    return m.group(1) if m else md


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--draft", required=True)
    ap.add_argument("--facts-cat", required=True)
    args = ap.parse_args()
    md = open(args.draft, encoding="utf-8").read()
    facts = load_facts_for_category(args.facts_cat)
    result = factcheck(strip_frontmatter(md), facts)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
