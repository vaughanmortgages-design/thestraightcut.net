import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const ROUTES = {
  'amazon.html': 'deals.html',
  'ebay.html': 'auctions-collectibles.html',
  'amazon-vs-ebay-canada-best-place-to-buy.html': 'buying-guides.html',
  'books.html': 'books-media.html',
  'collectibles-worth-watching.html': 'auctions-collectibles.html',
  'computers.html': 'refurbished-beauties.html',
  'digital-downloads.html': 'books-media.html',
  'fashion.html': 'apparel.html',
  'furniture.html': 'home.html',
  'gaming.html': 'video-games.html',
  'gifts.html': 'his-hers.html',
  'kitchen-upgrades-that-get-used.html': 'home.html',
  'kitchen.html': 'home.html',
  'latest-deals.html': 'deals.html',
  'office.html': 'home.html',
  'phones-tablets.html': 'electronics.html',
  'privacy-policy.html': 'affiliate-disclosure.html',
  'terms-of-use.html': 'affiliate-disclosure.html',
  'toys-kids.html': 'kids.html',
  'tsc-store.html': 'departments.html',
  'watches-jewelry.html': 'his-hers.html',
};

const ROOT_ANCHORS = {
  '/#top-deals': 'deals.html',
  '/#categories': 'departments.html',
  '/#newsletter': 'index.html#newsletter',
  '/#about-site': 'affiliate-disclosure.html',
  '/#latest': 'hot-finds.html',
  '/#brands': 'affiliate-partners.html',
};

const MERCHANT_REPLACEMENTS = new Map([
  ['https://www.hotels.com/', 'https://www.dpbolvw.net/click-101746656-11131426'],
  ['https://www.vrbo.com/', 'https://www.anrdoezrs.net/click-101746656-13880505'],
  ['https://www.rexingusa.com/', 'https://www.tkqlhce.com/click-101746656-15019509'],
  ['https://wrapitstorage.com/', 'https://www.anrdoezrs.net/click-101746656-17279920'],
  ['https://www.amazon.ca/?tag=straightcutgu-20', 'amazon.html'],
  ['https://www.ebay.ca/', 'ebay.html'],
]);

const UNAPPROVED_PURCHASE_URLS = new Set([
  'https://www.tkqlhce.com/click-101746656-13756265',
  'https://straightcut.gumroad.com/l/mldboi',
]);

const CONTENT_REPLACEMENTS = new Map([
  ['<a class="btn btn-outline" href="index.html#newsletter">Join newsletter →</a>', '<a class="btn btn-outline" href="deals.html">Browse deals →</a>'],
  ['1-year NordVPN plan. $5.00/mo.', 'NordVPN partner offer pending approval.'],
  ['Private. Encrypted. Everywhere.', 'Approved destination required.'],
  ['<span class="badge badge-new">Deal</span>', '<span class="badge badge-new">Coming Soon</span>'],
  ["Secure your connection and protect your privacy. World's leading VPN — 58% off, just $5.00/mo on the 1-year plan.", 'An approved NordVPN affiliate destination is not currently available in the Affiliate Link Vault.'],
  ['<div class="price">$5 <span>/mo</span></div>', '<div class="price">Coming Soon</div>'],
]);

const files = (await readdir(ROOT)).filter((file) => file.endsWith('.html'));
const existingPages = new Set(files);
let repaired = 0;
let editorialFound = 0;
let editorialRepaired = 0;

