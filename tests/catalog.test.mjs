import assert from 'node:assert/strict';
import test from 'node:test';
import { importCatalog, parseCsv, toCatalogCsv, toCatalogXml } from '../scripts/catalog-core.mjs';

const header = [
  'Product ID',
  'Product Title',
  'Merchant',
  'Category',
  'Short Description',
  'Image URL',
  'Affiliate URL',
  'Price',
  'Currency',
  'Active',
  'Featured',
].join(',');

test('CSV parser supports quoted commas and escaped quotes', () => {
  const rows = parseCsv('title,description\n"Product, One","A ""quoted"" description"');
  assert.deepEqual(rows, [
    ['title', 'description'],
    ['Product, One', 'A "quoted" description'],
  ]);
});

test('importer preserves approved Amazon affiliate URLs exactly', () => {
  const affiliate = 'https://www.amazon.ca/dp/EXAMPLE?tag=straightcutgu-20&ref_=abc';
  const csv = `${header}
p-1,Desk Lamp,Amazon,Home & Kitchen,Useful light,https://example.com/lamp.jpg,${affiliate},49.99,CAD,TRUE,TRUE`;
  const { products, report } = importCatalog(csv);
  assert.equal(report.imported_rows, 1);
  assert.equal(products[0].affiliate_url, affiliate);
  assert.equal(products[0].category_slug, 'home');
});

test('importer preserves approved eBay EPN URLs exactly', () => {
  const affiliate = 'https://www.ebay.ca/itm/123?mkcid=1&campid=5339155090&mkevt=1';
  const csv = `${header}
p-2,Vintage Book,eBay,Books,Collectible edition,https://example.com/book.jpg,${affiliate},25.00,CAD,TRUE,FALSE`;
  const { products, report } = importCatalog(csv);
  assert.equal(report.imported_rows, 1);
  assert.equal(products[0].affiliate_url, affiliate);
});

test('importer rejects Slickdeals, missing images and duplicates', () => {
  const csv = `${header}
p-3,Invalid Deal,Amazon,Electronics,Invalid,https://example.com/item.jpg,https://slickdeals.net/f/123?tag=straightcutgu-20,10,CAD,TRUE,FALSE
p-4,Missing Image,Amazon,Electronics,Invalid,,https://www.amazon.ca/dp/EXAMPLE?tag=straightcutgu-20,10,CAD,TRUE,FALSE
p-5,Valid Item,Amazon,Electronics,Valid,https://example.com/item.jpg,https://www.amazon.ca/dp/EXAMPLE?tag=straightcutgu-20,10,CAD,TRUE,FALSE
p-5,Duplicate Item,Amazon,Electronics,Duplicate,https://example.com/item-2.jpg,https://www.amazon.ca/dp/EXAMPLE2?tag=straightcutgu-20,11,CAD,TRUE,FALSE`;
  const { products, report } = importCatalog(csv);
  assert.equal(products.length, 1);
  assert.equal(report.invalid_rows, 2);
  assert.equal(report.duplicate_rows, 1);
});

test('catalog outputs contain the same validated product', () => {
  const affiliate = 'https://www.amazon.ca/dp/EXAMPLE?tag=straightcutgu-20';
  const csv = `${header}
p-6,Product Six,Amazon,Deals,Description,https://example.com/six.jpg,${affiliate},19.99,CAD,TRUE,TRUE`;
  const { products } = importCatalog(csv);
  assert.match(toCatalogCsv(products), /p-6/);
  assert.match(toCatalogXml(products), /<g:id>p-6<\/g:id>/);
  assert.match(toCatalogXml(products), /straightcutgu-20/);
});
