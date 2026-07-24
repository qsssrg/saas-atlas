"use client";

/* ---------------------------------------------------------------------------
   AiToolFinder — interactive "find your AI tool" quiz.

   Five questions route a visitor to a best-fit tool (+ a runner-up) out of the
   30 tools in src/data/tools.ts, then hand off to the tool's own site via the
   shared TrackedLink so the click lands in GA4 (outbound_click) exactly like
   every other outbound link on the Atlas.

   Recommendation is BEST-FIT first; a tool's affiliate program only breaks
   ties (+epsilon), never overrides a better match. Scoring runs entirely on
   structured Tool fields (category / startingPrice / hasFreeplan / bestFor /
   features), so it is deterministic and needs no network.

   GA4 events:
     diagnosis_start     — on the first answer (not on mount, to skip bounces)
     diagnosis_complete  — when a result is shown (recommended_slug/category/budget)
     outbound_click      — fired by TrackedLink on the result CTA (linkType "finder")
   ------------------------------------------------------------------------- */

import { useMemo, useState } from "react";
import type { Tool, ToolCategory } from "@/types";
import { tools, hasAffiliate } from "@/data/tools";
import TrackedLink from "@/components/TrackedLink";

type BudgetKey = "free" | "u20" | "u50" | "any";
type TeamKey = "solo" | "team" | "company";
type PriorityKey = "quality" | "ease" | "integrations";

interface Answers {
  category?: ToolCategory;
  budget?: BudgetKey;
  needFree?: boolean;
  team?: TeamKey;
  priority?: PriorityKey;
}

const BUDGET_CAP: Record<BudgetKey, number> = {
  free: 0,
  u20: 20,
  u50: 50,
  any: Infinity,
};

interface Question {
  id: keyof Answers;
  title: string;
  hint?: string;
  options: { value: string; label: string; icon?: string }[];
}

const QUESTIONS: Question[] = [
  {
    id: "category",
    title: "What do you want to do?",
    hint: "Pick the job you need an AI tool for.",
    options: [
      { value: "ai-writing", label: "Write content", icon: "✍️" },
      { value: "ai-image", label: "Generate images", icon: "🎨" },
      { value: "ai-coding", label: "Write code", icon: "💻" },
      { value: "ai-voice", label: "Voice, audio & video", icon: "🎙️" },
      { value: "ai-productivity", label: "Meetings & productivity", icon: "⚡" },
    ],
  },
  {
    id: "budget",
    title: "What's your monthly budget?",
    options: [
      { value: "free", label: "Free only", icon: "🆓" },
      { value: "u20", label: "Under $20 / mo", icon: "💸" },
      { value: "u50", label: "Under $50 / mo", icon: "💳" },
      { value: "any", label: "Budget isn't the issue", icon: "🚀" },
    ],
  },
  {
    id: "needFree",
    title: "Do you want to start on a free plan?",
    options: [
      { value: "yes", label: "Yes — let me try it free first", icon: "✅" },
      { value: "no", label: "Paid is fine if it's the best fit", icon: "💼" },
    ],
  },
  {
    id: "team",
    title: "Who's using it?",
    options: [
      { value: "solo", label: "Just me", icon: "🙋" },
      { value: "team", label: "A small team", icon: "👥" },
      { value: "company", label: "A company / enterprise", icon: "🏢" },
    ],
  },
  {
    id: "priority",
    title: "What matters most?",
    options: [
      { value: "quality", label: "Top-quality output", icon: "🏆" },
      { value: "ease", label: "Fast & easy to use", icon: "⚡" },
      { value: "integrations", label: "Integrations & API", icon: "🔌" },
    ],
  },
];

const TEAM_KEYWORDS: Record<TeamKey, string[]> = {
  solo: ["solo", "individual", "freelanc", "creator", "personal", "beginner", "indie", "hobby", "student"],
  team: ["team", "agenc", "startup", "small business", "collaborat", "small teams"],
  company: ["enterprise", "compan", "organization", "organisation", "large", "business", "scale", "professional"],
};

const PRIORITY_KEYWORDS: Record<PriorityKey, string[]> = {
  quality: ["enterprise", "professional", "advanced", "quality", "accuracy", "high-quality", "premium", "brand"],
  ease: ["beginner", "easy", "simple", "fast", "quick", "no-code", "intuitive", "affordable", "budget"],
  integrations: ["api", "integration", "integrat", "plugin", "extension", "workflow", "zapier", "collaborat"],
};

