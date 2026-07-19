import type { ReactNode } from "react";
import type { ReviewRank, Tool, ToolReview as ToolReviewData } from "@/types";
import { REVIEW_AXES } from "@/data/reviews";
import { hasAffiliate } from "@/data/tools";
import TrackedLink from "@/components/TrackedLink";

/* ---------------------------------------------------------------------------
   ToolReview — scored review panel (2026-07-05 evaluation-axis profile).

   Renders, in fixed order:
     1. Overall letter rank (S/A/B/C/D) + feature-centric lead
     2. Per-axis score table (Feature depth / Value for cost /
        Hallucination resistance / Pricing clarity, each /10)
     3. Strengths (additive credit)
     4. Not for everyone (downsides as "not for you if..." euphemisms)
     5. Pricing (value-for-cost; "per official listing" on unverified figures)
     6. Recommendation (staged: monthly trial -> switch -> annual)
     7. CTA (sign-up first, pointed at the MONTHLY plan)

   Data-driven: pass any `ToolReview` + its `Tool`. Uses the site's
   cartographic design tokens so it matches the rest of the Atlas.
   ------------------------------------------------------------------------- */

/** Visual treatment per overall letter rank. Light-theme palette. */
const RANK_STYLES: Record<
  ReviewRank,
  { bg: string; ring: string; text: string; caption: string }
> = {
  S: { bg: "#e7f6ee", ring: "#1e7a55", text: "#12603f", caption: "Exceptional" },
  A: { bg: "#eaf3ec", ring: "#2f8f5b", text: "#1e6b41", caption: "Strong" },
  B: { bg: "#ede7f8", ring: "#6d28d9", text: "#5a1fb0", caption: "Solid" },
  C: { bg: "#fdf3e3", ring: "#c07a1a", text: "#8a5410", caption: "Situational" },
  D: { bg: "#fbe9e9", ring: "#c0392b", text: "#8f271c", caption: "Hard to justify" },
};

/** Bar colour by score band, so the table reads at a glance. */
function scoreColor(score: number): string {
  if (score >= 8) return "#1e7a55"; // good
  if (score >= 6) return "#6d28d9"; // accent
  if (score >= 4) return "#c07a1a"; // caution
  return "#c0392b"; // weak
}

function RankBadge({ rank }: { rank: ReviewRank }) {
  const s = RANK_STYLES[rank];
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-16 w-16 flex-col items-center justify-center rounded-[10px] font-display leading-none"
        style={{ background: s.bg, border: `2px solid ${s.ring}`, color: s.text }}
        aria-hidden="true"
      >
        <span className="text-[34px] font-semibold">{rank}</span>
      </div>
      <div>
        <span className="tag-mono block">Overall rank</span>
        <span className="block text-[17px] font-semibold text-[var(--ink)]">
          {rank} · {s.caption}
        </span>
      </div>
    </div>
  );
}

