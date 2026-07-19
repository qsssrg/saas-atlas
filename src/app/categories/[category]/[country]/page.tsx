import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getToolsByCategory } from "@/data/tools";
import { categories, getCategoryBySlug } from "@/data/categories";
import { countries, getCountryByCode } from "@/data/countries";

/**
 * Category × Country programmatic-SEO page — e.g. /categories/ai-writing/us
 * ("Best AI Writing Tools in the United States").
 *
 * This is the cross-country USP made concrete: for a given category it ranks
 * the tools that are actually available in a given country, ordered by that
 * country's local popularity. It also fixes the previously-dangling links
 * emitted by the category page's "Browse by country" grid, which pointed here
 * before the route existed (all 404s).
 */

export async function generateStaticParams() {
  const params: { category: string; country: string }[] = [];
  for (const cat of categories) {
    const catTools = getToolsByCategory(cat.slug);
    for (const country of countries) {
      // Only emit a page when at least one tool in this category is
      // available in this country — no empty pages.
      const hasTools = catTools.some((t) =>
        t.availableCountries.includes(country.code)
      );
      if (hasTools) {
        params.push({ category: cat.slug, country: country.code.toLowerCase() });
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; country: string }>;
}): Promise<Metadata> {
  const { category, country: countryParam } = await params;
  const cat = getCategoryBySlug(category);
  const country = getCountryByCode(countryParam.toUpperCase());
  if (!cat || !country) return { title: "Not Found" };

  const title = `Best ${cat.name} in ${country.name} 2026 — Compare Pricing & Alternatives`;
  const description = `The top ${cat.name.toLowerCase()} available in ${country.name} ${country.flag}, ranked by local popularity where tracked. Compare USD pricing, free-plan availability, and expert analysis of local alternatives — billable with ${country.currency} payment methods.`;
  const url = `https://saas-atlas.uk/categories/${cat.slug}/${countryParam.toLowerCase()}`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website", url },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: url },
  };
}

