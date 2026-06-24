import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { tools, getToolsByCategory } from "@/data/tools";
import { categories, getCategoryBySlug } from "@/data/categories";
import { countries } from "@/data/countries";

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

  return {
    title: `Best ${cat.name} 2026 — Compare Pricing, Features & Alternatives`,
    description: cat.description,
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
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-700">Home</Link>
        {" › "}
        <span className="text-gray-900">{cat.name}</span>
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">
          {cat.icon} Best {cat.name} 2026
        </h1>
        <p className="mt-2 text-lg text-gray-600">{cat.description}</p>
      </header>

      {categoryTools.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
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
                <tr className="border-b border-gray-200 text-left">
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
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-4 pr-4">
                      <Link
                        href={`/tools/${tool.slug}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
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
                        <span className="text-green-600">✓ Yes</span>
                      ) : (
                        <span className="text-gray-400">✗ No</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {tool.headquarters}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {tool.bestFor[0]}
                    </td>
                    <td className="pl-4 py-4">
                      <a
                        href={tool.website}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        Visit →
                      </a>
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
                  className="rounded-lg border border-gray-200 p-6 transition-shadow hover:shadow-md"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {tool.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {tool.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1">
                    {tool.features.slice(0, 4).map((f) => (
                      <span
                        key={f}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
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
                  className="rounded-lg border border-gray-200 p-3 text-center transition-shadow hover:shadow-md"
                >
                  <span className="text-xl">{c.flag}</span>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {cat.name} in {c.name}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
