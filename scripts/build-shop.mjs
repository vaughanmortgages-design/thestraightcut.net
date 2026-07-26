import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugify } from './catalog-core.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOP = join(ROOT, 'shop');
const SITE = 'https://thestraightcut.net';
const catalog = JSON.parse(await readFile(join(SHOP, 'data', 'products.json'), 'utf8'));
const products = Array.isArray(catalog.products) ? catalog.products : [];

const CATEGORIES = [
  ['deals', "Today's Deals", 'Freshly validated offers from approved Amazon and eBay links.', 'photo-1607082349566-187342175e2f'],
  ['clearance', 'Clearance', 'Verified end-cap finds without invented markdowns or false urgency.', 'photo-1472851294608-062f824d29cc'],
  ['new-arrivals', 'New Arrivals', 'Recently added products from the live catalog.', 'photo-1441986300917-64674bd600d8'],
  ['home', 'Home & Kitchen', 'Useful upgrades for cooking, storage, comfort and daily routines.', 'photo-1556911220-bff31c812dba'],
  ['electronics', 'Electronics', 'Technology chosen for real utility, compatibility and value.', 'photo-1498049794561-7780e7231661'],
  ['tools', 'Tools & Workshop', 'Practical gear for a clearer bench and a more productive weekend.', 'photo-1586864387967-d02ef85d93e8'],
  ['auto', 'Automotive', 'Road-ready technology, organization and everyday driving essentials.', 'photo-1492144534655-ae79c964c9d7'],
  ['sports-outdoors', 'Sports & Outdoors', 'Training, recreation and outdoor products worth comparing.', 'photo-1538805060514-97d9cc17730c'],
  ['pets', 'Pets', 'Comfort, enrichment, travel and everyday pet-living finds.', 'photo-1450778869180-41d0601e046e'],
  ['books-media', 'Books', 'Books, reading tools and collectible media.', 'photo-1495446815901-a7297e633e8d'],
  ['toys-kids', 'Toys & Kids', 'Play, learning and family products organized by practical use.', 'photo-1503454537195-1dcabb73ffb9'],
  ['travel', 'Travel', 'Travel essentials and approved getaway partners.', 'photo-1507525428034-b723cf961d3e'],
  ['fashion', 'Fashion', 'Wearable finds selected around usefulness, fit and repeat wear.', 'photo-1483985988355-763728e1935b'],
];

const COLLECTIONS = [
  ['back-to-school', 'Back to School', 'A focused edit for learning, organization, technology and the daily routine.', 'back_to_school', 'photo-1503676260728-1c00da094a0b'],
  ['prime-picks', 'Prime Picks', 'Approved Amazon products from the production catalog only.', 'prime_pick', 'photo-1523206489230-c012c64b2b48'],
  ['ebay-finds', 'eBay Finds', 'Tracked eBay discoveries selected from the production catalog.', 'ebay_find', 'photo-1461360370896-922624d12aa1'],
];

