// The Straight Cut — Department page generator (reusable components)
// -----------------------------------------------------------------------------
// Renders every department page and the departments hub from a single set of
// component functions and the data in departments.data.mjs. Because the markup
// lives here once, pages share one implementation instead of duplicating HTML.
//
//   node scripts/build-departments.mjs
//
// Output: <slug>.html for each generated department + departments.html, written
// to the repo root. SEO-critical <head> tags are emitted statically per page.
// -----------------------------------------------------------------------------

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { AMAZON_TAG, DEPARTMENTS, REGISTRY, NAME_BY_SLUG, IMAGE_POOL } from './departments.data.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://thestraightcut.net';

// --- small utilities ---------------------------------------------------------
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const img = (id, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
const amazon = (q) => `amazon.html#sitestripe-links-needed`;
const ebay = (q) => `ebay.html#epn-links-needed`;
const shopUrl = (item) => (item.market === 'ebay' ? ebay(item.q) : amazon(item.q));
const shopLabel = (item) => (item.market === 'ebay' ? 'Shop on eBay →' : 'Shop on Amazon →');
const EXT = ' target="_blank" rel="sponsored nofollow"';

// --- shared search index (drives on-site search where a search box exists) ----
const SEARCH_INDEX = [
  ...REGISTRY.filter((d) => d.generated).map((d) => ({
    type: 'Department',
    title: d.name,
    text: `${d.name} department — shop featured categories, product picks and buying guides.`,
    href: `${d.slug}.html`,
    keywords: d.name.toLowerCase(),
  })),
  { type: 'Category', title: 'Travel', text: 'Hotels, VRBO stays and trip planning.', href: 'travel.html', keywords: 'travel hotels vrbo getaways' },
  { type: 'Category', title: 'Gifts', text: 'Gift ideas by person, price and occasion.', href: 'gifts.html', keywords: 'gifts men women budget' },
  { type: 'Category', title: 'Amazon', text: 'Amazon best sellers and everyday deals.', href: 'amazon.html', keywords: 'amazon marketplace deals' },
  { type: 'Category', title: 'eBay', text: 'eBay marketplace deals and refurbished tech.', href: 'ebay.html', keywords: 'ebay refurbished parts' },
  { type: 'Category', title: 'Digital Downloads', text: 'Premium Gumroad guides and resources.', href: 'digital-downloads.html', keywords: 'digital downloads gumroad' },
  { type: 'Article', title: 'Latest Deals', text: 'Buying guides, reviews and budget roundups.', href: 'latest-deals.html', keywords: 'latest deals guides reviews' },
];

// --- reusable components ------------------------------------------------------
const NAV_ITEMS = [
  { label: "Today's Deals", href: '/#top-deals' },
  { label: 'Departments', href: 'departments.html' },
  { label: 'Categories', href: '/#categories' },
  { label: 'Travel', href: 'travel.html' },
  { label: 'Latest', href: 'latest-deals.html' },
  { label: 'Newsletter', href: '/#newsletter' },
];

function header() {
  const links = NAV_ITEMS.map((n) => `<a href="${n.href}">${esc(n.label)}</a>`).join('');
  const shopCta = `href="amazon.html#sitestripe-links-needed"${EXT}`;
  return `<header class="site-header"><div class="header-inner"><a href="/" class="logo" aria-label="The Straight Cut homepage">The Straight <em>Cut</em></a><nav class="nav-links" aria-label="Main navigation">${links}<a class="nav-cta" ${shopCta}>Shop Now →</a></nav><button class="menu-btn" data-menu-btn aria-label="Open navigation menu" aria-expanded="false" aria-controls="mobileNav">☰</button></div><nav class="mobile-nav" id="mobileNav" aria-label="Mobile navigation">${links}<a class="m-cta" ${shopCta}>Shop Amazon →</a></nav></header>`;
}

function miniNav() {
  const items = [
    ['#featured', 'Categories'],
    ['#products', 'Featured Picks'],
    ['#guide', 'Buying Guide'],
    ['#related', 'Related'],
    ['#newsletter', 'Newsletter'],
  ];
  return `<nav class="mini-nav" aria-label="On-page navigation"><div class="mini-nav-inner">${items
    .map(([h, l]) => `<a href="${h}">${l}</a>`)
    .join('')}</div></nav>`;
}

function footer() {
  const deptLinks = REGISTRY.filter((d) => d.generated)
    .slice(0, 10)
    .map((d) => `<a href="${d.slug}.html">${esc(d.name)}</a>`)
    .join('');
  return `<footer class="footer"><div class="footer-inner"><div class="footer-grid"><div class="footer-brand"><a href="/" class="logo footer-logo">The Straight <em>Cut</em></a><p>The Straight Cut publishes static shopping pages, travel ideas, gift guides and digital resources designed to make browsing fast and decisions easier.</p><div class="social-row"><a href="mailto:hello@thestraightcut.net" aria-label="Email The Straight Cut">✉</a><a href="/#newsletter" aria-label="Join the newsletter">✦</a><a href="https://straightcut.gumroad.com" target="_blank" rel="sponsored nofollow" aria-label="Shop digital downloads on Gumroad">⌘</a><a href="amazon.html#sitestripe-links-needed" target="_blank" rel="sponsored nofollow" aria-label="Shop Amazon Canada">A</a></div></div><div class="footer-col"><h3>Explore</h3><a href="departments.html">All Departments</a><a href="/#about-site">About</a><a href="mailto:hello@thestraightcut.net">Contact</a><a href="affiliate-disclosure.html">Affiliate Disclosure</a><a href="/#newsletter">Newsletter</a></div><div class="footer-col"><h3>Departments</h3>${deptLinks}</div><div class="footer-col"><h3>Policies</h3><a href="privacy-policy.html">Privacy Policy</a><a href="terms-of-use.html">Terms of Use</a><a href="latest-deals.html">Latest Deals</a><a href="travel.html">Travel</a></div></div><div class="footer-bottom"><p class="footer-legal"><strong>Affiliate Disclosure:</strong> The Straight Cut participates in affiliate advertising programs including Amazon Associates, eBay Partner Network and others. We may earn commissions from qualifying purchases at no additional cost to you. Prices and availability can change, so always confirm details on the final merchant page.</p><div class="footer-links"><a href="affiliate-disclosure.html">Affiliate Disclosure</a><a href="privacy-policy.html">Privacy</a><a href="terms-of-use.html">Terms</a><a href="latest-deals.html">Latest Deals</a></div></div></div></footer>`;
}

function scripts() {
  return `<script>window.siteSearchIndex=${JSON.stringify(SEARCH_INDEX)};</script><script src="assets/site.js"></script><script src="https://www.dwin2.com/pub.2902393.min.js"></script>`;
}

function head({ title, description, canonical, image, breadcrumbName }) {
  const bc = breadcrumbName
    ? `<script type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: breadcrumbName, item: canonical },
        ],
      })}</script>`
    : '';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="theme-color" content="#111111"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index, follow"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="website"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${image}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${image}"><link rel="canonical" href="${canonical}"><link rel="stylesheet" href="assets/site.css"><script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"The Straight Cut","url":"https://thestraightcut.net","email":"hello@thestraightcut.net","description":"Black and gold shopping guide covering deals, travel, gifts, home, electronics and digital resources."}</script>${bc}</head>`;
}

// category card → external shop search
function categoryCard(item) {
  return `<article class="card-shell"><div class="card-copy"><span class="card-tag">Category</span><h3>${esc(item.name)}</h3><p>Browse ${esc(item.name.toLowerCase())} picks and compare options before you buy.</p><a class="card-action" href="${shopUrl(item)}"${EXT}>${shopLabel(item)}</a></div></article>`;
}

// product card (sample data) → Amazon search for that product
function productCard(item, imageId) {
  const desc = item.desc || `A well-reviewed ${item.name.toLowerCase()} pick chosen for everyday value.`;
  return `<article class="card-shell"><div class="card-media"><img loading="lazy" src="${img(imageId, 800)}" alt="${esc(item.name)}"></div><div class="card-copy"><span class="card-tag">Featured</span><div class="price-pill">from ${esc(item.price)}</div><h3>${esc(item.name)}</h3><p>${esc(desc)}</p><a class="card-action" href="${amazon(item.q)}"${EXT}>Shop on Amazon →</a></div></article>`;
}

function guideCard(tip) {
  return `<article class="card-shell"><div class="card-copy"><span class="card-tag">Buying Tip</span><h3>${esc(tip.h)}</h3><p>${esc(tip.p)}</p></div></article>`;
}

function relatedCard(slug) {
  return `<article class="card-shell"><div class="card-copy"><span class="card-tag">Department</span><h3>${esc(NAME_BY_SLUG[slug] || slug)}</h3><p>Explore the ${esc((NAME_BY_SLUG[slug] || slug).toLowerCase())} department.</p><a class="card-action" href="${slug}.html">Open Page →</a></div></article>`;
}

function newsletterSection() {
  return `<section class="section-block" id="newsletter"><div class="section-inner"><div class="newsletter-box"><div><p class="section-label">Newsletter</p><h2>Stay ready for the next good find.</h2><p>Use the newsletter form for deal alerts, new guide announcements and shopping updates. Signup opens your email app so every request goes directly to hello@thestraightcut.net.</p></div><form class="newsletter-form" data-newsletter-form><label for="newsletterEmail">Email address</label><input id="newsletterEmail" type="email" name="email" placeholder="you@example.com" autocomplete="email"><button class="btn btn-gold" type="submit">Join the newsletter →</button><p class="form-note">You can also email hello@thestraightcut.net anytime.</p><p class="form-message" data-form-message aria-live="polite"></p></form></div></div></section>`;
}

// --- department page ----------------------------------------------------------
function departmentPage(d) {
  const canonical = `${SITE}/${d.slug}.html`;
  const description = `${d.name} at The Straight Cut — ${d.tagline} Shop featured categories, curated picks and a quick buying guide.`;
  const heroImg = img(d.hero, 1200);
  // Give each product card a distinct image from the verified pool, offset per
  // department so pages don't all repeat the same sequence.
  const offset = [...d.slug].reduce((a, c) => a + c.charCodeAt(0), 0) % IMAGE_POOL.length;
  const productImg = (i) => IMAGE_POOL[(offset + i) % IMAGE_POOL.length];
  return (
    head({ title: `${d.name} | The Straight Cut`, description, canonical, image: heroImg, breadcrumbName: d.name }) +
    `<body class="page-body"><a class="skip-link" href="#main">Skip to content</a>` +
    header() +
    `<section class="page-hero" style="background-image:linear-gradient(135deg,rgba(15,15,15,.92),rgba(17,17,17,.72)),url('${heroImg}');background-size:cover;background-position:center"><div class="page-hero-inner"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><a href="departments.html">Departments</a><span>${esc(d.name)}</span></nav><div class="page-hero-grid"><div><p class="eyebrow">${esc(d.name)}</p><h1>${esc(d.tagline)}</h1><p>${esc(d.intro)}</p><div class="hero-actions"><a class="btn btn-gold" href="#products">See featured picks →</a><a class="btn btn-outline" href="#guide">Read buying guide →</a></div></div><aside class="hero-panel"><h2>Quick links</h2><ul><li><strong>Shop by category:</strong> jump straight to curated ${esc(d.name.toLowerCase())} searches.</li><li><strong>Featured picks:</strong> sample products with clear price context.</li><li><strong>Buying guide:</strong> quick tips before you commit.</li></ul></aside></div></div></section>` +
    miniNav() +
    `<main id="main" class="page-main">` +
    // Featured categories
    `<section class="section-block" id="featured"><div class="section-inner"><div class="section-head"><div><p class="section-label">Shop by Category</p><h2>Ways to browse ${esc(d.name)}.</h2></div><p>Each category opens a curated search on Amazon or eBay so the next click always lands somewhere useful.</p></div><div class="cards-grid">${d.cats.map(categoryCard).join('')}</div></div></section>` +
    // Products
    `<section class="section-block dark" id="products"><div class="section-inner"><div class="section-head"><div><p class="section-label">Featured Picks</p><h2>Sample ${esc(d.name)} products.</h2></div><p>Representative picks with typical price context. Tap any card to shop live listings — prices and availability update on the merchant page.</p></div><div class="cards-grid four">${d.products.map((p, i) => productCard(p, productImg(i))).join('')}</div></div></section>` +
    // Buying guide
    `<section class="section-block" id="guide"><div class="section-inner"><div class="section-head"><div><p class="section-label">Buying Guide</p><h2>How to choose.</h2></div><p>${esc(d.guide.intro)}</p></div><div class="cards-grid">${d.guide.tips.map(guideCard).join('')}</div></div></section>` +
    // Related
    `<section class="section-block dark" id="related"><div class="section-inner"><div class="section-head"><div><p class="section-label">Related Departments</p><h2>Keep browsing.</h2></div><p>Departments that pair well with ${esc(d.name)}.</p></div><div class="cards-grid">${d.related.map(relatedCard).join('')}</div></div></section>` +
    newsletterSection() +
    `</main>` +
    footer() +
    scripts() +
    `</body></html>`
  );
}

// --- departments hub ----------------------------------------------------------
function hubPage() {
  const canonical = `${SITE}/departments.html`;
  const description =
    'Browse every department at The Straight Cut — electronics, home, kitchen, tools, fashion, sports, books, pets, automotive and more.';
  const heroImg = img('1607082349566-187342175e2f', 1200);
  const cards = REGISTRY.map((d) => {
    const href = d.generated ? `${d.slug}.html` : `${d.slug}.html`;
    return `<article class="card-shell"><div class="card-copy"><span class="card-tag">Department</span><h3>${esc(d.name)}</h3><p>Shop the ${esc(d.name.toLowerCase())} department — categories, picks and guides.</p><a class="card-action" href="${href}">Open Page →</a></div></article>`;
  }).join('');
  return (
    head({ title: 'All Departments | The Straight Cut', description, canonical, image: heroImg, breadcrumbName: 'Departments' }) +
    `<body class="page-body"><a class="skip-link" href="#main">Skip to content</a>` +
    header() +
    `<section class="page-hero"><div class="page-hero-inner"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>Departments</span></nav><div class="page-hero-grid"><div><p class="eyebrow">Departments</p><h1>Every department, one click away.</h1><p>The Straight Cut is organised the way people shop. Pick a department to see featured categories, curated product picks and a quick buying guide — all in the same fast black-and-gold layout.</p><div class="hero-actions"><a class="btn btn-gold" href="/#top-deals">Today's deals →</a><a class="btn btn-outline" href="/#newsletter">Join newsletter →</a></div></div><aside class="hero-panel"><h2>How it works</h2><ul><li><strong>Consistent layout:</strong> every department page follows the same structure.</li><li><strong>Real destinations:</strong> categories and picks link to live listings.</li><li><strong>Buying guides:</strong> quick tips before you buy.</li></ul></aside></div></div></section>` +
    `<main id="main" class="page-main"><section class="section-block"><div class="section-inner"><div class="section-head"><div><p class="section-label">Shop by Department</p><h2>Choose where to start.</h2></div><p>All departments share the same reusable template, so browsing stays fast and familiar.</p></div><div class="cards-grid">${cards}</div></div></section></main>` +
    footer() +
    scripts() +
    `</body></html>`
  );
}

// --- write everything ---------------------------------------------------------
const written = [];
for (const d of DEPARTMENTS) {
  const file = join(ROOT, `${d.slug}.html`);
  await writeFile(file, departmentPage(d), 'utf8');
  written.push(`${d.slug}.html`);
}
await writeFile(join(ROOT, 'departments.html'), hubPage(), 'utf8');
written.push('departments.html');

console.log(`Generated ${written.length} pages:`);
console.log(written.join('\n'));
