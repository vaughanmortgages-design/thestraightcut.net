import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import {
  asBoolean,
  chooseRotatingCategory,
  extractProducts,
  parseCsv,
  seasonalCategories,
  selectProduct
} from "./lib.mjs";
import {
  parseAffiliateVaultCsv,
  REQUIRED_VAULT_COLUMNS,
  updateLastUsedDateViaWebhook
} from "./affiliate-vault.mjs";
import {
  loadAffiliateVaultFromGoogleSheets,
  rowsToCsv,
  writeGoogleSheetValue
} from "./google-sheets.mjs";

test("boolean inputs are normalized", () => {
  assert.equal(asBoolean("TRUE"), true);
  assert.equal(asBoolean("inactive"), false);
});

test("all three brands require LinkedIn and the correct daily outputs", () => {
  const config = JSON.parse(
    fs.readFileSync(
      new URL("./config/brands.json", import.meta.url),
      "utf8"
    )
  );
  assert.deepEqual(config.brands.vmg.outputs, [
    "article",
    "facebook",
    "instagram",
    "linkedin"
  ]);
  assert.deepEqual(config.brands.estack.outputs, [
    "article",
    "facebook",
    "instagram",
    "linkedin"
  ]);
  assert.deepEqual(config.brands.straightcut.outputs, [
    "article",
    "facebook",
    "instagram",
    "linkedin",
    "pinterestTitle",
    "pinterestDescription"
  ]);
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

test("Affiliate Vault accepts only Active, Canadian, approved records", () => {
  const headers = REQUIRED_VAULT_COLUMNS.join(",");
  const csv = [
    headers,
    [
      "estack.ca",
      "Money Metals Exchange",
      "Bullion",
      "Approved gold offer",
      "https://merchant.example/product",
      "https://merchant.example/affiliate?id=exact",
      "",
      "",
      "CA",
      "Active",
      "https://merchant.example/image.jpg",
      "Test fixture",
      "2026-07-20"
    ].join(","),
    [
      "estack.us",
      "Money Metals Exchange",
      "Bullion",
      "Wrong market",
      "https://merchant.example/us",
      "https://merchant.example/affiliate-us",
      "",
      "",
      "US",
      "Active",
      "",
      "",
      ""
    ].join(","),
    [
      "TSC",
      "Rocky Mountain Dog",
      "Pets",
      "Approved partner offer",
      "https://rockymountaindog.ca/",
      "https://rockymountaindog.ca/discount/RAYCUTTER10?ref=mcwboquj",
      "RAYCUTTER10",
      "",
      "CA",
      "Inactive",
      "",
      "",
      ""
    ].join(",")
  ].join("\n");
  const result = parseAffiliateVaultCsv(csv, configForTest());
  assert.equal(result.products.estack.length, 1);
  assert.equal(result.products.straightcut.length, 0);
  assert.equal(result.skipped.length, 1);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0].errors.join(" "), /unsupported or missing Brand/);
});

test("Affiliate Vault rejects duplicate products and altered Rocky Mountain Dog links", () => {
  const headers = REQUIRED_VAULT_COLUMNS.join(",");
  const activeRocky = [
    "TSC",
    "Rocky Mountain Dog",
    "Pets",
    "Approved partner offer",
    "https://rockymountaindog.ca/",
    "https://rockymountaindog.ca/discount/RAYCUTTER10?ref=mcwboquj",
    "RAYCUTTER10",
    "",
    "CA",
    "Active",
    "",
    "",
    ""
  ].join(",");
  const alteredRocky = activeRocky.replace(
    "https://rockymountaindog.ca/discount/RAYCUTTER10?ref=mcwboquj",
    "https://rockymountaindog.ca/discount/WRONG"
  );
  const csv = [headers, activeRocky, activeRocky, alteredRocky].join("\n");
  const result = parseAffiliateVaultCsv(csv, configForTest());
  assert.equal(result.products.straightcut.length, 1);
  assert.equal(result.duplicates.length, 1);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0].errors.join(" "), /does not match the approved value/);
});

test("current legacy Vault columns are reported and Confirmed rows are skipped", () => {
  const csv = [
    "Brand,Program Name,Contact,Commission Terms,Offer/Link Name,Full URL,Status,Placed On Page (URL),Notes",
    "estack.ca,Awin,,Referral,Money Metals Exchange,https://example.com/exact,Confirmed,,Legacy row"
  ].join("\n");
  const result = parseAffiliateVaultCsv(csv, configForTest());
  assert.equal(result.products.estack.length, 0);
  assert.equal(result.skipped.length, 1);
  assert.ok(result.missingColumns.includes("affiliate_name"));
  assert.ok(result.missingColumns.includes("last_used_date"));
});

