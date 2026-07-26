import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://thestraightcut.net";
const data = JSON.parse(await readFile(join(ROOT, "data/pets-store.json"), "utf8"));
const esc = (value = "") =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function head({ title, description, canonical, image, breadcrumb }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumb.map(([name, url], index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: `${SITE}${url}`
    }))
  };
  return `<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0c0c0d"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${esc(image)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${esc(image)}"><link rel="preconnect" href="https://images.unsplash.com"><link rel="stylesheet" href="/assets/store.css"><link rel="stylesheet" href="/assets/pets-store.css"><script type="application/ld+json">${JSON.stringify(schema)}</script></head>`;
}

function header() {
  return `<a class="skip-link" href="#main">Skip to content</a><header class="store-header"><div class="utility-bar"><span>Independent shopping guidance</span><a href="/affiliate-disclosure.html">How we earn</a></div><div class="nav-shell"><a class="wordmark" href="/" aria-label="The Straight Cut home">THE STRAIGHT <em>CUT</em></a><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button><nav id="site-nav" class="store-nav" aria-label="Main navigation"><a href="/deals.html">Deals</a><a href="/clearance.html">Clearance</a><a href="/hot-finds.html">Hot Finds</a><a href="/departments.html">Departments</a><a href="/pets.html" aria-current="page">Pets</a><a href="/travel.html">Travel</a><a href="/buying-guides.html">Buying Guides</a></nav><button class="search-toggle" type="button" aria-expanded="false" aria-controls="global-search">Search</button></div><div id="global-search" class="global-search" hidden><label for="global-search-input">What are you looking for?</label><div><input id="global-search-input" type="search" placeholder="Search departments and collections"><button type="button" data-search-submit>Search</button></div><div class="search-results" data-search-results aria-live="polite"></div></div></header>`;
}

function footer() {
  return `<footer class="store-footer"><div class="footer-top"><div><a class="wordmark" href="/">THE STRAIGHT <em>CUT</em></a><p>The store for people who work hard and spend smart. Useful edits, straight recommendations and no invented bargains.</p></div><div><h2>Shop</h2><a href="/deals.html">Deals</a><a href="/clearance.html">Clearance</a><a href="/pets.html">Pets</a><a href="/travel.html">Travel &amp; Getaways</a><a href="/home.html">Home &amp; Kitchen</a><a href="/electronics.html">Electronics</a></div><div><h2>Read</h2><a href="/buying-guides.html">Buying Guides</a><a href="/affiliate-disclosure.html">Affiliate Disclosure</a><a href="/privacy-policy.html">Privacy</a><a href="/terms-of-use.html">Terms</a></div></div><div class="footer-bottom"><p>As an Amazon Associate, The Straight Cut earns from qualifying purchases. We may also earn commissions from other approved partners, at no additional cost to you.</p><p>© 2026 The Straight Cut</p></div></footer>`;
}

const disclosure = `<aside class="affiliate-note"><strong>Affiliate disclosure:</strong> The Straight Cut may earn a commission when you purchase through links on this page, at no additional cost to you. <a href="/affiliate-disclosure.html">Read the full disclosure.</a></aside>`;

function collectionCards() {
  return data.collections.map((item) => `<a class="pet-collection" href="${esc(item.href)}"><img loading="lazy" decoding="async" src="${esc(item.image)}" alt=""><span><strong>${esc(item.name)}</strong><small>${esc(item.description)}</small></span></a>`).join("");
}

function guideCards(limit = data.guides.length) {
  return data.guides.slice(0, limit).map((guide) => `<a class="pet-guide" href="/pets-${guide.slug}.html" style="--guide:url('${esc(guide.image)}')"><span><strong>${esc(guide.title)}</strong><small>${esc(guide.description)}</small><b>Read the guide →</b></span></a>`).join("");
}

function catalogSection(key, title, intro) {
  return `<section class="section light pets-product-section" data-pet-products="${key}" hidden><div class="section-heading"><span class="section-kicker">Catalog powered</span><h2>${esc(title)}</h2><p>${esc(intro)}</p></div>${disclosure}<div class="pets-product-grid" data-pet-product-grid></div></section>`;
}

