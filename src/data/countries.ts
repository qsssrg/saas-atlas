import { Country } from '@/types';

export const countries: Country[] = [
  // Tier 1 — High CPC, High Purchasing Power
  {
    code: 'US',
    name: 'United States',
    tier: 1,
    region: 'North America',
    currency: 'USD',
    currencySymbol: '$',
    language: 'English',
    flag: '🇺🇸',
    saasMarketSize: '$150B',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    tier: 1,
    region: 'Europe',
    currency: 'GBP',
    currencySymbol: '£',
    language: 'English',
    flag: '🇬🇧',
    saasMarketSize: '$20B',
  },
  {
    code: 'CA',
    name: 'Canada',
    tier: 1,
    region: 'North America',
    currency: 'CAD',
    currencySymbol: 'C$',
    language: 'English',
    flag: '🇨🇦',
    saasMarketSize: '$12B',
  },
  {
    code: 'AU',
    name: 'Australia',
    tier: 1,
    region: 'Oceania',
    currency: 'AUD',
    currencySymbol: 'A$',
    language: 'English',
    flag: '🇦🇺',
    saasMarketSize: '$8B',
  },
  // Tier 2 — Growth Markets (Cross-Country Key)
  {
    code: 'IN',
    name: 'India',
    tier: 2,
    region: 'South Asia',
    currency: 'INR',
    currencySymbol: '₹',
    language: 'English',
    flag: '🇮🇳',
    saasMarketSize: '$15B',
  },
  {
    code: 'SG',
    name: 'Singapore',
    tier: 2,
    region: 'Southeast Asia',
    currency: 'SGD',
    currencySymbol: 'S$',
    language: 'English',
    flag: '🇸🇬',
    saasMarketSize: '$3B',
  },
  {
    code: 'IE',
    name: 'Ireland',
    tier: 2,
    region: 'Europe',
    currency: 'EUR',
    currencySymbol: '€',
    language: 'English',
    flag: '🇮🇪',
    saasMarketSize: '$5B',
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    tier: 2,
    region: 'Oceania',
    currency: 'NZD',
    currencySymbol: 'NZ$',
    language: 'English',
    flag: '🇳🇿',
    saasMarketSize: '$1.5B',
  },
];

export function getCountryByCode(code: string): Country | undefined {
  return countries.find((c) => c.code === code);
}

export function getTier1Countries(): Country[] {
  return countries.filter((c) => c.tier === 1);
}

export function getTier2Countries(): Country[] {
  return countries.filter((c) => c.tier === 2);
}
