import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { tools, getToolBySlug, hasAffiliate } from "@/data/tools";
import { Tool } from "@/types";
import TrackedLink from "@/components/TrackedLink";

// Generate all pairwise comparisons within same category
export async function generateStaticParams() {
  const params: { "toolA": string; "toolB": string }[] = [];
  const categories = [...new Set(tools.map((t) => t.category))];

  for (const cat of categories) {
    const catTools = tools.filter((t) => t.category === cat);
    for (let i = 0; i < catTools.length; i++) {
      for (let j = i + 1; j < catTools.length; j++) {
        params.push({
          "toolA": catTools[i].slug,
          "toolB": catTools[j].slug,
        });
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ "toolA": string; "toolB": string }>;
}): Promise<Metadata> {
  const { toolA: slugA, toolB: slugB } = await params;
  const toolA = getToolBySlug(slugA);
  const toolB = getToolBySlug(slugB);
  if (!toolA || !toolB) return { title: "Comparison Not Found" };

  const title = `${toolA.name} vs ${toolB.name} (2026) — Pricing, Features & Expert Verdict`;
  const description = `Detailed comparison of ${toolA.name} ($${toolA.startingPrice}/mo) vs ${toolB.name} ($${toolB.startingPrice}/mo). Which AI tool is better for your needs? Expert analysis and side-by-side feature comparison.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "article", url: `https://saas-atlas.uk/compare/${slugA}-vs-${slugB}` },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: `https://saas-atlas.uk/compare/${slugA}-vs-${slugB}` },
  };
}

