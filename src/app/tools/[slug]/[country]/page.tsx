import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { tools, getToolBySlug, getToolsByCategory } from "@/data/tools";
import { countries, getCountryByCode } from "@/data/countries";

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

  return {
    title: `${tool.name} in ${country.name} — Pricing in ${country.currency}, Alternatives & Review`,
    description: `Is ${tool.name} the best AI ${tool.category === "ai-writing" ? "writing" : tool.category === "ai-image" ? "image" : "coding"} tool in ${country.name}? Compare pricing (${country.currencySymbol}${Math.round(tool.startingPrice * 1.0)}/mo), features, and local alternatives. Expert review from a 25-year IT veteran.`,
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
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-700">Home</Link>
        {" › "}
        <Link href={`/tools/${tool.slug}`} className="hover:text-gray-700">
          {tool.name}
        </Link>
        {" › "}
        <span className="text-gray-900">
          {country.flag} {country.name}
        </span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {tool.name} in {country.name} {country.flag}
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Everything you need to know about using {tool.name} in{" "}
          {country.name} — pricing, availability, local alternatives, and expert
          analysis.
        </p>
        {popularity && (
          <div className="mt-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
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
      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          Pricing for {country.name} Users
        </h2>
        <div className="rounded-lg border border-gray-200 p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tool.pricing.map((tier) => (
              <div key={tier.name} className="rounded-lg bg-gray-50 p-4">
                <h3 className="font-semibold text-gray-900">{tier.name}</h3>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {tier.price === 0 ? (
                    "Free"
                  ) : (
                    <>
                      ${tier.price}
                      <span className="text-sm font-normal text-gray-500">
                        /mo USD
                      </span>
                    </>
                  )}
                </p>
                <ul className="mt-3 space-y-1">
                  {tier.features.map((f) => (
                    <li key={f} className="text-sm text-gray-600">
                      ✓ {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-500">
            All prices in USD. Payment methods accepted in {country.name}{" "}
            typically include Visa, Mastercard, and PayPal.
          </p>
        </div>
      </section>

      {/* Alternatives in this country */}
      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          Alternatives to {tool.name} in {country.name}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {categoryTools.map((alt) => {
            const altPopularity = alt.popularIn.find(
              (p) => p.country === country.code
            );
            return (
              <Link
                key={alt.slug}
                href={`/tools/${alt.slug}/${countryParam}`}
                className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900">{alt.name}</h3>
                  {altPopularity && (
                    <span className="text-xs text-blue-600">
                      #{altPopularity.rank}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">{alt.tagline}</p>
                <p className="mt-2 text-sm font-medium text-gray-900">
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
      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          🌍 {tool.name} in Other Countries
        </h2>
        <div className="flex flex-wrap gap-2">
          {otherCountries
            .filter((c) => tool.availableCountries.includes(c.code))
            .map((c) => (
              <Link
                key={c.code}
                href={`/tools/${tool.slug}/${c.code.toLowerCase()}`}
                className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
              >
                {c.flag} {c.name}
              </Link>
            ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-lg bg-blue-50 p-6 text-center">
        <h2 className="text-xl font-bold text-gray-900">
          Try {tool.name} from {country.name}
        </h2>
        <p className="mt-2 text-gray-600">
          {tool.hasFreeplan
            ? `Start free — no credit card required. Works worldwide including ${country.name}.`
            : `Start your free trial. Available in ${country.name} and ${tool.availableCountries.length - 1} other countries.`}
        </p>
        <a
          href={tool.website}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          Get Started with {tool.name} →
        </a>
      </section>
    </div>
  );
}
