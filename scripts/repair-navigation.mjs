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

const files = (await readdir(ROOT)).filter((file) => file.endsWith('.html'));
let repaired = 0;

for (const file of files) {
  const path = join(ROOT, file);
  const source = await readFile(path, 'utf8');
  const fallback = ROUTES[file] || 'departments.html';
  const output = source.replace(/<a\b[^>]*\bhref=(["'])(.*?)\1[^>]*>/gi, (tag, quote, href) => {
    if (ROOT_ANCHORS[href]) {
      repaired += 1;
      return tag.replace(/\bhref=(["']).*?\1/i, `href="${ROOT_ANCHORS[href]}"`);
    }
    const dead =
      !href.trim() ||
      href.trim() === '#' ||
      /^javascript:/i.test(href) ||
      /sitestripe|epn-links-needed|approved-product|placeholder|link-required/i.test(href);
    const marketplace = /^https:\/\/www\.(?:amazon|ebay)\./i.test(href);
    if (!dead && !marketplace) return tag;
    repaired += 1;
    return tag
      .replace(/\s+target=(["']).*?\1/gi, '')
      .replace(/\s+rel=(["']).*?\1/gi, '')
      .replace(/\bhref=(["']).*?\1/i, `href="${fallback}"`);
  });
  if (output !== source) await writeFile(path, output, 'utf8');
}

console.log(`Repaired ${repaired} dead, placeholder or unapproved marketplace links.`);
