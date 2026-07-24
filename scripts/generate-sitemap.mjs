import { readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://thestraightcut.net';
const today = new Date().toISOString().slice(0, 10);

const priority = (file) => {
  if (file === 'index.html') return '1.0';
  if (file === 'deals.html') return '0.95';
  if (file === 'departments.html') return '0.9';
  if (['affiliate-disclosure.html', 'privacy-policy.html', 'terms-of-use.html'].includes(file)) return '0.3';
  return '0.7';
};

const files = (await readdir(ROOT))
  .filter((file) => file.endsWith('.html'))
  .sort((a, b) => {
    if (a === 'index.html') return -1;
    if (b === 'index.html') return 1;
    return a.localeCompare(b);
  });

const entries = files.map((file) => {
  const loc = file === 'index.html' ? '/' : `/${file}`;
  return `  <url><loc>${SITE}${loc}</loc><lastmod>${today}</lastmod><priority>${priority(file)}</priority></url>`;
}).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
await writeFile(join(ROOT, 'sitemap.xml'), xml, 'utf8');
console.log(`Generated sitemap.xml with ${files.length} URLs`);
