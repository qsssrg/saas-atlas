import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { tools, getToolBySlug, getToolsByCategory, hasAffiliate } from "@/data/tools";
import { getReviewBySlug } from "@/data/reviews";
import { countries } from "@/data/countries";
import ToolReview from "@/components/ToolReview";
import TrackedLink from "@/components/TrackedLink";

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

  const title = `${tool.name} Review 2026 — Pricing, Features & Expert Take`;
  const description = `${tool.description} Compare ${tool.name} pricing across ${countries.length} countries. Starting from $${tool.startingPrice}/mo.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://www.saas-atlas.uk/tools/${tool.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `https://www.saas-atlas.uk/tools/${tool.slug}`,
    },
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

  const review = getReviewBySlug(slug);

  // Map the S/A/B/C/D letter rank to a 1-5 star value for schema.org.
  const rankToRating: Record<string, string> = {
    S: "5.0",
    A: "4.5",
    B: "4.0",
    C: "3.0",
    D: "2.0",
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: tool.website,
    offers: tool.pricing.map((tier) => ({
      "@type": "Offer",
      name: tier.name,
      price: tier.price,
      priceCurrency: "USD",
      priceValidUntil: "2026-12-31",
    })),
    aggregateRating: review
      ? {
          "@type": "AggregateRating",
          ratingValue: rankToRating[review.rank] ?? "4.0",
          bestRating: "5",
          worstRating: "1",
          ratingCount: "1",
        }
      : tool.expertTake
        ? {
            "@type": "AggregateRating",
            ratingValue:
              tool.expertTake.pros.length > tool.expertTake.cons.length
                ? "4.5"
                : "4.0",
            bestRating: "5",
            worstRating: "1",
            ratingCount: "1",
          }
        : undefined,
    review: review
      ? {
          "@type": "Review",
          author: { "@type": "Organization", name: "SaaS Atlas" },
          reviewBody: review.recommendation,
          datePublished: review.reviewedOn,
          reviewRating: {
            "@type": "Rating",
            ratingValue: rankToRating[review.rank] ?? "4.0",
            bestRating: "5",
            worstRating: "1",
          },
        }
      : tool.expertTake
        ? {
            "@type": "Review",
            author: { "@type": "Organization", name: "SaaS Atlas" },
            reviewBody: tool.expertTake.verdict,
            datePublished: tool.expertTake.lastReviewed,
          }
        : undefined,
  };

  const categoryName =
    tool.category === "ai-writing"
      ? "AI Writing"
      : tool.category === "ai-image"
        ? "AI Image"
        : tool.category === "ai-coding"
          ? "AI Coding"
          : tool.category === "ai-voice"
            ? "AI Voice & Audio"
            : "AI Productivity";

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.saas-atlas.uk" },
      { "@type": "ListItem", position: 2, name: categoryName, item: `https://www.saas-atlas.uk/categories/${tool.category}` },
      { "@type": "ListItem", position: 3, name: tool.name, item: `https://www.saas-atlas.uk/tools/${tool.slug}` },
    ],
  };

  return (
    <div className="section">
      <div className="mx-auto w-full max-w-[860px] px-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Breadcrumb */}
      <nav className="font-mono-t mb-8 text-[12px] text-[var(--ink-faint)]">
        <Link href="/" className="hover:text-[var(--accent)]">
          Home
        </Link>
        <span className="mx-2 opacity-50">/</span>
        <Link
          href={`/categories/${tool.category}`}
          className="hover:text-[var(--accent)]"
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
        <span className="mx-2 opacity-50">/</span>
        <span className="text-[var(--ink-soft)]">{tool.name}</span>
      </nav>

      {/* Header */}
      <header className="mb-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="display-h1">{tool.name}</h1>
            <p className="mt-1 text-lg text-[var(--ink-soft)]">{tool.tagline}</p>
          </div>
          <TrackedLink
            href={tool.website}
            toolSlug={tool.slug}
            toolName={tool.name}
            hasAffiliate={hasAffiliate(tool)}
            linkType="header"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-accent"
          >
            Visit {tool.name} →
          </TrackedLink>
        </div>
        <p className="mt-4 max-w-[640px] text-[var(--ink-soft)]">
          {tool.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {tool.hasFreeplan && (
            <span className="pill-free">Free plan available</span>
          )}
          <span className="tag-mono rounded-full border border-[var(--line-soft)] px-3 py-1">
            Founded {tool.founded}
          </span>
          <span className="tag-mono rounded-full border border-[var(--line-soft)] px-3 py-1">
            📍 {tool.headquarters}
          </span>
        </div>
      </header>

      {/* Scored Expert Review (2026-07-05 evaluation-axis profile) */}
      {review && <ToolReview review={review} tool={tool} />}

      {/* Pricing */}
      <section className="mb-12">
        <div className="mb-5">
          <p className="eyebrow mb-3">Pricing</p>
          <h2 className="display-h2">Plans &amp; pricing</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tool.pricing.map((tier) => (
            <div key={tier.name} className="card p-6">
              <h3 className="font-semibold text-[var(--ink)]">{tier.name}</h3>
              <p className="mono-meta mt-2 text-3xl font-bold text-[var(--ink)]">
                {tier.price === 0 ? (
                  "Free"
                ) : (
                  <>
                    ${tier.price}
                    <span className="text-base font-normal text-[var(--ink-faint)]">
                      /mo
                    </span>
                  </>
                )}
              </p>
              {tier.billingCycle === "yearly" && tier.price > 0 && (
                <p className="text-xs text-[var(--ink-faint)]">billed annually</p>
              )}
              <ul className="mt-4 space-y-2">
                {tier.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start text-sm text-[var(--ink-soft)]"
                  >
                    <span className="mr-2 text-[var(--good)]">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="font-mono-t mt-3 text-[12px] text-[var(--ink-faint)]">
          Last updated: {tool.lastUpdated}
        </p>
      </section>

      {/* Features */}
      <section className="mb-12">
        <div className="mb-5">
          <p className="eyebrow mb-3">Capabilities</p>
          <h2 className="display-h2">Key features</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {tool.features.map((f) => (
            <div
              key={f}
              className="flex items-center gap-2 text-[var(--ink-soft)]"
            >
              <span className="text-[var(--accent)]">●</span>
              {f}
            </div>
          ))}
        </div>
      </section>

      {/* Best For / Limitations */}
      <div className="mb-12 grid gap-4 sm:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-3 text-lg font-bold text-[var(--good)]">Best For</h2>
          <ul className="space-y-2">
            {tool.bestFor.map((b) => (
              <li
                key={b}
                className="flex items-start text-sm text-[var(--ink-soft)]"
              >
                <span className="mr-2">👍</span>
                {b}
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-6">
          <h2 className="mb-3 text-lg font-bold text-[var(--bad)]">
            Limitations
          </h2>
          <ul className="space-y-2">
            {tool.limitations.map((l) => (
              <li
                key={l}
                className="flex items-start text-sm text-[var(--ink-soft)]"
              >
                <span className="mr-2">⚠️</span>
                {l}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Expert Take — legacy prose block; suppressed when a scored review exists */}
      {!review && tool.expertTake && (
        <section className="card mb-12 p-6 sm:p-8">
          <p className="eyebrow mb-3">Expert Take</p>
          <h2 className="display-h2 mb-4">The verdict</h2>
          <p className="mb-4 text-[var(--ink-soft)]">
            {tool.expertTake.summary}
          </p>
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-[var(--good)]">
                Strengths
              </h3>
              <ul className="space-y-1">
                {tool.expertTake.pros.map((p) => (
                  <li
                    key={p}
                    className="flex items-start text-sm text-[var(--ink-soft)]"
                  >
                    <span className="mr-2 text-[var(--good)]">+</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-[var(--bad)]">
                Weaknesses
              </h3>
              <ul className="space-y-1">
                {tool.expertTake.cons.map((c) => (
                  <li
                    key={c}
                    className="flex items-start text-sm text-[var(--ink-soft)]"
                  >
                    <span className="mr-2 text-[var(--bad)]">-</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="expert-take">
            <span className="label">Verdict</span>
            <p className="body text-sm text-[var(--ink-soft)]">
              {tool.expertTake.verdict}
            </p>
          </div>
          <p className="font-mono-t mt-3 text-[12px] italic text-[var(--ink-faint)]">
            {tool.expertTake.authorNote} — Last reviewed:{" "}
            {tool.expertTake.lastReviewed}
          </p>
        </section>
      )}

      {/* Cross-Country Availability */}
      <section className="mb-12">
        <div className="mb-5">
          <p className="eyebrow mb-3">🌍 Availability</p>
          <h2 className="display-h2">
            Available in {tool.availableCountries.length} countries
          </h2>
        </div>
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
                  className="card card-hover p-4 text-center"
                >
                  <span className="text-xl">{country.flag}</span>
                  <p className="mt-1 text-sm font-medium text-[var(--ink)]">
                    {country.name}
                  </p>
                  {popularity && (
                    <p className="mono-meta text-xs text-[var(--accent)]">
                      #{popularity.rank} in category
                    </p>
                  )}
                </Link>
              );
            })}
        </div>
      </section>

      {/* FAQ Section */}
      {(() => {
        const categoryLabel = tool.category === "ai-writing" ? "writing" : tool.category === "ai-image" ? "image generation" : tool.category === "ai-coding" ? "coding" : tool.category === "ai-voice" ? "voice & audio" : "productivity";
        const faqItems = [
          { q: `Is ${tool.name} worth it in 2026?`, a: tool.expertTake?.verdict || `${tool.name} is a competitive ${categoryLabel} tool. Check our Expert Take above for a detailed assessment.` },
          { q: `Does ${tool.name} have a free plan?`, a: tool.hasFreeplan ? `Yes, ${tool.name} offers a free plan. ${tool.pricing.find(p => p.price === 0)?.features.join(", ") || ""}` : `No, ${tool.name} does not offer a free plan. The lowest tier starts at $${tool.startingPrice}/mo.` },
          { q: `What are the best alternatives to ${tool.name}?`, a: `The top alternatives in the ${categoryLabel} category include ${getToolsByCategory(tool.category).filter(t => t.slug !== tool.slug).slice(0, 3).map(t => t.name).join(", ")}. Compare them on our category page.` },
          { q: `Is ${tool.name} available internationally?`, a: `Yes, ${tool.name} is available in ${tool.availableCountries.length} countries including the US, UK, Canada, Australia, and more. Pricing is in USD but accessible globally.` },
        ];
        return (
          <section className="mb-12">
            <div className="mb-5">
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
        );
      })()}

      {/* Related Tools */}
      {(() => {
        const relatedTools = getToolsByCategory(tool.category).filter(t => t.slug !== tool.slug);
        if (relatedTools.length === 0) return null;
        return (
          <section className="mb-12">
            <div className="mb-5">
              <p className="eyebrow mb-3">Alternatives</p>
              <h2 className="display-h2">Similar tools</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedTools.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tools/${t.slug}`}
                  className="card card-hover flex items-start gap-4 p-5"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--ink)]">{t.name}</h3>
                    <p className="mt-1 text-xs text-[var(--ink-faint)]">
                      {t.tagline}
                    </p>
                    <p className="mono-meta mt-2 text-sm font-medium text-[var(--ink)]">
                      {t.startingPrice === 0
                        ? "Free"
                        : `From $${t.startingPrice}/mo`}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-[var(--accent)]">
                    Compare →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        );
      })()}

      {/* Affiliate CTA */}
      <section className="card p-8 text-center" style={{ background: "var(--sea)" }}>
        <h2 className="display-h2">Try {tool.name} today</h2>
        <p className="mt-2 text-[var(--ink-soft)]">
          {tool.hasFreeplan
            ? `Start with ${tool.name}'s free plan — no credit card required.`
            : `Start your free trial of ${tool.name} today.`}
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
