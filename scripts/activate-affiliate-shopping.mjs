import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AMAZON_TAG = 'straightcutgu-20';
const EBAY_CAMPAIGN = '5339155090';

const ebayPages = new Set([
  'auctions-collectibles.html',
  'refurbished-beauties.html',
  'refurbished-beauties-collections.html',
  'books-media.html',
]);

const clean = (value = '') => value
  .replace(/&amp;/g, '&')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const amazonUrl = (query) => `https://www.amazon.ca/s?k=${encodeURIComponent(query)}&tag=${AMAZON_TAG}`;
const ebayUrl = (query) => {
  const destination = `https://www.ebay.ca/sch/i.html?_nkw=${encodeURIComponent(query)}`;
  return `https://rover.ebay.com/rover/1/706-53473-19255-0/1?campid=${EBAY_CAMPAIGN}&toolid=10001&customid=tsc&mpre=${encodeURIComponent(destination)}`;
};

const files = (await readdir(ROOT)).filter((name) => name.endsWith('.html'));
let changedFiles = 0;
let activatedLinks = 0;

for (const file of files) {
  const path = join(ROOT, file);
  const original = await readFile(path, 'utf8');
  let html = original;
  const useEbay = ebayPages.has(file);

  html = html.replace(/<a\b([^>]*?)href=(['"])(.*?)\2([^>]*?)aria-label=(['"])(Browse the collection|Read the buying notes):\s*([^'"]+)\5([^>]*)>/gi,
    (match, before, quote, href, middle, labelQuote, action, rawTitle, after) => {
      const title = clean(rawTitle);
      const url = useEbay ? ebayUrl(title) : amazonUrl(title);
      activatedLinks += 1;
      return `<a${before}href="${url}"${middle}aria-label=${labelQuote}${action}: ${rawTitle}${labelQuote}${after} target="_blank" rel="sponsored nofollow noopener">`;
    });

  html = html.replace(/<a\b([^>]*?)class=(['"])(button gold)\2([^>]*?)href=(['"])(\/[^'"]+-collections\.html)\5([^>]*)>(Browse the Collection|Shop the Collection)<\/a>/gi,
    (match, before, classQuote, className, middle, hrefQuote, href, after, label) => {
      const pageTitle = clean((html.match(/<title>(.*?)\|/i) || [,'The Straight Cut'])[1]);
      const url = useEbay ? ebayUrl(pageTitle) : amazonUrl(pageTitle);
      activatedLinks += 1;
      return `<a${before}class=${classQuote}${className}${classQuote}${middle}href="${url}"${after} target="_blank" rel="sponsored nofollow noopener">Shop ${useEbay ? 'on eBay' : 'on Amazon'} →</a>`;
    });

  if (html !== original) {
    await writeFile(path, html, 'utf8');
    changedFiles += 1;
  }
}

console.log(`Activated ${activatedLinks} affiliate shopping links across ${changedFiles} HTML files.`);
