import Link from "next/link";
import type { ReactNode } from "react";
import { tools } from "@/data/tools";
import { countries } from "@/data/countries";
import { categories } from "@/data/categories";
import ContourCanvas from "@/components/ContourCanvas";
import SectionHeading from "@/components/SectionHeading";
import Faq from "@/components/Faq";

const countryFlags: Record<string, string> = {
  US: "🇺🇸", GB: "🇬🇧", CA: "🇨🇦", AU: "🇦🇺", IN: "🇮🇳",
  SG: "🇸🇬", IE: "🇮🇪", NZ: "🇳🇿", IL: "🇮🇱", HK: "🇭🇰", RO: "🇷🇴",
};

const categoryShort: Record<string, string> = {
  "ai-writing": "Writing",
  "ai-image": "Image",
  "ai-coding": "Coding",
  "ai-voice": "Voice",
  "ai-productivity": "Productivity",
};

// Thin-line cartographic icons (stroke = currentColor).
const categoryIcons: Record<string, ReactNode> = {
  "ai-writing": (
    <path d="M4 20l4-1L20 7l-3-3L5 16l-1 4zM14 6l3 3" />
  ),
  "ai-image": (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M4 17l5-5 4 4 3-3 4 4" />
    </>
  ),
  "ai-coding": <path d="M9 7l-5 5 5 5M15 7l5 5-5 5" />,
  "ai-voice": (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" />
    </>
  ),
  "ai-productivity": <path d="M13 3L5 13h5l-1 8 8-11h-5z" />,
};

function Icon({ slug }: { slug: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {categoryIcons[slug]}
    </svg>
  );
}

// Featured picks: one strong tool per region/category, with a hand-written take.
const featured: { slug: string; take: string }[] = [
  { slug: "cursor", take: "The fastest-moving editor on the map — but budget for the Pro tier once the free credits run out mid-project." },
  { slug: "rytr", take: "The value pick of the entire writing category — solo creators get 90% of Jasper's output at a fraction of the price." },
  { slug: "ideogram", take: "If your images need readable text, skip the famous names and start here — nothing else on the map comes close." },
  { slug: "tabnine", take: "The one to shortlist when compliance says your code can't leave the building — a niche the US giants still ignore." },
  { slug: "meetgeek", take: "Feature-for-feature it matches notetakers charging triple — a textbook case for looking beyond the usual suspects." },
  { slug: "notta", take: "The strongest multilingual transcription in the Atlas — if your meetings aren't in English, this beats every US option." },
];

const solutions = [
  {
    title: "Compared across borders",
    body: "Every tool is charted with its country of origin, real pricing, and availability across 8 markets — so the hidden gems surface.",
  },
  {
    title: "An Expert Take on every review",
    body: "Not scraped marketing copy — professional analysis from 25 years of enterprise IT across Asia, Europe, and North America.",
  },
  {
    title: "Honest about the money",
    body: "Some links earn us a commission at no extra cost to you. It's disclosed on every page, and it never decides what we recommend.",
  },
];

const faqItems = [
  {
    q: "How does SaaS Atlas make money?",
    a: "Some links are affiliate links that earn us a commission at no extra cost to you. Every page discloses this, and commissions never influence which tools we feature or how the Expert Take reads — several of our top picks pay us nothing.",
  },
  {
    q: "What is the “Expert Take”?",
    a: "A short professional judgement on every tool, written from 25 years of enterprise IT experience across Asia, Europe, and North America — the kind of verdict a colleague gives you over coffee, not a rewritten press release.",
  },
  {
    q: "Why compare across countries?",
    a: "Because pricing, availability, and language support differ wildly by market — and because excellent tools built in India, Japan, Romania, or Israel rarely surface on US-centric lists. Cross-border comparison is how you find them.",
  },
  {
    q: "Can I suggest a tool for the Atlas?",
    a: "Please do — especially tools popular in your country that the English-language lists miss. Reader suggestions go to the top of the survey queue.",
  },
];

function priceLabel(startingPrice: number) {
  return startingPrice === 0 ? "Free" : `From $${startingPrice}/mo`;
}

