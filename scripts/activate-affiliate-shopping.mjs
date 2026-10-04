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

const dhgateUrl = 'https://www.linkusee.com/cHU6sJ5m';
const dhgateNav = '<a href="dhgate.html">DHgate</a>';
const dhgateSection = '<section id="dhgate" class="section warm"><div class="section-heading"><span class="section-kicker">DHgate</span><h2>DHgate marketplace listings.</h2><p>Review the seller, delivery costs and return terms before buying.</p></div><a class="feature-tile" href="dhgate.html" style="--tile:url(https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=78)"><span>DHgate</span><p>View our linked listing and the checks to make before checkout.</p><b>View DHgate listing →</b></a></section>';
const homepagePath = join(ROOT, 'index.html');
let homepageHtml = await readFile(homepagePath, 'utf8');
if (!homepageHtml.includes('href="dhgate.html"')) {
  const marker = '<section class="section warm"><div class="section-heading"><span class="section-kicker">Shop by retailer</span>';
  if (!homepageHtml.includes(marker)) throw new Error('Homepage retailer section missing');
  homepageHtml = homepageHtml.replace('</main>', dhgateSection + '</main>');
}
homepageHtml = homepageHtml.replace('Amazon · eBay · Temu · Benable · Canada', 'Amazon · eBay · Temu · Benable · DHgate · Canada');
await writeFile(homepagePath, homepageHtml, 'utf8');
for (const file of files) {
  const path = join(ROOT, file);
  let html = await readFile(path, 'utf8');
  html = html.replace(/(<nav id="site-nav"[^>]*>)([\s\S]*?)(<\/nav>)/, (all, open, links, close) =>
    links.includes('href="dhgate.html"') ? all : open + links + dhgateNav + close);
  await writeFile(path, html, 'utf8');
}
const dhgatePage = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0c0c0d"><title>DHgate | The Straight Cut</title><meta name="description" content="View The Straight Cut's linked DHgate marketplace listing, affiliate disclosure and buying checks."><link rel="canonical" href="https://thestraightcut.net/dhgate.html"><link rel="stylesheet" href="assets/store.css"></head><body><a class="skip-link" href="#main">Skip to content</a><header class="store-header"><div class="utility-bar"><span>Independent shopping guidance for Canada</span><a href="affiliate-disclosure.html">How we earn</a></div><div class="nav-shell"><a class="wordmark" href="/">THE STRAIGHT <em>CUT</em></a><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button><nav id="site-nav" class="store-nav"><a href="shop-picks.html">Top Picks</a><a href="amazon.html">Amazon</a><a href="ebay.html">eBay</a><a href="temu.html">Temu</a><a href="benable.html">Benable</a><a href="dhgate.html" aria-current="page">DHgate</a></nav></div></header><main id="main"><section class="section ink"><div class="section-heading"><span class="section-kicker">DHgate marketplace</span><h1>DHgate on The Straight Cut.</h1><p>Review the listing and seller details before deciding to buy. Final price, shipping, availability and returns are shown by the marketplace.</p></div><aside class="affiliate-note"><strong>Affiliate disclosure:</strong> The Straight Cut may earn a commission from qualifying purchases through the link below.</aside></section><section class="section warm"><div class="section-heading"><span class="section-kicker">Linked seller listing</span><h2>Pikachu Illustrator card listing</h2><p>The seller describes this as a 1998 Japanese Pokémon Illustrator card graded PSA 10. <strong>The Straight Cut has not verified the card's authenticity, age or PSA grading.</strong></p><p>Before purchasing, request the certification number and confirm it with PSA, compare the actual item with its certification record, and review seller history, shipping and refund terms. A certification number alone does not authenticate the item offered.</p></div><a class="button dark" href="${dhgateUrl}" target="_blank" rel="sponsored nofollow noopener">VIEW SELLER LISTING ↗</a><p>This link opens the seller listing. It is not an endorsement of the seller's authenticity or grading claims.</p></section><section class="section light"><div class="section-heading"><h2>Keep browsing.</h2></div><div class="hero-actions"><a class="button dark" href="shop-picks.html">Top picks</a><a class="button dark" href="benable.html">Benable lists</a></div></section></main><footer class="store-footer"><a class="wordmark" href="/">THE STRAIGHT <em>CUT</em></a><p><a href="affiliate-disclosure.html">Affiliate disclosure</a></p><p>© 2026 The Straight Cut</p></footer><script src="assets/store.js"></script></body></html>`;
await writeFile(join(ROOT, 'dhgate.html'), dhgatePage, 'utf8');
console.log('Added DHgate page, homepage entry and navigation links.');
