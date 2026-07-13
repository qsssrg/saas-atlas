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
    openGraph: { title, description: cat.description, type: "website", url: `https://saas-atlas.uk/categories/${cat.slug}` },
    twitter: { card: "summary_large_image", title, description: cat.description },
    alternates: { canonical: `https://saas-atlas.uk/categories/${cat.slug}` },
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
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://saas-atlas.uk" },
              { "@type": "ListItem", position: 2, name: cat.name, item: `https://saas-atlas.uk/categories/${cat.slug}` },
            ],
          }),
        }}
      />
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        {" › "}
        <span className="text-gray-900">{cat.name}</span>
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">
          {cat.icon} Best {cat.name} 2026
        </h1>
        <p className="mt-2 text-lg text-gray-500">{cat.description}</p>
      </header>

      {categoryTools.length === 0 ? (
        <div className="rounded-lg border border-dashed border-purple-200 p-12 text-center">
          <p className="text-lg text-gray-500">
            Tools for this category are coming soon.
          </p>
        </div>
      ) : (
        <>
          {/* Comparison table */}
          <section className="mb-10 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-purple-200 text-left">
                  <th className="py-3 pr-4 text-sm font-semibold text-gray-900">
                    Tool
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-900">
                    Starting Price
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-900">
                    Free Plan
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-900">
                    Origin
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-900">
                    Best For
                  </th>
                  <th className="pl-4 py-3 text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {categoryTools.map((tool) => (
                  <tr
                    key={tool.slug}
                    className="border-b border-purple-100 hover:bg-purple-50"
                  >
                    <td className="py-4 pr-4">
                      <Link
                        href={`/tools/${tool.slug}`}
                        className="font-medium text-gray-900 hover:text-purple-700"
                      >
                        {tool.name}
                      </Link>
                      <p className="text-xs text-gray-500">{tool.tagline}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {tool.startingPrice === 0
                        ? "Free"
                        : `$${tool.startingPrice}/mo`}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {tool.hasFreeplan ? (
                        <span className="text-green-700">✓ Yes</span>
                      ) : (
                        <span className="text-gray-500">✗ No</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {tool.headquarters}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {tool.bestFor[0]}
                    </td>
                    <td className="pl-4 py-4">
                      <TrackedLink
                        href={tool.website}
                        toolSlug={tool.slug}
                        toolName={tool.name}
                        hasAffiliate={hasAffiliate(tool)}
                        linkType="card"
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="rounded bg-purple-600 px-3 py-1 text-xs font-medium text-gray-900 hover:bg-purple-700"
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
          <section className="mb-10">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Detailed Reviews
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {categoryTools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="rounded-lg border border-purple-200 p-6 transition-shadow hover:border-purple-400"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {tool.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {tool.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1">
                    {tool.features.slice(0, 4).map((f) => (
                      <span
                        key={f}
                        className="rounded-full bg-purple-50 px-2 py-0.5 text-xs text-gray-500"
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
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              🌍 Browse {cat.name} by Country
            </h2>
            <div className="grid gap-3 sm:grid-cols-4">
              {countries.map((c) => (
                <Link
                  key={c.code}
                  href={`/categories/${category}/${c.code.toLowerCase()}`}
                  className="rounded-lg border border-purple-200 p-3 text-center transition-shadow hover:border-purple-400"
                >
                  <span className="text-xl">{c.flag}</span>
                  <p className="mt-1 text-sm font-medium text-gray-900">
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
              <section className="mt-10">
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  Frequently Asked Questions
                </h2>
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
                <div className="space-y-4">
                  {faqItems.map((item) => (
                    <details key={item.q} className="group rounded-lg border border-purple-200">
                      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-900 hover:bg-purple-50">
                        {item.q}
                      </summary>
                      <p className="px-4 pb-3 text-sm text-gray-600">{item.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            );
          })()}
        </>
      )}
    </div>
  );
}
