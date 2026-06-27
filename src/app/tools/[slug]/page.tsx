import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { tools, getToolBySlug } from "@/data/tools";
import { countries } from "@/data/countries";

export async function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return { title: "Tool Not Found" };

  return {
    title: `${tool.name} Review 2026 — Pricing, Features & Expert Take`,
    description: `${tool.description} Compare ${tool.name} pricing across ${countries.length} countries. Starting from $${tool.startingPrice}/mo.`,
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-600">
          Home
        </Link>
        {" › "}
        <Link
          href={`/categories/${tool.category}`}
          className="hover:text-gray-600"
        >
          {tool.category === "ai-writing"
            ? "AI Writing"
            : tool.category === "ai-image"
              ? "AI Image"
              : tool.category === "ai-coding"
                ? "AI Coding"
                : tool.category === "ai-voice"
                  ? "AI Voice & Audio"
                  : "AI Productivity"}
        </Link>
        {" › "}
        <span className="text-gray-900">{tool.name}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tool.name}</h1>
            <p className="mt-1 text-lg text-gray-500">{tool.tagline}</p>
          </div>
          <a
            href={tool.website}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-purple-700"
          >
            Visit {tool.name} →
          </a>
        </div>
        <p className="mt-4 text-gray-500">{tool.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {tool.hasFreeplan && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              Free plan available
            </span>
          )}
          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs text-gray-500">
            Founded {tool.founded}
          </span>
          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs text-gray-500">
            📍 {tool.headquarters}
          </span>
        </div>
      </header>

      {/* Pricing */}
      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Pricing</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tool.pricing.map((tier) => (
            <div
              key={tier.name}
              className="rounded-lg border border-purple-200 p-6"
            >
              <h3 className="font-semibold text-gray-900">{tier.name}</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {tier.price === 0 ? (
                  "Free"
                ) : (
                  <>
                    ${tier.price}
                    <span className="text-base font-normal text-gray-500">
                      /mo
                    </span>
                  </>
                )}
              </p>
              {tier.billingCycle === "yearly" && tier.price > 0 && (
                <p className="text-xs text-gray-500">billed annually</p>
              )}
              <ul className="mt-4 space-y-2">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start text-sm text-gray-500">
                    <span className="mr-2 text-green-700">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Last updated: {tool.lastUpdated}
        </p>
      </section>

      {/* Features */}
      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Key Features</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {tool.features.map((f) => (
            <div key={f} className="flex items-center gap-2 text-gray-600">
              <span className="text-blue-500">●</span>
              {f}
            </div>
          ))}
        </div>
      </section>

      {/* Best For / Limitations */}
      <div className="mb-10 grid gap-6 sm:grid-cols-2">
        <section>
          <h2 className="mb-3 text-xl font-bold text-green-700">Best For</h2>
          <ul className="space-y-2">
            {tool.bestFor.map((b) => (
              <li key={b} className="flex items-start text-sm text-gray-600">
                <span className="mr-2">👍</span>
                {b}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-bold text-red-700">Limitations</h2>
          <ul className="space-y-2">
            {tool.limitations.map((l) => (
              <li key={l} className="flex items-start text-sm text-gray-600">
                <span className="mr-2">⚠️</span>
                {l}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Expert Take */}
      {tool.expertTake && (
        <section className="mb-10 rounded-lg border border-purple-200 bg-white p-6">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            Expert Take
          </h2>
          <p className="mb-4 text-gray-600">{tool.expertTake.summary}</p>
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-green-700">
                Strengths
              </h3>
              <ul className="space-y-1">
                {tool.expertTake.pros.map((p) => (
                  <li
                    key={p}
                    className="flex items-start text-sm text-gray-600"
                  >
                    <span className="mr-2 text-green-600">+</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-red-700">
                Weaknesses
              </h3>
              <ul className="space-y-1">
                {tool.expertTake.cons.map((c) => (
                  <li
                    key={c}
                    className="flex items-start text-sm text-gray-600"
                  >
                    <span className="mr-2 text-red-500">-</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="rounded-md bg-purple-50 p-4">
            <p className="text-sm font-medium text-gray-900">
              Verdict
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {tool.expertTake.verdict}
            </p>
          </div>
          <p className="mt-3 text-xs italic text-gray-400">
            {tool.expertTake.authorNote} — Last reviewed:{" "}
            {tool.expertTake.lastReviewed}
          </p>
        </section>
      )}

      {/* Cross-Country Availability */}
      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          🌍 Available in {tool.availableCountries.length} Countries
        </h2>
        <div className="grid gap-3 sm:grid-cols-4">
          {countries
            .filter((c) => tool.availableCountries.includes(c.code))
            .map((country) => {
              const popularity = tool.popularIn.find(
                (p) => p.country === country.code
              );
              return (
                <Link
                  key={country.code}
                  href={`/tools/${tool.slug}/${country.code.toLowerCase()}`}
                  className="rounded-lg border border-purple-200 p-3 text-center transition-shadow hover:border-purple-400"
                >
                  <span className="text-xl">{country.flag}</span>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {country.name}
                  </p>
                  {popularity && (
                    <p className="text-xs text-purple-600">
                      #{popularity.rank} in category
                    </p>
                  )}
                </Link>
              );
            })}
        </div>
      </section>

      {/* Affiliate CTA */}
      <section className="rounded-lg bg-purple-50 p-6 text-center">
        <h2 className="text-xl font-bold text-gray-900">
          Try {tool.name} Today
        </h2>
        <p className="mt-2 text-gray-500">
          {tool.hasFreeplan
            ? `Start with ${tool.name}'s free plan — no credit card required.`
            : `Start your free trial of ${tool.name} today.`}
        </p>
        <a
          href={tool.website}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-4 inline-block rounded-lg bg-purple-600 px-6 py-3 text-sm font-medium text-gray-900 hover:bg-purple-700"
        >
          Get Started with {tool.name} →
        </a>
      </section>
    </div>
  );
}
