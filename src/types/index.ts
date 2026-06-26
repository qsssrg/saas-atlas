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