const esc = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const image = (id, width = 1800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=78`;

const productPath = (product) =>
  `/shop/products/${slugify(`${product.product_id}-${product.title}`)}/`;

function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, url], index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item: `${SITE}${url}`,
    })),
  };
}

function head({ title, description, canonical, hero, schemas = [] }) {
  const fullTitle = `${title} | The Straight Cut`;
  return `<!doctype html>
<html lang="en-CA">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#0c0c0d">
  <title>${esc(fullTitle)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(fullTitle)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${hero}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(fullTitle)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${hero}">
  <link rel="stylesheet" href="/shop/assets/shop.css">
  ${schemas.map((schema) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`).join('\n  ')}
</head>`;
}

function header() {
  const departmentLinks = CATEGORIES.slice(0, 8)
    .map(([slug, name]) => `<a href="/shop/${slug}/">${esc(name)}</a>`)
    .join('');
  return `<a class="skip-link" href="#main">Skip to content</a>
<header class="shop-header">
  <div class="shop-utility"><a href="/">The Straight Cut publication</a><span>Amazon + eBay shopping edit</span></div>
  <div class="shop-nav-shell">
    <a class="shop-wordmark" href="/shop/">The Straight <em>Cut</em> Shop</a>
    <nav id="shop-nav" class="shop-nav" aria-label="Shop navigation">${departmentLinks}<a href="/shop/#departments">All departments</a></nav>
    <button class="shop-menu" type="button" aria-controls="shop-nav" aria-expanded="false">Menu</button>
  </div>
</header>`;
}

function footer() {
  return `<footer class="shop-footer">
  <div><a class="shop-wordmark" href="/shop/">The Straight <em>Cut</em> Shop</a><p>A catalog-powered shopping edit. Product details, availability and prices can change at the merchant.</p></div>
  <div><strong>Collections</strong><a href="/shop/collections/back-to-school/">Back to School</a><a href="/shop/collections/prime-picks/">Prime Picks</a><a href="/shop/collections/ebay-finds/">eBay Finds</a></div>
  <div><strong>Trust</strong><a href="/affiliate-disclosure.html">Affiliate Disclosure</a><a href="/privacy-policy.html">Privacy</a><a href="/terms-of-use.html">Terms</a><a href="/">Shopping publication</a></div>
  <p class="shop-legal">As an Amazon Associate, The Straight Cut earns from qualifying purchases. We may also earn commissions from eBay purchases, at no additional cost to you.</p>
</footer>
<script src="/shop/assets/shop.js" defer></script>`;
}

function disclosure() {
  return `<p class="shop-disclosure">The Straight Cut may earn a commission when you purchase through links in this section, at no additional cost to you. <a href="/affiliate-disclosure.html">Full disclosure</a>.</p>`;
}

function productCard(product) {
  const detail = productPath(product);
  const price = product.price
    ? `<p class="product-price">${esc(product.price)} <small>${esc(product.currency)}</small></p>`
    : '';
  const badge = product.badge || (product.clearance ? 'Clearance' : product.new_arrival ? 'New' : '');
  return `<article class="product-card" data-product-card data-merchant="${esc(product.merchant)}" data-category="${esc(product.category_slug)}" data-search="${esc(`${product.title} ${product.description} ${product.merchant} ${product.category}`.toLowerCase())}">
  <a class="product-image" href="${detail}" aria-label="View ${esc(product.title)}"><img src="${esc(product.image_url)}" alt="${esc(product.title)}" loading="lazy" decoding="async"></a>
  <div class="product-copy">
    <div class="product-meta"><span class="merchant-badge">${esc(product.merchant)}</span>${badge ? `<span class="status-badge">${esc(badge)}</span>` : ''}</div>
    <h3><a href="${detail}">${esc(product.title)}</a></h3>
    <p>${esc(product.description)}</p>
    ${price}
    <a class="shop-now" href="${esc(product.affiliate_url)}" target="_blank" rel="sponsored nofollow noopener">Shop Now <span aria-hidden="true">↗</span></a>
  </div>
</article>`;
}

function productGrid(items, limit = 8) {
  return items.slice(0, limit).map(productCard).join('');
}

function directoryGrid() {
  return CATEGORIES.map(([slug, name, description, hero]) =>
    `<a class="department-card" href="/shop/${slug}/" style="--department-image:url('${image(hero, 800)}')"><span><small>Department</small><strong>${esc(name)}</strong><p>${esc(description)}</p><b>Browse →</b></span></a>`
  ).join('');
}

function productSection(title, intro, items, id) {
  if (!items.length) return '';
  return `<section id="${id}" class="shop-section">
  <div class="section-title"><div><small>Curated from the live catalog</small><h2>${esc(title)}</h2><p>${esc(intro)}</p></div></div>
  ${disclosure()}
  <div class="product-grid">${productGrid(items)}</div>
</section>`;
}

function collectionCards() {
  return COLLECTIONS.map(([slug, name, description, , hero]) =>
    `<a class="collection-card" href="/shop/collections/${slug}/" style="--collection-image:url('${image(hero, 1000)}')"><span><small>Featured collection</small><strong>${esc(name)}</strong><p>${esc(description)}</p><b>Explore collection →</b></span></a>`
  ).join('');
}

function homePage() {
  const hero = image('photo-1441986300917-64674bd600d8');
  const deals = products.filter((product) => product.category_slug === 'deals' || product.featured);
  const staff = products.filter((product) => product.staff_pick);
  const trending = products.filter((product) => product.trending);
  const clearance = products.filter((product) => product.clearance || product.category_slug === 'clearance');
  return `${head({
    title: 'Shop Amazon and eBay',
    description: 'A curated Amazon and eBay shopping showroom from The Straight Cut, powered by verified product links from the production catalog.',
    canonical: `${SITE}/shop/`,
    hero,
    schemas: [breadcrumbSchema([['Home', '/'], ['Shop', '/shop/']])],
  })}
<body>${header()}<main id="main">
  <section class="shop-hero" style="--hero:url('${hero}')"><div class="shop-hero-shade"></div><div class="shop-hero-copy"><small>The Amazon + eBay edit</small><h1>Shop smarter.<br><em>Find better.</em></h1><p>A quieter, curated way to browse useful products. Every Shop Now link comes directly from the production catalog.</p><div><a class="primary-button" href="#departments">Browse departments</a><a class="secondary-button" href="/">Read The Straight Cut</a></div></div></section>
  ${productSection("Today's Deals", 'Current finds selected from validated catalog rows.', deals, 'deals')}
  ${productSection('Staff Picks', 'Products marked for the editorial shortlist.', staff, 'staff-picks')}
  ${productSection('Trending', 'Products currently marked as trending in the catalog.', trending, 'trending')}
  ${productSection('Clearance', 'Verified clearance products with live tracked destinations.', clearance, 'clearance')}
  <section class="shop-section shop-collections"><div class="section-title"><div><small>Seasonal shopping edits</small><h2>Featured collections</h2></div></div><div class="collection-grid">${collectionCards()}</div></section>
  <section id="departments" class="shop-section shop-departments"><div class="section-title"><div><small>The department store</small><h2>Shop by department</h2><p>Every department has its own focused destination and catalog filter.</p></div></div><div class="department-grid">${directoryGrid()}</div></section>
</main>${footer()}</body></html>`;
}

function categoryPage(category) {
  const [slug, name, description, heroId] = category;
  const hero = image(heroId);
  const items = products.filter((product) => product.category_slug === slug);
  const cards = items.length
    ? `${disclosure()}<div class="catalog-tools"><label>Search this department<input type="search" data-product-search placeholder="Search ${esc(name)}"></label><label>Merchant<select data-merchant-filter><option value="">All merchants</option><option>Amazon</option><option>eBay</option></select></label></div><div class="product-grid">${productGrid(items, 24)}</div><p class="no-results" data-no-results hidden>No matching products.</p>`
    : `<div class="catalog-empty"><h2>Keep exploring the shopping edit.</h2><p>Move through the department store by interest, season or the next useful upgrade.</p><a class="primary-button" href="/shop/#departments">View all departments</a></div>`;
  return `${head({
    title: name,
    description,
    canonical: `${SITE}/shop/${slug}/`,
    hero,
    schemas: [breadcrumbSchema([['Home', '/'], ['Shop', '/shop/'], [name, `/shop/${slug}/`]])],
  })}
<body>${header()}<main id="main">
  <section class="category-hero" style="--hero:url('${hero}')"><div class="shop-hero-shade"></div><div class="category-copy"><nav class="breadcrumbs"><a href="/">Home</a><span>/</span><a href="/shop/">Shop</a><span>/</span><span>${esc(name)}</span></nav><small>Department</small><h1>${esc(name)}</h1><p>${esc(description)}</p></div></section>
  <section class="shop-section">${cards}</section>
  <section class="shop-section related-section"><div class="section-title"><div><small>Keep browsing</small><h2>Related departments</h2></div></div><div class="department-grid">${directoryGrid()}</div></section>
</main>${footer()}</body></html>`;
}

function collectionPage(collection) {
  const [slug, name, description, flag, heroId] = collection;
  const hero = image(heroId);
  const items = products.filter((product) => product[flag]);
  const body = items.length
    ? `${disclosure()}<div class="product-grid">${productGrid(items, 24)}</div>`
    : `<div class="catalog-empty"><h2>Explore the departments.</h2><p>Browse the full store by category and find the next useful idea.</p><a class="primary-button" href="/shop/#departments">Browse departments</a></div>`;
  return `${head({
    title: name,
    description,
    canonical: `${SITE}/shop/collections/${slug}/`,
    hero,
    schemas: [breadcrumbSchema([['Home', '/'], ['Shop', '/shop/'], [name, `/shop/collections/${slug}/`]])],
  })}
<body>${header()}<main id="main">
  <section class="category-hero" style="--hero:url('${hero}')"><div class="shop-hero-shade"></div><div class="category-copy"><nav class="breadcrumbs"><a href="/">Home</a><span>/</span><a href="/shop/">Shop</a><span>/</span><span>${esc(name)}</span></nav><small>Featured collection</small><h1>${esc(name)}</h1><p>${esc(description)}</p></div></section>
  <section class="shop-section">${body}</section>
</main>${footer()}</body></html>`;
}

function productPage(product) {
  const path = productPath(product);
  const canonical = `${SITE}${path}`;
  const price = product.price ? `${product.price} ${product.currency}` : '';
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: [product.image_url],
    brand: { '@type': 'Brand', name: product.merchant },
    sku: product.product_id,
    offers: {
      '@type': 'Offer',
      url: product.affiliate_url,
      priceCurrency: product.currency,
      ...(product.price ? { price: product.price } : {}),
      availability: product.availability.toLowerCase().includes('out')
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
    },
  };
  const related = products.filter((candidate) =>
    candidate.product_id !== product.product_id &&
    candidate.category_slug === product.category_slug
  );
  return `${head({
    title: product.title,
    description: product.description,
    canonical,
    hero: product.image_url,
    schemas: [
      breadcrumbSchema([['Home', '/'], ['Shop', '/shop/'], [product.category, `/shop/${product.category_slug}/`], [product.title, path]]),
      schema,
    ],
  })}
<body>${header()}<main id="main">
  <section class="product-detail">
    <nav class="breadcrumbs dark"><a href="/">Home</a><span>/</span><a href="/shop/">Shop</a><span>/</span><a href="/shop/${product.category_slug}/">${esc(product.category)}</a></nav>
    <div class="product-detail-grid"><div class="product-detail-image"><img src="${esc(product.image_url)}" alt="${esc(product.title)}"></div><div class="product-detail-copy"><span class="merchant-badge">${esc(product.merchant)}</span><h1>${esc(product.title)}</h1><p>${esc(product.description)}</p>${price ? `<p class="detail-price">${esc(price)}</p>` : ''}${disclosure()}<a class="primary-button" href="${esc(product.affiliate_url)}" target="_blank" rel="sponsored nofollow noopener">Shop Now <span aria-hidden="true">↗</span></a><p class="merchant-note">Final pricing, availability, delivery and returns are confirmed on ${esc(product.merchant)}.</p></div></div>
  </section>
  ${related.length ? `<section class="shop-section related-section"><div class="section-title"><div><small>Keep browsing</small><h2>Related products</h2></div></div><div class="product-grid">${productGrid(related, 4)}</div></section>` : ''}
</main>${footer()}</body></html>`;
}

async function write(relativePath, content) {
  const target = join(SHOP, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content, 'utf8');
}

await write('index.html', homePage());
for (const category of CATEGORIES) await write(`${category[0]}/index.html`, categoryPage(category));
for (const collection of COLLECTIONS) await write(`collections/${collection[0]}/index.html`, collectionPage(collection));
for (const product of products) {
  await write(`${productPath(product).replace('/shop/', '')}index.html`, productPage(product));
}

const urls = [
  `${SITE}/shop/`,
  ...CATEGORIES.map(([slug]) => `${SITE}/shop/${slug}/`),
  ...COLLECTIONS.map(([slug]) => `${SITE}/shop/collections/${slug}/`),
  ...products.map((product) => `${SITE}${productPath(product)}`),
];
await write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${esc(url)}</loc></url>`).join('\n')}
</urlset>
`);

console.log(`Built /shop with ${CATEGORIES.length} departments, ${COLLECTIONS.length} collections and ${products.length} validated products.`);
