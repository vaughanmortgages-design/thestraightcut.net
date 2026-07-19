// The Straight Cut — Department data (single source of truth)
// -----------------------------------------------------------------------------
// This module defines every department shown across the site. The build script
// (build-departments.mjs) turns each entry into a static department page using
// the shared reusable components, so page content lives here — never duplicated
// in markup. To add or edit a department, change this file and re-run:
//   node scripts/build-departments.mjs
// -----------------------------------------------------------------------------

// Affiliate tag preserved from the existing site (Amazon Associates).
export const AMAZON_TAG = 'straightcutgu-20';

// Pool of image IDs already used on the site (guaranteed to load) reused for
// department heroes and product cards so nothing points at a missing asset.
export const IMAGE_POOL = [
  '1454165804606-c3d57bc86b40', '1455390582262-044cdead277a', '1472851294608-062f824d29cc',
  '1483985988355-763728e1935b', '1486406146926-c627a92ad1ab', '1490481651871-ab68de25d43d',
  '1498049794561-7780e7231661', '1505693416388-ac5ce068fe85', '1505740420928-5e560c06d30e',
  '1512909006721-3d6018887383', '1515169067868-5387ec356754', '1516321318423-f06f85e504b3',
  '1516321497487-e288fb19713f', '1518546305927-5a555bb7020d', '1518709268805-4e9042af9f23',
  '1519125323398-675f0ddb6308', '1549465220-1a8b9238cd48', '1554200876-56c2f25224fa',
  '1556740749-887f6717d7e4', '1556909114-f6e7ad7d3136', '1607082349566-187342175e2f',
  '1621607505925-dc5e7c4fe9e5',
];

// Master registry of every department (slug + display name). Used to build the
// nav, footer, departments hub, related-department cards and the search index.
// `generated:true` means the build script owns the page; others are existing
// pages that are preserved as-is and only linked to.
export const REGISTRY = [
  { slug: 'electronics', name: 'Electronics', generated: true },
  { slug: 'computers', name: 'Computers', generated: true },
  { slug: 'phones-tablets', name: 'Phones & Tablets', generated: true },
  { slug: 'gaming', name: 'Gaming', generated: true },
  { slug: 'home', name: 'Home', generated: true },
  { slug: 'kitchen', name: 'Kitchen', generated: true },
  { slug: 'furniture', name: 'Furniture', generated: true },
  { slug: 'garden', name: 'Garden & Outdoor', generated: true },
  { slug: 'tools', name: 'Tools', generated: true },
  { slug: 'office', name: 'Office', generated: true },
  { slug: 'sports-outdoors', name: 'Sports & Outdoors', generated: true },
  { slug: 'health-beauty', name: 'Health & Beauty', generated: true },
  { slug: 'fashion', name: 'Fashion', generated: true },
  { slug: 'watches-jewelry', name: 'Watches & Jewelry', generated: true },
  { slug: 'toys-kids', name: 'Toys & Kids', generated: true },
  { slug: 'books', name: 'Books', generated: true },
  { slug: 'pets', name: 'Pet Supplies', generated: true },
  { slug: 'auto', name: 'Automotive', generated: true },
  { slug: 'travel', name: 'Travel', generated: false },
  { slug: 'gifts', name: 'Gifts', generated: false },
];

// Convenience: display name for a slug (used by related-department cards).
export const NAME_BY_SLUG = Object.fromEntries(REGISTRY.map((d) => [d.slug, d.name]));

// -----------------------------------------------------------------------------
// Department content. Each product/category `q` becomes a real Amazon or eBay
// search link at build time, so every card is a working destination.
// -----------------------------------------------------------------------------

// Compact helpers for authoring below.
const C = (name, q, market = 'amazon') => ({ name, q, market });
const P = (name, price, q) => ({ name, price, q });
const G = (h, p) => ({ h, p });