for (const file of files) {
  const path = join(ROOT, file);
  const original = await readFile(path, 'utf8');
  let source = original;
  for (const [direct, approved] of MERCHANT_REPLACEMENTS) {
    const occurrences = source.split(direct).length - 1;
    if (!occurrences) continue;
    source = source.replaceAll(direct, approved);
    repaired += occurrences;
  }
  for (const [current, replacement] of CONTENT_REPLACEMENTS) {
    source = source.replaceAll(current, replacement);
  }
  const fallback = ROUTES[file] || 'departments.html';
  const routedEditorial = source.replace(/<a\b[^>]*\bhref=(["'])(.*?)\1[^>]*>[\s\S]*?<\/a>/gi, (anchor, quote, href) => {
    const text = anchor.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    const isStart = text.includes('start browsing');
    const isGuide = text.includes('read the guide');
    const isCollection = text.includes('browse the collection');
    const isNotes = text.includes('read the buying notes');
    const isKeepBrowsing = text.includes('keep browsing');
    if (!isStart && !isGuide && !isCollection && !isNotes && !isKeepBrowsing) return anchor;

    editorialFound += 1;
    let destination = isStart && (!href || href === '#')
      ? '/departments.html'
      : isGuide && (!href || href === '#')
        ? '/buying-guides.html'
        : isKeepBrowsing && (!href || href === '#')
          ? '/departments.html'
          : href;
    const page = destination.replace(/^\//, '').split(/[?#]/)[0];
    if (!existingPages.has(page)) destination = `/${fallback}`;
    else destination = `/${destination.replace(/^\//, '')}`;

    if (destination === href) return anchor;
    editorialRepaired += 1;
    repaired += 1;
    return anchor.replace(/\bhref=(["']).*?\1/i, `href="${destination}"`);
  });
  const withoutUntrackedPurchases = routedEditorial.replace(/<a\b[^>]*\bhref=(["'])(.*?)\1[^>]*>[\s\S]*?<\/a>/gi, (anchor, quote, href) => {
    const text = anchor.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const marketplaceIntent = /\b(shop(?: on)?|buy(?: on)?|view|see|check|browse|explore)\b[\s\S]{0,55}\b(amazon|ebay)\b|\b(amazon|ebay)\b[\s\S]{0,55}\b(listing|finds|picks|deal)\b/i.test(text);
    const approvedAmazon = /^https:\/\/(?:www\.)?(?:amazon\.|amzn\.to|a\.co)/i.test(href) &&
      /[?&]tag=straightcutgu-20(?:&|$)/i.test(href);
    const approvedEbay = /^https:\/\/(?:www\.)?ebay\./i.test(href) &&
      /[?&](?:campid|campaignid)=5339155090(?:&|$)/i.test(href);
    if (marketplaceIntent && !approvedAmazon && !approvedEbay) {
      repaired += 1;
      const opening = anchor.match(/^<a\b[^>]*>/i)?.[0] || '<a>';
      const replacement = /\b(btn|button|card-action|nav-cta|m-cta)\b/i.test(opening)
        ? 'Coming Soon'
        : 'Marketplace listing coming soon';
      return opening
        .replace(/^<a\b/i, '<span')
        .replace(/\s+href=(["']).*?\1/i, '')
        .replace(/\s+target=(["']).*?\1/gi, '')
        .replace(/\s+rel=(["']).*?\1/gi, '')
        .replace(/\s+aria-label=(["']).*?\1/gi, '')
        .replace(/>$/, `>${replacement}</span>`);
    }
    const untrackedAmazon = /^https:\/\/(?:www\.)?(?:amazon\.|amzn\.to|a\.co)/i.test(href) &&
      !/[?&]tag=straightcutgu-20(?:&|$)/i.test(href);
    const untrackedEbay = /^https:\/\/(?:www\.)?ebay\./i.test(href) &&
      !/[?&](?:campid|campaignid)=5339155090(?:&|$)/i.test(href);
    const unapprovedPurchase = UNAPPROVED_PURCHASE_URLS.has(href);
    if (!untrackedAmazon && !untrackedEbay && !unapprovedPurchase) return anchor;

    repaired += 1;
    if (unapprovedPurchase) {
      const opening = anchor.match(/^<a\b[^>]*>/i)?.[0] || '<a>';
      return opening
        .replace(/^<a\b/i, '<span')
        .replace(/\s+href=(["']).*?\1/i, '')
        .replace(/\s+target=(["']).*?\1/gi, '')
        .replace(/\s+rel=(["']).*?\1/gi, '')
        .replace(/\s+aria-label=(["']).*?\1/gi, '')
        .replace(/>$/, '>Coming Soon</span>');
    }
    const card = anchor
      .replace(/^<a\b/i, '<article')
      .replace(/\s+href=(["']).*?\1/i, '')
      .replace(/\s+target=(["']).*?\1/gi, '')
      .replace(/\s+rel=(["']).*?\1/gi, '')
      .replace(/\s+aria-label=(["']).*?\1/gi, '')
      .replace(/<\/a>$/i, '</article>');
    if (/class=(["'])[^"']*\bcard-action\b/i.test(card)) {
      return card.replace(/<span class=(["'])card-action\1>[\s\S]*?<\/span>/i, '<span class="card-action coming-soon">Coming Soon</span>');
    }
    return card.replace(/<\/article>$/i, '<span class="coming-soon">Coming Soon</span></article>');
  });
  const output = withoutUntrackedPurchases.replace(/<a\b[^>]*\bhref=(["'])(.*?)\1[^>]*>/gi, (tag, quote, href) => {
    if (ROOT_ANCHORS[href]) {
      repaired += 1;
      return tag.replace(/\bhref=(["']).*?\1/i, `href="${ROOT_ANCHORS[href]}"`);
    }
    const dead =
      !href.trim() ||
      href.trim() === '#' ||
      /^javascript:/i.test(href) ||
      /sitestripe|epn-links-needed|approved-product|placeholder|link-required/i.test(href);
    if (!dead) return tag;
    repaired += 1;
    return tag
      .replace(/\s+target=(["']).*?\1/gi, '')
      .replace(/\s+rel=(["']).*?\1/gi, '')
      .replace(/\bhref=(["']).*?\1/i, `href="${fallback}"`);
  });
  if (output !== original) await writeFile(path, output, 'utf8');
}

console.log(`Repaired ${repaired} dead, placeholder or unapproved marketplace links.`);
console.log(`Verified ${editorialFound} editorial CTAs and repaired ${editorialRepaired} routes.`);
