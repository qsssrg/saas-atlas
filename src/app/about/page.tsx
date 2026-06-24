import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About SaaS Atlas — Expert AI Tool Comparisons Across Borders",
  description:
    "SaaS Atlas provides expert-curated AI tool comparisons across 8 countries. Founded by an IT industry veteran with 25 years of experience spanning Asia, Europe, and North America.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">About SaaS Atlas</h1>

      <section className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
        <p className="mt-3 text-gray-600 leading-relaxed">
          SaaS Atlas helps professionals and businesses discover the best AI
          tools — not just the ones everyone already knows, but hidden gems from
          across the globe. We believe the best tool for you might be built in
          India, Israel, or Singapore, not just Silicon Valley.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-gray-900">
          What Makes Us Different
        </h2>
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900">
              🌍 Cross-Country Discovery
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              We&apos;re the only comparison site that systematically tracks
              which AI tools are popular in which countries. When a tool is
              trending in India or gaining traction in Australia, we surface it
              for users worldwide.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900">
              🧠 Expert Take — Not Just Aggregated Reviews
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Every tool review includes an Expert Take — professional analysis
              grounded in 25 years of hands-on experience deploying enterprise
              software across three continents. We don&apos;t just collect user
              reviews; we provide informed, contextual opinions.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900">
              📊 Real Data, Updated Daily
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Pricing, features, and availability are pulled from official
              sources and updated regularly. We don&apos;t rely on outdated
              marketing copy — every data point is verified.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-gray-900">About the Author</h2>
        <div className="mt-4 rounded-lg bg-gray-50 p-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Rintaro Sonoda
          </h3>
          <p className="mt-1 text-sm text-blue-600">
            IT Industry Professional — 25 Years Experience
          </p>
          <p className="mt-3 text-gray-600 leading-relaxed">
            With a career spanning enterprise IT, software development, and
            digital transformation across Japan and international markets, I
            bring a global perspective to AI tool evaluation. I&apos;ve seen
            technology trends come and go — from the dot-com era through cloud
            computing to today&apos;s AI revolution. This depth of experience
            informs every Expert Take on SaaS Atlas.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs text-gray-600 border border-gray-200">
              Enterprise IT
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs text-gray-600 border border-gray-200">
              Global SaaS
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs text-gray-600 border border-gray-200">
              AI & Automation
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs text-gray-600 border border-gray-200">
              Japan × Global
            </span>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-gray-900">
          Our Methodology
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-gray-600">
          <li>
            <strong>Data Collection:</strong> We gather pricing, features, and
            availability data directly from official sources and APIs.
          </li>
          <li>
            <strong>Cross-Country Analysis:</strong> We track adoption patterns
            across 8 countries to identify regional favorites and emerging
            alternatives.
          </li>
          <li>
            <strong>Expert Review:</strong> Each tool receives a professional
            assessment considering use case fit, value for money, and
            competitive positioning.
          </li>
          <li>
            <strong>Continuous Updates:</strong> Data is refreshed regularly to
            ensure accuracy. Every page shows its last updated date.
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-gray-900">
          Affiliate Disclosure
        </h2>
        <p className="mt-3 text-gray-600 leading-relaxed">
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
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          Start Exploring AI Tools →
        </Link>
      </div>
    </div>
  );
}
