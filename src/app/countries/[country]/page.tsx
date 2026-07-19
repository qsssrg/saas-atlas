import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { tools } from "@/data/tools";
import { countries, getCountryByCode } from "@/data/countries";
import { categories } from "@/data/categories";

export async function generateStaticParams() {
  return countries.map((c) => ({ country: c.code.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}): Promise<Metadata> {
  const { country: countryParam } = await params;
  const country = getCountryByCode(countryParam.toUpperCase());
  if (!country) return { title: "Country Not Found" };

  const title = `Best AI Tools in ${country.name} ${country.flag} — SaaS Comparison 2026`;
  const description = `Discover the most popular AI writing, image, coding, voice, and productivity tools in ${country.name}. Compare pricing in ${country.currency}, features, and local alternatives. Expert insights for the ${country.name} market.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website", url: `https://saas-atlas.uk/countries/${countryParam.toLowerCase()}` },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: `https://saas-atlas.uk/countries/${countryParam.toLowerCase()}` },
  };
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: countryParam } = await params;
  const country = getCountryByCode(countryParam.toUpperCase());
  if (!country) notFound();

  const availableTools = tools.filter((t) =>
    t.availableCountries.includes(country.code)
  );

  const toolsByCategory = categories
    .map((cat) => ({
      category: cat,
      tools: availableTools
        .filter((t) => t.category === cat.slug)
        .sort((a, b) => {
          const aRank =
            a.popularIn.find((p) => p.country === country.code)?.rank ?? 99;
          const bRank =
            b.popularIn.find((p) => p.country === country.code)?.rank ?? 99;
          return aRank - bRank;
        }),
    }))
    .filter((group) => group.tools.length > 0);

  const otherCountries = countries.filter((c) => c.code !== country.code);

  return (
    <div className="section">
      <div className="container-atlas">
        {/* Breadcrumb */}
        <nav className="font-mono-t mb-8 text-[12px] text-[var(--ink-faint)]">
          <Link href="/" className="hover:text-[var(--accent)]">
            Home
          </Link>
          <span className="mx-2 opacity-50">/</span>
          <span className="text-[var(--ink-soft)]">
            {country.flag} {country.name}
          </span>
        </nav>

        {/* Header */}
        <header className="mb-12">
          <p className="eyebrow mb-3">
            Grid · {country.code} · Territory
          </p>
          <h1 className="display-h1">
            Best AI tools in <em>{country.name}</em> {country.flag}
          </h1>
          <p className="mt-4 max-w-[640px] text-[var(--ink-soft)]">
            Compare the most popular AI SaaS tools available in {country.name}.
            Ranked by popularity with pricing, features, and expert analysis.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="tag-mono rounded-full border border-[var(--line-soft)] px-3 py-1">
              Region · {country.region}
            </span>
            <span className="tag-mono rounded-full border border-[var(--line-soft)] px-3 py-1">
              Currency · {country.currency} ({country.currencySymbol})
            </span>
            {country.saasMarketSize && (
              <span className="tag-mono rounded-full border border-[var(--accent)] px-3 py-1 text-[var(--accent)]">
                SaaS Market · {country.saasMarketSize}
              </span>
            )}
          </div>
        </header>

        {/* Tools by category */}
        {toolsByCategory.map(({ category: cat, tools: catTools }) => (
          <section key={cat.slug} className="mb-12">
            <div className="mb-5">
              <p className="eyebrow mb-3">{cat.icon} {cat.name}</p>
              <h2 className="display-h2">
                {cat.name} in {country.name}
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {catTools.map((tool) => {
                const popularity = tool.popularIn.find(
                  (p) => p.country === country.code
                );
                return (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}/${countryParam}`}
                    className="card card-hover flex flex-col p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-[var(--ink)]">
                        {tool.name}
                      </h3>
                      {popularity && (
                        <span className="mono-meta shrink-0 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
                          #{popularity.rank}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">
                      {tool.tagline}
                    </p>
                    <p className="mono-meta mt-3 text-sm font-medium text-[var(--ink)]">
                      {tool.startingPrice === 0
                        ? "Free"
                        : `From $${tool.startingPrice}/mo`}
                    </p>
                    {tool.hasFreeplan && (
                      <span className="pill-free mt-3 self-start">
                        Free plan
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        {/* Other countries */}
        <section>
          <div className="mb-5">
            <p className="eyebrow mb-3">🌍 Cross-Country</p>
            <h2 className="display-h2">Compare with other countries</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {otherCountries.map((c) => (
              <Link
                key={c.code}
                href={`/countries/${c.code.toLowerCase()}`}
                className="tag-mono rounded-full border border-[var(--line-soft)] px-3 py-1.5 text-[var(--ink-soft)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {c.flag} {c.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