function departmentPage() {
  const partner = data.partners[0];
  const quick = [
    ["Featured Deals", "featured-deals"],
    ["Dogs", "dogs"],
    ["Cats", "cats"],
    ["Fish & Aquariums", "fish-aquariums"],
    ["Travel & Outdoor", "travel-outdoor"],
    ["Buying Guides", "buying-guides"],
    ["Weekly Deals", "weekly-deals"]
  ].map(([name, id]) => `<a href="#${id}">${esc(name)}</a>`).join("");
  return `${head({
    title: "Pets Store | The Straight Cut",
    description: "Shop The Straight Cut Pets department for curated pet essentials, weekly deals and practical buying guides for dogs, cats, aquariums, travel and everyday care.",
    canonical: `${SITE}/pets`,
    image: data.department.heroImage,
    breadcrumb: [["Home","/"],["Departments","/departments.html"],["Pets","/pets"]]
  })}<body>${header()}<main id="main"><section class="pets-hero" style="--hero:url('${data.department.heroImage}')"><div class="pets-hero-copy"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/departments.html">Departments</a><span>/</span><span>Pets</span></nav><span class="eyebrow">${esc(data.department.eyebrow)}</span><h1>${esc(data.department.headline)}</h1><p>${esc(data.department.intro)}</p><div class="hero-actions"><a class="button gold" href="#shop-by-pet">Shop the department</a><a class="button glass" href="#buying-guides">Read buying guides</a></div></div></section><nav class="pets-quick-nav" aria-label="Pets department sections">${quick}</nav>
  ${catalogSection("featured","Featured Deals","Approved Amazon and eBay pet products appear here automatically when they are active in the production catalog.")}
  <section id="shop-by-pet" class="section light"><div class="section-heading"><span class="section-kicker">Shop by pet and routine</span><h2>Everything starts with how they live.</h2><p>Browse by companion, room or routine. Product recommendations appear only when an approved tracked destination exists.</p></div><div class="pet-collection-grid">${collectionCards()}</div></section>
  <section id="featured-deals" class="pet-partner-feature"><div id="dogs" class="pet-partner-image" role="img" aria-label="Dog enjoying an outdoor walk"></div><div class="pet-partner-copy"><span class="section-kicker">Featured deal · Approved Canadian partner</span><h2>${esc(partner.name)}</h2><p>${esc(partner.description)}</p><span class="coupon-badge">Use code ${esc(partner.couponCode)}</span>${disclosure}<a class="button gold" href="${esc(partner.affiliateUrl)}" target="_blank" rel="sponsored nofollow noopener">${esc(partner.cta)} <span aria-hidden="true">↗</span></a></div></section>
  <section id="cats" class="section warm"><div class="section-heading"><span class="section-kicker">Everyday care</span><h2>Comfort, feeding and healthier routines.</h2><p>Explore calm-at-home ideas across cats, birds, fish and small pets without unsupported health claims or invented product ratings.</p></div><div class="pet-editorial-strip"><article id="fish-aquariums" class="pet-editorial-card"><span class="card-kicker">Aquariums</span><h3>Build the habitat first.</h3><p>Start with species needs, tank size, filtration and water care.</p><a href="/pets-best-aquarium-starter-kits.html">Read the aquarium guide</a></article><article id="birds" class="pet-editorial-card"><span class="card-kicker">Birds</span><h3>Room to move and engage.</h3><p>Compare habitat dimensions, safe materials and enrichment.</p><a href="/pets-buying-guide.html">Open the pets guide</a></article><article id="small-pets" class="pet-editorial-card"><span class="card-kicker">Small pets</span><h3>Easy care starts with setup.</h3><p>Plan habitat, bedding, temperature and cleanup before extras.</p><a href="/pets-buying-guide.html">Review the basics</a></article><article id="pet-insurance" class="pet-editorial-card"><span class="card-kicker">Pet insurance</span><h3>Compare the policy, not the headline.</h3><p>Review exclusions, deductibles, reimbursement and waiting periods directly with providers.</p><a href="/pets-buying-guide.html">Read comparison notes</a></article></div></section>
  <section id="pet-health" class="section light"><div class="section-heading"><span class="section-kicker">Care collections</span><h2>Useful aisles for daily life.</h2><p>Grooming, food storage, beds, travel gear, automatic feeders and cameras—organized around fit, safety and care.</p></div><div class="pet-editorial-strip"><article id="grooming" class="pet-editorial-card"><h3>Grooming</h3><p>Choose tools for coat type, comfort and easier cleanup.</p><a href="/pets-buying-guide.html">Read care notes</a></article><article id="beds-furniture" class="pet-editorial-card"><h3>Beds &amp; Furniture</h3><p>Compare support, dimensions, covers and room placement.</p><a href="/pets-best-dog-beds.html">Compare dog beds</a></article><article id="food-treats" class="pet-editorial-card"><h3>Food &amp; Treats</h3><p>Confirm ingredients, portions and storage with qualified guidance.</p><a href="/pets-buying-guide.html">Review buying notes</a></article><article id="travel-outdoor" class="pet-editorial-card"><h3>Travel &amp; Outdoor</h3><p>Plan carriers, restraint, hydration and identification first.</p><a href="/pets-best-pet-travel-accessories.html">Read the travel guide</a></article></div></section>
  ${catalogSection("weekly","Weekly Deals","The Content Engine and production catalog rotate active pet products without repeating unapproved links.")}
  ${catalogSection("top","Top Rated Products","This section appears only for catalog products carrying verified top-rated data.")}
  ${catalogSection("clearance","Clearance","Only products explicitly marked Clearance in the production catalog appear here.")}
  <section id="buying-guides" class="section ink"><div class="section-heading"><span class="section-kicker">The Pets buying desk</span><h2>Better questions before checkout.</h2><p>Focused, useful guides with no fake testing claims, prices or ratings.</p></div><div class="pet-guide-grid">${guideCards()}</div></section>
  <section id="weekly-deals" class="section warm"><div class="section-heading"><span class="section-kicker">Weekly Deals</span><h2>Fresh finds, only when verified.</h2><p>Approved pet deals are supplied by the private catalog and rotate through the Content Engine. If no current tracked offer exists, this page does not manufacture one.</p></div><a class="button dark" href="/pets-best-pet-deals-this-week.html">Read this week’s deal guide</a></section>
  <section class="section light"><div class="section-heading"><span class="section-kicker">Related departments</span><h2>Keep browsing.</h2></div><div class="related-grid"><a class="related-card" href="/home.html"><span>Comfort at home</span><strong>Home &amp; Kitchen</strong><p>Storage, cleanup and useful everyday upgrades.</p></a><a class="related-card" href="/travel.html"><span>Go together</span><strong>Travel</strong><p>Plan the stay, road and essentials.</p></a><a class="related-card" href="/auto.html"><span>Road ready</span><strong>Automotive</strong><p>Organization and safer travel routines.</p></a></div></section></main>${footer()}<script src="/assets/store.js"></script><script src="/assets/pets-store.js" defer></script></body></html>`;
}

