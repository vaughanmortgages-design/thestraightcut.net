import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { importCatalog, toCatalogCsv, toCatalogXml } from './catalog-core.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOP_DIR = join(ROOT, 'shop');
const DATA_DIR = join(SHOP_DIR, 'data');
const DEFAULT_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1N5MWf_GMtVDUrLep9JchPKDWPHCLiufm-bY1KrA-IoE/gviz/tq?tqx=out:csv&sheet=Deals';
const sourceUrl = process.env.PRODUCT_SHEET_CSV_URL || DEFAULT_SHEET_CSV_URL;

async function readSource() {
  if (process.env.PRODUCT_CSV_FILE) {
    return readFile(process.env.PRODUCT_CSV_FILE, 'utf8');
  }
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Product catalog request failed with HTTP ${response.status}.`);
  }
  return response.text();
}

await mkdir(DATA_DIR, { recursive: true });

let products = [];
let report;
try {
  const csv = await readSource();
  ({ products, report } = importCatalog(csv));
} catch (error) {
  report = {
    source_rows: 0,
    imported_rows: 0,
    skipped_rows: 0,
    duplicate_rows: 0,
    invalid_rows: 0,
    errors: [error.message],
  };
}

const generatedAt = new Date().toISOString();
const productDocument = {
  generated_at: generatedAt,
  source: 'Google Sheets',
  products,
};
const validationDocument = {
  generated_at: generatedAt,
  source_url_configured: Boolean(process.env.PRODUCT_SHEET_CSV_URL),
  ...report,
};

await Promise.all([
  writeFile(join(DATA_DIR, 'products.json'), `${JSON.stringify(productDocument, null, 2)}\n`, 'utf8'),
  writeFile(join(DATA_DIR, 'catalog-validation.json'), `${JSON.stringify(validationDocument, null, 2)}\n`, 'utf8'),
  writeFile(join(SHOP_DIR, 'catalog.csv'), `${toCatalogCsv(products)}\n`, 'utf8'),
  writeFile(join(SHOP_DIR, 'catalog.xml'), toCatalogXml(products), 'utf8'),
]);

console.log(
  `Catalog refresh: ${report.imported_rows} imported, ${report.skipped_rows} skipped, ` +
  `${report.duplicate_rows} duplicates, ${report.invalid_rows} invalid.`
);
if (report.errors.length) {
  console.warn(report.errors.slice(0, 20).join('\n'));
}
