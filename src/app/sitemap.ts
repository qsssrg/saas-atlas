import type { MetadataRoute } from 'next';
import { tools } from '@/data/tools';
import { countries } from '@/data/countries';
import { categories } from '@/data/categories';

const BASE_URL = 'https://saas-atlas.uk';

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Home
  entries.push({
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1,
  });

  // About
  entries.push({
    url: `${BASE_URL}/about`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  });

  // Category pages
  for (const cat of categories) {
    entries.push({
      url: `${BASE_URL}/categories/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  }

  // Country pages
  for (const country of countries) {
    entries.push({
      url: `${BASE_URL}/countries/${country.code.toLowerCase()}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  // Tool pages
  for (const tool of tools) {
    entries.push({
      url: `${BASE_URL}/tools/${tool.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    });

    // Tool × Country pages
    for (const countryCode of tool.availableCountries) {
      entries.push({
        url: `${BASE_URL}/tools/${tool.slug}/${countryCode.toLowerCase()}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  // Comparison pages
  const catTools: Record<string, typeof tools> = {};
  for (const tool of tools) {
    if (!catTools[tool.category]) catTools[tool.category] = [];
    catTools[tool.category].push(tool);
  }
  for (const cat of Object.keys(catTools)) {
    const ct = catTools[cat];
    for (let i = 0; i < ct.length; i++) {
      for (let j = i + 1; j < ct.length; j++) {
        entries.push({
          url: `${BASE_URL}/compare/${ct[i].slug}-vs-${ct[j].slug}`,
          lastModified: new Date(),
          changeFrequency: 'monthly',
          priority: 0.8,
        });
      }
    }
  }

  return entries;
}
