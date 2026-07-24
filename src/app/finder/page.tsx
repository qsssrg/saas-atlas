import { Metadata } from "next";
import AiToolFinder from "@/components/AiToolFinder";

export const metadata: Metadata = {
  title: "AI Tool Finder — Find Your Best AI Tool in 60 Seconds",
  description:
    "Answer 5 quick questions and get a personalised AI tool recommendation from 30 writing, image, coding, voice, and productivity tools — matched to your budget, team, and priorities.",
  keywords: [
    "AI tool finder",
    "best AI tool quiz",
    "which AI tool should I use",
    "AI tool recommendation",
    "AI software finder",
  ],
  alternates: { canonical: "https://www.saas-atlas.uk/finder" },
  openGraph: {
    type: "website",
    title: "AI Tool Finder — Find Your Best AI Tool in 60 Seconds",
    description:
      "Answer 5 quick questions and get a personalised AI tool recommendation matched to your budget, team, and priorities.",
    url: "https://www.saas-atlas.uk/finder",
  },
};

// Lightweight WebApplication schema for the interactive finder.
const finderJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "SaaS Atlas AI Tool Finder",
  url: "https://www.saas-atlas.uk/finder",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description:
    "Interactive quiz that recommends the best AI tool for your needs across writing, image, coding, voice, and productivity categories.",
  publisher: { "@id": "https://www.saas-atlas.uk/#organization" },
};

export default function FinderPage() {
  return (
    <div className="section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(finderJsonLd) }}
      />
      <div className="mx-auto mb-10 w-full max-w-[720px] text-center">
        <p className="eyebrow-plain mb-3">Tool finder</p>
        <h1 className="display-h1">Find your AI tool in 60 seconds</h1>
        <p className="mx-auto mt-4 max-w-[560px] leading-relaxed text-[var(--ink-soft)]">
          Not sure which AI tool fits? Answer five quick questions and we&apos;ll match you to
          the best option — and a runner-up — from 30 tools across writing, image, coding, voice,
          and productivity, weighed against your budget, team size, and priorities.
        </p>
      </div>

      <AiToolFinder />
    </div>
  );
}
