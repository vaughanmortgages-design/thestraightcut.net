import crypto from "node:crypto";
import { parseCsv } from "./lib.mjs";

export const REQUIRED_VAULT_COLUMNS = [
  "Brand",
  "Affiliate Name",
  "Category",
  "Product Name",
  "Product URL",
  "Affiliate URL",
  "Coupon Code",
  "Commission",
  "Country",
  "Status",
  "Image URL",
  "Notes",
  "Last Used Date"
];

const BRAND_ALIASES = new Map([
  ["estack.ca", "estack"],
  ["estack canada", "estack"],
  ["tsc", "straightcut"],
  ["the straight cut", "straightcut"],
  ["straightcut.net", "straightcut"],
  ["thestraightcut.net", "straightcut"],
  ["vaughan mortgage group", "vmg"],
  ["vmg", "vmg"]
]);

const BRAND_COUNTRIES = {
  estack: "CA",
  straightcut: "CA",
  vmg: "CA"
};

const PARTNER_CATEGORIES = new Map([
  ["money metals exchange", "Bullion"],
  ["kitco", "Bullion"],
  ["kitco us & canada", "Bullion"],
  ["sprott money", "Bullion"],
  ["sprott money canada", "Bullion"],
  ["cmi", "Loans and Credit"],
  ["creditmarketing.ca", "Loans and Credit"],
  ["creditmarketing (cmi)", "Loans and Credit"],
  ["afn", "Loans and Credit"],
  ["advance funds network", "Loans and Credit"],
  ["lead scout", "Loans and Credit"],
  ["leadscout", "Loans and Credit"],
  ["rocky mountain dog", "Pets"]
]);

function text(value) {
  return String(value ?? "").trim();
}

function exactText(value) {
  return String(value ?? "");
}

function normalized(value) {
  return text(value).toLowerCase();
}

function isGenericNetwork(value) {
  const name = normalized(value);
  return (
    name === "awin" ||
    name.includes("(awin") ||
    name === "cj affiliate" ||
    name === "amazon associates" ||
    name === "ebay partner network"
  );
}

function canonicalCountry(value, brandKey) {
  const supplied = normalized(value);
  if (["ca", "canada", "canadian"].includes(supplied)) return "CA";
  if (["us", "usa", "united states", "united states of america"].includes(supplied)) {
    return "US";
  }
  return BRAND_COUNTRIES[brandKey] ?? "";
}

function validHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function deriveCategory(row, affiliateName, productName) {
  const supplied = text(row.category);
  if (supplied) return supplied;
  return (
    PARTNER_CATEGORIES.get(normalized(productName)) ??
    PARTNER_CATEGORIES.get(normalized(affiliateName)) ??
    ""
  );
}

export function normalizeVaultRecord(row) {
  const rawBrand = text(row.brand);
  const brandKey = BRAND_ALIASES.get(normalized(rawBrand)) ?? "";
  const affiliateName = text(row.affiliate_name ?? row.program_name);
  const productName = text(row.product_name ?? row.offer_link_name);
  const merchant = isGenericNetwork(affiliateName)
    ? productName
    : affiliateName;
  const category = deriveCategory(row, affiliateName, productName);
  const affiliateUrl = exactText(row.affiliate_url ?? row.full_url);
  const country = canonicalCountry(row.country, brandKey);
  const sourceRow = Number(row.__rowNumber || 0);
  const id = crypto
    .createHash("sha256")
    .update(
      [
        rawBrand,
        affiliateName,
        productName,
        affiliateUrl,
        country
      ].join("|")
    )
    .digest("hex")
    .slice(0, 16);

  return {
    id,
    brandKey,
    sourceBrand: rawBrand,
    affiliateName,
    merchant,
    category,
    title: productName,
    productUrl: exactText(row.product_url),
    affiliateUrl,
    couponCode: exactText(row.coupon_code),
    commission: text(row.commission ?? row.commission_terms),
    country,
    status: text(row.status),
    imageUrl: exactText(row.image_url),
    description: text(row.notes),
    notes: text(row.notes),
    lastUsedDate: text(row.last_used_date),
    sourceRow,
    active: normalized(row.status) === "active",
    featured: false,
    seasonal: normalized(category) === "back to school",
    currency: country === "US" ? "USD" : "CAD",
    price: ""
  };
}