function matchesAny(haystack: string[], needles: string[]): boolean {
  const hay = haystack.join(" ").toLowerCase();
  return needles.some((n) => hay.includes(n));
}

interface Scored {
  tool: Tool;
  score: number;
  reasons: string[];
}

/** Deterministic best-fit scoring inside the chosen category. */
function scoreTools(answers: Answers): Scored[] {
  if (!answers.category) return [];
  const cap = answers.budget ? BUDGET_CAP[answers.budget] : Infinity;
  const wantFree = answers.needFree || answers.budget === "free";

  const pool = tools.filter((t) => t.category === answers.category);
  const scored = pool.map((tool) => {
    let score = 0;
    const reasons: string[] = [];
    const searchable = [...tool.bestFor, ...tool.features];

    // Budget fit
    if (tool.startingPrice <= cap) {
      score += 30;
      if (cap !== Infinity) {
        reasons.push(
          tool.startingPrice === 0
            ? "Has a free tier"
            : `Fits your budget (from $${tool.startingPrice}/mo)`,
        );
      }
    } else if (tool.startingPrice <= cap * 1.5) {
      score += 6; // slightly over budget — still worth showing
    }

    // Free-plan preference
    if (wantFree) {
      if (tool.hasFreeplan) {
        score += 25;
        reasons.push("Free plan available to start");
      } else {
        score -= 18;
      }
    } else if (tool.hasFreeplan) {
      score += 5;
    }

    // Team fit
    if (answers.team && matchesAny(searchable, TEAM_KEYWORDS[answers.team])) {
      score += 12;
      const teamLabel =
        answers.team === "solo" ? "individuals" : answers.team === "team" ? "small teams" : "companies";
      reasons.push(`Well suited to ${teamLabel}`);
    }

    // Priority fit
    if (answers.priority && matchesAny(searchable, PRIORITY_KEYWORDS[answers.priority])) {
      score += 12;
      const pLabel =
        answers.priority === "quality"
          ? "output quality"
          : answers.priority === "ease"
            ? "ease of use"
            : "integrations & API";
      reasons.push(`Strong on ${pLabel}`);
    }

    // Depth proxy — more capabilities is a mild, stable baseline signal
    score += Math.min(8, tool.features.length);

    // Affiliate is a TIE-BREAK ONLY (epsilon), never overrides a better fit
    if (hasAffiliate(tool)) score += 0.5;

    if (reasons.length === 0) reasons.push(`A leading ${tool.category.replace("ai-", "AI ")} option`);
    return { tool, score, reasons };
  });

  return scored.sort((a, b) => b.score - a.score);
}

function fireEvent(name: string, params: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", name, { event_category: "finder", ...params });
  }
}

const CATEGORY_PATH: Record<ToolCategory, string> = {
  "ai-writing": "/categories/ai-writing",
  "ai-image": "/categories/ai-image",
  "ai-coding": "/categories/ai-coding",
  "ai-voice": "/categories/ai-voice",
  "ai-productivity": "/categories/ai-productivity",
};