function guidePage(guide) {
  const checks = guide.checks.map((check, index) => `<article class="pet-guide-check"><span>${String(index + 1).padStart(2, "0")}</span><h3>${esc(check)}</h3><p>Confirm this detail against the current product information and your pet’s individual needs before purchasing.</p></article>`).join("");
  const related = data.guides.filter((item) => item.slug !== guide.slug).slice(0, 3).map((item) => `<a class="related-card" href="/pets-${item.slug}.html"><span>Pets buying guide</span><strong>${esc(item.title)}</strong><p>${esc(item.description)}</p></a>`).join("");
  return `${head({
    title: `${guide.title} | The Straight Cut`,
    description: `${guide.description} Practical pet buying guidance without invented products, ratings or prices.`,
    canonical: `${SITE}/pets-${guide.slug}.html`,
    image: guide.image,
    breadcrumb: [["Home","/"],["Pets","/pets"],[guide.title,`/pets-${guide.slug}.html`]]
  })}<body>${header()}<main id="main"><section class="department-hero compact" style="--hero:url('${esc(guide.image)}')"><div class="hero-shade"></div><div class="hero-content"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/pets">Pets</a><span>/</span><span>${esc(guide.title)}</span></nav><span class="eyebrow">Pets Buying Guide</span><h1>${esc(guide.title)}</h1><p>${esc(guide.description)}</p><div class="hero-actions"><a class="button gold" href="/pets">Browse the Pets Store</a><a class="button glass" href="/pets#weekly-deals">View Weekly Deals</a></div></div></section><section class="section warm"><div class="pet-guide-body"><span class="section-kicker">The Straight Cut checklist</span><h2>What to compare first.</h2><p>Use these checkpoints to narrow the field. Product-specific purchase links appear only when the production catalog contains an approved tracked affiliate URL.</p><div class="pet-guide-checks">${checks}</div></div></section><section class="section light"><div class="section-heading"><span class="section-kicker">Related guides</span><h2>Continue with a useful next step.</h2></div><div class="related-grid">${related}</div></section></main>${footer()}<script src="/assets/store.js"></script></body></html>`;
}

await writeFile(join(ROOT, "pets.html"), departmentPage(), "utf8");
for (const guide of data.guides) {
  await writeFile(join(ROOT, `pets-${guide.slug}.html`), guidePage(guide), "utf8");
}
console.log(`Built Pets department and ${data.guides.length} buying guides.`);