export const DEPARTMENTS = [
  {
    slug: 'electronics',
    name: 'Electronics',
    hero: '1486406146926-c627a92ad1ab',
    tagline: 'Tech that earns its spot on the desk.',
    intro:
      'Chargers, cables, audio and everyday gadgets, sorted so the next click is obvious. Shop new on Amazon or hunt refurbished value on eBay — both paths are one tap away.',
    cats: [
      C('Headphones & Earbuds', 'wireless headphones'),
      C('Chargers & Cables', 'usb c charger'),
      C('Smart Home', 'smart home devices'),
      C('Cameras', 'digital camera'),
      C('Wearables', 'smart watch'),
      C('Refurbished Tech', 'refurbished electronics', 'ebay'),
    ],
    products: [
      P('Noise-Cancelling Earbuds', '$79', 'noise cancelling earbuds'),
      P('65W USB-C Charger', '$34', '65w usb c charger'),
      P('Smart Speaker', '$49', 'smart speaker'),
      P('Portable SSD 1TB', '$99', 'portable ssd 1tb'),
      P('Streaming Stick 4K', '$44', 'streaming stick 4k'),
      P('Bluetooth Soundbar', '$119', 'bluetooth soundbar'),
      P('Wireless Charging Pad', '$24', 'wireless charging pad'),
      P('Action Camera', '$149', 'action camera'),
    ],
    guide: {
      intro: 'A few quick checks save the most returns in electronics.',
      tips: [
        G('Match the spec to the use', 'Buy the charger wattage and cable rating your device actually needs — higher numbers are not always better value.'),
        G('Refurbished can be smart', 'Certified refurbished gear on eBay often carries a warranty and saves 20–40% versus boxed-new.'),
        G('Check the port, not the brand', 'USB-C, Lightning and micro-USB are not interchangeable; confirm the connector before adding to cart.'),
        G('Read the recent reviews', 'Filter reviews to the last few months to catch firmware or build-quality changes.'),
      ],
    },
    related: ['computers', 'phones-tablets', 'gaming', 'office'],
  },
  {
    slug: 'computers',
    name: 'Computers',
    hero: '1518709268805-4e9042af9f23',
    tagline: 'Laptops, desktops and the gear around them.',
    intro:
      'From work-from-home laptops to monitors, keyboards and storage, this page groups the parts of a computing setup so you can build or upgrade without guesswork.',
    cats: [
      C('Laptops', 'laptop computer'),
      C('Monitors', 'computer monitor'),
      C('Keyboards & Mice', 'mechanical keyboard'),
      C('Storage & Drives', 'external hard drive'),
      C('Networking', 'wifi router'),
      C('Used & Refurbished', 'refurbished laptop', 'ebay'),
    ],
    products: [
      P('14" Laptop', '$649', '14 inch laptop'),
      P('27" 4K Monitor', '$329', '27 inch 4k monitor'),
      P('Mechanical Keyboard', '$79', 'mechanical keyboard'),
      P('Wireless Mouse', '$29', 'wireless mouse'),
      P('2TB External SSD', '$159', '2tb external ssd'),
      P('Mesh Wi-Fi System', '$189', 'mesh wifi system'),
      P('USB-C Docking Station', '$99', 'usb c docking station'),
      P('Laptop Stand', '$34', 'laptop stand'),
    ],
    guide: {
      intro: 'Buy for the workload you have, not the one you imagine.',
      tips: [
        G('RAM and storage first', 'For everyday use, 16GB of RAM and an SSD matter more than a faster processor.'),
        G('Screen size vs portability', 'A 14" laptop travels well; a 15–16" screen is easier for long work sessions.'),
        G('Refresh the network too', 'A modern router or mesh system often fixes “slow laptop” complaints that are really Wi-Fi.'),
        G('Consider certified refurb', 'Business-class refurbished laptops are durable and heavily discounted.'),
      ],
    },
    related: ['electronics', 'office', 'gaming', 'phones-tablets'],
  },
  {
    slug: 'phones-tablets',
    name: 'Phones & Tablets',
    hero: '1516321318423-f06f85e504b3',
    tagline: 'Devices, cases and everyday accessories.',
    intro:
      'Cases, chargers, tablets and the small add-ons that keep phones running. Grab accessories new on Amazon or find unlocked and refurbished handsets on eBay.',
    cats: [
      C('Cases & Covers', 'phone case'),
      C('Screen Protectors', 'screen protector'),
      C('Tablets', 'tablet'),
      C('Power Banks', 'power bank'),
      C('Car Mounts', 'phone car mount'),
      C('Unlocked Phones', 'unlocked phone', 'ebay'),
    ],
    products: [
      P('Rugged Phone Case', '$24', 'rugged phone case'),
      P('Tempered Glass 2-Pack', '$14', 'tempered glass screen protector'),
      P('10" Tablet', '$179', '10 inch tablet'),
      P('20000mAh Power Bank', '$39', '20000mah power bank'),
      P('Magnetic Car Mount', '$19', 'magnetic phone car mount'),
      P('Tablet Keyboard Case', '$49', 'tablet keyboard case'),
      P('USB-C Fast Cable', '$12', 'usb c fast charging cable'),
      P('Phone Gimbal', '$89', 'phone gimbal stabilizer'),
    ],
    guide: {
      intro: 'Protect first, then personalise.',
      tips: [
        G('Case + glass on day one', 'The cheapest insurance for a phone is a case and a tempered-glass protector fitted before first use.'),
        G('Watch charging standards', 'Match your phone’s fast-charge standard so a new brick actually charges quickly.'),
        G('Tablets for media and notes', 'A mid-range tablet handles streaming, reading and note-taking without laptop pricing.'),
        G('Unlocked saves long term', 'Unlocked handsets avoid carrier lock-in and are easy to resell.'),
      ],
    },
    related: ['electronics', 'computers', 'travel', 'gaming'],
  },
  {
    slug: 'gaming',
    name: 'Gaming',
    hero: '1621607505925-dc5e7c4fe9e5',
    tagline: 'Consoles, controllers and the setup around them.',
    intro:
      'Controllers, headsets, chairs and storage for console and PC players. Pick up accessories new, or browse eBay for pre-owned consoles and collectible titles.',
    cats: [
      C('Controllers', 'game controller'),
      C('Gaming Headsets', 'gaming headset'),
      C('Gaming Chairs', 'gaming chair'),
      C('Console Storage', 'console storage expansion'),
      C('PC Accessories', 'gaming mouse'),
      C('Pre-owned Consoles', 'used game console', 'ebay'),
    ],
    products: [
      P('Wireless Controller', '$69', 'wireless game controller'),
      P('Surround Headset', '$59', 'surround gaming headset'),
      P('Ergonomic Gaming Chair', '$199', 'ergonomic gaming chair'),
      P('1TB Expansion Card', '$149', 'console storage expansion card'),
      P('RGB Gaming Mouse', '$39', 'rgb gaming mouse'),
      P('Mechanical Gaming Keyboard', '$89', 'mechanical gaming keyboard'),
      P('Charging Dock', '$29', 'controller charging dock'),
      P('Capture Card', '$129', 'game capture card'),
    ],
    guide: {
      intro: 'Comfort and audio beat flashy extras.',
      tips: [
        G('Headset before graphics', 'Positional audio changes how you play more than most cosmetic upgrades.'),
        G('Storage fills fast', 'Modern titles are huge — plan for an expansion drive early.'),
        G('Wired for competitive', 'Wired controllers and mice cut latency for serious play.'),
        G('Pre-owned for back catalogue', 'eBay is the best route to older consoles and out-of-print games.'),
      ],
    },
    related: ['electronics', 'computers', 'toys-kids', 'phones-tablets'],
  },
  {
    slug: 'home',
    name: 'Home',
    hero: '1505740420928-5e560c06d30e',
    tagline: 'Decor, storage and quiet quality-of-life upgrades.',
    intro:
      'Lighting, storage, cleaning and the small changes that make a space work harder. Everything links to shoppable picks so you can refresh a room without a full renovation.',
    cats: [
      C('Storage & Organization', 'home storage organization'),
      C('Lighting', 'led lighting'),
      C('Bedding', 'bedding set'),
      C('Cleaning', 'cleaning supplies'),
      C('Decor', 'home decor'),
      C('Vacuums', 'robot vacuum'),
    ],
    products: [
      P('Storage Bin Set', '$34', 'storage bins with lids'),
      P('LED Floor Lamp', '$59', 'led floor lamp'),
      P('Cooling Duvet', '$79', 'cooling duvet insert'),
      P('Robot Vacuum', '$229', 'robot vacuum'),
      P('Over-Door Organizer', '$24', 'over the door organizer'),
      P('Scented Candle Set', '$29', 'scented candle set'),
      P('Cordless Stick Vacuum', '$189', 'cordless stick vacuum'),
      P('Wall Shelf Set', '$39', 'floating wall shelves'),
    ],
    guide: {
      intro: 'Fix friction points before buying decor.',
      tips: [
        G('Solve the daily annoyance', 'The best upgrade is usually the thing you trip over or search for every day.'),
        G('Layer the lighting', 'A lamp or two beats one overhead light for making a room feel finished.'),
        G('Storage that you can reach', 'Bins and shelves only help if the things you use most stay within arm’s reach.'),
        G('Buy washable', 'Removable, washable covers keep bedding and cushions looking new far longer.'),
      ],
    },
    related: ['kitchen', 'furniture', 'garden', 'tools'],
  },
  {
    slug: 'kitchen',
    name: 'Kitchen',
    hero: '1556909114-f6e7ad7d3136',
    tagline: 'Tools that actually get used.',
    intro:
      'Prep tools, cookware and organizers chosen for real cooking, not gadget drawers. Pair this page with the Kitchen Upgrades guide for picks worth buying and ones worth skipping.',
    cats: [
      C('Cookware', 'cookware set'),
      C('Small Appliances', 'kitchen appliances'),
      C('Prep & Tools', 'kitchen prep tools'),
      C('Storage & Organization', 'kitchen storage'),
      C('Coffee & Tea', 'coffee maker'),
      C('Bakeware', 'bakeware set'),
    ],
    products: [
      P('Nonstick Pan Set', '$79', 'nonstick frying pan set'),
      P('Air Fryer', '$99', 'air fryer'),
      P('Chef’s Knife', '$49', 'chef knife'),
      P('Food Storage Set', '$34', 'glass food storage containers'),
      P('Drip Coffee Maker', '$59', 'drip coffee maker'),
      P('Stand Mixer', '$249', 'stand mixer'),
      P('Cutting Board Set', '$29', 'cutting board set'),
      P('Immersion Blender', '$44', 'immersion blender'),
    ],
    guide: {
      intro: 'Buy the few tools you reach for daily.',
      tips: [
        G('One good knife wins', 'A single sharp chef’s knife replaces a drawer of cheap ones.'),
        G('Appliances that earn counter space', 'An air fryer or mixer only helps if it lives out and gets used.'),
        G('Match cookware to your stove', 'Induction needs magnetic bases — check before buying a set.'),
        G('Storage stops waste', 'Airtight, stackable containers keep food longer and clear the counter.'),
      ],
    },
    related: ['home', 'furniture', 'health-beauty', 'garden'],
  },
  {
    slug: 'furniture',
    name: 'Furniture',
    hero: '1554200876-56c2f25224fa',
    tagline: 'Seating, desks and storage that fit the room.',
    intro:
      'Desks, chairs, shelving and accent pieces for spaces that need to work as hard as they look. Measure once, then shop pieces that fit the way you live.',
    cats: [
      C('Desks', 'computer desk'),
      C('Office Chairs', 'ergonomic office chair'),
      C('Shelving', 'bookshelf'),
      C('Sofas & Seating', 'accent chair'),
      C('Bedroom', 'bedroom furniture'),
      C('Entryway', 'entryway storage bench'),
    ],
    products: [
      P('Standing Desk', '$329', 'standing desk'),
      P('Ergonomic Chair', '$219', 'ergonomic office chair'),
      P('5-Tier Bookshelf', '$89', '5 tier bookshelf'),
      P('Accent Chair', '$179', 'accent chair'),
      P('Storage Bench', '$99', 'storage bench'),
      P('Nightstand', '$59', 'nightstand'),
      P('TV Stand', '$139', 'tv stand'),
      P('Folding Table', '$49', 'folding table'),
    ],
    guide: {
      intro: 'Measure the space and the doorway.',
      tips: [
        G('Measure before you buy', 'Note the room, the wall and the door it has to fit through.'),
        G('Sit-stand for long days', 'An adjustable desk pays off if you work from home most days.'),
        G('Chairs are worth the spend', 'You spend hours in a work chair — support beats style here.'),
        G('Multi-use in small spaces', 'Storage benches and folding tables do double duty in tight rooms.'),
      ],
    },
    related: ['home', 'office', 'kitchen', 'garden'],
  },
  {
    slug: 'garden',
    name: 'Garden & Outdoor',
    hero: '1518546305927-5a555bb7020d',
    tagline: 'Grow, tidy and enjoy the outdoor space.',
    intro:
      'Tools, planters, lighting and patio gear for yards big and small. Start seeds, tame the lawn or set up a weekend patio — the essentials are grouped here.',
    cats: [
      C('Garden Tools', 'garden tools'),
      C('Planters & Pots', 'planters'),
      C('Outdoor Lighting', 'solar outdoor lights'),
      C('Lawn Care', 'lawn care'),
      C('Patio Furniture', 'patio furniture'),
      C('Grilling', 'bbq grill'),
    ],
    products: [
      P('Garden Tool Set', '$44', 'garden tool set'),
      P('Raised Planter Box', '$69', 'raised garden planter box'),
      P('Solar Path Lights', '$34', 'solar path lights'),
      P('Cordless Trimmer', '$119', 'cordless string trimmer'),
      P('Patio Bistro Set', '$189', 'patio bistro set'),
      P('Charcoal Grill', '$149', 'charcoal grill'),
      P('Hose Reel', '$59', 'garden hose reel'),
      P('Weather Station', '$39', 'wireless weather station'),
    ],
    guide: {
      intro: 'Match effort to the season and the space.',
      tips: [
        G('Right tool, less strain', 'Ergonomic, cordless tools make small yards fast and big yards bearable.'),
        G('Containers for flexibility', 'Planters let you garden on patios and move plants to the light.'),
        G('Solar for easy lighting', 'Solar path and string lights skip the wiring and switch on themselves.'),
        G('Cover what you leave out', 'Furniture and grill covers dramatically extend outdoor gear life.'),
      ],
    },
    related: ['tools', 'home', 'sports-outdoors', 'furniture'],
  },
  {
    slug: 'tools',
    name: 'Tools',
    hero: '1607082349566-187342175e2f',
    tagline: 'Hardware, workshop helpers and jobsite-ready gear.',
    intro:
      'Power tools, hand tools and the storage to keep them in order — picked for DIYers and trades alike. Build a kit that handles the jobs you actually take on.',
    cats: [
      C('Power Tools', 'power tools'),
      C('Hand Tools', 'hand tool set'),
      C('Tool Storage', 'tool box'),
      C('Measuring & Layout', 'laser level'),
      C('Fasteners', 'screw assortment kit'),
      C('Safety Gear', 'safety glasses'),
    ],
    products: [
      P('20V Drill/Driver', '$99', '20v cordless drill driver'),
      P('Impact Driver', '$119', 'impact driver'),
      P('Socket Set', '$79', 'socket wrench set'),
      P('Rolling Tool Chest', '$179', 'rolling tool chest'),
      P('Laser Level', '$49', 'self leveling laser level'),
      P('LED Work Light', '$34', 'rechargeable led work light'),
      P('Tape Measure 3-Pack', '$24', 'tape measure'),
      P('Safety Glasses Pack', '$14', 'safety glasses'),
    ],
    guide: {
      intro: 'Start with a platform, then add to it.',
      tips: [
        G('Commit to one battery', 'Pick a cordless brand and buy bare tools that share its batteries.'),
        G('Buy the drill and driver', 'A drill/driver plus an impact driver covers most household jobs.'),
        G('Storage keeps you fast', 'A chest or organized bag saves more time than another gadget.'),
        G('Never skip safety', 'Glasses, gloves and hearing protection are the cheapest tools you’ll own.'),
      ],
    },
    related: ['garden', 'auto', 'home', 'office'],
  },
  {
    slug: 'office',
    name: 'Office',
    hero: '1498049794561-7780e7231661',
    tagline: 'A workspace that helps you focus.',
    intro:
      'Desks, ergonomics, supplies and the small upgrades that make a home office comfortable and organised. Set up a space you can work in all day.',
    cats: [
      C('Desk Setup', 'desk organizer'),
      C('Ergonomics', 'ergonomic accessories'),
      C('Printers & Ink', 'printer'),
      C('Stationery', 'office supplies'),
      C('Cable Management', 'cable management'),
      C('Webcams & Audio', 'webcam'),
    ],
    products: [
      P('Monitor Arm', '$59', 'single monitor arm'),
      P('Laptop Riser', '$34', 'laptop riser stand'),
      P('All-in-One Printer', '$129', 'all in one printer'),
      P('Desk Organizer Set', '$24', 'desk organizer set'),
      P('1080p Webcam', '$49', '1080p webcam'),
      P('Under-Desk Drawer', '$29', 'under desk drawer'),
      P('Anti-Fatigue Mat', '$44', 'anti fatigue mat'),
      P('Cable Management Kit', '$19', 'cable management kit'),
    ],
    guide: {
      intro: 'Fix posture and clutter first.',
      tips: [
        G('Get the screen to eye level', 'A riser or arm cuts neck strain more than any other upgrade.'),
        G('Tame the cables once', 'A clip-and-sleeve kit makes the whole desk look and feel calmer.'),
        G('Good audio and video', 'A decent webcam and mic matter on every call — buy once.'),
        G('Keep supplies stocked', 'A small buffer of paper, ink and basics avoids workflow stalls.'),
      ],
    },
    related: ['computers', 'furniture', 'electronics', 'books'],
  },
  {
    slug: 'sports-outdoors',
    name: 'Sports & Outdoors',
    hero: '1518709268805-4e9042af9f23',
    tagline: 'Train, hike, camp and play.',
    intro:
      'Fitness gear, camping kit and everyday active essentials for indoors and out. Whether you’re building a home gym or packing for a trail, start here.',
    cats: [
      C('Home Gym', 'home gym equipment'),
      C('Camping', 'camping gear'),
      C('Cycling', 'cycling accessories'),
      C('Running', 'running gear'),
      C('Water Sports', 'water sports gear'),
      C('Team Sports', 'team sports equipment'),
    ],
    products: [
      P('Adjustable Dumbbells', '$179', 'adjustable dumbbells'),
      P('Yoga Mat', '$29', 'yoga mat'),
      P('2-Person Tent', '$99', '2 person tent'),
      P('Insulated Water Bottle', '$24', 'insulated water bottle'),
      P('Resistance Bands Set', '$19', 'resistance bands set'),
      P('Bike Repair Kit', '$34', 'bike repair kit'),
      P('Camping Stove', '$49', 'portable camping stove'),
      P('Fitness Tracker', '$79', 'fitness tracker'),
    ],
    guide: {
      intro: 'Consistency beats equipment.',
      tips: [
        G('Start with versatile gear', 'Adjustable dumbbells and bands cover a whole home workout in little space.'),
        G('Hydration and layers', 'A good bottle and layering system matter on every outdoor outing.'),
        G('Pack light, pack right', 'Compact, multi-use camping gear beats a truckload of single-use kit.'),
        G('Track to stay honest', 'A simple tracker keeps training consistent without a coach.'),
      ],
    },
    related: ['health-beauty', 'garden', 'travel', 'fashion'],
  },
  {
    slug: 'health-beauty',
    name: 'Health & Beauty',
    hero: '1512909006721-3d6018887383',
    tagline: 'Skincare, grooming and everyday wellness.',
    intro:
      'Skincare, hair, grooming and wellness picks that fit a real routine. Restock the essentials or try the tools that make daily care faster.',
    cats: [
      C('Skincare', 'skincare'),
      C('Hair Care', 'hair care'),
      C('Grooming', 'grooming kit'),
      C('Oral Care', 'electric toothbrush'),
      C('Vitamins', 'vitamins supplements'),
      C('Wellness Devices', 'massage gun'),
    ],
    products: [
      P('Vitamin C Serum', '$29', 'vitamin c serum'),
      P('Electric Toothbrush', '$59', 'electric toothbrush'),
      P('Hair Dryer', '$49', 'ionic hair dryer'),
      P('Beard Trimmer', '$39', 'beard trimmer'),
      P('Massage Gun', '$99', 'massage gun'),
      P('Daily Multivitamin', '$24', 'daily multivitamin'),
      P('Facial Cleanser', '$18', 'facial cleanser'),
      P('LED Vanity Mirror', '$44', 'led vanity mirror'),
    ],
    guide: {
      intro: 'Keep the routine simple and consistent.',
      tips: [
        G('Fewer, better products', 'A cleanser, moisturiser and sunscreen out-perform a crowded shelf.'),
        G('Tools that save time', 'An electric toothbrush or good trimmer pays back every morning.'),
        G('Recovery counts', 'Simple wellness tools help after training and long days.'),
        G('Check the ingredients', 'Match actives to your skin type rather than chasing trends.'),
      ],
    },
    related: ['fashion', 'sports-outdoors', 'kitchen', 'toys-kids'],
  },
  {
    slug: 'fashion',
    name: 'Fashion',
    hero: '1490481651871-ab68de25d43d',
    tagline: 'Wardrobe staples and finishing touches.',
    intro:
      'Everyday apparel, footwear and accessories that mix and match. Build a wardrobe of reliable staples, then add the pieces that make an outfit yours.',
    cats: [
      C('Men’s Apparel', 'mens clothing'),
      C('Women’s Apparel', 'womens clothing'),
      C('Footwear', 'shoes'),
      C('Bags & Accessories', 'bags accessories'),
      C('Activewear', 'activewear'),
      C('Cold Weather', 'winter jacket'),
    ],
    products: [
      P('Everyday Sneakers', '$69', 'everyday sneakers'),
      P('Crewneck Sweater', '$39', 'crewneck sweater'),
      P('Weekender Bag', '$59', 'weekender bag'),
      P('Leather Belt', '$29', 'leather belt'),
      P('Packable Rain Jacket', '$49', 'packable rain jacket'),
      P('Athletic Leggings', '$34', 'athletic leggings'),
      P('Wool Socks 4-Pack', '$24', 'wool socks'),
      P('Sunglasses', '$44', 'polarized sunglasses'),
    ],
    guide: {
      intro: 'Staples first, statement second.',
      tips: [
        G('Build around neutrals', 'A few neutral staples mix into far more outfits than trend pieces.'),
        G('Fit over label', 'A well-fitting basic looks better than an ill-fitting designer piece.'),
        G('Invest in footwear', 'Shoes and a good jacket are worn most — spend there.'),
        G('Care extends life', 'Wash cold, hang dry and rotate to keep clothes looking new.'),
      ],
    },
    related: ['watches-jewelry', 'health-beauty', 'travel', 'sports-outdoors'],
  },
  {
    slug: 'watches-jewelry',
    name: 'Watches & Jewelry',
    hero: '1519125323398-675f0ddb6308',
    tagline: 'Timepieces and pieces worth keeping.',
    intro:
      'Watches, everyday jewelry and gift-ready pieces. Shop new on Amazon or explore vintage and collectible finds on eBay.',
    cats: [
      C('Men’s Watches', 'mens watch'),
      C('Women’s Watches', 'womens watch'),
      C('Smartwatches', 'smartwatch'),
      C('Necklaces', 'necklace'),
      C('Rings', 'ring'),
      C('Vintage & Collectible', 'vintage watch', 'ebay'),
    ],
    products: [
      P('Automatic Watch', '$189', 'automatic watch'),
      P('Minimalist Watch', '$79', 'minimalist watch'),
      P('Smartwatch', '$149', 'smartwatch'),
      P('Sterling Necklace', '$49', 'sterling silver necklace'),
      P('Stud Earrings', '$34', 'stud earrings'),
      P('Watch Winder', '$59', 'watch winder'),
      P('Leather Watch Band', '$24', 'leather watch band'),
      P('Jewelry Box', '$39', 'jewelry box'),
    ],
    guide: {
      intro: 'Buy pieces you’ll actually wear.',
      tips: [
        G('One versatile watch', 'A neutral watch that suits work and weekends beats a drawer of niche pieces.'),
        G('Mind the movement', 'Automatic, quartz and smart each suit different habits — pick for yours.'),
        G('Care for metals', 'Store pieces dry and separate to avoid scratches and tarnish.'),
        G('Vintage rewards patience', 'eBay is the place for collectible and discontinued models.'),
      ],
    },
    related: ['fashion', 'electronics', 'gifts', 'health-beauty'],
  },
  {
    slug: 'toys-kids',
    name: 'Toys & Kids',
    hero: '1515169067868-5387ec356754',
    tagline: 'Play, learn and everyday kid gear.',
    intro:
      'Toys, games and practical gear across ages and stages. Find the birthday hit, the rainy-day builder or the everyday essentials parents actually reuse.',
    cats: [
      C('Building & STEM', 'stem building toys'),
      C('Games & Puzzles', 'board games kids'),
      C('Outdoor Play', 'outdoor toys'),
      C('Baby & Toddler', 'baby toddler toys'),
      C('Arts & Crafts', 'kids arts and crafts'),
      C('Learning', 'educational toys'),
    ],
    products: [
      P('Building Block Set', '$39', 'building block set'),
      P('Family Board Game', '$29', 'family board game'),
      P('Ride-On Scooter', '$59', 'kids scooter'),
      P('STEM Robot Kit', '$49', 'stem robot kit'),
      P('Art Supply Case', '$24', 'kids art supply set'),
      P('Wooden Puzzle Set', '$19', 'wooden puzzle set'),
      P('Plush Toy', '$18', 'plush toy'),
      P('Toy Storage Bins', '$34', 'toy storage bins'),
    ],
    guide: {
      intro: 'Choose open-ended over one-note.',
      tips: [
        G('Open-ended lasts longer', 'Blocks, kits and craft sets get replayed far more than single-use toys.'),
        G('Match the age range', 'Check the recommended age for both safety and enjoyment.'),
        G('Storage keeps peace', 'Labelled bins make cleanup a kid-sized job, not a parent’s.'),
        G('Learning can be play', 'STEM and puzzle toys sneak skills into genuinely fun playtime.'),
      ],
    },
    related: ['books', 'gaming', 'sports-outdoors', 'health-beauty'],
  },
  {
    slug: 'books',
    name: 'Books',
    hero: '1516321497487-e288fb19713f',
    tagline: 'Reads for every shelf and screen.',
    intro:
      'Fiction, non-fiction, kids’ titles and the accessories that make reading easier. Browse bestsellers and back-catalogue picks, print or digital.',
    cats: [
      C('Fiction', 'best fiction books'),
      C('Non-Fiction', 'non fiction books'),
      C('Kids & Young Adult', 'childrens books'),
      C('Cookbooks', 'cookbooks'),
      C('E-Readers', 'e reader'),
      C('Used & Rare', 'used books', 'ebay'),
    ],
    products: [
      P('Bestseller Fiction', '$18', 'bestselling fiction'),
      P('Popular Non-Fiction', '$22', 'popular non fiction'),
      P('Kids Picture Book', '$14', 'kids picture book'),
      P('Bestselling Cookbook', '$29', 'bestselling cookbook'),
      P('E-Reader', '$139', 'e reader'),
      P('Reading Light', '$16', 'clip on reading light'),
      P('Bookends Set', '$24', 'bookends'),
      P('Book Stand', '$19', 'book stand'),
    ],
    guide: {
      intro: 'Make reading easy to reach.',
      tips: [
        G('Mix formats', 'Print for keepers, e-reader for travel and late-night reading.'),
        G('Follow a series or author', 'Back-catalogue titles are cheap and keep the momentum going.'),
        G('Light it well', 'A clip light or good lamp makes long reading comfortable.'),
        G('Used for value', 'eBay and used listings are great for out-of-print and bargain finds.'),
      ],
    },
    related: ['toys-kids', 'office', 'kitchen', 'travel'],
  },
  {
    slug: 'pets',
    name: 'Pet Supplies',
    hero: '1483985988355-763728e1935b',
    tagline: 'Everyday care, walk-time gear and home-friendly picks.',
    intro:
      'Food storage, toys, grooming and travel gear for dogs, cats and small pets. Keep the essentials stocked and daily care simple.',
    cats: [
      C('Dog Supplies', 'dog supplies'),
      C('Cat Supplies', 'cat supplies'),
      C('Feeding', 'pet feeder'),
      C('Grooming', 'pet grooming kit'),
      C('Beds & Crates', 'dog bed'),
      C('Travel Gear', 'pet travel carrier'),
    ],
    products: [
      P('Orthopedic Dog Bed', '$59', 'orthopedic dog bed'),
      P('Automatic Feeder', '$49', 'automatic pet feeder'),
      P('Cat Scratching Tower', '$69', 'cat scratching tower'),
      P('No-Pull Harness', '$29', 'no pull dog harness'),
      P('Grooming Kit', '$34', 'pet grooming kit'),
      P('Travel Carrier', '$44', 'pet travel carrier'),
      P('Food Storage Bin', '$24', 'pet food storage container'),
      P('Interactive Toy', '$18', 'interactive pet toy'),
    ],
    guide: {
      intro: 'Comfort, safety and easy cleanup.',
      tips: [
        G('Size the bed and harness', 'Measure your pet — a good fit means comfort and safety.'),
        G('Store food airtight', 'Sealed bins keep kibble fresh and pests out.'),
        G('Groom at home', 'A basic kit reduces trips and keeps coats healthy between visits.'),
        G('Travel ready', 'A sturdy carrier makes vet visits and trips far less stressful.'),
      ],
    },
    related: ['home', 'auto', 'health-beauty', 'travel'],
  },
  {
    slug: 'auto',
    name: 'Automotive',
    hero: '1549465220-1a8b9238cd48',
    tagline: 'Accessories, road-trip gear and parts.',
    intro:
      'Dash cams, organizers, care kits and road-trip add-ons for daily drivers. Shop accessories new on Amazon or find parts and OEM pieces on eBay.',
    cats: [
      C('Dash Cams', 'dash cam'),
      C('Interior Accessories', 'car organizer'),
      C('Car Care', 'car detailing kit'),
      C('Electronics', 'car charger'),
      C('Emergency Gear', 'car emergency kit'),
      C('Parts', 'car parts', 'ebay'),
    ],
    products: [
      P('2K Dash Cam', '$89', '2k dash cam'),
      P('Trunk Organizer', '$29', 'car trunk organizer'),
      P('Detailing Kit', '$44', 'car detailing kit'),
      P('Fast Car Charger', '$19', 'usb c car charger'),
      P('Jump Starter', '$79', 'portable jump starter'),
      P('Seat Gap Filler', '$14', 'car seat gap filler'),
      P('Tire Inflator', '$49', 'portable tire inflator'),
      P('Phone Mount', '$18', 'car phone mount'),
    ],
    guide: {
      intro: 'Safety and upkeep first.',
      tips: [
        G('A dash cam earns its keep', 'Footage protects you in disputes and often lowers insurance stress.'),
        G('Keep an emergency kit', 'A jump starter and basic kit turn roadside trouble into a quick fix.'),
        G('Care preserves value', 'Regular detailing and interior protection keep resale value up.'),
        G('eBay for parts', 'Hard-to-find and OEM parts are often cheaper and available on eBay.'),
      ],
    },
    related: ['tools', 'travel', 'electronics', 'pets'],
  },
];