export default function AiToolFinder() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [started, setStarted] = useState(false);

  const done = step >= QUESTIONS.length;
  const ranked = useMemo(() => (done ? scoreTools(answers) : []), [done, answers]);
  const winner = ranked[0];
  const runnerUp = ranked[1];

  function choose(q: Question, value: string) {
    if (!started) {
      setStarted(true);
      fireEvent("diagnosis_start", {});
    }
    let parsed: Answers[keyof Answers];
    if (q.id === "needFree") parsed = value === "yes";
    else parsed = value as never;
    const next = { ...answers, [q.id]: parsed };
    setAnswers(next);

    const nextStep = step + 1;
    setStep(nextStep);

    if (nextStep >= QUESTIONS.length) {
      const result = scoreTools(next);
      fireEvent("diagnosis_complete", {
        recommended_slug: result[0]?.tool.slug ?? "none",
        recommended_category: next.category ?? "none",
        budget: next.budget ?? "none",
      });
    }
  }

  function restart() {
    setStep(0);
    setAnswers({});
    // Reset the start-fired guard so a second run counts as its own funnel:
    // otherwise diagnosis_complete fires again with no matching diagnosis_start.
    setStarted(false);
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  // ── Result view ──────────────────────────────────────────────
  if (done && winner) {
    return (
      <div className="mx-auto w-full max-w-[720px]">
        <p className="eyebrow mb-2">Your match</p>
        <ResultCard scored={winner} primary />
        {runnerUp && (
          <div className="mt-6">
            <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
              Runner-up
            </p>
            <ResultCard scored={runnerUp} primary={false} />
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a href={CATEGORY_PATH[answers.category as ToolCategory]} className="btn btn-outline btn-sm">
            See all {(answers.category ?? "").replace("ai-", "AI ")} tools
          </a>
          <button type="button" onClick={restart} className="text-[13.5px] text-[var(--ink-soft)] underline hover:text-[var(--accent)]">
            Start over
          </button>
        </div>
        <p className="mt-6 text-[12px] leading-relaxed text-[var(--ink-faint)]">
          Recommendation is generated from your answers against each tool&apos;s pricing and
          capabilities. Some links are affiliate links — they never change which tool ranks first.
        </p>
      </div>
    );
  }

  // Defensive: quiz finished but nothing scored (only possible if a category
  // were ever left with no tools). Offer a restart instead of crashing.
  if (done) {
    return (
      <div className="mx-auto w-full max-w-[640px] text-center">
        <p className="text-[var(--ink-soft)]">
          We couldn&apos;t find a match. Let&apos;s try that again.
        </p>
        <button type="button" onClick={restart} className="btn btn-accent btn-sm mt-4">
          Start over
        </button>
      </div>
    );
  }

  // ── Question view ────────────────────────────────────────────
  const q = QUESTIONS[step];
  const progress = Math.round((step / QUESTIONS.length) * 100);

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-[12.5px] text-[var(--ink-faint)]">
          <span>
            Question {step + 1} of {QUESTIONS.length}
          </span>
          <span>{progress}%</span>
        </div>
        <div
          className="h-[6px] w-full overflow-hidden rounded-full bg-[var(--line-soft)]"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Question ${step + 1} of ${QUESTIONS.length}`}
        >
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
            style={{ width: `${Math.max(progress, 4)}%` }}
          />
        </div>
      </div>

      <h2 className="display-h2 mb-1">{q.title}</h2>
      {q.hint && <p className="mb-5 text-[14px] text-[var(--ink-soft)]">{q.hint}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {q.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => choose(q, opt.value)}
            className="card flex items-center gap-3 p-4 text-left transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
          >
            {opt.icon && <span className="text-[22px]" aria-hidden="true">{opt.icon}</span>}
            <span className="font-medium text-[var(--ink)]">{opt.label}</span>
          </button>
        ))}
      </div>

      {step > 0 && (
        <button
          type="button"
          onClick={back}
          className="mt-5 text-[13.5px] text-[var(--ink-soft)] underline hover:text-[var(--accent)]"
        >
          ← Back
        </button>
      )}
    </div>
  );
}

function ResultCard({ scored, primary }: { scored: Scored; primary: boolean }) {
  const { tool, reasons } = scored;
  const priceLabel = tool.hasFreeplan
    ? "Free plan available"
    : `From $${tool.startingPrice}/mo`;
  return (
    <div
      className="card p-6"
      style={primary ? { borderColor: "var(--accent)", boxShadow: "var(--shadow-card)" } : undefined}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-[22px] font-semibold text-[var(--ink)]">{tool.name}</h3>
        <span className="text-[13px] text-[var(--ink-faint)]">{priceLabel}</span>
      </div>
      <p className="mt-1 text-[14px] text-[var(--ink-soft)]">{tool.tagline}</p>

      <ul className="mt-4 space-y-1.5">
        {reasons.slice(0, 4).map((r, i) => (
          <li key={i} className="flex items-start gap-2 text-[14px] text-[var(--ink-soft)]">
            <span className="mt-[2px] text-[var(--good)]" aria-hidden="true">✓</span>
            <span>{r}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <TrackedLink
          href={tool.website}
          toolSlug={tool.slug}
          toolName={tool.name}
          hasAffiliate={hasAffiliate(tool)}
          linkType="finder"
          target="_blank"
          rel="nofollow sponsored noopener"
          className={primary ? "btn btn-accent" : "btn btn-outline btn-sm"}
        >
          Visit {tool.name} →
        </TrackedLink>
        <a
          href={`/tools/${tool.slug}`}
          className="text-[13.5px] text-[var(--ink-soft)] underline hover:text-[var(--accent)]"
        >
          Read our review
        </a>
      </div>
    </div>
  );
}
