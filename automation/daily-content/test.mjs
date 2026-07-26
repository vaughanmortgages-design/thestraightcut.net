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
import {
  buildActiveAffiliateFeed,
  FEED_COLUMNS
} from "./csv-publisher.mjs";
import {
  createAffiliateVaultWebhook,
  signWebhookBody
} from "./webhook-core.mjs";
import {
  hasProcessedWebhookEvent,
  markWebhookEventProcessed
} from "./webhook-idempotency.mjs";

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

test("active Affiliate Vault CSV excludes non-Active rows and preserves tracking", () => {
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
      "TSC",
      "Rocky Mountain Dog",
      "",
      "",
      "Rocky Mountain Dog",
      "https://rockymountaindog.ca/discount/RAYCUTTER10?ref=mcwboquj",
      "Active",
      "",
      "",
      "Pets",
      "",
      "RAYCUTTER10",
      "CA",
      "",
      ""
    ],
    [
      "TSC",
      "Awin",
      "",
      "",
      "Active offers",
      "https://example.com/unconfirmed",
      "Confirmed",
      "",
      "",
      "Other",
      "",
      "",
      "CA",
      "",
      ""
    ]
  ];
  const result = buildActiveAffiliateFeed(rows);
  assert.equal(result.report.activeRows, 1);
  assert.equal(result.report.publishedRows, 1);
  assert.deepEqual(result.report.columns, FEED_COLUMNS.map(({ output }) => output));
  assert.match(
    result.csv,
    /https:\/\/rockymountaindog\.ca\/discount\/RAYCUTTER10\?ref=mcwboquj/
  );
  assert.match(result.csv, /RAYCUTTER10/);
  assert.doesNotMatch(result.csv, /unconfirmed/);
});

test("active Affiliate Vault CSV fails safely when its schema changes", () => {
  assert.throws(
    () =>
      buildActiveAffiliateFeed([
        ["Brand", "Program Name", "Status"],
        ["TSC", "Rocky Mountain Dog", "Active"]
      ]),
    /schema mismatch/
  );
});

test("active Affiliate Vault CSV reports invalid Active rows", () => {
  const headers = FEED_COLUMNS.map(({ output }) => output);
  const result = buildActiveAffiliateFeed([
    headers,
    [
      "TSC",
      "Rocky Mountain Dog",
      "Pets",
      "Rocky Mountain Dog",
      "",
      "not-a-url",
      "RAYCUTTER10",
      "CA",
      "Active"
    ]
  ]);
  assert.equal(result.report.activeRows, 1);
  assert.equal(result.report.publishedRows, 0);
  assert.deepEqual(result.report.invalidRows, [
    { row: 2, errors: ["invalid Affiliate URL"] }
  ]);
});

test("signed Affiliate Vault webhook dispatches once and ignores duplicates", async () => {
  const store = fakeEventStore();
  let dispatches = 0;
  const webhook = createAffiliateVaultWebhook({
    getEventStore: () => store,
    fetchImpl: async () => {
      dispatches += 1;
      return new Response(null, { status: 204 });
    },
    sleep: async () => {},
    now: () => 1_800_000_000_000,
    env: webhookEnvironment(),
    logger: quietLogger()
  });
  const request = signedWebhookRequest();
  const first = await webhook(request);
  const second = await webhook(signedWebhookRequest());
  assert.equal(first.status, 202);
  assert.equal((await first.json()).status, "accepted");
  assert.equal(second.status, 202);
  assert.equal((await second.json()).status, "duplicate_ignored");
  assert.equal(dispatches, 1);
});

test("Affiliate Vault webhook rejects an invalid signature", async () => {
  let dispatches = 0;
  const webhook = createAffiliateVaultWebhook({
    getEventStore: () => fakeEventStore(),
    fetchImpl: async () => {
      dispatches += 1;
      return new Response(null, { status: 204 });
    },
    now: () => 1_800_000_000_000,
    env: webhookEnvironment(),
    logger: quietLogger()
  });
  const request = signedWebhookRequest({
    signature: `sha256=${"0".repeat(64)}`
  });
  const response = await webhook(request);
  assert.equal(response.status, 401);
  assert.equal(dispatches, 0);
});

test("Affiliate Vault webhook retries transient dispatch failures safely", async () => {
  let dispatches = 0;
  const sleeps = [];
  const webhook = createAffiliateVaultWebhook({
    getEventStore: () => fakeEventStore(),
    fetchImpl: async () => {
      dispatches += 1;
      return dispatches === 1
        ? new Response(null, { status: 503 })
        : new Response(null, { status: 204 });
    },
    sleep: async (milliseconds) => sleeps.push(milliseconds),
    now: () => 1_800_000_000_000,
    env: webhookEnvironment(),
    logger: quietLogger()
  });
  const response = await webhook(signedWebhookRequest());
  const body = await response.json();
  assert.equal(response.status, 202);
  assert.equal(body.attempts, 2);
  assert.equal(dispatches, 2);
  assert.deepEqual(sleeps, [500]);
});