function ScoreRow({
  label,
  hint,
  score,
}: {
  label: string;
  hint: string;
  score: number;
}) {
  const pct = Math.max(0, Math.min(10, score)) * 10;
  const color = scoreColor(score);
  return (
    <div className="py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[14.5px] font-semibold text-[var(--ink)]">
          {label}
        </span>
        <span className="font-mono-t text-[13px] text-[var(--ink)]">
          <span className="font-semibold">{score}</span>
          <span className="text-[var(--ink-faint)]">/10</span>
        </span>
      </div>
      <div
        className="mt-2 h-[6px] w-full overflow-hidden rounded-full"
        style={{ background: "var(--line-soft)" }}
        role="img"
        aria-label={`${label}: ${score} out of 10`}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <p className="mt-1.5 text-[12.5px] text-[var(--ink-faint)]">{hint}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="eyebrow-plain mb-3">{children}</p>;
}

export default function ToolReview({
  review,
  tool,
}: {
  review: ToolReviewData;
  tool: Tool;
}) {
  // CTA points at the tool's own site via `website`, which is where the
  // owner's tracked affiliate link lives (e.g. ?via=/?ref=/branded redirect).
  // NB: do NOT use affiliate.signupUrl here — that field holds the affiliate
  // *program application* page (e.g. jasper.ai/partners, listnr.tolt.io), which
  // is owner-facing, not a customer destination. Sending buyers there breaks
  // both UX and commission tracking.
  const ctaUrl = tool.website;

  return (
    <section className="card tool-card mb-10 overflow-hidden">
      {/* Header: eyebrow + rank + lead */}
      <div className="border-b border-[var(--line-soft)] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <SectionLabel>Expert Review · Scored</SectionLabel>
            <h2 className="display-h2">{tool.name} review</h2>
          </div>
          <RankBadge rank={review.rank} />
        </div>
        <p className="mt-5 max-w-[68ch] text-[15.5px] leading-relaxed text-[var(--ink-soft)]">
          {review.lead}
        </p>
      </div>

      <div className="grid gap-8 p-6 sm:p-8 min-[860px]:grid-cols-[1fr_1.1fr]">
        {/* Score table */}
        <div>
          <SectionLabel>Scorecard</SectionLabel>
          <div className="divide-y divide-[var(--line-soft)]">
            {REVIEW_AXES.map((axis) => (
              <ScoreRow
                key={axis.key}
                label={axis.label}
                hint={axis.hint}
                score={review.scores[axis.key]}
              />
            ))}
          </div>
        </div>

        {/* Strengths + Not for everyone */}
        <div className="grid gap-6">
          <div>
            <SectionLabel>Strengths</SectionLabel>
            <ul className="space-y-2.5">
              {review.strengths.map((s) => (
                <li
                  key={s}
                  className="flex items-start gap-2.5 text-[14.5px] leading-relaxed text-[var(--ink-soft)]"
                >
                  <span
                    className="mt-0.5 font-mono-t font-semibold"
                    style={{ color: "var(--good)" }}
                    aria-hidden="true"
                  >
                    +
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionLabel>Not for everyone</SectionLabel>
            <ul className="space-y-2.5">
              {review.notForEveryone.map((n) => (
                <li
                  key={n}
                  className="flex items-start gap-2.5 text-[14.5px] leading-relaxed text-[var(--ink-soft)]"
                >
                  <span
                    className="mt-0.5 font-mono-t text-[var(--ink-faint)]"
                    aria-hidden="true"
                  >
                    ·
                  </span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Pricing (value-for-cost) */}
      <div className="border-t border-[var(--line-soft)] p-6 sm:p-8">
        <SectionLabel>Pricing · value for cost</SectionLabel>
        <p className="max-w-[68ch] text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
          {review.pricingNote}
        </p>
      </div>

      {/* Recommendation (staged) */}
      <div className="border-t border-[var(--line-soft)] bg-[var(--sea)] p-6 sm:p-8">
        <SectionLabel>Recommendation</SectionLabel>
        <p className="max-w-[68ch] text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
          {review.recommendation}
        </p>
      </div>

      {/* CTA — sign-up first, monthly plan */}
      <div className="border-t border-[var(--line-soft)] p-6 text-center sm:p-8">
        <h3 className="display-h2 text-[24px]">{review.cta.heading}</h3>
        <p className="mx-auto mt-2 max-w-[52ch] text-[14.5px] text-[var(--ink-soft)]">
          {review.cta.body}
        </p>
        <TrackedLink
          href={ctaUrl}
          toolSlug={tool.slug}
          toolName={tool.name}
          hasAffiliate={hasAffiliate(tool)}
          linkType="review_cta"
          target="_blank"
          rel="noopener noreferrer nofollow sponsored"
          className="btn btn-accent mt-5 inline-flex"
        >
          Start {tool.name} — monthly plan →
        </TrackedLink>
        <p className="font-mono-t mt-3 text-[12px] text-[var(--ink-faint)]">
          Reviewed {review.reviewedOn} · scored on a fixed rubric ·
          affiliate link disclosed
        </p>
      </div>
    </section>
  );
}
