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
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        {" › "}
        <span className="text-gray-900">
          {country.flag} {country.name}
        </span>
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">
          {country.flag} Best AI Tools in {country.name}
        </h1>
        <p className="mt-2 text-lg text-gray-500">
          Compare the most popular AI SaaS tools available in {country.name}.
          Ranked by popularity with pricing, features, and expert analysis.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <span className="rounded-full bg-purple-50 px-3 py-1 text-sm text-gray-500">
            Region: {country.region}
          </span>
          <span className="rounded-full bg-purple-50 px-3 py-1 text-sm text-gray-500">
            Currency: {country.currency} ({country.currencySymbol})
          </span>
          {country.saasMarketSize && (
            <span className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-600">
              SaaS Market: {country.saasMarketSize}
            </span>
          )}
        </div>
      </header>

      {/* Tools by category */}
      {toolsByCategory.map(({ category: cat, tools: catTools }) => (
        <section key={cat.slug} className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            {cat.icon} {cat.name} in {country.name}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catTools.map((tool) => {
              const popularity = tool.popularIn.find(
                (p) => p.country === country.code
              );
              return (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}/${countryParam}`}
                  className="rounded-lg border border-purple-200 p-5 transition-shadow hover:border-purple-400"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900">{tool.name}</h3>
                    {popularity && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-600">
                        #{popularity.rank}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{tool.tagline}</p>
                  <p className="mt-3 text-sm font-medium text-gray-900">
                    {tool.startingPrice === 0
                      ? "Free"
                      : `From $${tool.startingPrice}/mo`}
                  </p>
                  {tool.hasFreeplan && (
                    <span className="mt-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
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
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          🌍 Compare with Other Countries
        </h2>
        <div className="flex flex-wrap gap-2">
          {otherCountries.map((c) => (
            <Link
              key={c.code}
              href={`/countries/${c.code.toLowerCase()}`}
              className="rounded-full border border-purple-200 px-3 py-1 text-sm text-gray-500 hover:bg-purple-50"
            >
              {c.flag} {c.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
