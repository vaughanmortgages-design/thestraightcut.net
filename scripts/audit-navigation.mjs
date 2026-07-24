import { readFile, readdir } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = (await readdir(ROOT)).filter((file) => file.endsWith('.html')).sort();
const pages = new Set(files);
const ids = new Map();
const failures = [];
let links = 0;
let ctas = 0;

for (const file of files) {
  const source = await readFile(join(ROOT, file), 'utf8');
  ids.set(file, new Set([...source.matchAll(/\bid=(["'])(.*?)\1/gi)].map((match) => match[2])));
}

for (const file of files) {
  const source = await readFile(join(ROOT, file), 'utf8');
  for (const match of source.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    links += 1;
    const attrs = match[1];
    const href = attrs.match(/\bhref=(["'])(.*?)\1/i)?.[2]?.trim() ?? '';
    const text = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const classes = attrs.match(/\bclass=(["'])(.*?)\1/i)?.[2] ?? '';
    const isCta = /\b(button|editorial-card|partner-card|feature-tile|department-tile|related-card|text-link|scroll-cue|nav-cta|m-cta|btn|cta|buy-btn)\b/i.test(classes);
    if (isCta) ctas += 1;

    if (!href || href === '#' || /^javascript:/i.test(href) || /sitestripe|epn-links-needed|approved-product|placeholder|link-required/i.test(href)) {
      failures.push(`${file}: dead or placeholder link "${text}" -> "${href}"`);
      continue;
    }
    if (/^(mailto:|tel:)/i.test(href)) continue;
    if (/^https?:/i.test(href)) {
      if (/amazon\.|amzn\.to|a\.co/i.test(href) && !/[?&]tag=straightcutgu-20(?:&|$)/i.test(href)) {
        failures.push(`${file}: untracked Amazon link "${text}" -> "${href}"`);
      }
      if (/ebay\./i.test(href) && !/[?&](campid|campaignid)=5339155090(?:&|$)/i.test(href)) {
        failures.push(`${file}: untracked eBay link "${text}" -> "${href}"`);
      }
      continue;
    }

    const [pathPart, fragment] = href.split('#');
    const rawTarget = pathPart === '' ? file : pathPart === '/' ? 'index.html' : basename(pathPart);
    const target = pages.has(rawTarget) ? rawTarget : `${rawTarget}.html`;
    if (!pages.has(target)) {
      failures.push(`${file}: missing internal page "${text}" -> "${href}"`);
      continue;
    }
    if (fragment && !ids.get(target)?.has(fragment)) {
      failures.push(`${file}: missing fragment "${text}" -> "${href}"`);
    }
    if (isCta && target === file && !fragment) {
      failures.push(`${file}: self-routing CTA "${text}" -> "${href}"`);
    }
    if (isCta && /read (the )?buying notes/i.test(text) && fragment) {
      failures.push(`${file}: buying-notes CTA still uses an anchor "${text}" -> "${href}"`);
    }
  }
}

console.log(JSON.stringify({ pages: files.length, links, ctas, failures: failures.length }, null, 2));
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
}
