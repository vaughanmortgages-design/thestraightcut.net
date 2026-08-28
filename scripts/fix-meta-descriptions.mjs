import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIN_LEN = 120;
const MAX_LEN = 160;

const decodeBasic = (value = '') => value
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const encodeAttr = (value = '') => value
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;');

const stripTags = (value = '') => decodeBasic(value.replace(/<[^>]*>/g, ' '));

const tailFor = (file, title) => {
  const haystack = `${file} ${title}`.toLowerCase();
  if (/travel|vacation|hotel|getaway|flight|trip/.test(haystack)) {
    return 'Compare stays, trip-planning details and practical travel options before you book.';
  }
  if (/book|little.?lamb|kids|children|toy/.test(haystack)) {
    return 'Explore family-friendly picks, useful comparisons and straightforward guidance before you buy.';
  }
  if (/guide|buying|how-to|checklist/.test(haystack)) {
    return 'Get practical comparisons, key buying checks and straightforward advice before you spend.';
  }
  if (/collection|department|category/.test(haystack)) {
    return 'Browse curated categories, practical comparisons and useful picks designed to reduce guesswork.';
  }
  if (/deal|clearance|hot-find|refurb|sale|discount/.test(haystack)) {
    return 'Browse curated finds, compare value and check current offers before you decide what to buy.';
  }
  if (/affiliate|partner/.test(haystack)) {
    return 'Explore approved partners, practical comparisons and clear disclosures before you click or buy.';
  }
  if (/bullion|gold|silver|loan|finance|credit/.test(haystack)) {
    return 'Compare resources, partner options and key considerations before choosing a provider or product.';
  }
  return 'Browse practical buying guidance, curated picks and straightforward comparisons from The Straight Cut.';
};

const makeDescription = ({ current, title, h1, file }) => {
  let base = decodeBasic(current);
  const cleanTitle = decodeBasic(title).replace(/\s*\|\s*The Straight Cut\s*$/i, '').trim();
  const cleanH1 = stripTags(h1);

  if (!base) {
    const subject = cleanTitle || cleanH1 || file.replace(/\.html$/i, '').replace(/[-_]+/g, ' ');
    base = `${subject} at The Straight Cut.`;
  }

  if (base.length < MIN_LEN) {
    const tail = tailFor(file, cleanTitle || cleanH1);
    base = `${base.replace(/[.!?]?$/, '.')} ${tail}`.replace(/\s+/g, ' ').trim();
  }

  if (base.length > MAX_LEN) {
    const clipped = base.slice(0, MAX_LEN + 1);
    const boundary = Math.max(clipped.lastIndexOf('. '), clipped.lastIndexOf('; '), clipped.lastIndexOf(', '), clipped.lastIndexOf(' '));
    base = clipped.slice(0, boundary > MIN_LEN ? boundary : MAX_LEN).replace(/[\s,;:-]+$/, '').trim();
    if (!/[.!?]$/.test(base)) base += '.';
  }

  return base;
};

const entries = await readdir(ROOT, { withFileTypes: true });
const htmlFiles = entries
  .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === '.html')
  .map((entry) => entry.name)
  .sort();

const report = [];

for (const file of htmlFiles) {
  const path = join(ROOT, file);
  let html = await readFile(path, 'utf8');

  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '';
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '';
  const metaMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']\s*\/?\s*>/i)
    ?? html.match(/<meta\s+content=["']([\s\S]*?)["']\s+name=["']description["']\s*\/?\s*>/i);
  const current = metaMatch?.[1] ?? '';
  const currentDecoded = decodeBasic(current);

  if (currentDecoded.length >= MIN_LEN) continue;

  const next = makeDescription({ current, title, h1, file });
  const encoded = encodeAttr(next);

  if (metaMatch) {
    html = html.replace(metaMatch[0], `<meta name="description" content="${encoded}">`);
  } else {
    const headPos = html.search(/<\/title>/i);
    if (headPos >= 0) {
      html = html.replace(/<\/title>/i, `</title><meta name="description" content="${encoded}">`);
    } else {
      report.push({ file, status: 'skipped-no-title' });
      continue;
    }
  }

  const ogRegexA = /<meta\s+property=["']og:description["']\s+content=["']([\s\S]*?)["']\s*\/?\s*>/i;
  const ogRegexB = /<meta\s+content=["']([\s\S]*?)["']\s+property=["']og:description["']\s*\/?\s*>/i;
  const ogMatch = html.match(ogRegexA) ?? html.match(ogRegexB);
  if (ogMatch) html = html.replace(ogMatch[0], `<meta property="og:description" content="${encoded}">`);

  const twitterRegexA = /<meta\s+name=["']twitter:description["']\s+content=["']([\s\S]*?)["']\s*\/?\s*>/i;
  const twitterRegexB = /<meta\s+content=["']([\s\S]*?)["']\s+name=["']twitter:description["']\s*\/?\s*>/i;
  const twitterMatch = html.match(twitterRegexA) ?? html.match(twitterRegexB);
  if (twitterMatch) html = html.replace(twitterMatch[0], `<meta name="twitter:description" content="${encoded}">`);

  await writeFile(path, html, 'utf8');
  report.push({ file, before: currentDecoded.length, after: next.length, description: next });
}

console.log(`Scanned ${htmlFiles.length} top-level HTML files.`);
console.log(`Updated ${report.filter((row) => row.after).length} short or missing meta descriptions.`);
for (const row of report) console.log(JSON.stringify(row));
