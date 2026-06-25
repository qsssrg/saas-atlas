import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { tools, getToolBySlug } from "@/data/tools";
import { Tool } from "@/types";

// Generate all pairwise comparisons within same category
export async function generateStaticParams() {
  const params: { "toolA": string; "toolB": string }[] = [];
  const categories = [...new Set(tools.map((t) => t.category))];

  for (const cat of categories) {
    const catTools = tools.filter((t) => t.category === cat);
    for (let i = 0; i < catTools.length; i++) {
      for (let j = i + 1; j < catTools.length; j++) {
        params.push({
          "toolA": catTools[i].slug,
          "toolB": catTools[j].slug,
        });
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ "toolA": string; "toolB": string }>;
}): Promise<Metadata> {
  const { toolA: slugA, toolB: slugB } = await params;
  const toolA = getToolBySlug(slugA);
  const toolB = getToolBySlug(slugB);
  if (!toolA || !toolB) return { title: "Comparison Not Found" };

  return {
    title: `${toolA.name} vs ${toolB.name} (2026) — Pricing, Features & Expert Verdict`,
    description: `Detailed comparison of ${toolA.name} ($${toolA.startingPrice}/mo) vs ${toolB.name} ($${toolB.startingPrice}/mo). Which AI tool is better for your needs? Expert analysis and side-by-side feature comparison.`,
  };
}

function ComparisonRow({
  label,
  valueA,
  valueB,
  highlight,
}: {
  label: string;
  valueA: string | React.ReactNode;
  valueB: string | React.ReactNode;
  highlight?: "a" | "b" | "tie";
}) {
  return (
    <tr className="border-b border-purple-100">
      <td className="py-3 pr-4 text-sm font-medium text-gray-900">{label}</td>
      <td
        className={`px-4 py-3 text-sm ${highlight === "a" ? "font-semibold text-green-700" : "text-gray-500"}`}
      >
        {valueA}
      </td>
      <td
        className={`pl-4 py-3 text-sm ${highlight === "b" ? "font-semibold text-green-700" : "text-gray-500"}`}
      >
        {valueB}
      </td>
    </tr>
  );
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ "toolA": string; "toolB": string }>;
}) {
  const { toolA: slugA, toolB: slugB } = await params;
  const toolA = getToolBySlug(slugA);
  const toolB = getToolBySlug(slugB);
  if (!toolA || !toolB) notFound();

  const priceWinner =
    toolA.startingPrice < toolB.startingPrice
      ? "a"
      : toolA.startingPrice > toolB.startingPrice
        ? "b"
        : "tie";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        {" › "}
        <span className="text-gray-900">
          {toolA.name} vs {toolB.name}
        </span>
      </nav>

      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          {toolA.name} vs {toolB.name}
        </h1>
        <p className="mt-2 text-lg text-gray-500">
          Side-by-side comparison of two leading{" "}
          {toolA.category === "ai-writing"
            ? "AI writing"
            : toolA.category === "ai-image"
              ? "AI image generation"
              : "AI coding"}{" "}
          tools. Updated {toolA.lastUpdated}.
        </p>
      </header>

      {/* Quick verdict */}
      <section className="mb-10 rounded-lg bg-purple-50 p-6">
        <h2 className="text-lg font-bold text-gray-900">Quick Verdict</h2>
        <p className="mt-2 text-gray-600">
          <strong>{toolA.name}</strong> is best for{" "}
          {toolA.bestFor[0]?.toLowerCase()}, while{" "}
          <strong>{toolB.name}</strong> is ideal for{" "}
          {toolB.bestFor[0]?.toLowerCase()}.
          {priceWinner === "a"
            ? ` ${toolA.name} is more affordable starting at $${toolA.startingPrice}/mo.`
            : priceWinner === "b"
              ? ` ${toolB.name} is more affordable starting at $${toolB.startingPrice}/mo.`
              : " Both tools are similarly priced."}
        </p>
      </section>

      {/* Comparison table */}
      <section className="mb-10 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-purple-200">
              <th className="py-3 pr-4 text-left text-sm font-semibold text-gray-500">
                Feature
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                {toolA.name}
              </th>
              <th className="pl-4 py-3 text-left text-sm font-semibold text-gray-900">
                {toolB.name}
              </th>
            </tr>
          </thead>
          <tbody>
            <ComparisonRow
              label="Starting Price"
              valueA={
                toolA.startingPrice === 0
                  ? "Free"
                  : `$${toolA.startingPrice}/mo`
              }
              valueB={
                toolB.startingPrice === 0
                  ? "Free"
                  : `$${toolB.startingPrice}/mo`
              }
              highlight={priceWinner}
            />
            <ComparisonRow
              label="Free Plan"
              valueA={toolA.hasFreeplan ? "✓ Yes" : "✗ No"}
              valueB={toolB.hasFreeplan ? "✓ Yes" : "✗ No"}
              highlight={
                toolA.hasFreeplan && !toolB.hasFreeplan
                  ? "a"
                  : !toolA.hasFreeplan && toolB.hasFreeplan
                    ? "b"
                    : "tie"
              }
            />
            <ComparisonRow
              label="Founded"
              valueA={String(toolA.founded)}
              valueB={String(toolB.founded)}
            />
            <ComparisonRow
              label="Headquarters"
              valueA={toolA.headquarters}
              valueB={toolB.headquarters}
            />
            <ComparisonRow
              label="Best For"
              valueA={toolA.bestFor.join(", ")}
              valueB={toolB.bestFor.join(", ")}
            />
            <ComparisonRow
              label="Key Features"
              valueA={
                <ul className="space-y-1">
                  {toolA.features.slice(0, 5).map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
              }
              valueB={
                <ul className="space-y-1">
                  {toolB.features.slice(0, 5).map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
              }
            />
            <ComparisonRow
              label="Limitations"
              valueA={toolA.limitations.join("; ")}
              valueB={toolB.limitations.join("; ")}
            />
            <ComparisonRow
              label="Affiliate Commission"
              valueA={toolA.affiliate.commission}
              valueB={toolB.affiliate.commission}
            />
          </tbody>
        </table>
      </section>

      {/* CTAs */}
      <section className="grid gap-4 sm:grid-cols-2">
        <a
          href={toolA.website}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="rounded-lg border-2 border-purple-600 p-6 text-center transition-colors hover:bg-purple-50"
        >
          <h3 className="text-lg font-bold text-purple-600">
            Try {toolA.name}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {toolA.hasFreeplan ? "Start free" : "Start free trial"} →
          </p>
        </a>
        <a
          href={toolB.website}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="rounded-lg border-2 border-purple-600 p-6 text-center transition-colors hover:bg-purple-50"
        >
          <h3 className="text-lg font-bold text-purple-600">
            Try {toolB.name}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {toolB.hasFreeplan ? "Start free" : "Start free trial"} →
          </p>
        </a>
      </section>

      {/* Related comparisons */}
      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold text-gray-900">
          More Comparisons
        </h2>
        <div className="flex flex-wrap gap-2">
          {tools
            .filter(
              (t) =>
                t.category === toolA.category &&
                t.slug !== toolA.slug &&
                t.slug !== toolB.slug
            )
            .flatMap((t) => [
              <Link
                key={`${toolA.slug}-vs-${t.slug}`}
                href={`/compare/${toolA.slug}-vs-${t.slug}`}
                className="rounded-full border border-purple-200 px-3 py-1 text-sm text-gray-500 hover:bg-purple-50"
              >
                {toolA.name} vs {t.name}
              </Link>,
              <Link
                key={`${toolB.slug}-vs-${t.slug}`}
                href={`/compare/${toolB.slug}-vs-${t.slug}`}
                className="rounded-full border border-purple-200 px-3 py-1 text-sm text-gray-500 hover:bg-purple-50"
              >
                {toolB.name} vs {t.name}
              </Link>,
            ])}
        </div>
      </section>
    </div>
  );
}