export function validateVaultRecord(record, brandConfigs) {
  const errors = [];
  if (!record.brandKey) errors.push("unsupported or missing Brand");
  if (record.brandKey === "vmg") errors.push("VMG cannot use affiliate records");
  if (!record.affiliateName) errors.push("missing Affiliate Name");
  if (!record.category) errors.push("missing Category");
  if (!record.title) errors.push("missing Product Name");
  if (!record.affiliateUrl) errors.push("missing Affiliate URL");
  else if (!validHttpUrl(record.affiliateUrl)) errors.push("invalid Affiliate URL");
  else if (record.affiliateUrl !== record.affiliateUrl.trim()) {
    errors.push("Affiliate URL contains leading or trailing whitespace");
  }
  if (record.productUrl && !validHttpUrl(record.productUrl)) {
    errors.push("invalid Product URL");
  } else if (record.productUrl !== record.productUrl.trim()) {
    errors.push("Product URL contains leading or trailing whitespace");
  }
  if (record.imageUrl && !validHttpUrl(record.imageUrl)) {
    errors.push("invalid Image URL");
  } else if (record.imageUrl !== record.imageUrl.trim()) {
    errors.push("Image URL contains leading or trailing whitespace");
  }
  if (record.couponCode !== record.couponCode.trim()) {
    errors.push("Coupon Code contains leading or trailing whitespace");
  }
  if (!record.country) errors.push("missing or unsupported Country");
  if (record.status && !record.active) errors.push(`Status is ${record.status}; expected Active`);
  if (!record.status) errors.push("missing Status");

  const brandConfig = brandConfigs[record.brandKey];
  if (brandConfig?.allowedCountries && !brandConfig.allowedCountries.includes(record.country)) {
    errors.push(
      `Country ${record.country} is not allowed for ${brandConfig.name}`
    );
  }
  const allowedCategories = [
    ...(brandConfig?.categories ?? []),
    ...(brandConfig?.allowedPillars ?? [])
  ].map(normalized);
  if (
    allowedCategories.length &&
    !allowedCategories.includes(normalized(record.category))
  ) {
    errors.push(`Category ${record.category} is not allowed for ${brandConfig.name}`);
  }
  if (
    brandConfig?.approvedMerchants &&
    !brandConfig.approvedMerchants.some(
      (merchant) => normalized(merchant) === normalized(record.merchant)
    )
  ) {
    errors.push(`Affiliate ${record.merchant || record.affiliateName} is not approved for ${brandConfig.name}`);
  }

  const partnerRule = brandConfig?.partnerRules?.[record.merchant];
  if (
    partnerRule?.expectedAffiliateUrl &&
    record.affiliateUrl !== partnerRule.expectedAffiliateUrl
  ) {
    errors.push(`${record.merchant} Affiliate URL does not match the approved value`);
  }
  if (
    partnerRule?.expectedCouponCode &&
    record.couponCode !== partnerRule.expectedCouponCode
  ) {
    errors.push(`${record.merchant} Coupon Code does not match the approved value`);
  }
  if (
    record.lastUsedDate &&
    !/^\d{4}-\d{2}-\d{2}$/.test(record.lastUsedDate)
  ) {
    errors.push("Last Used Date must use YYYY-MM-DD");
  }
  return errors;
}

export function parseAffiliateVaultCsv(csv, brandConfigs) {
  const rows = parseCsv(csv);
  const headerLine = csv.split(/\r?\n/, 1)[0] ?? "";
  const actualHeaders = new Set(
    parseCsv(`${headerLine}\nplaceholder`)[0]
      ? Object.keys(parseCsv(`${headerLine}\nplaceholder`)[0])
      : []
  );
  const normalizedRequired = REQUIRED_VAULT_COLUMNS.map((header) =>
    header.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
  );
  const missingColumns = normalizedRequired.filter(
    (header) => !actualHeaders.has(header)
  );

  const products = { estack: [], straightcut: [] };
  const errors = [];
  const skipped = [];
  const duplicates = [];
  const seen = new Set();

  for (const row of rows) {
    const record = normalizeVaultRecord(row);
    if (!record.active) {
      skipped.push({
        row: record.sourceRow,
        affiliate: record.merchant || record.affiliateName || record.title,
        reason: record.status
          ? `Status is ${record.status}; expected Active`
          : "missing Status"
      });
      continue;
    }
    const recordErrors = validateVaultRecord(record, brandConfigs);
    if (recordErrors.length) {
      errors.push({
        row: record.sourceRow,
        affiliate: record.merchant || record.affiliateName || record.title,
        errors: recordErrors
      });
      continue;
    }
    const duplicateKey = [
      record.brandKey,
      record.country,
      normalized(record.title),
      record.affiliateUrl
    ].join("|");
    if (seen.has(duplicateKey)) {
      duplicates.push({
        row: record.sourceRow,
        affiliate: record.merchant,
        reason: "duplicate product record"
      });
      continue;
    }
    seen.add(duplicateKey);
    if (products[record.brandKey]) products[record.brandKey].push(record);
  }

  return { products, errors, skipped, duplicates, missingColumns };
}

export async function loadAffiliateVault(url, brandConfigs) {
  if (!url) throw new Error("AFFILIATE_VAULT_CSV_URL is not configured");
  const response = await fetch(url, {
    headers: { "user-agent": "daily-content-drafts/2.0" },
    signal: AbortSignal.timeout(20_000)
  });
  if (!response.ok) {
    throw new Error(`Affiliate Vault returned HTTP ${response.status}`);
  }
  const csv = await response.text();
  if (!csv.trim()) throw new Error("Affiliate Vault CSV is empty");
  return {
    ...parseAffiliateVaultCsv(csv, brandConfigs),
    source: url
  };
}

export async function updateLastUsedDate(record, date) {
  if (!record) return "not applicable";
  if (!record.sourceRow) {
    throw new Error("Affiliate record is missing its source row; Last Used Date cannot be updated");
  }
  const url = process.env.AFFILIATE_VAULT_UPDATE_WEBHOOK_URL;
  if (!url) {
    throw new Error(
      "AFFILIATE_VAULT_UPDATE_WEBHOOK_URL is required to update Last Used Date"
    );
  }
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(process.env.AFFILIATE_VAULT_UPDATE_WEBHOOK_TOKEN
        ? {
            authorization: `Bearer ${process.env.AFFILIATE_VAULT_UPDATE_WEBHOOK_TOKEN}`
          }
        : {})
    },
    body: JSON.stringify({
      spreadsheetId:
        process.env.AFFILIATE_VAULT_SPREADSHEET_ID ||
        "1KzunQnNsPPCvTW5UbFWz9z4zl1o7u1QFped2vhCN1wo",
      sheetName: process.env.AFFILIATE_VAULT_SHEET_NAME || "Affiliate Link Vault",
      rowNumber: record.sourceRow,
      affiliateName: record.affiliateName,
      productName: record.title,
      affiliateUrl: record.affiliateUrl,
      lastUsedDate: date
    }),
    signal: AbortSignal.timeout(20_000)
  });
  if (!response.ok) {
    throw new Error(`Affiliate Vault update webhook returned HTTP ${response.status}`);
  }
  return "updated";
}
