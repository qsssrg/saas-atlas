import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About SaaS Atlas — Expert AI Tool Comparisons Across Borders",
  description:
    "SaaS Atlas provides expert-curated AI tool comparisons across 8 countries. Founded by an IT industry veteran with 25 years of experience spanning Asia, Europe, and North America.",
};

// Author E-E-A-T schema. @id matches the Organization.founder reference in
// the root layout so the two link into one entity graph.
const authorJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://www.saas-atlas.uk/about#author",
  name: "Rintaro Sonoda",
  url: "https://www.saas-atlas.uk/about",
  jobTitle: "Founder & Editor, SaaS Atlas",
  description:
    "IT industry professional with 25 years of hands-on experience deploying enterprise software across Asia, Europe, and North America.",
  knowsAbout: [
    "Enterprise IT",
    "SaaS",
    "AI tools",
    "Software evaluation",
    "Digital transformation",
  ],
  worksFor: { "@id": "https://www.saas-atlas.uk/#organization" },
};

export default function AboutPage() {
  return (
    <div className="section">
      <div className="mx-auto w-full max-w-[760px] px-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(authorJsonLd) }}
      />
      <p className="eyebrow mb-3">The cartographer</p>
      <h1 className="display-h1">About SaaS Atlas</h1>

      <section className="mt-10">
        <h2 className="display-h2">Our Mission</h2>
        <p className="mt-3 leading-relaxed text-[var(--ink-soft)]">
          SaaS Atlas helps professionals and businesses discover the best AI
          tools — not just the ones everyone already knows, but hidden gems from
          across the globe. We believe the best tool for you might be built in
          India, Israel, or Singapore, not just Silicon Valley.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="display-h2">
          What Makes Us Different
        </h2>
        <div className="mt-4 space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-[var(--ink)]">
              🌍 Cross-Country Discovery
            </h3>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              We&apos;re the only comparison site that systematically tracks
              which AI tools are popular in which countries. When a tool is
              trending in India or gaining traction in Australia, we surface it
              for users worldwide.
            </p>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-[var(--ink)]">
              🧠 Expert Take — Not Just Aggregated Reviews
            </h3>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              Every tool review includes an Expert Take — professional analysis
              grounded in 25 years of hands-on experience deploying enterprise
              software across three continents. We don&apos;t just collect user
              reviews; we provide informed, contextual opinions.
            </p>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-[var(--ink)]">
              📊 Real Data, Updated Daily
            </h3>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              Pricing, features, and availability are pulled from official
              sources and updated regularly. We don&apos;t rely on outdated
              marketing copy — every data point is verified.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="display-h2">About the Author</h2>
        <div className="card mt-4 p-6" style={{ background: "var(--sea)" }}>
          <h3 className="text-lg font-semibold text-[var(--ink)]">
            Rintaro Sonoda
          </h3>
          <p className="mono-meta mt-1 text-sm text-[var(--accent)]">
            IT Industry Professional — 25 Years Experience
          </p>
          <p className="mt-3 leading-relaxed text-[var(--ink-soft)]">
            With a career spanning enterprise IT, software development, and
            digital transformation across Japan and international markets, I
            bring a global perspective to AI tool evaluation. I&apos;ve seen
            technology trends come and go — from the dot-com era through cloud
            computing to today&apos;s AI revolution. This depth of experience
            informs every Expert Take on SaaS Atlas.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="tag-mono rounded-full border border-[var(--line-soft)] px-3 py-1">
              Enterprise IT
            </span>
            <span className="tag-mono rounded-full border border-[var(--line-soft)] px-3 py-1">
              Global SaaS
            </span>
            <span className="tag-mono rounded-full border border-[var(--line-soft)] px-3 py-1">
              AI & Automation
            </span>
            <span className="tag-mono rounded-full border border-[var(--line-soft)] px-3 py-1">
              Japan × Global
            </span>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="display-h2">
          Our Methodology
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-[var(--ink-soft)]">
          <li>
            <strong>Data Collection:</strong> We gather pricing, features, and
            availability data directly from official sources and APIs. Every
            data point is verified against the tool&apos;s pricing page — not
            third-party aggregators.
          </li>
          <li>
            <strong>Cross-Country Analysis:</strong> We track adoption patterns
            across 8 English-speaking markets (US, UK, Canada, Australia,
            India, Singapore, Ireland, New Zealand) to identify regional
            favorites and emerging alternatives.
          </li>
          <li>
            <strong>Expert Review:</strong> Each tool receives a professional
            assessment considering use case fit, value for money, and
            competitive positioning. Reviews include specific strengths,
            weaknesses, and a verdict with concrete recommendations.
          </li>
          <li>
            <strong>Continuous Updates:</strong> Data is refreshed regularly to
            ensure accuracy. Every page shows its last updated date. Pricing
            changes are tracked and reflected within 7 days.
          </li>
          <li>
            <strong>Independence:</strong> Affiliate partnerships never
            influence our rankings or recommendations. Tools without affiliate
            programs (like Midjourney and Cursor) receive the same thorough
            evaluation as those with programs.
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="display-h2">
          Evaluation Criteria
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="card p-4">
            <h3 className="font-semibold text-[var(--ink)]">Pricing Transparency</h3>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              We report both monthly and annual pricing, hidden fees, and
              credit/usage limits that affect real-world costs.
            </p>
          </div>
          <div className="card p-4">
            <h3 className="font-semibold text-[var(--ink)]">Feature Verification</h3>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Features listed are confirmed through official documentation and
              hands-on testing, not marketing claims.
            </p>
          </div>
          <div className="card p-4">
            <h3 className="font-semibold text-[var(--ink)]">Use Case Matching</h3>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              We identify who each tool is best for and who should look
              elsewhere — no tool is perfect for everyone.
            </p>
          </div>
          <div className="card p-4">
            <h3 className="font-semibold text-[var(--ink)]">Market Context</h3>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Popularity rankings reflect real adoption patterns in each
              country, not just global search volume.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="display-h2">
          Affiliate Disclosure
        </h2>
        <p className="mt-3 leading-relaxed text-[var(--ink-soft)]">
          SaaS Atlas participates in affiliate programs. When you click certain
          links and make a purchase, we may receive a commission at no additional
          cost to you. This never influences our rankings or reviews. We
          recommend tools based on merit, data, and professional experience —
          not commission rates.
        </p>
      </section>

      <div className="mt-12 text-center">
        <Link
          href="/"
          className="btn btn-accent inline-flex"
        >
          Start Exploring AI Tools →
        </Link>
      </div>
      </div>
    </div>
  );
}