function ComparisonRow({
  label,
  valueA,
  valueB,
  highlight,
}: {
  label: string;
  valueA: string | React.ReactNode;
  valueB: string | React.ReactNode;
  highlight?: "a" | "b" | "tie";
}) {
  return (
    <tr className="border-b border-[var(--line-soft)] last:border-0">
      <td className="px-5 py-3 text-sm font-medium text-[var(--ink)]">
        {label}
      </td>
      <td
        className={`px-4 py-3 text-sm ${highlight === "a" ? "font-semibold text-[var(--good)]" : "text-[var(--ink-soft)]"}`}
      >
        {valueA}
      </td>
      <td
        className={`px-5 py-3 text-sm ${highlight === "b" ? "font-semibold text-[var(--good)]" : "text-[var(--ink-soft)]"}`}
      >
        {valueB}
      </td>
    </tr>
  );
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ "toolA": string; "toolB": string }>;
}) {
  const { toolA: slugA, toolB: slugB } = await params;
  const toolA = getToolBySlug(slugA);
  const toolB = getToolBySlug(slugB);
  if (!toolA || !toolB) notFound();

  const priceWinner =
    toolA.startingPrice < toolB.startingPrice
      ? "a"
      : toolA.startingPrice > toolB.startingPrice
        ? "b"
        : "tie";

  return (
    <div className="section">
      <div className="mx-auto w-full max-w-[860px] px-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://saas-atlas.uk" },
              { "@type": "ListItem", position: 2, name: `${toolA.name} vs ${toolB.name}`, item: `https://saas-atlas.uk/compare/${toolA.slug}-vs-${toolB.slug}` },
            ],
          }),
        }}
      />
      <nav className="font-mono-t mb-8 text-[12px] text-[var(--ink-faint)]">
        <Link href="/" className="hover:text-[var(--accent)]">
          Home
        </Link>
        <span className="mx-2 opacity-50">/</span>
        <span className="text-[var(--ink-soft)]">
          {toolA.name} vs {toolB.name}
        </span>
      </nav>

      <header className="mb-10 text-center">
        <p className="eyebrow-plain mb-3">Head to head</p>
        <h1 className="display-h1">
          {toolA.name} <em>vs</em> {toolB.name}
        </h1>
        <p className="mx-auto mt-4 max-w-[640px] text-[var(--ink-soft)]">
          Side-by-side comparison of two leading{" "}
          {toolA.category === "ai-writing"
            ? "AI writing"
            : toolA.category === "ai-image"
              ? "AI image generation"
              : "AI coding"}{" "}
          tools. Updated {toolA.lastUpdated}.
        </p>
      </header>

      {/* Quick verdict */}
      <section className="card mb-10 p-6" style={{ background: "var(--sea)" }}>
        <p className="eyebrow mb-2">Quick Verdict</p>
        <p className="mt-2 text-[var(--ink-soft)]">
          <strong className="text-[var(--ink)]">{toolA.name}</strong> is best for{" "}
          {toolA.bestFor[0]?.toLowerCase()}, while{" "}
          <strong className="text-[var(--ink)]">{toolB.name}</strong> is ideal for{" "}
          {toolB.bestFor[0]?.toLowerCase()}.
          {priceWinner === "a"
            ? ` ${toolA.name} is more affordable starting at $${toolA.startingPrice}/mo.`
            : priceWinner === "b"
              ? ` ${toolB.name} is more affordable starting at $${toolB.startingPrice}/mo.`
              : " Both tools are similarly priced."}
        </p>
      </section>

      {/* Comparison table */}
      <section className="card mb-12 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--line-soft)]">
              <th className="tag-mono px-5 py-3.5 text-left">Feature</th>
              <th className="px-4 py-3.5 text-left text-sm font-semibold text-[var(--ink)]">
                {toolA.name}
              </th>
              <th className="px-5 py-3.5 text-left text-sm font-semibold text-[var(--ink)]">
                {toolB.name}
              </th>
            </tr>
          </thead>
          <tbody>
            <ComparisonRow
              label="Starting Price"
              valueA={
                toolA.startingPrice === 0
                  ? "Free"
                  : `$${toolA.startingPrice}/mo`
              }
              valueB={
                toolB.startingPrice === 0
                  ? "Free"
                  : `$${toolB.startingPrice}/mo`
              }
              highlight={priceWinner}
            />
            <ComparisonRow
              label="Free Plan"
              valueA={toolA.hasFreeplan ? "✓ Yes" : "✗ No"}
              valueB={toolB.hasFreeplan ? "✓ Yes" : "✗ No"}
              highlight={
                toolA.hasFreeplan && !toolB.hasFreeplan
                  ? "a"
                  : !toolA.hasFreeplan && toolB.hasFreeplan
                    ? "b"
                    : "tie"
              }
            />
            <ComparisonRow
              label="Founded"
              valueA={String(toolA.founded)}
              valueB={String(toolB.founded)}
            />
            <ComparisonRow
              label="Headquarters"
              valueA={toolA.headquarters}
              valueB={toolB.headquarters}
            />
            <ComparisonRow
              label="Best For"
              valueA={toolA.bestFor.join(", ")}
              valueB={toolB.bestFor.join(", ")}
            />
            <ComparisonRow
              label="Key Features"
              valueA={
                <ul className="space-y-1">
                  {toolA.features.slice(0, 5).map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
              }
              valueB={
                <ul className="space-y-1">
                  {toolB.features.slice(0, 5).map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
              }
            />
            <ComparisonRow
              label="Limitations"
              valueA={toolA.limitations.join("; ")}
              valueB={toolB.limitations.join("; ")}
            />
            <ComparisonRow
              label="Affiliate Commission"
              valueA={toolA.affiliate.commission}
              valueB={toolB.affiliate.commission}
            />
          </tbody>
        </table>
      </section>

      {/* CTAs */}
      <section className="grid gap-4 sm:grid-cols-2">
        <TrackedLink
          href={toolA.website}
          toolSlug={toolA.slug}
          toolName={toolA.name}
          hasAffiliate={hasAffiliate(toolA)}
          linkType="compare"
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="card card-hover p-6 text-center"
        >
          <h3 className="text-lg font-bold text-[var(--accent)]">
            Try {toolA.name}
          </h3>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            {toolA.hasFreeplan ? "Start free" : "Start free trial"} →
          </p>
        </TrackedLink>
        <TrackedLink
          href={toolB.website}
          toolSlug={toolB.slug}
          toolName={toolB.name}
          hasAffiliate={hasAffiliate(toolB)}
          linkType="compare"
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="card card-hover p-6 text-center"
        >
          <h3 className="text-lg font-bold text-[var(--accent)]">
            Try {toolB.name}
          </h3>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            {toolB.hasFreeplan ? "Start free" : "Start free trial"} →
          </p>
        </TrackedLink>
      </section>

      {/* Related comparisons */}
      <section className="mt-12">
        <div className="mb-5">
          <p className="eyebrow mb-3">Keep comparing</p>
          <h2 className="display-h2">More comparisons</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {tools
            .filter(
              (t) =>
                t.category === toolA.category &&
                t.slug !== toolA.slug &&
                t.slug !== toolB.slug
            )
            .flatMap((t) => [
              <Link
                key={`${toolA.slug}-vs-${t.slug}`}
                href={`/compare/${toolA.slug}-vs-${t.slug}`}
                className="tag-mono rounded-full border border-[var(--line-soft)] px-3 py-1.5 text-[var(--ink-soft)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {toolA.name} vs {t.name}
              </Link>,
              <Link
                key={`${toolB.slug}-vs-${t.slug}`}
                href={`/compare/${toolB.slug}-vs-${t.slug}`}
                className="tag-mono rounded-full border border-[var(--line-soft)] px-3 py-1.5 text-[var(--ink-soft)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {toolB.name} vs {t.name}
              </Link>,
            ])}
        </div>
      </section>

      {/* FAQ */}
      {(() => {
        const cheaper =
          priceWinner === "a" ? toolA : priceWinner === "b" ? toolB : null;
        const faqItems = [
          {
            q: `Is ${toolA.name} or ${toolB.name} cheaper?`,
            a: cheaper
              ? `${cheaper.name} is cheaper, starting at $${cheaper.startingPrice}/mo, versus $${(cheaper === toolA ? toolB : toolA).startingPrice}/mo for ${(cheaper === toolA ? toolB : toolA).name}.`
              : `${toolA.name} and ${toolB.name} start at the same price ($${toolA.startingPrice}/mo).`,
          },
          {
            q: `What is the main difference between ${toolA.name} and ${toolB.name}?`,
            a: `${toolA.name} is best for ${toolA.bestFor[0]?.toLowerCase()}, while ${toolB.name} is ideal for ${toolB.bestFor[0]?.toLowerCase()}. See the feature table above for a full side-by-side.`,
          },
          {
            q: `Does ${toolA.name} or ${toolB.name} have a free plan?`,
            a:
              toolA.hasFreeplan && toolB.hasFreeplan
                ? `Both ${toolA.name} and ${toolB.name} offer a free plan.`
                : toolA.hasFreeplan
                  ? `${toolA.name} offers a free plan; ${toolB.name} does not.`
                  : toolB.hasFreeplan
                    ? `${toolB.name} offers a free plan; ${toolA.name} does not.`
                    : `Neither ${toolA.name} nor ${toolB.name} offers a permanent free plan.`,
          },
          {
            q: `Which is better, ${toolA.name} or ${toolB.name}?`,
            a: `Neither wins outright — it depends on your use case. Choose ${toolA.name} for ${toolA.bestFor[0]?.toLowerCase()}, or ${toolB.name} for ${toolB.bestFor[0]?.toLowerCase()}. Both are compared in detail above.`,
          },
        ];
        return (
          <section className="mt-12">
            <div className="mb-5">
              <p className="eyebrow mb-3">FAQ</p>
              <h2 className="display-h2">Frequently asked questions</h2>
            </div>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: faqItems.map((item) => ({
                    "@type": "Question",
                    name: item.q,
                    acceptedAnswer: { "@type": "Answer", text: item.a },
                  })),
                }),
              }}
            />
            <div className="space-y-3">
              {faqItems.map((item) => (
                <details key={item.q} className="card group">
                  <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-[var(--ink)] hover:text-[var(--accent)]">
                    {item.q}
                  </summary>
                  <p className="px-5 pb-4 text-sm text-[var(--ink-soft)]">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        );
      })()}
      </div>
    </div>
  );
}