test("Last Used Date webhook receives the exact source row and affiliate URL", async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.AFFILIATE_VAULT_UPDATE_WEBHOOK_URL;
  let request;
  process.env.AFFILIATE_VAULT_UPDATE_WEBHOOK_URL =
    "https://automation.example/vault-update";
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return { ok: true };
  };
  try {
    await updateLastUsedDateViaWebhook(
      {
        sourceRow: 12,
        affiliateName: "Sprott Money",
        title: "Sprott Money Canada",
        affiliateUrl: "https://www.sprottmoney.ca/?acc=paul-maladrino-5887a"
      },
      "2026-07-29"
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) {
      delete process.env.AFFILIATE_VAULT_UPDATE_WEBHOOK_URL;
    } else {
      process.env.AFFILIATE_VAULT_UPDATE_WEBHOOK_URL = originalUrl;
    }
  }
  const payload = JSON.parse(request.options.body);
  assert.equal(request.url, "https://automation.example/vault-update");
  assert.equal(payload.rowNumber, 12);
  assert.equal(
    payload.affiliateUrl,
    "https://www.sprottmoney.ca/?acc=paul-maladrino-5887a"
  );
  assert.equal(payload.lastUsedDate, "2026-07-29");
});

test("Google Sheets connector maps the production tab and detects Active products", async () => {
  const { privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" }
  });
  const originalCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({
    client_email: "content-engine@example-project.iam.gserviceaccount.com",
    private_key: privateKey
  });
  const rows = [
    [
      "Brand",
      "Program Name",
      "Contact",
      "Commission Terms",
      "Offer/Link Name",
      "Full URL",
      "Status",
      "Placed On Page (URL)",
      "Notes",
      "Category",
      "Product URL",
      "Coupon Code",
      "Country",
      "Image URL",
      "Last Used Date"
    ],
    [
      "estack.ca",
      "Sprott Money",
      "",
      "",
      "Sprott Money Canada",
      "https://www.sprottmoney.ca/?acc=paul-maladrino-5887a",
      "Active",
      "",
      "Preserve exactly",
      "Bullion",
      "",
      "",
      "CA",
      "",
      "2026-07-20"
    ]
  ];
  let requestNumber = 0;
  const fetchImpl = async () => {
    requestNumber += 1;
    if (requestNumber === 1) {
      return {
        ok: true,
        json: async () => ({ access_token: "test-access-token" })
      };
    }
    return { ok: true, json: async () => ({ values: rows }) };
  };
  try {
    const result = await loadAffiliateVaultFromGoogleSheets(
      configForTest(),
      fetchImpl
    );
    assert.equal(
      result.spreadsheetId,
      "1KzunQnNsPPCvTW5UbFWz9z4zl1o7u1QFped2vhCN1wo"
    );
    assert.equal(result.tabName, "Affiliate Link Vault");
    assert.equal(result.products.estack.length, 1);
    assert.equal(
      result.products.estack[0].affiliateUrl,
      "https://www.sprottmoney.ca/?acc=paul-maladrino-5887a"
    );
    assert.equal(result.products.estack[0].lastUsedColumn, "O");
  } finally {
    if (originalCredentials === undefined) {
      delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    } else {
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON = originalCredentials;
    }
  }
});

test("Google Sheets writeback targets the detected Last Used Date cell", async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return { ok: true };
  };
  await writeGoogleSheetValue({
    spreadsheetId: "sheet-id",
    tabName: "Affiliate Link Vault",
    column: "O",
    row: 52,
    value: "2026-07-30",
    accessToken: "token",
    fetchImpl
  });
  assert.match(request.url, /spreadsheets\/sheet-id\/values/);
  assert.deepEqual(JSON.parse(request.options.body).values, [["2026-07-30"]]);
});

test("row-to-CSV mapping preserves commas and exact affiliate URLs", () => {
  const csv = rowsToCsv([
    ["Affiliate URL", "Notes"],
    [
      "https://example.com/?a=1&b=2",
      "Keep commas, tracking parameters, and text"
    ]
  ]);
  assert.match(csv, /https:\/\/example\.com\/\?a=1&b=2/);
  assert.match(csv, /"Keep commas, tracking parameters, and text"/);
});

function configForTest() {
  return {
    estack: {
      name: "eStack.ca",
      allowedCountries: ["CA"],
      approvedMerchants: [
        "Money Metals Exchange",
        "Kitco",
        "Sprott Money",
        "CMI",
        "AFN",
        "Lead Scout"
      ]
    },
    straightcut: {
      name: "The Straight Cut",
      allowedCountries: ["CA"],
      approvedMerchants: ["Amazon", "eBay", "Rocky Mountain Dog"],
      partnerRules: {
        "Rocky Mountain Dog": {
          expectedAffiliateUrl:
            "https://rockymountaindog.ca/discount/RAYCUTTER10?ref=mcwboquj",
          expectedCouponCode: "RAYCUTTER10"
        }
      }
    }
  };
}
