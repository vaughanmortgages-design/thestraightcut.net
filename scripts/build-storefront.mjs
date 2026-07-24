import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://thestraightcut.net';

const PARTNERS = {
  hotels: { name: 'Hotels.com', url: 'https://www.dpbolvw.net/click-101746656-11131426' },
  vrbo: { name: 'VRBO', url: 'https://www.anrdoezrs.net/click-101746656-13880505' },
  wrapItStorage: { name: 'Wrap-It Storage', url: 'https://www.anrdoezrs.net/click-101746656-17279920' },
  rexing: { name: 'Rexing', url: 'https://www.tkqlhce.com/click-101746656-15019509' },
  bathorium: { name: 'Bathorium', url: 'https://www.awin1.com/cread.php?awinmid=120413&awinaffid=2902393' },
  skylark: { name: 'Skylark Travel Group', url: 'https://www.awin1.com/cread.php?awinmid=106305&awinaffid=2902393' },
  roamable: { name: 'Roamable', url: 'https://www.awin1.com/awclick.php?gid=581576&mid=118127&awinaffid=2936205&linkid=4514497&clickref=' },
  gumroad: { name: 'The Straight Cut Shop', url: 'https://straightcut.gumroad.com' },
};

const PAGE_ORDER = [
  'deals', 'clearance', 'hot-finds', 'refurbished-beauties', 'travel', 'home',
  'electronics', 'auto', 'sports-outdoors', 'pets', 'health-beauty', 'garden',
  'tools', 'books-media', 'video-games', 'senior-living',
];

