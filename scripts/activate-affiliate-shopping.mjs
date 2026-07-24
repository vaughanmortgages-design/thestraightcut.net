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

const ebaySearchByFile = new Map([
  ['auctions-collectibles.html', 'vintage collectibles'],
  ['auctions-collectibles-collections.html', 'vintage collectibles'],
  ['refurbished-beauties.html', 'refurbished laptops'],
  ['refurbished-beauties-collections.html', 'refurbished electronics'],
  ['books-media.html', 'vintage books'],
  ['books-media-collections.html', 'collectible books'],
  ['ebay.html', 'ebay deals'],
]);

const partnerByFile = new Map([
  ['travel.html', vault.hotels],
  ['electronics.html', vault.rexing],
  ['auto.html', vault.rexing],
  ['health-beauty.html', vault.bathorium],
  ['books-media.html', vault.gumroad],
  ['tools.html', vault.wrapItStorage],
  ['garden.html', vault.wrapItStorage],
  ['home.html', vault.wrapItStorage],
  ['his-hers.html', vault.activeAwinOffer],
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
  const params = new URLSearchParams({
    _nkw: query,
    mkcid: '1',
    mkrid: '706-53473-19255-0',
    siteid: '2',
    campid: EBAY_CAMPAIGN,
    customid: '',
    toolid: '10001',
    mkevt: '1',
  });
  return `https://www.ebay.ca/sch/i.html?${params.toString()}`;
};

const marketplaceUrl = (file, query) => ebayPages.has(file) ? ebayUrl(query) : amazonUrl(query);
const files = (await readdir(ROOT)).filter((name) => name.endsWith('.html'));
let changedFiles = 0;
let activatedLinks = 0;

for (const file of files) {
  const path = join(ROOT, file);
  const original = await readFile(path, 'utf8');
  let html = original;
  const pageTitle = clean((html.match(/<title>([\s\S]*?)\|/i) || [,'The Straight Cut'])[1]);

  html = html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (anchor, attrs, inner) => {
    const visible = clean(inner);
    const aria = clean((attrs.match(/aria-label=(['"])(.*?)\1/i) || [,'',''])[2]);
    const signal = `${visible} ${aria}`.toLowerCase();
    const isEditorialCta = /(browse the collection|read buying notes|read the buying notes|start browsing|shop the collection|browse collection)/i.test(signal);
    if (!isEditorialCta) return anchor;

    const ariaTitle = aria.replace(/^(browse the collection|read buying notes|read the buying notes|start browsing|shop the collection)\s*:\s*/i, '').trim();
    const genericVisible = /^(browse the collection|read buying notes|read the buying notes|start browsing|shop the collection|browse collection)(\s*→)?$/i.test(visible);
    const fallbackTitle = ebaySearchByFile.get(file) || pageTitle;
    const title = ariaTitle || (!genericVisible ? visible : '') || fallbackTitle;
    const partner = partnerByFile.get(file);
    const url = partner || marketplaceUrl(file, title);
    const label = partner ? 'Visit Partner →' : `Shop ${ebayPages.has(file) ? 'on eBay' : 'on Amazon'} →`;

    let newAttrs = attrs
      .replace(/\s+href=(['"])[\s\S]*?\1/i, '')
      .replace(/\s+target=(['"])[\s\S]*?\1/gi, '')
      .replace(/\s+rel=(['"])[\s\S]*?\1/gi, '');
    newAttrs += ` href="${url}" target="_blank" rel="sponsored nofollow noopener"`;
    activatedLinks += 1;
    return `<a${newAttrs}>${label}</a>`;
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