test("Affiliate Vault webhook does not retry permanent failures and logs them", async () => {
  let dispatches = 0;
  const errors = [];
  const store = fakeEventStore();
  const webhook = createAffiliateVaultWebhook({
    getEventStore: () => store,
    fetchImpl: async () => {
      dispatches += 1;
      return new Response(null, { status: 403 });
    },
    sleep: async () => {},
    now: () => 1_800_000_000_000,
    env: webhookEnvironment(),
    logger: {
      log: () => {},
      info: () => {},
      warn: () => {},
      error: (message) => errors.push(message)
    }
  });
  const response = await webhook(signedWebhookRequest());
  assert.equal(response.status, 503);
  assert.equal(dispatches, 1);
  assert.ok(errors.some((entry) => entry.includes("dispatch_failed")));
  assert.equal(store.entries.size, 1);
  assert.ok([...store.entries.keys()][0].startsWith("failures/"));
});

test("accepted dispatch keeps its duplicate claim if completion logging fails", async () => {
  const entries = new Map();
  let writes = 0;
  const store = {
    entries,
    async setJSON(key, value, options = {}) {
      writes += 1;
      if (writes === 2) throw new Error("completion store unavailable");
      if (options.onlyIfNew && entries.has(key)) return { modified: false };
      entries.set(key, value);
      return { modified: true };
    },
    async delete(key) {
      entries.delete(key);
    }
  };
  const webhook = createAffiliateVaultWebhook({
    getEventStore: () => store,
    fetchImpl: async () => new Response(null, { status: 204 }),
    now: () => 1_800_000_000_000,
    env: webhookEnvironment(),
    logger: quietLogger()
  });
  const response = await webhook(signedWebhookRequest());
  assert.equal(response.status, 202);
  assert.equal(entries.size, 1);
  const duplicate = await webhook(signedWebhookRequest());
  assert.equal((await duplicate.json()).status, "duplicate_ignored");
});

test("workflow event history prevents duplicate content runs", () => {
  const state = { version: 1, brands: {}, processedWebhookEvents: [] };
  assert.equal(hasProcessedWebhookEvent(state, "vault-event-001"), false);
  const marked = markWebhookEventProcessed(state, "vault-event-001");
  assert.equal(hasProcessedWebhookEvent(marked, "vault-event-001"), true);
  assert.deepEqual(
    markWebhookEventProcessed(marked, "vault-event-001"),
    marked
  );
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

function webhookEnvironment() {
  return {
    AFFILIATE_VAULT_WEBHOOK_SECRET: "test-webhook-secret",
    AFFILIATE_VAULT_SPREADSHEET_ID:
      "1KzunQnNsPPCvTW5UbFWz9z4zl1o7u1QFped2vhCN1wo",
    AFFILIATE_VAULT_SHEET_NAME: "Affiliate Link Vault",
    GITHUB_REPOSITORY_DISPATCH_TOKEN: "test-github-token",
    GITHUB_REPOSITORY: "owner/repository"
  };
}

function signedWebhookRequest({ signature } = {}) {
  const timestamp = "1800000000";
  const eventId = "vault-event-001";
  const body = JSON.stringify({
    event: "affiliate-vault.updated",
    event_id: eventId,
    occurred_at: "2027-01-15T08:00:00.000Z",
    spreadsheet_id: "1KzunQnNsPPCvTW5UbFWz9z4zl1o7u1QFped2vhCN1wo",
    tab: "Affiliate Link Vault",
    change: { row: 52, column: 12, a1_notation: "L52" }
  });
  return new Request(
    "https://straightcut.net/.netlify/functions/affiliate-vault-webhook",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-affiliate-vault-event-id": eventId,
        "x-affiliate-vault-timestamp": timestamp,
        "x-affiliate-vault-signature":
          signature ??
          `sha256=${signWebhookBody(
            webhookEnvironment().AFFILIATE_VAULT_WEBHOOK_SECRET,
            timestamp,
            body
          )}`
      },
      body
    }
  );
}

function fakeEventStore() {
  const entries = new Map();
  return {
    entries,
    async setJSON(key, value, options = {}) {
      if (options.onlyIfNew && entries.has(key)) return { modified: false };
      entries.set(key, value);
      return { modified: true, etag: `etag-${entries.size}` };
    },
    async delete(key) {
      entries.delete(key);
    }
  };
}

function quietLogger() {
  return {
    log: () => {},
    info: () => {},
    warn: () => {},
    error: () => {}
  };
}
