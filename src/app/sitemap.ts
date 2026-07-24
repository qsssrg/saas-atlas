import type { MetadataRoute } from 'next';
import { tools } from '@/data/tools';
import { countries } from '@/data/countries';
import { categories } from '@/data/categories';
import { getAllPosts } from '@/lib/blog';

const BASE_URL = 'https://www.saas-atlas.uk';

// Fixed content-update dates for static/editorial pages. Bump these only when
// the page's actual content changes — never use new Date(), or every deploy
// marks every page as freshly updated and dilutes the crawl signal.
const HOME_UPDATED = '2026-07-13';
const ABOUT_UPDATED = '2026-07-13';
const FINDER_UPDATED = '2026-07-24';

/** Pick the newest lastUpdated among a set of tools; fall back to a base date. */
function newestUpdate(subset: typeof tools, fallback: string): Date {
  const iso = subset.reduce<string>(
    (acc, t) => (t.lastUpdated > acc ? t.lastUpdated : acc),
    fallback,
  );
  return new Date(iso);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Home — reflects the latest tool data so a genuine data refresh shows.
  entries.push({
    url: BASE_URL,
    lastModified: newestUpdate(tools, HOME_UPDATED),
    changeFrequency: 'weekly',
    priority: 1,
  });

  // About — editorial page, fixed date bumped on real edits only.
  entries.push({
    url: `${BASE_URL}/about`,
    lastModified: new Date(ABOUT_UPDATED),
    changeFrequency: 'monthly',
    priority: 0.7,
  });

  // Finder — interactive tool-recommendation quiz.
  entries.push({
    url: `${BASE_URL}/finder`,
    lastModified: new Date(FINDER_UPDATED),
    changeFrequency: 'monthly',
    priority: 0.8,
  });

  // Blog — index + each post.
  const posts = getAllPosts();
  entries.push({
    url: `${BASE_URL}/blog`,
    lastModified: posts.length ? new Date(posts[0].date) : new Date(FINDER_UPDATED),
    changeFrequency: 'weekly',
    priority: 0.7,
  });
  for (const post of posts) {
    entries.push({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  // Category pages — newest tool in that category.
  for (const cat of categories) {
    const catTools = tools.filter((t) => t.category === cat.slug);
    entries.push({
      url: `${BASE_URL}/categories/${cat.slug}`,
      lastModified: newestUpdate(catTools, HOME_UPDATED),
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  }

  // Country pages — newest tool available in that country.
  for (const country of countries) {
    const code = country.code.toLowerCase();
    const countryTools = tools.filter((t) =>
      t.availableCountries.some((c) => c.toLowerCase() === code),
    );
    entries.push({
      url: `${BASE_URL}/countries/${code}`,
      lastModified: newestUpdate(countryTools, HOME_UPDATED),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  // Category × Country pages — the cross-country pSEO grid. Emitted only for
  // combinations where at least one tool in the category is available in the
  // country (mirrors the route's generateStaticParams).
  for (const cat of categories) {
    const catTools = tools.filter((t) => t.category === cat.slug);
    for (const country of countries) {
      const code = country.code.toLowerCase();
      const available = catTools.filter((t) =>
        t.availableCountries.some((c) => c.toLowerCase() === code),
      );
      if (available.length === 0) continue;
      entries.push({
        url: `${BASE_URL}/categories/${cat.slug}/${code}`,
        lastModified: newestUpdate(available, HOME_UPDATED),
        changeFrequency: 'weekly',
        priority: 0.75,
      });
    }
  }

  // Tool pages
  for (const tool of tools) {
    const toolDate = new Date(tool.lastUpdated);

    entries.push({
      url: `${BASE_URL}/tools/${tool.slug}`,
      lastModified: toolDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    });

    // Tool × Country pages
    for (const countryCode of tool.availableCountries) {
      entries.push({
        url: `${BASE_URL}/tools/${tool.slug}/${countryCode.toLowerCase()}`,
        lastModified: toolDate,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  // Comparison pages — newest of the two tools compared.
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
          lastModified: newestUpdate([ct[i], ct[j]], HOME_UPDATED),
          changeFrequency: 'monthly',
          priority: 0.8,
        });
      }
    }
  }

  return entries;
}
