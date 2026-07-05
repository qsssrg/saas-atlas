// SaaS Atlas - Core Types

export interface Tool {
  slug: string;
  name: string;
  category: ToolCategory;
  description: string;
  tagline: string;
  website: string;
  logo?: string;
  founded: number;
  headquarters: string;
  originCountry: string; // ISO 3166-1 alpha-2

  // Pricing
  pricing: PricingTier[];
  hasFreeplan: boolean;
  startingPrice: number; // USD monthly
  currency: string;

  // Features
  features: string[];
  bestFor: string[];
  limitations: string[];

  // Affiliate
  affiliate: AffiliateInfo;

  // Cross-country data
  availableCountries: string[]; // ISO codes
  popularIn: CountryPopularity[];

  // Expert Take
  expertTake?: ExpertTake;

  // Meta
  lastUpdated: string; // ISO date
}

export interface PricingTier {
  name: string;
  price: number; // USD monthly
  billingCycle: 'monthly' | 'yearly';
  features: string[];
}

export interface AffiliateInfo {
  program: string; // e.g., "Impact", "Direct", "PartnerStack"
  commission: string; // e.g., "25% recurring"
  cookieDuration: number; // days
  signupUrl: string;
  isRecurring: boolean;
  recurringDuration: string; // e.g., "12 months", "lifetime"
}

export interface CountryPopularity {
  country: string; // ISO code
  rank: number; // 1 = most popular
  marketShare?: number; // percentage
  localAlternative?: string; // slug of local alternative
}

export interface ExpertTake {
  summary: string;
  pros: string[];
  cons: string[];
  verdict: string;
  authorNote: string; // "Based on 25 years in IT..."
  lastReviewed: string; // ISO date
}

/* ---------------------------------------------------------------------------
   Scored Review (2026-07-05 evaluation-axis profile)
   Every tool review is generated on a fixed rubric:
   - Per-axis scores (1-10), each mapped to how much error/lock-in it removes.
   - A single overall letter rank S/A/B/C/D (not a 5-point number).
   - Feature-centric prose (target audience never named in the lead).
   - Downsides phrased as "this may not be for you if..." (euphemistic).
   - Pricing framed as value-for-cost; any unverified figure carries
     "per official listing" so fact and inference stay separated.
   - A staged recommendation (monthly trial -> switch -> annual), never a
     single forced pick.
   - A CTA that puts sign-up first but points at the MONTHLY plan (no rush
     into annual lock-in).
   ------------------------------------------------------------------------- */

export type ReviewRank = 'S' | 'A' | 'B' | 'C' | 'D';

/** Per-axis scores, each on a 1-10 scale. */
export interface ReviewScores {
  featureDepth: number; // differentiation is argued through depth of features
  valueForCost: number; // price judged on return, not sticker
  hallucinationResistance: number; // most-weighted AI-specific axis
  pricingClarity: number; // transparency of the pricing/tiers (lock-in landmine)
}

/** One axis rendered in the score table. Order is fixed across all tools. */
export interface ReviewAxis {
  key: keyof ReviewScores;
  label: string;
  hint: string; // one-line explanation of what the axis measures
}

export interface ToolReview {
  slug: string; // matches Tool.slug
  rank: ReviewRank; // overall letter rank
  scores: ReviewScores;
  /** Feature-centric intro. Never names the target reader. */
  lead: string;
  /** Additive points (what earns credit). */
  strengths: string[];
  /** Downsides as "not for you if..." euphemisms. */
  notForEveryone: string[];
  /** Value-for-cost paragraph; unverified figures marked "per official listing". */
  pricingNote: string;
  /** Staged advice: monthly trial -> switch if weak -> annual only if it sticks. */
  recommendation: string;
  cta: {
    heading: string;
    body: string; // copy that steers sign-up toward the monthly plan
  };
  reviewedOn: string; // ISO date
}

export type ToolCategory = 'ai-writing' | 'ai-image' | 'ai-coding' | 'ai-voice' | 'ai-productivity';

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  tier: 1 | 2;
  region: string;
  currency: string;
  currencySymbol: string;
  language: string;
  flag: string; // emoji
  saasMarketSize?: string; // e.g., "$50B"
}

export interface CategoryInfo {
  slug: ToolCategory;
  name: string;
  description: string;
  icon: string;
  toolCount: number;
}
