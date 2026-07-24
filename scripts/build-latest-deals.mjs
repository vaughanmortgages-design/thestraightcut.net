// The Straight Cut — Latest Deals page generator
// -----------------------------------------------------------------------------
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { AMAZON_TAG } from './departments.data.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://thestraightcut.net';
const SHEET_ID = '1N5MWf_GMtVDUrLep9JchPKDWPHCLiufm-bY1KrA-IoE';
const SHEET_TAB = 'Deals';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TAB)}`;
const MAX_DEALS = 40;

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const amazon = (q) => `amazon.html#sitestripe-links-needed

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map((v) => v.replace(/^"|"$/g, '').trim());
}

async function fetchDeals() {
  const res = await fetch(CSV_URL);
  if (!res.ok) {
    throw new Error(
      `Could not fetch Deals sheet (status ${res.status}). Confirm sharing is set to "Anyone with the link — Viewer".`
    );
  }
  const csv = await res.text();
  const lines = csv.split('\n').filter(Boolean);
  const rows = lines.map(parseCsvLine);
  return rows
    .map(([date, source, title, , url]) => ({ date, source, title, url }))
    .filter((d) => d.title && d.url)
    .reverse()
    .slice(0, MAX_DEALS);
}

function dealCard(d) {
  const clean = d.title.replace(/\s+/g, ' ').trim();
  const shopHref = amazon(clean);
  return `<article class="card-shell"><div class="card-copy"><span class="card-tag">${esc(d.date || 'Deal')}</span><h3>${esc(clean)}</h3><a class="card-action" href="${shopHref}" target="_blank" rel="sponsored nofollow">Shop this deal →</a></div></article>`;
}

function page(deals) {
  const canonical = `${SITE}/latest-deals.html`;
  const description =
    'The latest Amazon and eBay deals The Straight Cut has found, updated automatically — buying guides, budget roundups and today\'s best finds.';
  const cards = deals.map(dealCard).join('');
  const faq = deals.slice(0, 5).map((d) => ({
    '@type': 'Question',
    name: `Is "${d.title.replace(/\s+/g, ' ').trim()}" still available?`,
    acceptedAnswer: {
      '@type': 'Answer',
      text: `This deal was listed on ${d.date || 'a recent date'}. Availability and pricing can change — check the live listing for current status.`,
    },
  }));
  const faqSchema = faq.length
    ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq })}</script>`
    : '';

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="theme-color" content="#111111"><title>Latest Deals | The Straight Cut</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index, follow"><meta property="og:title" content="Latest Deals | The Straight Cut"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="website"><meta property="og:url" content="${canonical}"><link rel="canonical" href="${canonical}"><link rel="stylesheet" href="assets/site.css">${faqSchema}</head><body class="page-body"><a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="header-inner"><a href="/" class="logo">The Straight <em>Cut</em></a></div></header><section class="page-hero"><div class="page-hero-inner"><nav class="breadcrumbs"><a href="/">Home</a><span>Latest Deals</span></nav><h1>Today's best finds, updated automatically.</h1><p>${deals.length} deals currently listed, pulled straight from our daily scan of Amazon and eBay markdowns.</p></div></section><main id="main" class="page-main"><section class="section-block"><div class="section-inner"><div class="cards-grid">${cards}</div></div></section></main><script src="https://www.dwin2.com/pub.2902393.min.js"></script></body></html>`;
}

const deals = await fetchDeals();
await writeFile(join(ROOT, 'latest-deals.html'), page(deals), 'utf8');
console.log(`Generated latest-deals.html with ${deals.length} deals`);
