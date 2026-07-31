#!/usr/bin/env python3
"""SaaS Atlas ブログ 2軸レビュー（3c）。

軸A=内容(content_score)、軸B=SEO(seo_score) を各10点で採点し、改稿指示を返す。
執筆=Claude と別主体にするため、両軸とも OpenAI gpt-4o を既定にする（相互検証性）。
ファクトチェック（別工程 blog_factcheck.py）とは役割を分ける＝ここは品質/構成/SEO。

戻り値 JSON: {content_score, seo_score, must_fix[], readability, seo_notes, summary}
使い方（単体）:
  python3 scripts/blog_review.py --draft data/review/draft_xxx.md
"""

import argparse
import json
import os
import re
import sys
import urllib.request

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.expanduser("~/claudecode"))

REVIEW_MODEL = os.environ.get("SAAS_REVIEW_MODEL", "gpt-4o")

REVIEW_SYSTEM = """You are a strict editorial reviewer for SaaS Atlas, an AI-tool comparison site.
Score a draft blog post on two independent axes, 0-10 each. Do NOT rewrite it; return scores and
concrete fixes.

Axis A — CONTENT (content_score): Is it genuinely useful, specific, honest, and well-structured?
  Penalise: fluff, generic filler, hedging with no substance, missing a clear recommendation,
  contradictions, weak intro/closing. Reward: concrete guidance, fair trade-offs, a decisive
  "who should pick what".

Axis B — SEO (seo_score): judge ONLY what cannot be counted mechanically — does the title/meta
  match what a searcher actually wants, is the promise in the title delivered in the body, is the
  recommendation easy to find while skimming, is there keyword stuffing or thin repetition.
  Counts (word count, number of internal links, number of '##' headings, title/meta length) are
  measured in code and given to you below as MEASURED FACTS — treat them as already verified and
  never ask for more of something whose measured number already meets its minimum.

FORMAT NEUTRALITY (important): this site deliberately rotates the voice of its posts — Q&A,
essay, story/timeline, myth-busting, practical how-to, experience-led are all sanctioned formats.
Do NOT lower either score because a post is not a conventional listicle or how-to. Judge whether
the chosen format is executed well, not whether you would have chosen it.

Return ONLY this JSON (no prose, no fences):
{
  "content_score": number, "seo_score": number,
  "must_fix": ["concrete, actionable fix", ...],
  "readability": "1-sentence note",
  "seo_notes": "1-sentence note",
  "summary": "1-2 sentence overall"
}"""


def get_key(name):
    import lifelog_config
    v = lifelog_config.get(name)
    if not v:
        raise SystemExit(f"{name} 未取得")
    return v


def call_openai(system, user, model=REVIEW_MODEL):
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


def review(md_full):
    # 数えられる基準は blog_seo_facts が実測し、その結果を渡す。
    # これを渡さないと「内部リンクをもっと」のような**すでに満たしている指摘**が
    # 毎回返り、改稿しても直せず永久に落ち続ける（2026-08-01 の調査で実証）。
    try:
        import blog_seo_facts as bsf
        facts_note = bsf.facts_note(bsf.measure(md_full))
    except Exception:
        facts_note = ""
    user = (f"Review this draft (frontmatter + markdown body):\n\n{md_full}\n\n"
            f"{facts_note}\n\nReturn JSON only.")
    raw = call_openai(REVIEW_SYSTEM, user).strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```[a-z]*\n?|\n?```$", "", raw).strip()
    r = json.loads(raw)
    r["content_score"] = float(r.get("content_score", 0))
    r["seo_score"] = float(r.get("seo_score", 0))
    return r


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--draft", required=True)
    args = ap.parse_args()
    md = open(args.draft, encoding="utf-8").read()
    print(json.dumps(review(md), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
