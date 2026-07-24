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
  const arr = (re) => { const m = b.match(re); return m ? m[1].split(",").map((s) => s.replace(/['\[\]]/g, "").trim()).filter(Boolean) : []; };
  tools.push({
    slug,
    name: g(/name:\s*'([^']+)'/),
    category: g(/category:\s*'([^']+)'/),
    tagline: g(/tagline:\s*'([^']*)'/),
    startingPrice: Number(g(/startingPrice:\s*([0-9.]+)/) || 0),
    hasFreeplan: /hasFreeplan:\s*true/.test(b),
    bestFor: arr(/bestFor:\s*\[([^\]]*)\]/).slice(0, 5),
    features: arr(/features:\s*\[([^\]]*)\]/).slice(0, 8),
    headquarters: g(/headquarters:\s*'([^']*)'/),
    originCountry: g(/originCountry:\s*'([^']*)'/),
  });
}
process.stdout.write(JSON.stringify(tools));
