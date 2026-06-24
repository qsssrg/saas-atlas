import { Tool } from '@/types';

export const tools: Tool[] = [
  // ===== AI Writing Tools =====
  {
    slug: 'jasper',
    name: 'Jasper',
    category: 'ai-writing',
    description:
      'Enterprise-grade AI writing and marketing platform with brand voice training, campaign management, and team collaboration features.',
    tagline: 'AI copilot for enterprise marketing teams',
    website: 'https://www.jasper.ai',
    founded: 2021,
    headquarters: 'Austin, TX',
    originCountry: 'US',
    pricing: [
      {
        name: 'Pro',
        price: 59,
        billingCycle: 'yearly',
        features: [
          'Brand voice',
          'SEO mode',
          'AI image generation',
          'Browser extension',
          'Multi-channel campaigns',
        ],
      },
      {
        name: 'Pro Monthly',
        price: 69,
        billingCycle: 'monthly',
        features: [
          'Brand voice',
          'SEO mode',
          'AI image generation',
          'Browser extension',
          'Multi-channel campaigns',
        ],
      },
    ],
    hasFreeplan: false,
    startingPrice: 59,
    currency: 'USD',
    features: [
      'Brand voice training',
      'SEO optimization',
      'Campaign management',
      '50+ templates',
      'AI image generation',
      'Browser extension',
      'API access',
      'Team collaboration',
    ],
    bestFor: [
      'Marketing teams',
      'Content agencies',
      'Enterprise brands',
      'SEO content at scale',
    ],
    limitations: [
      'No free plan',
      'Expensive for solo users',
      'Learning curve for full feature set',
    ],
    affiliate: {
      program: 'Impact',
      commission: '25% recurring (30% after 100 conversions)',
      cookieDuration: 30,
      signupUrl: 'https://www.jasper.ai/partners',
      isRecurring: true,
      recurringDuration: '12 months',
    },
    availableCountries: [
      'US',
      'GB',
      'CA',
      'AU',
      'IN',
      'SG',
      'IE',
      'NZ',
    ],
    popularIn: [
      { country: 'US', rank: 1 },
      { country: 'GB', rank: 2 },
      { country: 'CA', rank: 2 },
      { country: 'AU', rank: 3 },
    ],
    lastUpdated: '2026-06-24',
  },
  {
    slug: 'copy-ai',
    name: 'Copy.ai',
    category: 'ai-writing',
    description:
      'AI-powered writing platform with workflow automation, brand voice training, and 90+ writing tools for marketing teams.',
    tagline: 'Go-to-market AI platform',
    website: 'https://www.copy.ai',
    founded: 2020,
    headquarters: 'Memphis, TN',
    originCountry: 'US',
    pricing: [
      {
        name: 'Free',
        price: 0,
        billingCycle: 'monthly',
        features: ['2,000 words/month', '90+ tools', 'Chat'],
      },
      {
        name: 'Starter',
        price: 36,
        billingCycle: 'yearly',
        features: [
          'Unlimited words',
          '5 user seats',
          'Brand voice',
          'Chat by Copy.ai',
        ],
      },
      {
        name: 'Starter Monthly',
        price: 49,
        billingCycle: 'monthly',
        features: [
          'Unlimited words',
          '5 user seats',
          'Brand voice',
          'Chat by Copy.ai',
        ],
      },
    ],
    hasFreeplan: true,
    startingPrice: 0,
    currency: 'USD',
    features: [
      '90+ writing tools',
      'Workflow automation',
      'Brand voice',
      'Chat interface',
      'Infobase',
      'API access',
      'Team collaboration',
    ],
    bestFor: [
      'Small marketing teams',
      'Freelancers',
      'Social media managers',
      'Email marketers',
    ],
    limitations: [
      'Free plan is very limited (2,000 words)',
      'No SEO-specific features',
      'Workflow automation only on higher tiers',
    ],
    affiliate: {
      program: 'Direct',
      commission: '45% first year',
      cookieDuration: 60,
      signupUrl: 'https://www.copy.ai/affiliate',
      isRecurring: false,
      recurringDuration: '12 months',
    },
    availableCountries: [
      'US',
      'GB',
      'CA',
      'AU',
      'IN',
      'SG',
      'IE',
      'NZ',
    ],
    popularIn: [
      { country: 'US', rank: 2 },
      { country: 'IN', rank: 1 },
      { country: 'GB', rank: 3 },
    ],
    lastUpdated: '2026-06-24',
  },
  {
    slug: 'writesonic',
    name: 'Writesonic',
    category: 'ai-writing',
    description:
      'AI writing and SEO platform with Chatsonic AI chat, article generation, and brand voice features for content marketers.',
    tagline: 'AI search visibility platform',
    website: 'https://writesonic.com',
    founded: 2021,
    headquarters: 'San Francisco, CA',
    originCountry: 'US',
    pricing: [
      {
        name: 'Individual',
        price: 39,
        billingCycle: 'yearly',
        features: [
          'Chatsonic',
          'Article writer',
          'Brand voice',
          'SEO tools',
        ],
      },
      {
        name: 'Standard',
        price: 99,
        billingCycle: 'monthly',
        features: [
          'Everything in Individual',
          'More words',
          'Priority support',
        ],
      },
    ],
    hasFreeplan: true,
    startingPrice: 0,
    currency: 'USD',
    features: [
      'Chatsonic (AI chat)',
      'Article writer 6.0',
      'Brand voice',
      'SEO checker',
      'Paraphrasing tool',
      'AI image generation',
      '100+ templates',
    ],
    bestFor: [
      'SEO content writers',
      'Bloggers',
      'Marketing agencies',
      'Budget-conscious teams',
    ],
    limitations: [
      'Word limits on lower tiers',
      'Quality varies by template',
      'UI can be overwhelming',
    ],
    affiliate: {
      program: 'Direct',
      commission: '30% lifetime recurring (up to 40%)',
      cookieDuration: 30,
      signupUrl: 'https://writesonic.com/affiliate',
      isRecurring: true,
      recurringDuration: 'lifetime',
    },
    availableCountries: [
      'US',
      'GB',
      'CA',
      'AU',
      'IN',
      'SG',
      'IE',
      'NZ',
    ],
    popularIn: [
      { country: 'IN', rank: 2 },
      { country: 'US', rank: 4 },
      { country: 'SG', rank: 2 },
    ],
    lastUpdated: '2026-06-24',
  },
  {
    slug: 'rytr',
    name: 'Rytr',
    category: 'ai-writing',
    description:
      'Affordable AI writing assistant with 40+ use cases, tone matching, and plagiarism checking. Best value for solo creators.',
    tagline: 'AI writing assistant that costs a fraction',
    website: 'https://rytr.me',
    founded: 2021,
    headquarters: 'New Delhi',
    originCountry: 'IN',
    pricing: [
      {
        name: 'Free',
        price: 0,
        billingCycle: 'monthly',
        features: ['10,000 characters/month', '40+ use cases'],
      },
      {
        name: 'Unlimited',
        price: 7.5,
        billingCycle: 'yearly',
        features: ['Unlimited characters', '40+ use cases', '20+ tones'],
      },
      {
        name: 'Premium',
        price: 24.16,
        billingCycle: 'yearly',
        features: [
          'Everything in Unlimited',
          '35+ languages',
          'Custom use cases',
          'Plagiarism checks',
          'Priority support',
        ],
      },
    ],
    hasFreeplan: true,
    startingPrice: 0,
    currency: 'USD',
    features: [
      '40+ use cases',
      '20+ tones',
      '35+ languages',
      'Plagiarism checker',
      'SEO analyzer',
      'Chrome extension',
      'Custom use cases',
    ],
    bestFor: [
      'Solo creators',
      'Students',
      'Budget-conscious writers',
      'Non-English content',
    ],
    limitations: [
      'Less sophisticated than Jasper',
      'No team features on basic plans',
      'Limited brand voice training',
    ],
    affiliate: {
      program: 'Direct',
      commission: '30% recurring',
      cookieDuration: 30,
      signupUrl: 'https://rytr.me/affiliate',
      isRecurring: true,
      recurringDuration: 'lifetime',
    },
    availableCountries: [
      'US',
      'GB',
      'CA',
      'AU',
      'IN',
      'SG',
      'IE',
      'NZ',
    ],
    popularIn: [
      { country: 'IN', rank: 1, localAlternative: 'rytr' },
      { country: 'SG', rank: 3 },
      { country: 'NZ', rank: 2 },
    ],
    lastUpdated: '2026-06-24',
  },
  {
    slug: 'hix-ai',
    name: 'HIX.AI',
    category: 'ai-writing',
    description:
      'All-in-one AI writing copilot with 120+ tools, long-form editor, email writer, and browser extension at competitive pricing.',
    tagline: 'Your most powerful all-in-one AI writing copilot',
    website: 'https://hix.ai',
    founded: 2023,
    headquarters: 'Hong Kong',
    originCountry: 'HK',
    pricing: [
      {
        name: 'Free',
        price: 0,
        billingCycle: 'monthly',
        features: ['1,000 words/week', 'Basic tools'],
      },
      {
        name: 'Basic',
        price: 19.99,
        billingCycle: 'monthly',
        features: [
          'Unlimited GPT-3.5 words',
          '120+ tools',
          'HIX Editor',
          'Email writer',
        ],
      },
      {
        name: 'Pro',
        price: 49.99,
        billingCycle: 'monthly',
        features: [
          'GPT-4 access',
          'Long-form editor',
          'All features',
          'Priority support',
        ],
      },
    ],
    hasFreeplan: true,
    startingPrice: 0,
    currency: 'USD',
    features: [
      '120+ AI writing tools',
      'HIX Editor (long-form)',
      'Email writer',
      'Grammar checker',
      'Content rewriter',
      'Browser extension',
      'AI detection bypass',
    ],
    bestFor: [
      'Content creators',
      'Email marketers',
      'Students',
      'Budget users who want GPT-4 access',
    ],
    limitations: [
      'Newer brand, less established',
      'AI detection bypass is ethically questionable',
      'GPT-4 only on higher tiers',
    ],
    affiliate: {
      program: 'Direct',
      commission: '30% recurring',
      cookieDuration: 30,
      signupUrl: 'https://hix.ai/affiliate',
      isRecurring: true,
      recurringDuration: '12 months',
    },
    availableCountries: [
      'US',
      'GB',
      'CA',
      'AU',
      'IN',
      'SG',
      'IE',
      'NZ',
    ],
    popularIn: [
      { country: 'IN', rank: 3 },
      { country: 'SG', rank: 1 },
      { country: 'AU', rank: 4 },
    ],
    lastUpdated: '2026-06-24',
  },

  // ===== AI Image Generation Tools =====
  // TODO: Phase 2 — add Midjourney, DALL-E 3, Stable Diffusion, Leonardo.ai, Ideogram

  // ===== AI Coding Tools =====
  // TODO: Phase 2 — add GitHub Copilot, Cursor, Cody, Tabnine, Replit AI
];

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}

export function getToolsByCategory(
  category: string
): Tool[] {
  return tools.filter((t) => t.category === category);
}

export function getAllCategories(): string[] {
  return [...new Set(tools.map((t) => t.category))];
}