export default function Home() {
  const toolCount = tools.length;
  const countryCount = countries.length;

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden border-b border-[var(--line-soft)]">
        <ContourCanvas />
        <div className="container-atlas relative z-10 py-[84px] max-[860px]:py-16">
          <div className="max-w-[740px]">
            <p className="font-mono-t mb-4 text-[12px] tracking-[0.12em] text-[var(--ink-faint)]">
              SURVEYING 8 COUNTRIES · 5 CATEGORIES · SHEET 01
            </p>
            <h1 className="display-h1">
              The best AI tool for you might be{" "}
              <em>three borders away.</em>
            </h1>
            <p className="mt-5 max-w-[58ch] text-[18px] text-[var(--ink-soft)]">
              SaaS Atlas compares pricing, features, and availability of AI tools
              across 8 countries — with an Expert Take on every review, drawn from
              25 years of IT deployments across Asia, Europe, and North America.
            </p>

            <form
              action="/categories/ai-writing"
              className="card mt-8 flex gap-2 p-2 shadow-[var(--shadow-card)] max-[860px]:flex-col"
            >
              <input
                type="search"
                name="q"
                aria-label="Search the Atlas"
                placeholder="Try “AI voiceover with a free plan”…"
                className="min-h-[46px] flex-1 rounded-[6px] bg-transparent px-3 text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none"
              />
              <button type="submit" className="btn btn-accent">
                Search the Atlas
              </button>
            </form>

            <div className="font-mono-t mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-[var(--ink-faint)]">
              <span>
                <span className="font-semibold text-[var(--ink)]">
                  {toolCount}
                </span>{" "}
                tools charted
              </span>
              <span>
                <span className="font-semibold text-[var(--ink)]">
                  {countryCount}
                </span>{" "}
                countries compared
              </span>
              <span>
                <span className="font-semibold text-[var(--ink)]">25</span> years
                of IT expertise
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- Categories */}
      <section className="section">
        <div className="container-atlas">
          <SectionHeading
            eyebrow="Grid B2 · Territories"
            heading="Browse by what you need AI to do"
            sub="Five charted territories. Every tool inside is compared on the same criteria — pricing, free tier, languages, and where it's actually available."
          />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-[14px]">
            {categories.map((cat) => {
              const count = tools.filter((t) => t.category === cat.slug).length;
              return (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  className="card card-hover flex items-start gap-3 p-[18px]"
                >
                  <span className="icon-box">
                    <Icon slug={cat.slug} />
                  </span>
                  <span>
                    <span className="block font-semibold text-[15.5px] text-[var(--ink)]">
                      {cat.name}
                    </span>
                    <span className="font-mono-t mt-1 block text-[12px] text-[var(--ink-faint)]">
                      {count} tools compared
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- Problem / Solution */}
      <section className="section bg-[var(--sea)]">
        <div className="container-atlas grid grid-cols-1 gap-12 min-[860px]:grid-cols-2">
          <div>
            <p className="eyebrow mb-3">Grid C1 · The Problem</p>
            <h2 className="display-h2">
              Most “best AI tools” lists are written from one zip code.
            </h2>
            <p className="mt-4 text-[var(--ink-soft)]">
              The AI tool market moves weekly, and almost every ranking you&rsquo;ll
              find is compiled in San Francisco, priced in dollars, and blind to
              what&rsquo;s available — or better — anywhere else.
            </p>
            <p className="mt-4 text-[var(--ink-soft)]">
              Meanwhile, an Indian writing assistant undercuts the market leader
              by 80%, a Tokyo transcription tool handles 100+ languages the US
              options don&rsquo;t, and a Romanian meeting notetaker ships features the
              famous names charge enterprise rates for.
            </p>
          </div>
          <div className="border-l-2 border-[var(--accent)] pl-6">
            {solutions.map((s, i) => (
              <div
                key={s.title}
                className={i > 0 ? "divider-dashed mt-5 pt-5" : ""}
              >
                <h3 className="font-semibold text-[16px] text-[var(--ink)]">
                  {s.title}
                </h3>
                <p className="mt-1 text-[14.5px] text-[var(--ink-soft)]">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- Featured */}
      <section id="featured" className="section scroll-mt-[70px]">
        <div className="container-atlas">
          <SectionHeading
            eyebrow="Grid D3 · Landmarks"
            heading="Finds from across the map"
            sub="A sample of the Atlas — one strong pick per region and category, each with the Expert Take that tells you what the pricing page won't."
          />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {featured.map(({ slug, take }) => {
              const tool = tools.find((t) => t.slug === slug);
              if (!tool) return null;
              return (
                <Link
                  key={slug}
                  href={`/tools/${tool.slug}`}
                  className="card card-hover tool-card flex flex-col gap-3 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-[17px] text-[var(--ink)]">
                        {tool.name}
                      </h3>
                      <span className="tag-mono">
                        {categoryShort[tool.category] ?? tool.category}
                      </span>
                    </div>
                    {tool.hasFreeplan ? (
                      <span className="pill-free">Free plan</span>
                    ) : null}
                  </div>

                  <p className="flex-1 text-[14.5px] text-[var(--ink-soft)] line-clamp-2">
                    {tool.description}
                  </p>

                  <div className="expert-take">
                    <span className="label">Expert Take</span>
                    <span className="body">{take}</span>
                  </div>

                  <div className="font-mono-t flex items-center justify-between border-t border-[var(--line-soft)] pt-3 text-[13px]">
                    <span className="font-semibold text-[var(--ink)]">
                      {priceLabel(tool.startingPrice)}
                    </span>
                    <span className="text-[var(--ink-faint)]">
                      {countryFlags[tool.originCountry] ?? "🌍"}{" "}
                      {tool.headquarters}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- Countries */}
      <section className="section bg-[var(--sea)]">
        <div className="container-atlas">
          <SectionHeading
            eyebrow="Grid E2 · Cross-Country Discovery"
            heading="Discover tools popular beyond your border"
            sub="Our signature view: what each market builds, what it pays, and the hidden gems that never make the English-language lists."
          />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-[14px]">
            {countries.map((country) => (
              <Link
                key={country.code}
                href={`/countries/${country.code.toLowerCase()}`}
                className="card card-hover flex items-center gap-3 p-[18px]"
              >
                <span className="text-[26px] leading-none">{country.flag}</span>
                <span>
                  <span className="block font-semibold text-[15.5px] text-[var(--ink)]">
                    {country.name}
                  </span>
                  <span className="font-mono-t mt-0.5 block text-[12px] text-[var(--ink-faint)]">
                    SaaS market: {country.saasMarketSize}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Proof */}
      <section className="section">
        <div className="container-atlas grid grid-cols-1 items-center gap-10 min-[860px]:grid-cols-[1.2fr_0.8fr]">
          <div>
            <blockquote className="font-display text-[clamp(20px,3vw,26px)] italic leading-[1.35] text-[var(--ink)]">
              “I&rsquo;d never heard of half these tools — and the one I picked costs a
              third of what we budgeted for the American brand everyone
              recommends.”
            </blockquote>
            <p className="mt-4 text-[14px] text-[var(--ink-faint)]">
              — Marketing lead evaluating AI writing tools (sample testimonial
              for preview)
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: String(toolCount), label: "AI tools charted & compared" },
              { value: String(countryCount), label: "countries surveyed side-by-side" },
              { value: "25 yrs", label: "of enterprise IT behind every Expert Take" },
              { value: "100%", label: "of affiliate links disclosed, always" },
            ].map((s) => (
              <div key={s.label} className="card p-4">
                <span className="stat-num block">{s.value}</span>
                <span className="mt-1 block text-[13px] text-[var(--ink-faint)]">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- About story */}
      <section className="section bg-[var(--sea)]">
        <div className="container-atlas grid grid-cols-1 gap-10 min-[860px]:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow mb-3">Grid F1 · The Cartographer</p>
            <h2 className="display-h2">Why this atlas exists</h2>
          </div>
          <div>
            <p className="text-[var(--ink-soft)]">
              Twenty-five years in IT teaches you one thing about software lists:
              the tools that win the rankings are rarely the tools that win the
              deployments. I&rsquo;ve rolled out systems across Asia, Europe, and North
              America, and the best pick was almost never the loudest one — it was
              the one built for the constraint nobody wrote about: the language,
              the regulation, the budget, the market.
            </p>
            <p className="mt-4 text-[var(--ink-soft)]">
              SaaS Atlas is that lesson, published. Every review carries an Expert
              Take because a feature list can&rsquo;t tell you what three decades of
              deployments can: which tool survives contact with a real team, in a
              real country, on a real budget.
            </p>
            <p className="font-display mt-5 text-[18px] italic text-[var(--ink)]">
              — The SaaS Atlas cartographer
            </p>
            <Link
              href="/about"
              className="mt-4 inline-block text-[14px] font-semibold text-[var(--accent)] hover:underline"
            >
              Learn more about our methodology →
            </Link>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- FAQ */}
      <section className="section">
        <div className="container-atlas">
          <div className="mx-auto mb-8 max-w-[720px]">
            <p className="eyebrow mb-3">Grid G1 · The Legend</p>
            <h2 className="display-h2">Questions, answered plainly</h2>
          </div>
          <Faq items={faqItems} />
        </div>
      </section>

      {/* ---------------------------------------------------------- Footer CTA */}
      <section className="section border-t border-[var(--line-soft)]">
        <div className="container-atlas text-center">
          <p className="eyebrow-plain mb-3">You are here ✕</p>
          <h2 className="display-h2 mx-auto max-w-[20ch]">
            Your next AI tool is already on the map.
          </h2>
          <p className="mx-auto mt-3 max-w-[52ch] text-[var(--ink-soft)]">
            Stop choosing from one country&rsquo;s shortlist. The whole atlas is free.
          </p>
          <Link
            href="/categories/ai-writing"
            className="btn btn-accent mt-6 inline-flex"
          >
            Explore the Atlas
          </Link>
        </div>
      </section>
    </>
  );
}
