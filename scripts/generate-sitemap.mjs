// The Straight Cut — sitemap.xml generator
// -----------------------------------------------------------------------------
// Mirrors build-departments.mjs: reads the same DEPARTMENTS/REGISTRY data so the
// sitemap always matches what's actually being written to the repo root, with
// zero manual upkeep as departments are added or removed.
//
//   node scripts/generate-sitemap.mjs
//
// Output: sitemap.xml written to the repo root, alongside the generated .html
// department pages. Wire this into the same Netlify build step that runs
// build-departments.mjs so it regenerates on every deploy.
// -----------------------------------------------------------------------------

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { DEPARTMENTS, REGISTRY } from './departments.data.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://thestraightcut.net';
const today = new Date().toISOString().slice(0, 10);

const STATIC_PAGES = [
  { loc: '/', priority: '1.0' },
  { loc: '/departments.html', priority: '0.9' },
  { loc: '/travel.html', priority: '0.7' },
  { loc: '/gifts.html', priority: '0.7' },
  { loc: '/amazon.html', priority: '0.7' },
  { loc: '/ebay.html', priority: '0.7' },
  { loc: '/digital-downloads.html', priority: '0.6' },
  { loc: '/latest-deals.html', priority: '0.95' },
  { loc: '/affiliate-disclosure.html', priority: '0.3' },
  { loc: '/privacy-policy.html', priority: '0.3' },
  { loc: '/terms-of-use.html', priority: '0.3' },
];

const departmentUrls = DEPARTMENTS.map((d) => ({
  loc: `/${d.slug}.html`,
  priority: '0.8',
}));

const seen = new Set();
const allUrls = [...STATIC_PAGES, ...departmentUrls].filter((u) => {
  if (seen.has(u.loc)) return false;
  seen.add(u.loc);
  return true;
});

const urlEntries = allUrls
  .map(
    (u) =>
      `  <url><loc>${SITE}${u.loc}</loc><lastmod>${today}</lastmod><priority>${u.priority}</priority></url>`
  )
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>\n`;

await writeFile(join(ROOT, 'sitemap.xml'), xml, 'utf8');

console.log(`Generated sitemap.xml with ${allUrls.length} URLs`);
