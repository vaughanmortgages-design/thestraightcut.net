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

const GENERATED_MARKERS = [
  'Get practical comparisons, key buying checks',
  'Browse curated categories, practical comparisons',
  'Compare stays, trip-planning details',
  'Explore family-friendly picks, useful comparisons',
  'Browse practical buying guidance, curated picks',
  'Browse curated finds, compare value',
  'Explore approved partners, practical comparisons',
  'Compare resources, partner options',
];

const cleanSubject = ({ title, h1, file }) => {
  let subject = decodeBasic(title)
    .replace(/\s*(?:\||—)\s*The Straight Cut\s*$/i, '')
    .trim();

  if (subject.includes(' | ')) subject = subject.split(' | ')[0].trim();
  if (!subject) subject = stripTags(h1);
  if (!subject) subject = file.replace(/\.html$/i, '').replace(/[-_]+/g, ' ');

  subject = subject
    .replace(/\s+/g, ' ')
    .replace(/\s+Buying Guide$/i, '')
    .trim();

  return subject;
};

const suffixFor = (file, subject) => {
  const haystack = `${file} ${subject}`.toLowerCase();

  if (/travel|vacation|hotel|getaway|flight|trip/.test(haystack)) {
    return 'stays, trip details and practical travel options from The Straight Cut to help you plan or book with more confidence.';
  }
  if (/book|little.?lamb|kids|children|toy/.test(haystack)) {
    return 'family-friendly picks, useful comparisons and practical guidance from The Straight Cut to help you choose what to buy.';
  }
  if (/guide|buying|how-to|checklist/.test(haystack)) {
    return 'practical buying checks, useful comparisons and clear guidance from The Straight Cut to help you decide before you buy.';
  }
  if (/collection|department|category/.test(haystack)) {
    return 'curated picks, practical comparisons and useful shopping guidance from The Straight Cut to help you choose with less guesswork.';
  }
  if (/deal|clearance|hot-find|refurb|sale|discount/.test(haystack)) {
    return 'curated finds, current value and practical shopping guidance from The Straight Cut to help you decide before you buy.';
  }
  if (/affiliate|partner/.test(haystack)) {
    return 'approved partner options, useful buying checks and clear affiliate disclosures from The Straight Cut before you click or buy.';
  }
  if (/bullion|gold|silver|loan|finance|credit/.test(haystack)) {
    return 'key considerations, partner options and practical information from The Straight Cut before you choose a provider or product.';
  }
  return 'curated picks, practical buying guidance and straightforward comparisons from The Straight Cut to help you choose with less guesswork.';
};

const fitSubject = (subject, suffix) => {
  const maxSubject = MAX_LEN - suffix.length - 2;
  if (subject.length <= maxSubject) return subject;

  const clipped = subject.slice(0, Math.max(1, maxSubject + 1));
  const boundary = clipped.lastIndexOf(' ');
  return (boundary > 8 ? clipped.slice(0, boundary) : clipped.slice(0, maxSubject)).replace(/[\s:;,.\-|—]+$/, '').trim();
};

const makeDescription = ({ title, h1, file }) => {
  if (file === 'affiliate-disclosure.html') {
    return 'The Straight Cut Affiliate Disclosure explains how affiliate links and partner commissions work, including Amazon, eBay, CJ, Awin and Gumroad.';
  }
  if (file === 'privacy-policy.html') {
    return 'The Straight Cut Privacy Policy explains how the site handles analytics, cookies, contact information and related data practices.';
  }
  if (file === 'terms-of-use.html') {
    return 'The Straight Cut Terms of Use cover site content, affiliate information, deal timing and the rules for using The Straight Cut services.';
  }

  const subject = cleanSubject({ title, h1, file });
  const suffix = suffixFor(file, subject);
  const fittedSubject = fitSubject(subject, suffix);
  return `${fittedSubject}: ${suffix}`;
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

  const generatedPreviously = GENERATED_MARKERS.some((marker) => currentDecoded.includes(marker));
  const needsRepair = !metaMatch || currentDecoded.length < MIN_LEN || generatedPreviously;
  if (!needsRepair) continue;

  const next = makeDescription({ title, h1, file });
  if (next.length < MIN_LEN || next.length > MAX_LEN || !/[.!?]$/.test(next)) {
    throw new Error(`Generated invalid description for ${file}: ${next.length} chars :: ${next}`);
  }

  const encoded = encodeAttr(next);

  if (metaMatch) {
    html = html.replace(metaMatch[0], `<meta name="description" content="${encoded}">`);
  } else if (/<\/title>/i.test(html)) {
    html = html.replace(/<\/title>/i, `</title><meta name="description" content="${encoded}">`);
  } else {
    report.push({ file, status: 'skipped-no-title' });
    continue;
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
console.log(`Updated ${report.filter((row) => row.after).length} short, missing or previously generated meta descriptions.`);
for (const row of report) console.log(JSON.stringify(row));
