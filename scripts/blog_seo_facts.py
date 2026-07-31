#!/usr/bin/env python3
"""blog_seo_facts.py — SEOの「機械で測れること」をコードで測る。

【なぜ要るか（2026-08-01 調査）】
SEOレビュー(gpt-4o)が rubric に挙げていた基準——内部リンク・語数・見出し構造——は
**全部コードで数えられるのに、LLMの主観に任せていた**。その結果:
  ・落ちた原稿(seo=7.0)と通った記事(seo=9.0)が、リンク数(9/1/1)も語数(825/826)も同一
  ・すでに公開済みの記事を再採点すると 7.0 で落ちる
  ・毎回「内部リンクをもっと」と定型で言われる（実際は11本あるのに）
  ・スコアは 7.0 か 9.0 の二値、content は常に 8.0（判別力ゼロ）
つまり「閾値8.0」は実質「9が出るまでガチャ」で、当たりを決めていたのは**文体**だった
（実用手順型/体験型=9.0、Q&A型/エッセイ型/物語型/神話破壊型=7.0）。
これは園田さんの「文体に幅を持たせる」方針と正面衝突していた。

→ 数えられるものはここで数え、**実測値をレビュアに渡して「もう満たしている」と分かる
ようにする**。合否もこの実測値で決める（LLMには数えさせない）。
"""
import re
import sys

# 基準値。SEO上の意味があり、かつ機械的に判定できるものだけを置く。
MIN_WORDS = 600
MAX_WORDS = 1600
MIN_TOOL_LINKS = 3        # /tools/<slug> への内部リンク
MIN_TAXONOMY_LINKS = 1    # /categories/ か /compare/ か /finder への内部リンク
MIN_H2 = 3
DESC_MIN, DESC_MAX = 70, 170   # meta description（検索結果で切られない範囲）
TITLE_MIN, TITLE_MAX = 25, 75   # 既存の公開記事が71字で通っているため、1字差で止めない実用値


def _frontmatter(md: str) -> dict:
    m = re.match(r"^---\n(.*?)\n---\n", md, re.DOTALL)
    if not m:
        return {}
    out = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def _body(md: str) -> str:
    return re.sub(r"^---\n.*?\n---\n", "", md, flags=re.DOTALL)


def measure(md: str) -> dict:
    fm = _frontmatter(md)
    body = _body(md)
    tool_links = re.findall(r"\]\(/tools/[^)]+\)", body)
    taxonomy = (re.findall(r"\]\(/categories/[^)]+\)", body)
            + re.findall(r"\]\(/compare/[^)]+\)", body)
            + re.findall(r"\]\(/finder[^)]*\)", body))
    return {
        "words": len(body.split()),
        "tool_links": len(tool_links),
        "taxonomy_links": len(taxonomy),
        "h2": len(re.findall(r"^##\s+\S", body, re.MULTILINE)),
        "title_len": len(fm.get("title", "")),
        "desc_len": len(fm.get("description", "")),
        "has_title": bool(fm.get("title")),
        "has_desc": bool(fm.get("description")),
    }


def check(f: dict) -> list:
    """満たしていない項目を「何をどうすればよいか」の形で返す。空なら合格。"""
    bad = []
    if not f["has_title"]:
        bad.append("frontmatter に title がない")
    elif not (TITLE_MIN <= f["title_len"] <= TITLE_MAX):
        bad.append(f"title が {f['title_len']}字（{TITLE_MIN}〜{TITLE_MAX}字に収める）")
    if not f["has_desc"]:
        bad.append("frontmatter に description がない")
    elif not (DESC_MIN <= f["desc_len"] <= DESC_MAX):
        bad.append(f"description が {f['desc_len']}字（{DESC_MIN}〜{DESC_MAX}字に収める）")
    if f["words"] < MIN_WORDS:
        bad.append(f"本文 {f['words']}語（{MIN_WORDS}語以上に増やす）")
    elif f["words"] > MAX_WORDS:
        bad.append(f"本文 {f['words']}語（{MAX_WORDS}語以下に削る）")
    if f["tool_links"] < MIN_TOOL_LINKS:
        bad.append(f"/tools/ への内部リンクが {f['tool_links']}本（{MIN_TOOL_LINKS}本以上）")
    if f["taxonomy_links"] < MIN_TAXONOMY_LINKS:
        bad.append(f"/categories/ /compare/ /finder への内部リンクが "
                   f"{f['taxonomy_links']}本（{MIN_TAXONOMY_LINKS}本以上）")
    if f["h2"] < MIN_H2:
        bad.append(f"## 見出しが {f['h2']}個（{MIN_H2}個以上）")
    return bad


def facts_note(f: dict) -> str:
    """レビュアに渡す実測値。これを渡すことで「リンクを増やせ」の誤指摘を構造的に防ぐ。"""
    return (
        "MEASURED FACTS (already counted in code — these are correct, do NOT ask for them again):\n"
        f"- body length: {f['words']} words (target {MIN_WORDS}-{MAX_WORDS})\n"
        f"- internal links to /tools/: {f['tool_links']} (minimum {MIN_TOOL_LINKS})\n"
        f"- internal links to /categories//compare//finder: {f['taxonomy_links']} "
        f"(minimum {MIN_TAXONOMY_LINKS})\n"
        f"- '##' headings: {f['h2']} (minimum {MIN_H2})\n"
        f"- title length: {f['title_len']} chars / meta description: {f['desc_len']} chars\n"
        "If a count above already meets its minimum, that criterion is SATISFIED. "
        "Never list 'add more internal links', 'make it longer' or 'add headings' as a fix "
        "when the measured number already meets the minimum."
    )


if __name__ == "__main__":
    md = open(sys.argv[1], encoding="utf-8").read()
    f = measure(md)
    bad = check(f)
    print("実測:", f)
    print("未達:", bad if bad else "なし（機械チェック合格）")
    sys.exit(0 if not bad else 1)