const PAGES = {
  deals: {
    name: 'Deals', eyebrow: 'The Daily Edit', headline: 'Good finds, without the noise.',
    intro: 'A calm, useful destination for timely partner offers, value-minded collections and the categories worth checking before you buy.',
    hero: 'photo-1607082349566-187342175e2f',
    collections: ['Today’s Shortlist', 'Best Value', 'Seasonal Opportunities', 'Worth a Second Look'],
    guide: ['Confirm the final merchant price', 'Compare the full cost, not the headline', 'Buy for a real need', 'Check returns before checkout'],
    related: ['clearance', 'hot-finds', 'electronics'],
  },
  clearance: {
    name: 'Clearance', eyebrow: 'The End Cap', headline: 'The last look can be the best one.',
    intro: 'Editorially organized end-of-season inspiration across technology, home, tools and everyday upgrades—without invented markdowns or countdown pressure.',
    hero: 'photo-1472851294608-062f824d29cc',
    collections: ['Clearance Tech', 'Home End Cap', 'Workshop Finds', 'Seasonal Last Look'],
    guide: ['Know the model year', 'Inspect condition language', 'Compare return policies', 'Skip false urgency'],
    related: ['deals', 'refurbished-beauties', 'home'],
  },
  'hot-finds': {
    name: 'Hot Finds', eyebrow: 'Freshly Spotted', headline: 'The things worth knowing about now.',
    intro: 'New discoveries, clever problem-solvers and conversation-starting ideas selected to make browsing feel rewarding.',
    hero: 'photo-1523275335684-37898b6baf30',
    collections: ['Trending Now', 'New Discoveries', 'Weekend Finds', 'Staff Recommendations'],
    guide: ['Look past novelty', 'Choose useful upgrades', 'Check compatibility', 'Wait when the value is unclear'],
    related: ['deals', 'electronics', 'home'],
  },
  'refurbished-beauties': {
    name: 'Refurbished Beauties', eyebrow: 'Renewed Technology', headline: 'Excellent technology deserves another chapter.',
    intro: 'A premium guide to renewed laptops, phones, tablets, audio and accessories—organized around condition, support and long-term value.',
    hero: 'photo-1496181133206-80ce9b88a853',
    collections: ['Renewed Laptops', 'Phones & Tablets', 'Gaming Machines', 'Audio & Accessories'],
    guide: ['Read the condition grade', 'Verify battery expectations', 'Confirm warranty coverage', 'Compare against current-generation value'],
    related: ['electronics', 'video-games', 'deals'],
  },
  travel: {
    name: 'Travel & Getaways', eyebrow: 'Go Somewhere', headline: 'A better getaway starts with better browsing.',
    intro: 'Hotels, vacation homes, luxury planning and connected travel—all presented with the breathing room of a modern travel magazine.',
    hero: 'photo-1507525428034-b723cf961d3e',
    collections: ['Weekend Escapes', 'Hotels & Resorts', 'Vacation Rentals', 'Luxury Travel'],
    guide: ['Choose the stay type first', 'Compare the total booking cost', 'Read the cancellation terms', 'Plan connectivity before departure'],
    partners: [
      ['hotels', 'Hotels & city stays', 'Browse hotel and resort options for city breaks, weekend plans and longer stays.', 'Explore Hotels'],
      ['vrbo', 'Vacation homes', 'Find whole-home stays suited to families, groups and trips that need more space.', 'Find a Vacation Rental'],
      ['skylark', 'Luxury travel', 'Explore premium travel planning through an approved luxury travel partner.', 'Discover Luxury Travel'],
      ['roamable', 'Connected travel', 'Review approved travel connectivity offers before leaving home.', 'View Travel Offers'],
    ],
    related: ['books-media', 'home', 'deals'],
  },
  home: {
    name: 'Home & Kitchen', eyebrow: 'Live Better', headline: 'Small upgrades. Better everyday living.',
    intro: 'Storage, cooking, comfort and thoughtful finishing touches selected for homes that work hard and still feel good.',
    hero: 'photo-1556911220-bff31c812dba',
    collections: ['Kitchen Reset', 'Organized Living', 'Quiet Comfort', 'Weekend Projects'],
    guide: ['Measure before ordering', 'Prioritize daily-use items', 'Choose easy-care materials', 'Build storage around routines'],
    partners: [['wrapItStorage', 'Storage that stays sorted', 'Explore practical organization for cords, tools, workshops and everyday clutter.', 'Explore Storage']],
    related: ['garden', 'tools', 'health-beauty'],
  },
  electronics: {
    name: 'Electronics', eyebrow: 'The Upgrade Desk', headline: 'Technology that earns its place.',
    intro: 'Smart, useful technology organized around the way you listen, work, travel and protect what matters.',
    hero: 'photo-1498049794561-7780e7231661',
    collections: ['Smart Home', 'Audio & Listening', 'Power & Charging', 'Road Technology'],
    guide: ['Start with compatibility', 'Buy the feature you will use', 'Plan cable and power needs', 'Keep privacy settings in mind'],
    partners: [['rexing', 'Dash cams & road technology', 'Explore approved Rexing driving technology for commuting, road trips and parked vehicles.', 'Explore Rexing']],
    related: ['refurbished-beauties', 'auto', 'video-games'],
  },
  auto: {
    name: 'Automotive', eyebrow: 'The Open Road', headline: 'Drive smarter. Pack better. Go farther.',
    intro: 'Road-ready technology, vehicle organization and practical essentials for commutes, weekends and longer journeys.',
    hero: 'photo-1492144534655-ae79c964c9d7',
    collections: ['Road Technology', 'Interior Organization', 'Weekend Drive', 'Garage Ready'],
    guide: ['Confirm vehicle compatibility', 'Keep sightlines clear', 'Plan safe cable routing', 'Choose gear that stores easily'],
    partners: [
      ['rexing', 'Road-ready camera systems', 'Explore approved Rexing dash cams and driving technology without unverified product claims.', 'Explore Dash Cams'],
      ['wrapItStorage', 'Garage & cable organization', 'Bring order to extension cords, hoses and workshop essentials.', 'Organize the Garage'],
    ],
    related: ['electronics', 'tools', 'travel'],
  },
  'sports-outdoors': {
    name: 'Sports & Outdoors', eyebrow: 'Move More', headline: 'Make the next hour count.',
    intro: 'Training ideas, outdoor essentials and recreation collections built around movement, consistency and time well spent.',
    hero: 'photo-1538805060514-97d9cc17730c',
    collections: ['Home Training', 'Trail & Camp', 'Game Day', 'Recovery Routine'],
    guide: ['Start with versatile equipment', 'Fit matters more than features', 'Pack for the real conditions', 'Build consistency before complexity'],
    related: ['health-beauty', 'garden', 'travel'],
  },
  pets: {
    name: 'Pets', eyebrow: 'For Good Company', headline: 'More comfort, play and tail wags.',
    intro: 'Thoughtful pet-living ideas for feeding, rest, travel, enrichment and the everyday routines shared with four-legged family.',
    hero: 'photo-1450778869180-41d0601e046e',
    collections: ['Calm at Home', 'Play & Enrichment', 'Walk Ready', 'Travel Together'],
    guide: ['Choose the right size', 'Prioritize washable materials', 'Introduce changes gradually', 'Ask a professional about health needs'],
    related: ['home', 'travel', 'garden'],
  },
  'health-beauty': {
    name: 'Health & Beauty', eyebrow: 'The Reset', headline: 'Turn the daily routine into a ritual.',
    intro: 'Bath, grooming, recovery and self-care inspiration with a focus on comfort, consistency and a little everyday luxury.',
    hero: 'photo-1540555700478-4be289fbecef',
    collections: ['Bath Ritual', 'Daily Grooming', 'Rest & Recovery', 'The Weekend Reset'],
    guide: ['Read ingredient and allergy information', 'Patch test when appropriate', 'Build a routine you can repeat', 'Treat wellness claims carefully'],
    partners: [['bathorium', 'A more considered bath', 'Explore approved Bathorium bath and body collections for a slower, more restorative routine.', 'Explore Bathorium']],
    related: ['home', 'sports-outdoors', 'senior-living'],
  },
  garden: {
    name: 'Garden', eyebrow: 'Outside, Refined', headline: 'Make more of the space beyond your door.',
    intro: 'Outdoor living, planting, organization and weekend project ideas for balconies, backyards and everything between.',
    hero: 'photo-1416879595882-3373a0480b5b',
    collections: ['Outdoor Living', 'Grow Something', 'Garden Organization', 'Weekend Outdoors'],
    guide: ['Work with the light you have', 'Choose for your climate', 'Plan water access', 'Store tools where they are used'],
    partners: [['wrapItStorage', 'Outdoor organization', 'Explore practical storage for hoses, extension cords and seasonal equipment.', 'Explore Outdoor Storage']],
    related: ['home', 'tools', 'sports-outdoors'],
  },
  tools: {
    name: 'Workshop', eyebrow: 'Built to Work', headline: 'A better shop starts with a clearer bench.',
    intro: 'Tools, organization and project-planning collections for capable DIYers and anyone ready to make the weekend productive.',
    hero: 'photo-1586864387967-d02ef85d93e8',
    collections: ['Bench Essentials', 'Cord Control', 'Weekend Repair', 'Workshop Organization'],
    guide: ['Buy for the next three jobs', 'Protect eyes and hearing', 'Organize before adding tools', 'Choose serviceable equipment'],
    partners: [['wrapItStorage', 'Workshop organization', 'Explore approved cord, hose and tool organization from Wrap-It Storage.', 'Organize Your Workshop']],
    related: ['home', 'garden', 'auto'],
  },
  'books-media': {
    name: 'Books & Media', eyebrow: 'The Reading Room', headline: 'Good ideas are always in season.',
    intro: 'Reading lists, digital resources, vintage-book inspiration and screen-free ways to spend an hour well.',
    hero: 'photo-1495446815901-a7297e633e8d',
    collections: ['Hardcover Shelf', 'Digital Reading', 'Vintage Finds', 'The Giftable Edit'],
    guide: ['Choose a format you will use', 'Sample before committing', 'Check device compatibility', 'Buy reference books for repeat value'],
    partners: [['gumroad', 'Digital guides & resources', 'Browse The Straight Cut’s approved digital shop for practical downloadable resources.', 'Browse Digital Guides']],
    related: ['travel', 'senior-living', 'video-games'],
  },
  'video-games': {
    name: 'Video Games', eyebrow: 'Press Start', headline: 'Build a setup worth coming back to.',
    intro: 'Gaming-room inspiration, renewed-technology guidance and smarter ways to choose screens, sound, seating and accessories.',
    hero: 'photo-1542751371-adc38448a05e',
    collections: ['Console Corner', 'PC Gaming', 'Sound & Screens', 'Comfort Upgrades'],
    guide: ['Choose the platform first', 'Match the display to the hardware', 'Prioritize comfort and ventilation', 'Consider renewed technology'],
    related: ['electronics', 'refurbished-beauties', 'books-media'],
  },
  'senior-living': {
    name: 'Senior Living', eyebrow: 'Comfort & Independence', headline: 'Thoughtful choices for easier everyday living.',
    intro: 'Comfort, organization, visibility and practical home ideas selected to support confidence without making the space feel clinical.',
    hero: 'photo-1544005313-94ddf0286df2',
    collections: ['Comfort at Home', 'Easy Organization', 'Stay Connected', 'Everyday Confidence'],
    guide: ['Choose intuitive controls', 'Reduce reaching and bending', 'Improve lighting first', 'Ask the user what feels comfortable'],
    related: ['home', 'health-beauty', 'electronics'],
  },
};

