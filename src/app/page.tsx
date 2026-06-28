import Link from "next/link";
import { tools } from "@/data/tools";
import { countries } from "@/data/countries";
import { categories } from "@/data/categories";

const countryFlags: Record<string, string> = {
  US: "🇺🇸", GB: "🇬🇧", CA: "🇨🇦", AU: "🇦🇺", IN: "🇮🇳",
  SG: "🇸🇬", IE: "🇮🇪", NZ: "🇳🇿", IL: "🇮🇱", HK: "🇭🇰",
  RO: "🇷🇴",
};

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mb-16 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Discover AI Tools{" "}
          <span className="text-purple-600">Across Borders</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-500">
          Compare pricing, features, and availability of AI SaaS tools across{" "}
          {countries.length} countries. Expert insights from 25 years in the IT
          industry.
        </p>
      </section>

      {/* Categories */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">
          Browse by Category
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              className="rounded-lg border border-purple-200 p-6 transition-shadow hover:border-purple-400"
            >
              <span className="text-3xl">{cat.icon}</span>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">
                {cat.name}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {cat.toolCount > 0
                  ? `${cat.toolCount} tools compared`
                  : "Coming soon"}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* All Categories - Tool Listings */}
      {categories.map((cat) => {
        const catTools = tools.filter((t) => t.category === cat.slug);
        return (
          <section key={cat.slug} className="mb-16">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {cat.icon} {cat.name}
              </h2>
              <Link
                href={`/categories/${cat.slug}`}
                className="text-sm font-medium text-purple-600 hover:text-purple-700"
              >
                View all →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {catTools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="rounded-lg border border-purple-200 p-6 transition-shadow hover:border-purple-400"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {tool.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {tool.tagline}
                      </p>
                    </div>
                    {tool.hasFreeplan && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Free plan
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-gray-500 line-clamp-2">
                    {tool.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {tool.startingPrice === 0
                        ? "Free"
                        : `From $${tool.startingPrice}/mo`}
                    </span>
                    <span className="text-xs text-gray-500">
                      {countryFlags[tool.originCountry] || "🌍"}{" "}
                      {tool.headquarters}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {/* Cross-Country Discovery */}
      <section className="mb-16 rounded-lg bg-purple-50 p-8">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          🌍 Cross-Country Discovery
        </h2>
        <p className="mb-6 text-gray-500">
          Discover AI tools popular in other countries that you might not know
          about. Our unique cross-country comparison helps you find hidden gems.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {countries.map((country) => (
            <Link
              key={country.code}
              href={`/countries/${country.code.toLowerCase()}`}
              className="rounded-lg bg-purple-50 p-4 transition-shadow hover:border-purple-400"
            >
              <span className="text-2xl">{country.flag}</span>
              <h3 className="mt-1 font-medium text-gray-900">
                {country.name}
              </h3>
              <p className="text-xs text-gray-500">
                SaaS market: {country.saasMarketSize}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Expert Section */}
      <section className="rounded-lg border border-purple-200 p-8">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          Expert Insights
        </h2>
        <p className="text-gray-500">
          Every tool review includes an{" "}
          <strong>Expert Take</strong> — professional analysis based on 25 years
          of experience in the IT industry, covering enterprise deployments
          across Asia, Europe, and North America.
        </p>
        <Link
          href="/about"
          className="mt-4 inline-block text-sm font-medium text-purple-600 hover:text-purple-700"
        >
          Learn more about our methodology →
        </Link>
      </section>
    </div>
  );
}
