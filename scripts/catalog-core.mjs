import { createHash } from 'node:crypto';

export const PRODUCT_FIELDS = [
  'product_id',
  'title',
  'merchant',
  'category',
  'description',
  'image_url',
  'affiliate_url',
  'price',
  'currency',
  'availability',
  'badge',
  'featured',
  'staff_pick',
  'trending',
  'weekly_deal',
  'top_rated',
  'clearance',
  'new_arrival',
  'back_to_school',
  'prime_pick',
  'ebay_find',
  'active',
  'last_updated',
];

export const REQUIRED_FIELDS = [
  'product_id',
  'title',
  'merchant',
  'category',
  'image_url',
  'affiliate_url',
];

export const MERCHANTS = new Set(['Amazon', 'eBay']);

export const CATEGORY_SLUGS = new Map([
  ['todays deals', 'deals'],
  ["today's deals", 'deals'],
  ['deals', 'deals'],
  ['clearance', 'clearance'],
  ['new arrivals', 'new-arrivals'],
  ['home', 'home'],
  ['home & kitchen', 'home'],
  ['home and kitchen', 'home'],
  ['electronics', 'electronics'],
  ['tools', 'tools'],
  ['tools & workshop', 'tools'],
  ['tools and workshop', 'tools'],
  ['automotive', 'auto'],
  ['auto', 'auto'],
  ['sports', 'sports-outdoors'],
  ['sports & outdoors', 'sports-outdoors'],
  ['sports and outdoors', 'sports-outdoors'],
  ['pets', 'pets'],
  ['books', 'books-media'],
  ['books & media', 'books-media'],
  ['books and media', 'books-media'],
  ['toys', 'toys-kids'],
  ['toys & kids', 'toys-kids'],
  ['toys and kids', 'toys-kids'],
  ['kids', 'toys-kids'],
  ['travel', 'travel'],
  ['travel & getaways', 'travel'],
  ['travel and getaways', 'travel'],
  ['fashion', 'fashion'],
  ['apparel', 'fashion'],
]);

const HEADER_ALIASES = new Map([
  ['id', 'product_id'],
  ['product id', 'product_id'],
  ['product_id', 'product_id'],
  ['product', 'title'],
  ['product title', 'title'],
  ['product_title', 'title'],
  ['title', 'title'],
  ['source', 'merchant'],
  ['merchant', 'merchant'],
  ['department', 'category'],
  ['category', 'category'],
  ['short description', 'description'],
  ['description', 'description'],
  ['image', 'image_url'],
  ['image url', 'image_url'],
  ['image_url', 'image_url'],
  ['affiliate link', 'affiliate_url'],
  ['affiliate url', 'affiliate_url'],
  ['affiliate_url', 'affiliate_url'],
  ['deal url', 'product_url'],
  ['product url', 'product_url'],
  ['product_url', 'product_url'],
  ['current price', 'price'],
  ['price', 'price'],
  ['currency', 'currency'],
  ['availability', 'availability'],
  ['status', 'availability'],
  ['badge', 'badge'],
  ['featured', 'featured'],
  ['staff pick', 'staff_pick'],
  ['staff_pick', 'staff_pick'],
  ['trending', 'trending'],
  ['weekly deal', 'weekly_deal'],
  ['weekly_deal', 'weekly_deal'],
  ['top rated', 'top_rated'],
  ['top_rated', 'top_rated'],
  ['clearance', 'clearance'],
  ['new arrival', 'new_arrival'],
  ['new_arrival', 'new_arrival'],
  ['back to school', 'back_to_school'],
  ['back_to_school', 'back_to_school'],
  ['prime pick', 'prime_pick'],
  ['prime_pick', 'prime_pick'],
  ['ebay find', 'ebay_find'],
  ['ebay_find', 'ebay_find'],
  ['active', 'active'],
  ['last updated', 'last_updated'],
  ['last_updated', 'last_updated'],
]);

const BOOLEAN_FIELDS = [
  'featured',
  'staff_pick',
  'trending',
  'weekly_deal',
  'top_rated',
  'clearance',
  'new_arrival',
  'back_to_school',
  'prime_pick',
  'ebay_find',
  'active',
];

const normalizeHeader = (value = '') =>
  String(value).replace(/^\uFEFF/, '').trim().toLowerCase().replace(/\s+/g, ' ');