const SECONDARY_PAGES = {
  appliances: {
    name: 'Appliances', eyebrow: 'Everyday Workhorses', headline: 'Choose the machine that fits the routine.',
    intro: 'Practical guidance for major and small appliances, organized around space, capacity, care and the features you will actually use.',
    hero: 'photo-1574269909862-7e1d70bb8078',
    collections: ['Kitchen Appliances', 'Laundry Planning', 'Small-Space Helpers', 'Care & Maintenance'],
    guide: ['Measure every doorway', 'Compare usable capacity', 'Check service access', 'Plan ventilation and power'],
    related: ['home', 'deals', 'tools'],
  },
  apparel: {
    name: 'Apparel', eyebrow: 'The Wardrobe Edit', headline: 'Wear more of what you own.',
    intro: 'A considered approach to everyday layers, occasion dressing, care and closet-building without trend-chasing.',
    hero: 'photo-1483985988355-763728e1935b',
    collections: ['Everyday Uniform', 'Weekend Layers', 'Occasion Ready', 'Care & Storage'],
    guide: ['Start with fit', 'Check fabric care', 'Build around repeat wear', 'Buy for your real calendar'],
    related: ['health-beauty', 'travel', 'home'],
  },
  'auctions-collectibles': {
    name: 'Auctions & Collectibles', eyebrow: 'The Collector’s Room', headline: 'The hunt is half the pleasure.',
    intro: 'Editorial guidance for vintage finds, memorabilia, bullion and auction browsing—without untracked marketplace destinations.',
    hero: 'photo-1461360370896-922624d12aa1',
    collections: ['Vintage Finds', 'Collectibles', 'Bullion Basics', 'Auction Strategy'],
    guide: ['Research sold examples', 'Study condition carefully', 'Set a total-cost ceiling', 'Keep provenance records'],
    related: ['books-media', 'hot-finds', 'refurbished-beauties'],
  },
  'his-hers': {
    name: 'His & Hers', eyebrow: 'Gifts & Daily Style', headline: 'Thoughtful ideas, minus the guesswork.',
    intro: 'Polished edits for grooming, useful gifts, travel and everyday style—organized around interests rather than stereotypes.',
    hero: 'photo-1529139574466-a303027c1d8b',
    collections: ['Daily Rituals', 'Useful Gifts', 'Travel Ready', 'Quiet Luxury'],
    guide: ['Shop the person, not the category', 'Choose useful over novelty', 'Check sizing early', 'Include an easy exchange path'],
    related: ['health-beauty', 'travel', 'books-media'],
  },
  kids: {
    name: 'Kids & Family', eyebrow: 'Growing Together', headline: 'Make family life a little easier.',
    intro: 'Play, organization, learning and family-time collections built around durability, age suitability and less household clutter.',
    hero: 'photo-1503454537195-1dcabb73ffb9',
    collections: ['Creative Play', 'Family Organization', 'Learning at Home', 'Weekend Together'],
    guide: ['Check age guidance', 'Choose easy-clean materials', 'Prioritize open-ended play', 'Plan storage with the purchase'],
    related: ['home', 'books-media', 'travel'],
  },
  sports: {
    name: 'Sports', eyebrow: 'Game On', headline: 'More playing. Less overthinking.',
    intro: 'A focused sports edit for training, team play, recovery and getting outside with the gear decision simplified.',
    hero: 'photo-1461896836934-ffe607ba8211',
    collections: ['Training Day', 'Team Sports', 'Outdoor Play', 'Recovery'],
    guide: ['Fit comes first', 'Choose league-appropriate equipment', 'Protective gear is not optional', 'Buy for current ability'],
    related: ['sports-outdoors', 'health-beauty', 'garden'],
  },
  'affiliate-partners': {
    name: 'Featured Partners', eyebrow: 'Shop With Confidence', headline: 'Approved destinations, clearly presented.',
    intro: 'A transparent directory of the approved partners currently featured across The Straight Cut’s editorial departments.',
    hero: 'photo-1556742049-0cfed4f6a45d',
    collections: ['Travel Partners', 'Home & Workshop', 'Road Technology', 'Self-Care & Digital'],
    guide: ['Confirm final prices on the partner site', 'Review delivery or booking terms', 'Check returns and cancellation rules', 'Use the full disclosure for context'],
    partners: [
      ['hotels', 'Hotels & city stays', 'Approved hotel and resort browsing through Hotels.com.', 'Explore Hotels'],
      ['vrbo', 'Vacation rentals', 'Approved whole-home vacation rental browsing through VRBO.', 'Explore VRBO'],
      ['skylark', 'Luxury travel', 'Premium travel planning through Skylark Travel Group.', 'Explore Skylark'],
      ['roamable', 'Travel connectivity', 'Approved travel connectivity offers through Roamable.', 'Explore Roamable'],
      ['wrapItStorage', 'Storage & organization', 'Approved home, garage and workshop organization through Wrap-It Storage.', 'Explore Storage'],
      ['rexing', 'Road technology', 'Approved dash cam and road technology browsing through Rexing.', 'Explore Rexing'],
      ['bathorium', 'Bath & body', 'Approved bath and body browsing through Bathorium.', 'Explore Bathorium'],
      ['gumroad', 'Digital resources', 'Approved digital downloads from The Straight Cut Shop.', 'Browse Digital Guides'],
    ],
    related: ['travel', 'home', 'electronics'],
  },
};