export default async function CategoryCountryPage({
  params,
}: {
  params: Promise<{ category: string; country: string }>;
}) {
  const { category, country: countryParam } = await params;
  const cat = getCategoryBySlug(category);
  const country = getCountryByCode(countryParam.toUpperCase());
  if (!cat || !country) notFound();

  // Tools in this category available in this country, ranked by local
  // popularity (unranked tools sink to the bottom).
  const catTools = getToolsByCategory(category)
    .filter((t) => t.availableCountries.includes(country.code))
    .map((t) => ({
      tool: t,
      rank: t.popularIn.find((p) => p.country === country.code)?.rank ?? 99,
    }))
    .sort((a, b) => a.rank - b.rank);

  if (catTools.length === 0) notFound();

  const otherCountries = countries.filter((c) => c.code !== country.code);
  const freeTools = catTools.filter((x) => x.tool.hasFreeplan);
  const topNames = catTools.slice(0, 3).map((x) => x.tool.name).join(", ");
  const label = cat.name.toLowerCase();

  const faqItems = [
    {
      q: `What is the best ${label} tool in ${country.name} in 2026?`,
      a: `In ${country.name}, the top-ranked ${label} tools are ${topNames}. Rankings reflect local popularity; each is compared on pricing, free plan, and best-fit use case below.`,
    },
    {
      q: `Which ${label} tools have a free plan in ${country.name}?`,
      a: freeTools.length
        ? `${freeTools.map((x) => x.tool.name).join(", ")} offer a free plan and are available in ${country.name}.`
        : `None of the ${label} tools available in ${country.name} currently offer a permanent free plan, though several provide free trials.`,
    },
    {
      q: `Can I use these ${label} tools from ${country.name}?`,
      a: `Yes. All ${catTools.length} tools listed here are available to users in ${country.name}. Pricing is billed in USD but accessible with local payment methods (Visa, Mastercard, PayPal).`,
    },
    {
      q: `How many ${label} tools are available in ${country.name}?`,
      a: `SaaS Atlas currently tracks ${catTools.length} ${label} tools available in ${country.name}, updated regularly from official pricing sources.`,
    },
  ];

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
                { "@type": "ListItem", position: 1, name: "Home", item: "https://saas-atlas.uk" },
                { "@type": "ListItem", position: 2, name: cat.name, item: `https://saas-atlas.uk/categories/${cat.slug}` },
                { "@type": "ListItem", position: 3, name: `${cat.name} in ${country.name}`, item: `https://saas-atlas.uk/categories/${cat.slug}/${countryParam.toLowerCase()}` },
              ],
            }),
          }}
        />

        {/* Breadcrumb */}
        <nav className="font-mono-t mb-8 text-[12px] text-[var(--ink-faint)]">
          <Link href="/" className="hover:text-[var(--accent)]">
            Home
          </Link>
          <span className="mx-2 opacity-50">/</span>
          <Link
            href={`/categories/${cat.slug}`}
            className="hover:text-[var(--accent)]"
          >
            {cat.name}
          </Link>
          <span className="mx-2 opacity-50">/</span>
          <span className="text-[var(--ink-soft)]">
            {country.flag} {country.name}
          </span>
        </nav>

        {/* Header */}
        <header className="mb-12">
          <p className="eyebrow mb-3">
            {country.code} · {cat.icon} {cat.name}
          </p>
          <h1 className="display-h1">
            Best <em>{cat.name}</em> in {country.name} {country.flag}
          </h1>
          <p className="mt-4 max-w-[640px] text-[var(--ink-soft)]">
            The {catTools.length} {label} available in {country.name}, ordered
            by local popularity where tracked. Compare USD pricing, free plans,
            and expert analysis.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="tag-mono rounded-full border border-[var(--line-soft)] px-3 py-1">
              {catTools.length} tools
            </span>
            <span className="tag-mono rounded-full border border-[var(--line-soft)] px-3 py-1">
              {freeTools.length} with free plan
            </span>
            <span className="tag-mono rounded-full border border-[var(--line-soft)] px-3 py-1">
              Billed in USD · pay in {country.currency}
            </span>
          </div>
        </header>

        {/* Ranked comparison table */}
        <section className="card mb-12 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--line-soft)] text-left">
                <th className="tag-mono px-5 py-3.5">Rank</th>
                <th className="tag-mono px-4 py-3.5">Tool</th>
                <th className="tag-mono px-4 py-3.5">Starting Price</th>
                <th className="tag-mono px-4 py-3.5">Free Plan</th>
                <th className="tag-mono px-5 py-3.5">Details</th>
              </tr>
            </thead>
            <tbody>
              {catTools.map(({ tool }, i) => (
                <tr
                  key={tool.slug}
                  className="border-b border-[var(--line-soft)] last:border-0 transition-colors hover:bg-[var(--accent-soft)]"
                >
                  {/* Positional rank (1..N) — monotonic & unique because the
                      list is already sorted by local popularity. The tool's
                      true local rank is surfaced on the cards below. */}
                  <td className="mono-meta px-5 py-4 text-sm font-semibold text-[var(--accent)]">
                    #{i + 1}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/tools/${tool.slug}/${countryParam.toLowerCase()}`}
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
                  <td className="px-5 py-4">
                    <Link
                      href={`/tools/${tool.slug}/${countryParam.toLowerCase()}`}
                      className="btn btn-sm btn-outline"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Tool cards */}
        <section className="mb-12">
          <div className="mb-6">
            <p className="eyebrow mb-3">Ranked for {country.name}</p>
            <h2 className="display-h2">
              {cat.name} available in {country.name}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {catTools.map(({ tool, rank }) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}/${countryParam.toLowerCase()}`}
                className="card card-hover flex flex-col p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-[var(--ink)]">
                    {tool.name}
                  </h3>
                  {rank <= 90 && (
                    <span className="mono-meta shrink-0 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
                      #{rank} in {country.code}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  {tool.description}
                </p>
                <p className="mono-meta mt-3 text-sm font-medium text-[var(--ink)]">
                  {tool.startingPrice === 0
                    ? "Free"
                    : `From $${tool.startingPrice}/mo`}
                </p>
                {tool.hasFreeplan && (
                  <span className="pill-free mt-3 self-start">Free plan</span>
                )}
              </Link>
            ))}
          </div>
        </section>

        {/* Same category, other countries */}
        <section className="mb-12">
          <div className="mb-5">
            <p className="eyebrow mb-3">🌍 Cross-Country</p>
            <h2 className="display-h2">{cat.name} in other countries</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {otherCountries.map((c) => (
              <Link
                key={c.code}
                href={`/categories/${cat.slug}/${c.code.toLowerCase()}`}
                className="tag-mono rounded-full border border-[var(--line-soft)] px-3 py-1.5 text-[var(--ink-soft)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {c.flag} {cat.name} in {c.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Related: other categories in this country + all tools in country */}
        <section className="mb-12">
          <div className="mb-5">
            <p className="eyebrow mb-3">More for {country.name}</p>
            <h2 className="display-h2">Other AI categories in {country.name}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories
              .filter((c) => c.slug !== cat.slug)
              .map((c) => (
                <Link
                  key={c.slug}
                  href={`/categories/${c.slug}/${countryParam.toLowerCase()}`}
                  className="tag-mono rounded-full border border-[var(--line-soft)] px-3 py-1.5 text-[var(--ink-soft)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  {c.icon} {c.name}
                </Link>
              ))}
            <Link
              href={`/countries/${countryParam.toLowerCase()}`}
              className="tag-mono rounded-full border border-[var(--accent)] px-3 py-1.5 text-[var(--accent)]"
            >
              All AI tools in {country.name} →
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section>
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
      </div>
    </div>
  );
}
