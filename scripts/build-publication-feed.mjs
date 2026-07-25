import { readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceInput = process.env.PRODUCT_SHEET_CSV_URL || join(ROOT, 'data/storefront-products.source.json');
const output = join(ROOT, 'data/storefront-products.json');
const departments = new Set([
  'electronics', 'home-kitchen', 'tools-workshop', 'automotive', 'sports-outdoors',
  'pets', 'books', 'travel', 'fashion', 'toys-kids',
]);
const statuses = new Set(['clearance', 'new', 'deal']);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if (/[\r\n]/.test(char) && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
    } else cell += char;
  }
  row.push(cell);
  if (row.some(Boolean)) rows.push(row);
  const headings = (rows.shift() || []).map((value) => value.trim().toLowerCase().replace(/\W+/g, '_'));
  return rows.map((values) => Object.fromEntries(headings.map((heading, index) => [heading, values[index]?.trim() || ''])));
}

function googleCsvUrl(input) {
  const url = new URL(input);
  const id = url.pathname.match(/\/spreadsheets\/d\/([^/]+)/)?.[1];
  if (!id) return input;
  const gid = url.searchParams.get('gid') || url.hash.match(/gid=(\d+)/)?.[1] || '0';
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

async function loadSource(input) {
  if (/^https?:\/\//i.test(input)) {
    const target = input.includes('docs.google.com/spreadsheets') ? googleCsvUrl(input) : input;
    const response = await fetch(target);
    if (!response.ok) throw new Error(`Product source returned HTTP ${response.status}`);
    const body = await response.text();
    return response.headers.get('content-type')?.includes('json') ? JSON.parse(body) : parseCsv(body);
  }
  const path = resolve(input);
  const body = await readFile(path, 'utf8');
  return extname(path) === '.json' ? JSON.parse(body) : parseCsv(body);
}

function truthy(value) {
  return ['1', 'true', 'yes', 'y'].includes(String(value || '').toLowerCase());
}

function validTrackedUrl(merchant, value) {
  if (!value) return false;
  let url;
  try { url = new URL(value); } catch { return false; }
  if (url.protocol !== 'https:') return false;
  if (merchant === 'amazon') return /(?:amazon\.|amzn\.to|a\.co)/i.test(url.hostname) && url.searchParams.get('tag') === 'straightcutgu-20';
  if (merchant === 'ebay') return /ebay\./i.test(url.hostname) &&
    (url.searchParams.get('campid') === '5339155090' || url.searchParams.get('campaignid') === '5339155090');
  return true;
}

function normalize(row) {
  const merchant = String(row.merchant || row.dealer || '').trim().toLowerCase();
  const department = String(row.department || row.category || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const status = String(row.status || row.badge || '').trim().toLowerCase();
  const affiliateUrl = String(row.affiliate_url || row.affiliateUrl || '').trim();
  const priceValue = String(row.price || '').replace(/[^0-9.-]/g, '');
  const price = priceValue && Number.isFinite(Number(priceValue)) ? Number(priceValue) : null;
  return {
    id: String(row.id || row.product_id || '').trim(),
    title: String(row.title || row.name || '').trim(),
    description: String(row.description || '').trim(),
    image: String(row.image || row.image_url || '').trim(),
    merchant,
    affiliateUrl,
    price,
    currency: String(row.currency || 'CAD').trim().toUpperCase(),
    department,
    status,
    featured: truthy(row.featured),
    updatedAt: String(row.updated_at || row.updatedAt || '').trim(),
  };
}

const source = await loadSource(sourceInput);
const rows = Array.isArray(source) ? source : source.products || [];
const seen = new Set();
const products = [];
const rejected = [];
for (const [index, row] of rows.entries()) {
  const product = normalize(row);
  const reason = !product.id || !product.title || !product.description || !product.image
    ? 'missing required product content'
    : seen.has(product.id) ? 'duplicate id'
      : !['amazon', 'ebay'].includes(product.merchant) ? 'unconfigured merchant'
        : !departments.has(product.department) ? 'unknown department'
          : !statuses.has(product.status) ? 'unknown status'
            : !validTrackedUrl(product.merchant, product.affiliateUrl) ? 'missing or unapproved tracked URL'
              : '';
  if (reason) {
    rejected.push({ row: index + 2, id: product.id, reason });
    continue;
  }
  seen.add(product.id);
  products.push(product);
}

const payload = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: /^https?:\/\//i.test(sourceInput) ? 'google-sheets-or-remote' : 'json-or-csv',
  products,
  importReport: { imported: products.length, rejected },
};
await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify(payload.importReport, null, 2));