export const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function parseCsv(csv = '') {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (character === '"') {
      if (quoted && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && csv[index + 1] === '\n') index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function parseBoolean(value, defaultValue = false) {
  if (typeof value === 'boolean') return value;
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized) return defaultValue;
  return ['true', 'yes', 'y', '1', 'active'].includes(normalized);
}

function validHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function validAffiliateUrl(product) {
  if (!validHttpsUrl(product.affiliate_url)) return false;
  const url = new URL(product.affiliate_url);
  const host = url.hostname.toLowerCase();

  if (product.merchant === 'Amazon') {
    return (
      host === 'amzn.to' ||
      host.endsWith('.amzn.to') ||
      ((host.includes('amazon.ca') || host.includes('amazon.com')) &&
        url.searchParams.get('tag') === 'straightcutgu-20')
    );
  }

  if (product.merchant === 'eBay') {
    return (
      host.includes('rover.ebay.') ||
      host.includes('ebay.ca') && url.searchParams.get('campid') === '5339155090'
    );
  }

  return false;
}

function deterministicId(row) {
  const source = [
    row.merchant,
    row.title,
    row.affiliate_url,
  ].join('|');
  return createHash('sha256').update(source).digest('hex').slice(0, 16);
}

export function importCatalog(csv) {
  const rawRows = parseCsv(csv);
  if (!rawRows.length) {
    return {
      products: [],
      report: {
        source_rows: 0,
        imported_rows: 0,
        skipped_rows: 0,
        duplicate_rows: 0,
        invalid_rows: 0,
        errors: ['The product CSV is empty.'],
      },
    };
  }

  const headerRow = rawRows[0];
  const embeddedTabs = headerRow.length === 1 && headerRow[0].includes('\t');
  const headers = (embeddedTabs ? headerRow[0].split('\t') : headerRow)
    .map(normalizeHeader)
    .map((header) => HEADER_ALIASES.get(header) || slugify(header).replace(/-/g, '_'));

  const products = [];
  const errors = [];
  const seen = new Set();
  let skippedRows = 0;
  let duplicateRows = 0;
  let invalidRows = 0;

  rawRows.slice(1).forEach((values, rowIndex) => {
    if (!values.some((value) => String(value).trim())) {
      skippedRows += 1;
      return;
    }

    const row = Object.fromEntries(headers.map((header, index) => [header, String(values[index] ?? '').trim()]));
    if (!row.product_id && row.title && row.merchant && row.affiliate_url) {
      row.product_id = deterministicId(row);
    }

    const product = {
      product_id: row.product_id,
      title: row.title,
      merchant: row.merchant,
      category: row.category,
      category_slug: CATEGORY_SLUGS.get(normalizeHeader(row.category)) || '',
      description: row.description,
      product_url: row.product_url,
      image_url: row.image_url,
      affiliate_url: row.affiliate_url,
      price: row.price,
      currency: row.currency || 'CAD',
      availability: row.availability || 'in stock',
      badge: row.badge,
      last_updated: row.last_updated,
    };

    BOOLEAN_FIELDS.forEach((field) => {
      product[field] = parseBoolean(row[field], field === 'active');
    });

    if (!product.active) {
      skippedRows += 1;
      return;
    }

    const missing = REQUIRED_FIELDS.filter((field) => !product[field]);
    const rowErrors = [];
    if (missing.length) rowErrors.push(`missing ${missing.join(', ')}`);
    if (product.merchant && !MERCHANTS.has(product.merchant)) rowErrors.push(`unsupported merchant "${product.merchant}"`);
    if (product.category && !product.category_slug) rowErrors.push(`unsupported category "${product.category}"`);
    if (product.image_url && !validHttpsUrl(product.image_url)) rowErrors.push('invalid image_url');
    if (product.product_url && !validHttpsUrl(product.product_url)) rowErrors.push('invalid product_url');
    if (product.affiliate_url && !validAffiliateUrl(product)) rowErrors.push('unapproved or untracked affiliate_url');
    if (product.currency && product.currency !== 'CAD') rowErrors.push(`unsupported currency "${product.currency}"`);

    if (rowErrors.length) {
      invalidRows += 1;
      if (errors.length < 100) {
        errors.push(`Row ${rowIndex + 2}: ${rowErrors.join('; ')}`);
      }
      return;
    }

    if (seen.has(product.product_id)) {
      duplicateRows += 1;
      return;
    }

    seen.add(product.product_id);
    products.push(product);
  });

  return {
    products,
    report: {
      source_rows: rawRows.length - 1,
      imported_rows: products.length,
      skipped_rows: skippedRows,
      duplicate_rows: duplicateRows,
      invalid_rows: invalidRows,
      errors_truncated: Math.max(0, invalidRows - errors.length),
      errors,
    },
  };
}

const csvValue = (value = '') => `"${String(value).replace(/"/g, '""')}"`;

export function toCatalogCsv(products) {
  const headers = [
    'id',
    'title',
    'description',
    'availability',
    'condition',
    'price',
    'link',
    'image_link',
    'brand',
    'google_product_category',
  ];
  const rows = products.map((product) => [
    product.product_id,
    product.title,
    product.description,
    product.availability,
    'new',
    product.price ? `${product.price} ${product.currency}` : '',
    product.affiliate_url,
    product.image_url,
    product.merchant,
    product.category,
  ]);
  return [headers, ...rows].map((row) => row.map(csvValue).join(',')).join('\n');
}

const xmlValue = (value = '') =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function toCatalogXml(products) {
  const items = products.map((product) => `    <item>
      <g:id>${xmlValue(product.product_id)}</g:id>
      <g:title>${xmlValue(product.title)}</g:title>
      <g:description>${xmlValue(product.description)}</g:description>
      <g:availability>${xmlValue(product.availability)}</g:availability>
      <g:condition>new</g:condition>
      ${product.price ? `<g:price>${xmlValue(product.price)} ${xmlValue(product.currency)}</g:price>` : ''}
      <g:link>${xmlValue(product.affiliate_url)}</g:link>
      <g:image_link>${xmlValue(product.image_url)}</g:image_link>
      <g:brand>${xmlValue(product.merchant)}</g:brand>
      <g:product_type>${xmlValue(product.category)}</g:product_type>
    </item>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>The Straight Cut Product Catalog</title>
    <link>https://thestraightcut.net/</link>
    <description>Validated Amazon and eBay products published by The Straight Cut.</description>
${items}
  </channel>
</rss>
`;
}
