import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { tools, getToolsByCategory, hasAffiliate } from "@/data/tools";
import { categories, getCategoryBySlug } from "@/data/categories";
import { countries } from "@/data/countries";
import TrackedLink from "@/components/TrackedLink";

export async function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategoryBySlug(category);
  if (!cat) return { title: "Category Not Found" };

  const title = `Best ${cat.name} 2026 — Compare Pricing, Features & Alternatives`;
  return {
    title,
    description: cat.description,
    openGraph: { title, description: cat.description, type: "website", url: `https://www.saas-atlas.uk/categories/${cat.slug}` },
    twitter: { card: "summary_large_image", title, description: cat.description },
    alternates: { canonical: `https://www.saas-atlas.uk/categories/${cat.slug}` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = getCategoryBySlug(category);
  if (!cat) notFound();

  const categoryTools = getToolsByCategory(category);

  return (
    <div className="section">
      <div className="container-atlas">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://www.saas-atlas.uk" },
                { "@type": "ListItem", position: 2, name: cat.name, item: `https://www.saas-atlas.uk/categories/${cat.slug}` },
              ],
            }),
          }}
        />
        <nav className="font-mono-t mb-8 text-[12px] text-[var(--ink-faint)]">
          <Link href="/" className="hover:text-[var(--accent)]">
            Home
          </Link>
          <span className="mx-2 opacity-50">/</span>
          <span className="text-[var(--ink-soft)]">{cat.name}</span>
        </nav>

        <header className="mb-12">
          <p className="eyebrow mb-3">{cat.icon} Category</p>
          <h1 className="display-h1">
            Best <em>{cat.name}</em> 2026
          </h1>
          <p className="mt-4 max-w-[640px] text-[var(--ink-soft)]">
            {cat.description}
          </p>
        </header>

        {categoryTools.length === 0 ? (
          <div className="card border-dashed p-12 text-center">
            <p className="text-lg text-[var(--ink-soft)]">
              Tools for this category are coming soon.
            </p>
          </div>
        ) : (
        <>
          {/* Comparison table */}
          <section className="card mb-12 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--line-soft)] text-left">
                  <th className="tag-mono px-5 py-3.5">Tool</th>
                  <th className="tag-mono px-4 py-3.5">Starting Price</th>
                  <th className="tag-mono px-4 py-3.5">Free Plan</th>
                  <th className="tag-mono px-4 py-3.5">Origin</th>
                  <th className="tag-mono px-4 py-3.5">Best For</th>
                  <th className="tag-mono px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categoryTools.map((tool) => (
                  <tr
                    key={tool.slug}
                    className="border-b border-[var(--line-soft)] last:border-0 transition-colors hover:bg-[var(--accent-soft)]"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/tools/${tool.slug}`}
                        className="font-medium text-[var(--ink)] hover:text-[var(--accent)]"
                      >
                        {tool.name}
                      </Link>
                      <p className="text-xs text-[var(--ink-faint)]">
                        {tool.tagline}
                      </p>
                    </td>
                    <td className="mono-meta px-4 py-4 text-sm text-[var(--ink)]">
                      {tool.startingPrice === 0
                        ? "Free"
                        : `$${tool.startingPrice}/mo`}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {tool.hasFreeplan ? (
                        <span className="text-[var(--good)]">✓ Yes</span>
                      ) : (
                        <span className="text-[var(--ink-faint)]">✗ No</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--ink-soft)]">
                      {tool.headquarters}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--ink-soft)]">
                      {tool.bestFor[0]}
                    </td>
                    <td className="px-5 py-4">
                      <TrackedLink
                        href={tool.website}
                        toolSlug={tool.slug}
                        toolName={tool.name}
                        hasAffiliate={hasAffiliate(tool)}
                        linkType="card"
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="btn btn-sm btn-accent"
                      >
                        Visit →
                      </TrackedLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Tool cards */}
          <section className="mb-12">
            <div className="mb-6">
              <p className="eyebrow mb-3">Detailed Reviews</p>
              <h2 className="display-h2">Every tool, compared</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {categoryTools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="card card-hover p-6"
                >
                  <h3 className="text-lg font-semibold text-[var(--ink)]">
                    {tool.name}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    {tool.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {tool.features.slice(0, 4).map((f) => (
                      <span
                        key={f}
                        className="tag-mono rounded-full border border-[var(--line-soft)] px-2 py-0.5"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Browse by country */}
          <section>
            <div className="mb-6">
              <p className="eyebrow mb-3">🌍 Cross-Country</p>
              <h2 className="display-h2">
                Browse {cat.name} by country
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {countries.map((c) => (
                <Link
                  key={c.code}
                  href={`/categories/${category}/${c.code.toLowerCase()}`}
                  className="card card-hover p-4 text-center"
                >
                  <span className="text-xl">{c.flag}</span>
                  <p className="mt-1 text-sm font-medium text-[var(--ink)]">
                    {cat.name} in {c.name}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          {/* FAQ */}
          {(() => {
            const label = cat.name.toLowerCase();
            const freeTools = categoryTools.filter((t) => t.hasFreeplan);
            const paidTools = categoryTools.filter((t) => t.startingPrice > 0);
            const cheapest = paidTools.length
              ? paidTools.reduce((a, b) => (b.startingPrice < a.startingPrice ? b : a))
              : null;
            const topNames = categoryTools.slice(0, 3).map((t) => t.name).join(", ");
            const faqItems = [
              {
                q: `What is the best ${label} tool in 2026?`,
                a: `The top ${label} picks on SaaS Atlas include ${topNames}. Each is compared on pricing, free plan, origin, and best-fit use case in the table above.`,
              },
              {
                q: `Which ${label} tools have a free plan?`,
                a: freeTools.length
                  ? `${freeTools.map((t) => t.name).join(", ")} offer a free plan. See the "Free Plan" column above for the full breakdown.`
                  : `None of the ${label} tools currently tracked offer a permanent free plan, though several provide free trials.`,
              },
              {
                q: `What is the cheapest ${label} tool?`,
                a: cheapest
                  ? `${cheapest.name} has the lowest paid entry point at $${cheapest.startingPrice}/mo among the ${label} tools we compare.`
                  : `Several ${label} tools start free — check the pricing column for the current lowest tiers.`,
              },
              {
                q: `How many ${label} tools does SaaS Atlas compare?`,
                a: `We currently compare ${categoryTools.length} ${label} tools across ${countries.length} English-speaking countries, updated regularly from official pricing sources.`,
              },
            ];
            return (
              <section className="mt-14">
                <div className="mb-6">
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
          </>
        )}
      </div>
    </div>
  );
}
