import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readAffiliateVaultRows, rowsToCsv } from "./google-sheets.mjs";

export const FEED_COLUMNS = [
  {
    output: "Brand",
    aliases: ["brand"]
  },
  {
    output: "Affiliate Name",
    aliases: ["affiliate_name", "program_name"]
  },
  {
    output: "Category",
    aliases: ["category"]
  },
  {
    output: "Product Name",
    aliases: ["product_name", "offer_link_name"]
  },
  {
    output: "Product URL",
    aliases: ["product_url"]
  },
  {
    output: "Affiliate URL",
    aliases: ["affiliate_url", "full_url"]
  },
  {
    output: "Coupon Code",
    aliases: ["coupon_code"]
  },
  {
    output: "Country",
    aliases: ["country"]
  },
  {
    output: "Status",
    aliases: ["status"]
  }
];

function normalized(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function validHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function resolveColumnIndexes(headers) {
  const normalizedHeaders = headers.map(normalized);
  const indexes = new Map();
  const missingColumns = [];

  for (const column of FEED_COLUMNS) {
    const index = normalizedHeaders.findIndex((header) =>
      column.aliases.includes(header)
    );
    if (index < 0) {
      missingColumns.push(column.output);
    } else {
      indexes.set(column.output, index);
    }
  }

  if (missingColumns.length) {
    throw new Error(
      `Affiliate Vault CSV schema mismatch: missing ${missingColumns.join(", ")}`
    );
  }
  return indexes;
}

export function buildActiveAffiliateFeed(rows) {
  if (!Array.isArray(rows) || rows.length < 2) {
    throw new Error("Affiliate Vault contains no data rows");
  }

  const indexes = resolveColumnIndexes(rows[0]);
  const statusIndex = indexes.get("Status");
  const affiliateUrlIndex = indexes.get("Affiliate URL");
  const categoryIndex = indexes.get("Category");
  const outputRows = [FEED_COLUMNS.map((column) => column.output)];
  const invalidRows = [];
  const duplicateRows = [];
  const seen = new Set();
  let activeRows = 0;

  rows.slice(1).forEach((row, offset) => {
    const sourceRow = offset + 2;
    if (!row.some((value) => String(value ?? "").trim())) return;
    if (normalized(row[statusIndex]) !== "active") return;
    activeRows += 1;

    const affiliateUrl = String(row[affiliateUrlIndex] ?? "");
    const category = String(row[categoryIndex] ?? "");
    const errors = [];
    if (!affiliateUrl) errors.push("missing Affiliate URL");
    else if (!validHttpUrl(affiliateUrl)) errors.push("invalid Affiliate URL");
    else if (affiliateUrl !== affiliateUrl.trim()) {
      errors.push("Affiliate URL contains leading or trailing whitespace");
    }
    if (!category.trim()) errors.push("missing Category");

    if (errors.length) {
      invalidRows.push({ row: sourceRow, errors });
      return;
    }

    const outputRow = FEED_COLUMNS.map((column) =>
      String(row[indexes.get(column.output)] ?? "")
    );
    const duplicateKey = outputRow.join("\u001f");
    if (seen.has(duplicateKey)) {
      duplicateRows.push({
        row: sourceRow,
        reason: "exact duplicate Active row"
      });
      return;
    }
    seen.add(duplicateKey);
    outputRows.push(outputRow);
  });

  return {
    csv: `${rowsToCsv(outputRows)}\n`,
    report: {
      encoding: "UTF-8",
      sourceRows: rows.length - 1,
      activeRows,
      publishedRows: outputRows.length - 1,
      invalidRows,
      duplicateRows,
      columns: FEED_COLUMNS.map((column) => column.output)
    }
  };
}

export async function publishActiveAffiliateFeed({
  outputDirectory = new URL("./public/", import.meta.url),
  fetchImpl = fetch
} = {}) {
  const sheet = await readAffiliateVaultRows(fetchImpl);
  const result = buildActiveAffiliateFeed(sheet.rows);
  const directory = fileURLToPath(outputDirectory);
  await fs.mkdir(directory, { recursive: true });
  await Promise.all([
    fs.writeFile(
      path.join(directory, "affiliate-vault-active.csv"),
      result.csv,
      "utf8"
    ),
    fs.writeFile(
      path.join(directory, "affiliate-vault-active.validation.json"),
      `${JSON.stringify(
        {
          spreadsheetId: sheet.spreadsheetId,
          tabName: sheet.tabName,
          ...result.report
        },
        null,
        2
      )}\n`,
      "utf8"
    )
  ]);
  return {
    spreadsheetId: sheet.spreadsheetId,
    tabName: sheet.tabName,
    ...result.report
  };
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  try {
    const report = await publishActiveAffiliateFeed();
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } catch (error) {
    console.error(`[affiliate-csv] ${error.message}`);
    process.exitCode = 1;
  }
}
