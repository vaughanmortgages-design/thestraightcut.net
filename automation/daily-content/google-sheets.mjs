import crypto from "node:crypto";
import {
  parseAffiliateVaultCsv
} from "./affiliate-vault.mjs";

export const DEFAULT_SHEET_ID =
  "1KzunQnNsPPCvTW5UbFWz9z4zl1o7u1QFped2vhCN1wo";
export const DEFAULT_TAB_NAME = "Affiliate Link Vault";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function base64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function csvCell(value) {
  const string = String(value ?? "");
  return /[",\r\n]/.test(string)
    ? `"${string.replace(/"/g, '""')}"`
    : string;
}

export function rowsToCsv(rows) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

export function readServiceAccountCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not configured");
  let credentials;
  try {
    credentials = JSON.parse(raw);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
  }
  if (!credentials.client_email || !credentials.private_key) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON must contain client_email and private_key"
    );
  }
  return credentials;
}

export async function getGoogleAccessToken(credentials, fetchImpl = fetch) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(
    JSON.stringify({
      iss: credentials.client_email,
      scope: GOOGLE_SHEETS_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      iat: now,
      exp: now + 3600
    })
  );
  const unsigned = `${header}.${claims}`;
  const signature = crypto
    .sign("RSA-SHA256", Buffer.from(unsigned), credentials.private_key)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  const assertion = `${unsigned}.${signature}`;
  const response = await fetchImpl(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    }),
    signal: AbortSignal.timeout(20_000)
  });
  if (!response.ok) {
    throw new Error(`Google OAuth returned HTTP ${response.status}`);
  }
  const payload = await response.json();
  if (!payload.access_token) throw new Error("Google OAuth returned no access token");
  return payload.access_token;
}

export async function loadAffiliateVaultFromGoogleSheets(
  brandConfigs,
  fetchImpl = fetch
) {
  const spreadsheetId =
    process.env.AFFILIATE_VAULT_SPREADSHEET_ID || DEFAULT_SHEET_ID;
  const tabName =
    process.env.AFFILIATE_VAULT_SHEET_NAME || DEFAULT_TAB_NAME;
  const credentials = readServiceAccountCredentials();
  const accessToken = await getGoogleAccessToken(credentials, fetchImpl);
  const range = `'${tabName.replace(/'/g, "''")}'!A:Z`;
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}` +
    `/values/${encodeURIComponent(range)}?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`;
  const response = await fetchImpl(url, {
    headers: { authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(20_000)
  });
  if (!response.ok) {
    throw new Error(
      `Google Sheets read failed for ${spreadsheetId}/${tabName}: HTTP ${response.status}`
    );
  }
  const payload = await response.json();
  const rows = payload.values ?? [];
  if (rows.length < 2) {
    throw new Error(`Google Sheet ${tabName} contains no affiliate records`);
  }
  const parsed = parseAffiliateVaultCsv(rowsToCsv(rows), brandConfigs);
  if (parsed.schemaErrors.length) {
    throw new Error(
      `Affiliate Vault schema mismatch on ${tabName}: ${parsed.schemaErrors.join("; ")}`
    );
  }
  return {
    ...parsed,
    spreadsheetId,
    tabName,
    source: `google-sheets://${spreadsheetId}/${tabName}`,
    connection: "google-sheets-api",
    accessToken
  };
}

export async function writeGoogleSheetValue({
  spreadsheetId,
  tabName,
  column,
  row,
  value,
  accessToken,
  fetchImpl = fetch
}) {
  const range = `'${tabName.replace(/'/g, "''")}'!${column}${row}`;
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}` +
    `/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
  const response = await fetchImpl(url, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ range, majorDimension: "ROWS", values: [[value]] }),
    signal: AbortSignal.timeout(20_000)
  });
  if (!response.ok) {
    throw new Error(
      `Google Sheets write failed for ${tabName}!${column}${row}: HTTP ${response.status}`
    );
  }
  return "updated";
}