const ALL_PAGES = { ...PAGES, ...SECONDARY_PAGES };
const STOREFRONT_ORDER = [...PAGE_ORDER, ...Object.keys(SECONDARY_PAGES)];

const HOME_FEATURES = [
  ['Today’s Best Deals', 'A disciplined shortlist of value-minded opportunities—no manufactured urgency.', 'deals.html', 'photo-1607082349566-187342175e2f'],
  ['Staff Picks', 'The practical upgrades and smart ideas our editorial desk would look at first.', 'hot-finds.html', 'photo-1523275335684-37898b6baf30'],
  ['Trending Now', 'Fresh discoveries organized for useful browsing, not hype.', 'hot-finds.html#collections', 'photo-1516321318423-f06f85e504b3'],
  ['New Arrivals', 'Recently added collections, guides and partner destinations.', 'departments.html', 'photo-1441986300917-64674bd600d8'],
  ['Editor’s Choice', 'Strong starting points across home, travel, tech and daily living.', 'buying-guides.html', 'photo-1455390582262-044cdead277a'],
  ['Weekend Finds', 'A browseable edit for road trips, projects and slower Sundays.', 'hot-finds.html#collections', 'photo-1500530855697-b586d89ba3ee'],
];

const BUDGET_EDIT = [
  ['$25', 'Small upgrades, useful add-ons and giftable ideas. Verify the live price before buying.', 'hot-finds.html'],
  ['$50', 'A planning collection for meaningful everyday improvements without a major spend.', 'deals.html'],
  ['$100', 'Bigger upgrades worth comparing carefully across features, support and total cost.', 'buying-guides.html'],
];

