import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://thestraightcut.net';

const escapeXml = (value) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const entries = await readdir(ROOT, { withFileTypes: true });
const htmlFiles = entries
  .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === '.html')
  .map((entry) => entry.name)
  .sort();

const urls = [];

for (const file of htmlFiles) {
  const html = await readFile(join(ROOT, file), 'utf8');

  const robotsNoindex = /<meta\s+[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)
    || /<meta\s+[^>]*content=["'][^"']*noindex[^"']*["'][^>]*name=["']robots["']/i.test(html);
  if (robotsNoindex || /^(404|500)\.html$/i.test(file)) continue;

  let loc = file.toLowerCase() === 'index.html' ? `${SITE}/` : `${SITE}/${file}`;
  const canonical = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)?.[1]
    ?? html.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i)?.[1];

  if (canonical) {
    try {
      const resolved = new URL(canonical, `${SITE}/`);
      if (!['thestraightcut.net', 'www.thestraightcut.net'].includes(resolved.hostname)) continue;
      resolved.protocol = 'https:';
      resolved.hostname = 'thestraightcut.net';
      resolved.hash = '';
      resolved.search = '';
      loc = resolved.toString();
    } catch {
      // Keep the file-based URL if a malformed canonical is encountered.
    }
  }

  let lastmod = '';
  try {
    lastmod = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
  } catch {
    lastmod = '';
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) {
    lastmod = new Date().toISOString().slice(0, 10);
  }

  urls.push({ loc, lastmod });
}

const unique = [...new Map(urls.map((item) => [item.loc, item])).values()]
  .sort((a, b) => a.loc.localeCompare(b.loc));

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...unique.map(({ loc, lastmod }) => `  <url><loc>${escapeXml(loc)}</loc><lastmod>${lastmod}</lastmod></url>`),
  '</urlset>',
  '',
].join('\n');

await writeFile(join(ROOT, 'sitemap.xml'), xml, 'utf8');
console.log(`Generated sitemap.xml with ${unique.length} indexable URLs.`);
