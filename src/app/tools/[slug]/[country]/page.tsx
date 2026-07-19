import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { tools, getToolBySlug, getToolsByCategory, hasAffiliate } from "@/data/tools";
import { countries, getCountryByCode } from "@/data/countries";
import TrackedLink from "@/components/TrackedLink";

// pSEO: Generate all tool × country combinations
export async function generateStaticParams() {
  const params: { slug: string; country: string }[] = [];
  for (const tool of tools) {
    for (const countryCode of tool.availableCountries) {
      params.push({
        slug: tool.slug,
        country: countryCode.toLowerCase(),
      });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; country: string }>;
}): Promise<Metadata> {
  const { slug, country: countryParam } = await params;
  const tool = getToolBySlug(slug);
  const country = getCountryByCode(countryParam.toUpperCase());
  if (!tool || !country) return { title: "Not Found" };

  const categoryLabel = tool.category === "ai-writing" ? "writing" : tool.category === "ai-image" ? "image" : tool.category === "ai-coding" ? "coding" : tool.category === "ai-voice" ? "voice" : "productivity";
  const title = `${tool.name} in ${country.name} — Pricing in ${country.currency}, Alternatives & Review`;
  const description = `Is ${tool.name} the best AI ${categoryLabel} tool in ${country.name}? Compare pricing (${country.currencySymbol}${Math.round(tool.startingPrice * 1.0)}/mo), features, and local alternatives. Expert review from a 25-year IT veteran.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "article", url: `https://saas-atlas.uk/tools/${tool.slug}/${countryParam.toLowerCase()}` },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: `https://saas-atlas.uk/tools/${tool.slug}/${countryParam.toLowerCase()}` },
  };
}

export default async function ToolCountryPage({
  params,
}: {
  params: Promise<{ slug: string; country: string }>;
}) {
  const { slug, country: countryParam } = await params;
  const tool = getToolBySlug(slug);
  const country = getCountryByCode(countryParam.toUpperCase());
  if (!tool || !country) notFound();

  const popularity = tool.popularIn.find((p) => p.country === country.code);
  const categoryTools = getToolsByCategory(tool.category).filter(
    (t) => t.slug !== tool.slug
  );
  const otherCountries = countries.filter((c) => c.code !== country.code);

  return (
    <div className="section">
      <div className="mx-auto w-full max-w-[860px] px-5">
      {/* Breadcrumb */}
      <nav className="font-mono-t mb-8 text-[12px] text-[var(--ink-faint)]">
        <Link href="/" className="hover:text-[var(--accent)]">
          Home
        </Link>
        <span className="mx-2 opacity-50">/</span>
        <Link
          href={`/tools/${tool.slug}`}
          className="hover:text-[var(--accent)]"
        >
          {tool.name}
        </Link>
        <span className="mx-2 opacity-50">/</span>
        <span className="text-[var(--ink-soft)]">
          {country.flag} {country.name}
        </span>
      </nav>

      {/* Header */}
      <header className="mb-10">
        <p className="eyebrow mb-3">
          {country.code} · {tool.name}
        </p>
        <h1 className="display-h1">
          {tool.name} in <em>{country.name}</em> {country.flag}
        </h1>
        <p className="mt-4 max-w-[640px] text-[var(--ink-soft)]">
          Everything you need to know about using {tool.name} in{" "}
          {country.name} — pricing, availability, local alternatives, and expert
          analysis.
        </p>
        {popularity && (
          <div className="mono-meta mt-4 inline-block rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm font-medium text-[var(--accent)]">
            #{popularity.rank} most popular{" "}
            {tool.category === "ai-writing"
              ? "AI writing tool"
              : tool.category === "ai-image"
                ? "AI image tool"
                : "AI coding tool"}{" "}
            in {country.name}
          </div>
        )}
      </header>

      {/* Pricing in local context */}
      <section className="mb-12">
        <div className="mb-5">
          <p className="eyebrow mb-3">Pricing</p>
          <h2 className="display-h2">Pricing for {country.name} users</h2>
        </div>
        <div className="card p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tool.pricing.map((tier) => (
              <div
                key={tier.name}
                className="rounded-[var(--radius-card)] border border-[var(--line-soft)] p-4"
              >
                <h3 className="font-semibold text-[var(--ink)]">{tier.name}</h3>
                <p className="mono-meta mt-1 text-2xl font-bold text-[var(--ink)]">
                  {tier.price === 0 ? (
                    "Free"
                  ) : (
                    <>
                      ${tier.price}
                      <span className="text-sm font-normal text-[var(--ink-faint)]">
                        /mo USD
                      </span>
                    </>
                  )}
                </p>
                <ul className="mt-3 space-y-1">
                  {tier.features.map((f) => (
                    <li key={f} className="text-sm text-[var(--ink-soft)]">
                      ✓ {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-[var(--ink-faint)]">
            All prices in USD. Payment methods accepted in {country.name}{" "}
            typically include Visa, Mastercard, and PayPal.
          </p>
        </div>
      </section>

      {/* Alternatives in this country */}
      <section className="mb-12">
        <div className="mb-5">
          <p className="eyebrow mb-3">Alternatives</p>
          <h2 className="display-h2">
            Alternatives to {tool.name} in {country.name}
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {categoryTools.map((alt) => {
            const altPopularity = alt.popularIn.find(
              (p) => p.country === country.code
            );
            return (
              <Link
                key={alt.slug}
                href={`/tools/${alt.slug}/${countryParam}`}
                className="card card-hover p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-[var(--ink)]">
                    {alt.name}
                  </h3>
                  {altPopularity && (
                    <span className="mono-meta shrink-0 text-xs text-[var(--accent)]">
                      #{altPopularity.rank}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  {alt.tagline}
                </p>
                <p className="mono-meta mt-2 text-sm font-medium text-[var(--ink)]">
                  {alt.startingPrice === 0
                    ? "Free"
                    : `From $${alt.startingPrice}/mo`}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Cross-country links */}
      <section className="mb-12">
        <div className="mb-5">
          <p className="eyebrow mb-3">🌍 Cross-Country</p>
          <h2 className="display-h2">{tool.name} in other countries</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {otherCountries
            .filter((c) => tool.availableCountries.includes(c.code))
            .map((c) => (
              <Link
                key={c.code}
                href={`/tools/${tool.slug}/${c.code.toLowerCase()}`}
                className="tag-mono rounded-full border border-[var(--line-soft)] px-3 py-1.5 text-[var(--ink-soft)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {c.flag} {c.name}
              </Link>
            ))}
        </div>
      </section>

      {/* CTA */}
      <section className="card p-8 text-center" style={{ background: "var(--sea)" }}>
        <h2 className="display-h2">
          Try {tool.name} from {country.name}
        </h2>
        <p className="mt-2 text-[var(--ink-soft)]">
          {tool.hasFreeplan
            ? `Start free — no credit card required. Works worldwide including ${country.name}.`
            : `Start your free trial. Available in ${country.name} and ${tool.availableCountries.length - 1} other countries.`}
        </p>
        <TrackedLink
          href={tool.website}
          toolSlug={tool.slug}
          toolName={tool.name}
          hasAffiliate={hasAffiliate(tool)}
          linkType="cta"
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="btn btn-accent mt-5 inline-flex"
        >
          Get Started with {tool.name} →
        </TrackedLink>
      </section>
      </div>
    </div>
  );
}
