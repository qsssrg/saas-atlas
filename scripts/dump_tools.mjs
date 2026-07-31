// Emit tools.ts as JSON for the Python generation pipeline.
// Uses a regex-lite block parse (tools.ts is a flat literal array).
import { readFileSync } from "node:fs";
const src = readFileSync(new URL("../src/data/tools.ts", import.meta.url), "utf8");
const blocks = src.split(/\n\s{2}\{/).slice(1);
const tools = [];
for (const b of blocks) {
  const g = (re) => { const m = b.match(re); return m ? m[1] : ""; };
  const slug = g(/slug:\s*'([^']+)'/);
  if (!slug) continue;
  // 2026-08-01 修正: 以前は m[1].split(",") でカンマ分割していたため、値の中に
  // カンマを含む文字列が割れていた（'2,000 completions/month' → '2' と '000
  // completions/month'）。壊れた事実源が writer と factchecker の両方に渡り、
  // 「2,000 completions」という正しい記述を factchecker が high で弾いていた。
  // クォートで囲まれた文字列を取り出す方式に変更する。
  const arr = (re) => {
    const m = b.match(re);
    if (!m) return [];
    return (m[1].match(/'((?:[^'\\]|\\.)*)'/g) || [])
      .map((s) => s.slice(1, -1).replace(/\\'/g, "'").trim())
      .filter(Boolean);
  };
  tools.push({
    slug,
    name: g(/name:\s*'([^']+)'/),
    category: g(/category:\s*'([^']+)'/),
    tagline: g(/tagline:\s*'([^']*)'/),
    startingPrice: Number(g(/startingPrice:\s*([0-9.]+)/) || 0),
    hasFreeplan: /hasFreeplan:\s*true/.test(b),
    bestFor: arr(/\n\s{4}bestFor:\s*\[([^\]]*)\]/).slice(0, 5),
    // 2026-08-01 修正: 4スペース字下げ（＝ツール直下のキー）に限定する。以前は
    // 最初の features: に当たっていたため、**pricing の Free ティアの features**
    // を「ツールの主要機能」として渡していた。その結果 GitHub Copilot の機能が
    // 「2,000 completions/month / Limited chat / VS Code only」になり、記事が
    // 「VS Codeでしか動かない」と誤記した（実際は Multi-IDE support）。
    features: arr(/\n\s{4}features:\s*\[([^\]]*)\]/).slice(0, 8),
    // 制約も渡す。過剰主張（"クレジットカード不要"等）を writer 側で防ぐため。
    limitations: arr(/\n\s{4}limitations:\s*\[([^\]]*)\]/).slice(0, 5),
    // 料金プランの内訳。2026-08-01 追加: これが無かったため「無料プランで何ができるか」
    // を書く記事（beginners/free/small-teams 系＝カタログ記事の大半）で、writer が
    // 裏付けのない数字を書き、factchecker が high で弾いていた。
    pricing: (() => {
      const m = b.match(/\n\s{4}pricing:\s*\[([\s\S]*?)\n\s{4}\]/);
      if (!m) return [];
      const tiers = [];
      const re = /\{\s*name:\s*'([^']+)',\s*price:\s*([0-9.]+)[^}]*?features:\s*\[([^\]]*)\]/g;
      let t;
      while ((t = re.exec(m[1])) !== null) {
        tiers.push({
          name: t[1],
          price: Number(t[2]),
          features: (t[3].match(/'((?:[^'\\]|\\.)*)'/g) || [])
            .map((s) => s.slice(1, -1).replace(/\\'/g, "'").trim()),
        });
      }
      return tiers;
    })(),
    // website と affiliate.program は「そのツールで報酬が発生しうるか」の判定材料。
    // 2026-08-01 追加: これが無かったため topic 選定が収益可能性を見られず、
    // アフィリエイトプログラムが1つも無い ai-coding の記事を量産していた。
    website: g(/\n\s{4}website:\s*'([^']*)'/),
    affiliate: {
      program: (() => {
        const m = b.match(/\n\s{4}affiliate:\s*\{([\s\S]*?)\}/);
        if (!m) return "";
        const p = m[1].match(/program:\s*'([^']*)'/);
        return p ? p[1] : "";
      })(),
    },
    headquarters: g(/headquarters:\s*'([^']*)'/),
    originCountry: g(/originCountry:\s*'([^']*)'/),
  });
}
process.stdout.write(JSON.stringify(tools));
