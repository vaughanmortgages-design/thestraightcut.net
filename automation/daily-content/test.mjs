import test from "node:test";
import assert from "node:assert/strict";
import {
  asBoolean,
  chooseRotatingCategory,
  extractProducts,
  parseCsv,
  seasonalCategories,
  selectProduct
} from "./lib.mjs";

test("boolean inputs are normalized", () => {
  assert.equal(asBoolean("TRUE"), true);
  assert.equal(asBoolean("inactive"), false);
});

test("published Google Sheet CSV is parsed with quoted values", () => {
  const rows = parseCsv(
    'Product ID,Product Title,Merchant,Affiliate URL,Active\n' +
      'p-1,"Gold coin, one ounce",Kitco,https://example.com/tracked,TRUE\n'
  );
  assert.equal(rows[0].product_id, "p-1");
  assert.equal(rows[0].product_title, "Gold coin, one ounce");
  assert.equal(rows[0].affiliate_url, "https://example.com/tracked");
});

test("invalid, inactive and duplicate products are rejected", () => {
  const row = {
    id: "p-1",
    title: "Verified product",
    merchant: "eBay",
    affiliate_url: "https://example.com/tracked",
    active: true
  };
  const result = extractProducts([
    row,
    row,
    { ...row, id: "p-2", active: false },
    { id: "p-3", title: "Missing link", merchant: "Amazon" }
  ]);
  assert.equal(result.products.length, 1);
  assert.equal(result.errors.length, 2);
});

test("rotation never repeats the previous category", () => {
  const categories = ["Gold", "Silver"];
  const first = chooseRotatingCategory(categories, null, "2026-07-26");
  const next = chooseRotatingCategory(categories, first, "2026-07-26");
  assert.notEqual(next, first);
});

test("back-to-school products receive seasonal priority", () => {
  const products = [
    {
      id: "one",
      title: "General item",
      merchant: "Amazon",
      category: "Electronics",
      affiliateUrl: "https://example.com/one",
      featured: true,
      seasonal: false
    },
    {
      id: "two",
      title: "School item",
      merchant: "eBay",
      category: "Back to School",
      affiliateUrl: "https://example.com/two",
      featured: false,
      seasonal: true
    }
  ];
  const selected = selectProduct(
    products,
    "straightcut",
    { approvedMerchants: ["Amazon", "eBay"] },
    { lastProductId: null },
    "2026-08-12"
  );
  assert.equal(selected.id, "two");
  assert.deepEqual(seasonalCategories("2026-08-12"), ["Back to School"]);
});