const esc = (value = '') =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const imageUrl = (id, width = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=78`;
const pageUrl = (slug) => `${slug}.html`;
const slugify = (value) => String(value).toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
const collectionUrl = (slug, name) => `/${slug}-collections.html#${slugify(name)}`;
const guideUrl = (slug, name) => `/${slug}-${slugify(name)}-guide.html`;
const nextDepartment = (slug, offset = 1) => {
  const index = STOREFRONT_ORDER.indexOf(slug);
  return STOREFRONT_ORDER[(index + offset + STOREFRONT_ORDER.length) % STOREFRONT_ORDER.length];
};

function head({ title, description, canonical, image, breadcrumb }) {
  const json = breadcrumb ? `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: breadcrumb, item: canonical },
    ],
  })}</script>` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0c0c0d"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${image}"><meta name="twitter:card" content="summary_large_image"><link rel="preconnect" href="https://images.unsplash.com"><link rel="stylesheet" href="assets/store.css">${json}</head>`;
}

function header() {
  return `<a class="skip-link" href="#main">Skip to content</a><header class="store-header"><div class="utility-bar"><span>Independent shopping guidance</span><a href="affiliate-disclosure.html">How we earn</a></div><div class="nav-shell"><a class="wordmark" href="/" aria-label="The Straight Cut home">THE STRAIGHT <em>CUT</em></a><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button><nav id="site-nav" class="store-nav" aria-label="Main navigation"><a href="deals.html">Deals</a><a href="clearance.html">Clearance</a><a href="hot-finds.html">Hot Finds</a><a href="refurbished-beauties.html">Refurbished</a><a href="departments.html">Departments</a><a href="travel.html">Travel</a><a href="buying-guides.html">Buying Guides</a></nav><button class="search-toggle" type="button" aria-expanded="false" aria-controls="global-search">Search</button></div><div id="global-search" class="global-search" hidden><label for="global-search-input">What are you looking for?</label><div><input id="global-search-input" type="search" placeholder="Search departments and collections"><button type="button" data-search-submit>Search</button></div><div class="search-results" data-search-results aria-live="polite"></div></div></header>`;
}

function footer() {
  const links = PAGE_ORDER.slice(0, 8).map((slug) => `<a href="${pageUrl(slug)}">${esc(PAGES[slug].name)}</a>`).join('');
  return `<footer class="store-footer"><div class="footer-top"><div><a class="wordmark" href="/">THE STRAIGHT <em>CUT</em></a><p>The store for people who work hard and spend smart. Useful edits, straight recommendations and no invented bargains.</p></div><div><h2>Shop</h2>${links}</div><div><h2>Read</h2><a href="buying-guides.html">Buying Guides</a><a href="affiliate-disclosure.html">Affiliate Disclosure</a><a href="privacy-policy.html">Privacy</a><a href="terms-of-use.html">Terms</a></div></div><div class="footer-bottom"><p>As an Amazon Associate, The Straight Cut earns from qualifying purchases. We may also earn commissions from other approved partners, at no additional cost to you.</p><p>© 2026 The Straight Cut</p></div></footer>`;
}

function disclosure() {
  return `<aside class="affiliate-note"><strong>Affiliate disclosure:</strong> The Straight Cut may earn a commission when you book or purchase through links on this page, at no additional cost to you. <a href="affiliate-disclosure.html">Read the full disclosure.</a></aside>`;
}

function editorialCard(title, body, href, label = 'Explore the edit', image = '') {
  const visual = image ? `<img loading="lazy" src="${image}" alt="">` : '';
  return `<a class="editorial-card${image ? ' editorial-card-image' : ''}" href="${href}" aria-label="${esc(`${label}: ${title}`)}">${visual}<span class="editorial-card-copy"><span class="card-kicker">The Straight Cut Edit</span><h3>${esc(title)}</h3><p>${esc(body)}</p><span class="card-action">${esc(label)} <span aria-hidden="true">→</span></span></span></a>`;
}

function partnerCard(key, title, body, label) {
  const partner = PARTNERS[key];
  return `<a class="partner-card" href="${esc(partner.url)}" target="_blank" rel="sponsored nofollow" aria-label="${esc(`${label}: ${title}`)}"><span class="card-kicker">Featured partner · ${esc(partner.name)}</span><h3>${esc(title)}</h3><p>${esc(body)}</p><span class="card-action">${esc(label)} <span aria-hidden="true">↗</span></span></a>`;
}

function newsletter() {
  return `<section id="newsletter" class="newsletter"><div><span class="section-kicker">The Saturday Cut</span><h2>One smart browse. Zero clutter.</h2><p>New edits, seasonal ideas and partner finds—delivered with the same no-noise approach as the store.</p></div><form data-newsletter-form><label for="newsletter-email">Email address</label><div><input id="newsletter-email" type="email" required placeholder="you@example.com"><button type="submit">Join the list</button></div><p data-form-message aria-live="polite"></p></form></section>`;
}

function departmentPage(slug, page) {
  const description = `${page.name} at The Straight Cut. ${page.intro}`;
  const canonical = `${SITE}/${slug}.html`;
  const image = imageUrl(page.hero);
  const collectionCards = page.collections.map((name) =>
    editorialCard(name, `A focused ${name.toLowerCase()} collection designed to help you compare what matters before the next click.`, collectionUrl(slug, name), 'Browse the collection', imageUrl(page.hero, 760))
  ).join('');
  const partnerCards = (page.partners || []).map((partner) => partnerCard(...partner)).join('');
  const curated = partnerCards || page.collections.slice(0, 3).map((name) =>
    editorialCard(name, `Explore our editorial approach to ${name.toLowerCase()}, with practical context and no unverified product claims.`, guideUrl(slug, name), 'Read the buying notes')
  ).join('');
  const guideCards = page.guide.map((tip, i) =>
    `<article class="guide-card"><span>0${i + 1}</span><h3>${esc(tip)}</h3><p>Use this as a quick checkpoint before deciding what belongs in your cart.</p></article>`
  ).join('');
  const related = [1, 2, 3].map((offset) => {
    const item = nextDepartment(slug, offset);
    const relatedPage = ALL_PAGES[item];
    return `<a class="related-card" href="${pageUrl(item)}"><span>${esc(relatedPage.eyebrow)}</span><strong>${esc(relatedPage.name)}</strong><p>${esc(relatedPage.headline)}</p></a>`;
  }).join('');
  const secondaryHero = `<a class="button glass" href="/${slug}-buying-guide.html">Read the guide</a>`;
  const primaryHero = `<a class="button gold" href="/${slug}-collections.html">Browse the Collection</a>`;
  return `${head({ title: `${page.name} | The Straight Cut`, description, canonical, image, breadcrumb: page.name })}<body>${header()}<main id="main"><section class="department-hero" style="--hero:url('${image}')"><div class="hero-shade"></div><div class="hero-content"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="departments.html">Departments</a><span>/</span><span>${esc(page.name)}</span></nav><span class="eyebrow">${esc(page.eyebrow)}</span><h1>${esc(page.headline)}</h1><p>${esc(page.intro)}</p><div class="hero-actions">${primaryHero}${secondaryHero}</div></div><a class="scroll-cue" href="#collections">Keep scrolling <span>↓</span></a></section><div class="anchor-strip"><a href="#collections">Featured collection</a><a href="#curated">Curated shopping</a><a href="/${slug}-buying-guide.html">Buying guide</a><a href="/${pageUrl(nextDepartment(slug))}">Keep browsing</a></div><section id="collections" class="section light"><div class="section-heading"><span class="section-kicker">Featured Collection</span><h2>A better place to begin.</h2><p>Editorially organized so you can browse the idea before chasing the product.</p></div><div class="editorial-grid">${collectionCards}</div></section><section id="curated" class="section ink"><div class="section-heading"><span class="section-kicker">Curated Shopping</span><h2>${partnerCards ? 'Approved destinations, placed with purpose.' : 'Shop the idea. Choose the product later.'}</h2><p>${partnerCards ? 'These approved partners fit this department naturally. Final prices, availability and terms appear on the partner site.' : 'Explore useful themes, compare the qualities that matter and turn a broad shopping idea into a confident shortlist.'}</p></div>${partnerCards ? disclosure() : ''}<div class="partner-grid">${curated}</div></section><section id="guide" class="section warm"><div class="section-heading split"><div><span class="section-kicker">The Buying Guide</span><h2>Four checks before checkout.</h2><p>Useful questions beat impulse regret. Keep the excitement—lose the guesswork.</p></div><a class="text-link" href="/${slug}-buying-guide.html">Read the complete guide →</a></div><div class="guide-grid">${guideCards}</div></section><section id="related" class="section light"><div class="section-heading"><span class="section-kicker">Related Departments</span><h2>There is always another aisle.</h2></div><div class="related-grid">${related}</div></section>${newsletter()}</main>${footer()}<script src="assets/store.js"></script></body></html>`;
}

function collectionPage(slug, page) {
  const image = imageUrl(page.hero, 1800);
  const sections = page.collections.map((name, index) => {
    const destination = guideUrl(slug, name);
    return `<section id="${slugify(name)}" class="section ${index % 2 ? 'warm' : 'light'}"><div class="collection-feature"><a class="collection-feature-image" href="${destination}" aria-label="Read the buying guide for ${esc(name)}"><img loading="lazy" src="${imageUrl(page.hero, 1000)}" alt=""></a><div><span class="section-kicker">Collection ${String(index + 1).padStart(2, '0')}</span><h2><a href="${destination}">${esc(name)}</a></h2><p>This editorial collection helps narrow the choices before shopping. Compare fit, usefulness, care and total cost without relying on invented products, prices or ratings.</p><a class="button dark" href="${destination}">Read Buying Notes</a></div></div></section>`;
  }).join('');
  return `${head({ title: `${page.name} Collections | The Straight Cut`, description: `Explore editorial ${page.name.toLowerCase()} collections and practical next-step buying guidance.`, canonical: `${SITE}/${slug}-collections.html`, image, breadcrumb: `${page.name} Collections` })}<body>${header()}<main id="main"><section class="department-hero compact" style="--hero:url('${image}')"><div class="hero-shade"></div><div class="hero-content"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/${pageUrl(slug)}">${esc(page.name)}</a><span>/</span><span>Collections</span></nav><span class="eyebrow">${esc(page.eyebrow)}</span><h1>${esc(page.name)} collections.</h1><p>Focused editorial paths that turn a broad idea into a useful shortlist.</p></div></section>${sections}<section class="section ink"><div class="section-heading"><span class="section-kicker">Continue Browsing</span><h2>Take the next useful step.</h2></div><a class="button gold" href="/${slug}-buying-guide.html">Open the ${esc(page.name)} Buying Guide</a></section>${newsletter()}</main>${footer()}<script src="assets/store.js"></script></body></html>`;
}

function shoppingExit(slug) {
  if (slug === 'clearance') return { label: 'View Deals', href: '/deals.html' };
  if (slug === 'deals') return { label: 'Explore Hot Finds', href: '/hot-finds.html' };
  if (slug === 'hot-finds') return { label: 'Browse Departments', href: '/departments.html' };
  if (slug === 'refurbished-beauties') return { label: 'Browse Departments', href: '/departments.html' };
  return { label: 'View Deals', href: '/deals.html' };
}

function buyingGuidePage(slug, page) {
  const image = imageUrl(page.hero, 1800);
  const checks = page.guide.map((tip, index) => `<section id="check-${index + 1}" class="section ${index % 2 ? 'warm' : 'light'}"><div class="guide-detail"><span class="guide-number">${String(index + 1).padStart(2, '0')}</span><div><span class="section-kicker">${esc(page.name)} Buying Notes</span><h2>${esc(tip)}</h2><p>Use this checkpoint to compare options consistently. Confirm the details on the final retailer or partner page, and avoid paying for features that do not improve the way you will actually use the purchase.</p></div></div></section>`).join('');
  const exit = shoppingExit(slug);
  const secondaryExit = exit.href === '/departments.html'
    ? { label: 'View Deals', href: '/deals.html' }
    : { label: 'Browse Departments', href: '/departments.html' };
  const onward = [1, 2, 3].map((offset) => {
    const next = nextDepartment(slug, offset);
    const nextPage = ALL_PAGES[next];
    return `<a class="related-card" href="/${pageUrl(next)}"><span>${esc(nextPage.eyebrow)}</span><strong>${esc(nextPage.name)}</strong><p>${esc(nextPage.headline)}</p></a>`;
  }).join('');
  return `${head({ title: `${page.name} Buying Guide | The Straight Cut`, description: `Practical ${page.name.toLowerCase()} buying guidance from The Straight Cut.`, canonical: `${SITE}/${slug}-buying-guide.html`, image, breadcrumb: `${page.name} Buying Guide` })}<body>${header()}<main id="main"><section class="department-hero compact" style="--hero:url('${image}')"><div class="hero-shade"></div><div class="hero-content"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/buying-guides.html">Buying Guides</a><span>/</span><span>${esc(page.name)}</span></nav><span class="eyebrow">The Buying Guide</span><h1>${esc(page.name)}, considered.</h1><p>Four practical checks that move the decision forward without fake urgency or unsupported claims.</p><div class="hero-actions"><a class="button gold" href="${exit.href}">Shop the Collection</a><a class="button glass" href="${secondaryExit.href}">${esc(secondaryExit.label)}</a></div></div></section>${checks}<section class="section ink"><div class="section-heading"><span class="section-kicker">Keep Browsing</span><h2>Continue into a related department.</h2></div><div class="related-grid">${onward}</div></section>${newsletter()}</main>${footer()}<script src="assets/store.js"></script></body></html>`;
}

function collectionGuidePage(slug, page, collection, index) {
  const image = imageUrl(page.hero, 1800);
  const focus = page.guide[index % page.guide.length];
  const checks = [
    [focus, `Start by applying this test specifically to ${collection.toLowerCase()}. Write down the feature, size or condition you actually need before opening a retailer page.`],
    [page.guide[(index + 1) % page.guide.length], `Compare at least two realistic options using the same criteria. Ignore unsupported rankings, invented urgency and features that do not improve the intended use.`],
    [page.guide[(index + 2) % page.guide.length], `Confirm final price, availability, delivery, returns and compatibility at the approved retailer before committing.`],
  ].map(([title, body], itemIndex) => `<section class="section ${itemIndex % 2 ? 'warm' : 'light'}"><div class="guide-detail"><span class="guide-number">${String(itemIndex + 1).padStart(2, '0')}</span><div><span class="section-kicker">${esc(collection)} Buying Notes</span><h2>${esc(title)}</h2><p>${esc(body)}</p></div></div></section>`).join('');
  const exit = shoppingExit(slug);
  const secondaryExit = exit.href === '/departments.html'
    ? { label: 'View Deals', href: '/deals.html' }
    : { label: 'Browse Departments', href: '/departments.html' };
  return `${head({ title: `${collection} Buying Guide | The Straight Cut`, description: `Useful buying notes for the ${collection} collection in ${page.name}.`, canonical: `${SITE}/${slug}-${slugify(collection)}-guide.html`, image, breadcrumb: `${collection} Buying Guide` })}<body>${header()}<main id="main"><section class="department-hero compact" style="--hero:url('${image}')"><div class="hero-shade"></div><div class="hero-content"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/${pageUrl(slug)}">${esc(page.name)}</a><span>/</span><span>${esc(collection)}</span></nav><span class="eyebrow">Collection Buying Guide</span><h1>${esc(collection)}, without the guesswork.</h1><p>Three useful checks written for this collection—not a generic anchor or another editorial loop.</p><div class="hero-actions"><a class="button gold" href="${exit.href}">Shop the Collection</a><a class="button glass" href="${secondaryExit.href}">${esc(secondaryExit.label)}</a></div></div></section>${checks}<section class="section ink"><div class="section-heading"><span class="section-kicker">Next Step</span><h2>Move from research into a real shopping destination.</h2><p>No product-level purchase button appears unless an approved tracked affiliate URL exists.</p></div><div class="hero-actions"><a class="button gold" href="${exit.href}">${esc(exit.label)}</a><a class="button glass" href="/departments.html">Browse Departments</a></div></section>${newsletter()}</main>${footer()}<script src="assets/store.js"></script></body></html>`;
}

function homepage() {
  const heroImage = imageUrl('photo-1441986300917-64674bd600d8', 1800);
  const features = HOME_FEATURES.map(([title, body, href, image]) =>
    `<a class="feature-tile" href="${href}" style="--tile:url('${imageUrl(image, 900)}')"><span>${esc(title)}</span><p>${esc(body)}</p><b>Explore <span aria-hidden="true">→</span></b></a>`
  ).join('');
  const depts = PAGE_ORDER.map((slug) =>
    `<a class="department-tile" href="${pageUrl(slug)}"><img loading="lazy" src="${imageUrl(PAGES[slug].hero, 640)}" alt=""><span><small>Department</small><strong>${esc(PAGES[slug].name)}</strong><em>Explore →</em></span></a>`
  ).join('');
  const budget = BUDGET_EDIT.map(([price, body, href]) => editorialCard(`Best Under ${price}`, body, href, 'Browse the budget edit')).join('');
  const travelCards = [
    partnerCard('hotels', 'City breaks & hotel stays', 'Browse approved hotel options for the next weekend worth taking.', 'Explore Hotels'),
    partnerCard('vrbo', 'Room for everyone', 'Explore vacation homes for family time, group trips and longer stays.', 'Find a Vacation Rental'),
    partnerCard('skylark', 'Travel, elevated', 'Start a premium trip with an approved luxury travel partner.', 'Discover Luxury Travel'),
  ].join('');
  return `${head({ title: 'The Straight Cut | Shop Smarter. Buy Better.', description: 'A premium online department store and shopping publication for smarter browsing across home, technology, travel, lifestyle and more.', canonical: `${SITE}/`, image: heroImage })}<body>${header()}<main id="main"><section class="home-hero" style="--hero:url('${heroImage}')"><div class="hero-shade"></div><div class="home-hero-copy"><span class="eyebrow">The premium shopping edit</span><h1>Shop Smarter.<br><em>Buy Better.</em></h1><p>Discover useful upgrades, timely ideas, beautiful escapes and straight recommendations—organized like a store and edited like a magazine.</p><div class="hero-actions"><a class="button gold" href="/deals.html">Start Browsing</a><a class="button glass" href="#departments">Browse departments</a></div></div><a class="hero-story" href="travel.html"><span>Featured story</span><strong>The getaway edit</strong><small>Hotels, vacation homes and luxury travel →</small></a><a class="scroll-cue" href="#today">Keep scrolling <span>↓</span></a></section><section id="today" class="section light first-section"><div class="section-heading split"><div><span class="section-kicker">Today at The Straight Cut</span><h2>Start with something good.</h2></div><a class="text-link" href="deals.html">See all deals →</a></div><div class="feature-grid">${features}</div></section><section class="marquee" aria-label="Store highlights"><span>NEW DISCOVERIES</span><i>◆</i><span>SMARTER UPGRADES</span><i>◆</i><span>WEEKEND ESCAPES</span><i>◆</i><span>STRAIGHT RECOMMENDATIONS</span></section><section class="section ink"><div class="section-heading"><span class="section-kicker">Editor’s Choice</span><h2>Three ways to spend smarter.</h2><p>Budget edits are planning collections, not price promises. Always verify the live merchant price before purchasing.</p></div><div class="editorial-grid">${budget}</div></section><section id="departments" class="section light"><div class="section-heading split"><div><span class="section-kicker">The Department Store</span><h2>Every aisle is open.</h2><p>Finished destinations with editorial collections, buying guidance and useful next steps.</p></div><a class="text-link" href="departments.html">View all departments →</a></div><div class="department-grid">${depts}</div></section><section class="travel-feature" style="--travel:url('${imageUrl('photo-1500530855697-b586d89ba3ee', 1800)}')"><div><span class="eyebrow">Travel Picks</span><h2>Leave room for somewhere new.</h2><p>Weekend inspiration, hotel ideas, vacation homes and elevated planning through approved travel partners.</p><a class="button gold" href="travel.html">Explore Travel & Getaways</a></div></section><section class="section warm"><div class="section-heading"><span class="section-kicker">Plan the Getaway</span><h2>Approved travel partners.</h2></div>${disclosure()}<div class="partner-grid">${travelCards}</div></section><section class="section light gift-section"><div class="section-heading"><span class="section-kicker">Gift Ideas & Seasonal Collections</span><h2>Good ideas for the people on your list.</h2><p>Browse by interest and occasion without made-up urgency, fake ratings or unverified prices.</p></div><div class="editorial-grid">${editorialCard('The Host Gift Edit', 'Useful, polished ideas for dinners, weekends away and thoughtful thank-yous.', 'gifts.html', 'Browse gift ideas')}${editorialCard('For the Homebody', 'Comfort, calm and small luxuries for a very good night in.', 'home.html', 'Explore Home & Kitchen')}${editorialCard('For the Weekend Explorer', 'Travel inspiration and practical pre-trip reading for the next quick escape.', 'travel.html', 'Plan a getaway')}</div></section>${newsletter()}</main>${footer()}<script src="assets/store.js"></script></body></html>`;
}

function departmentsPage() {
  const cards = PAGE_ORDER.map((slug) =>
    `<a class="department-tile wide" href="${pageUrl(slug)}"><img loading="lazy" src="${imageUrl(PAGES[slug].hero, 760)}" alt=""><span><small>${esc(PAGES[slug].eyebrow)}</small><strong>${esc(PAGES[slug].name)}</strong><p>${esc(PAGES[slug].intro)}</p><em>Enter department →</em></span></a>`
  ).join('');
  const image = imageUrl('photo-1441986300917-64674bd600d8', 1800);
  return `${head({ title: 'All Departments | The Straight Cut', description: 'Browse every finished department at The Straight Cut, from deals and travel to home, technology, pets, books and senior living.', canonical: `${SITE}/departments.html`, image, breadcrumb: 'Departments' })}<body>${header()}<main id="main"><section class="department-hero compact" style="--hero:url('${image}')"><div class="hero-shade"></div><div class="hero-content"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>Departments</span></nav><span class="eyebrow">The Department Store</span><h1>Every aisle is open.</h1><p>Browse complete editorial destinations designed to keep the next useful idea one click away.</p></div></section><section class="section light"><div class="department-grid">${cards}</div></section>${newsletter()}</main>${footer()}<script src="assets/store.js"></script></body></html>`;
}

await writeFile(join(ROOT, 'index.html'), homepage(), 'utf8');
await writeFile(join(ROOT, 'departments.html'), departmentsPage(), 'utf8');
for (const slug of PAGE_ORDER) await writeFile(join(ROOT, pageUrl(slug)), departmentPage(slug, PAGES[slug]), 'utf8');
for (const [slug, page] of Object.entries(SECONDARY_PAGES)) {
  await writeFile(join(ROOT, pageUrl(slug)), departmentPage(slug, page), 'utf8');
}
for (const [slug, page] of Object.entries(ALL_PAGES)) {
  await writeFile(join(ROOT, `${slug}-collections.html`), collectionPage(slug, page), 'utf8');
  await writeFile(join(ROOT, `${slug}-buying-guide.html`), buyingGuidePage(slug, page), 'utf8');
  for (const [index, collection] of page.collections.entries()) {
    await writeFile(join(ROOT, `${slug}-${slugify(collection)}-guide.html`), collectionGuidePage(slug, page, collection, index), 'utf8');
  }
}
console.log(`Built homepage, departments hub, ${STOREFRONT_ORDER.length} departments, ${STOREFRONT_ORDER.length} collection pages, ${STOREFRONT_ORDER.length} department guides and ${STOREFRONT_ORDER.length * 4} collection guides.`);
