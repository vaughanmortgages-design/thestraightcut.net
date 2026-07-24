import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const vault = JSON.parse(await readFile(join(ROOT, 'data', 'affiliate-links.json'), 'utf8'));
const AMAZON_TAG = vault.amazon.tag;
const EBAY_CAMPAIGN = vault.ebay.campaign;

const ebayPages = new Set([
  'auctions-collectibles.html',
  'auctions-collectibles-collections.html',
  'refurbished-beauties.html',
  'refurbished-beauties-collections.html',
  'books-media.html',
  'books-media-collections.html',
  'ebay.html',
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

const marketplaceUrl = (file, query) => ebayPages.has(file) ? ebayUrl(query) : amazonUrl(query);
const files = (await readdir(ROOT)).filter((name) => name.endsWith('.html'));
let changedFiles = 0;
let activatedLinks = 0;

for (const file of files) {
  const path = join(ROOT, file);
  const original = await readFile(path, 'utf8');
  let html = original;

  html = html.replace(/<a\b([^>]*?)href=(['"])(.*?)\2([^>]*?)aria-label=(['"])(Browse the collection|Read the buying notes|Start browsing|Shop the collection):\s*([^'"]+)\5([^>]*)>/gi,
    (match, before, quote, href, middle, labelQuote, action, rawTitle, after) => {
      const title = clean(rawTitle);
      const url = marketplaceUrl(file, title);
      activatedLinks += 1;
      return `<a${before}href="${url}"${middle}aria-label=${labelQuote}${action}: ${rawTitle}${labelQuote}${after} target="_blank" rel="sponsored nofollow noopener">`;
    });

  html = html.replace(/<a\b([^>]*?)class=(['"])(button gold)\2([^>]*?)href=(['"])(\/[^'"]+-collections\.html)\5([^>]*)>(Browse the Collection|Shop the Collection|Start Browsing)<\/a>/gi,
    (match, before, classQuote, className, middle, hrefQuote, href, after) => {
      const pageTitle = clean((html.match(/<title>(.*?)\|/i) || [,'The Straight Cut'])[1]);
      const useEbay = ebayPages.has(file);
      const url = marketplaceUrl(file, pageTitle);
      activatedLinks += 1;
      return `<a${before}class=${classQuote}${className}${classQuote}${middle}href="${url}"${after} target="_blank" rel="sponsored nofollow noopener">Shop ${useEbay ? 'on eBay' : 'on Amazon'} →</a>`;
    });

  html = html.replace(/<a\b([^>]*?)href=(['"])([^'"]*)\2([^>]*)>(Browse the Collection|Read Buying Notes|Start Browsing|Shop the Collection)<\/a>/gi,
    (match, before, quote, href, after, label) => {
      const nearby = clean((html.match(/<h1>(.*?)<\/h1>/i) || html.match(/<title>(.*?)\|/i) || [,'The Straight Cut'])[1]);
      const useEbay = ebayPages.has(file);
      const url = marketplaceUrl(file, nearby || label);
      activatedLinks += 1;
      return `<a${before}href="${url}"${after} target="_blank" rel="sponsored nofollow noopener">Shop ${useEbay ? 'on eBay' : 'on Amazon'} →</a>`;
    });

  if (file === 'his-hers.html' && vault.activeAwinOffer && !html.includes(vault.activeAwinOffer)) {
    const card = `<a class="partner-card" href="${vault.activeAwinOffer}" target="_blank" rel="sponsored nofollow noopener" aria-label="Explore 1st Class Cigar Humidors"><span class="card-kicker">Featured partner · 1st Class Cigar Humidors</span><h3>Premium cigar storage</h3><p>Explore approved humidors and cigar storage through 1st Class Cigar Humidors.</p><span class="card-action">Explore Humidors <span aria-hidden="true">↗</span></span></a>`;
    html = html.replace('<div class="partner-grid">', `<div class="partner-grid">${card}`);
    activatedLinks += 1;
  }

  if (html !== original) {
    await writeFile(path, html, 'utf8');
    changedFiles += 1;
  }
}

console.log(`Activated ${activatedLinks} affiliate shopping links across ${changedFiles} HTML files.`);
