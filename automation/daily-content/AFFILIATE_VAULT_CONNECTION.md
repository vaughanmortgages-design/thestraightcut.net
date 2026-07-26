# Affiliate Vault Connection

## Source

- Spreadsheet: `Affiliate Link Vault`
- Spreadsheet ID: `1KzunQnNsPPCvTW5UbFWz9z4zl1o7u1QFped2vhCN1wo`
- Tab: `Affiliate Link Vault`
- Runtime input: Google Sheets API using `GOOGLE_SERVICE_ACCOUNT_JSON`
- Read-only fallback: published CSV stored in `AFFILIATE_VAULT_CSV_URL`

The CSV URL should use Google Sheets' published form:

```text
https://docs.google.com/spreadsheets/d/e/<PUBLISHED_ID>/pub?gid=<SHEET_GID>&single=true&output=csv
```

Do not use the browser edit URL as the runtime CSV value.

## Required columns

| Column | Rule |
| --- | --- |
| Brand | `estack.ca`, `TSC`, or a configured alias. VMG affiliate rows are rejected. |
| Affiliate Name | Approved merchant or partner name. |
| Category | Must belong to the correct brand. |
| Product Name | Required for content selection. |
| Product URL | Merchant product page when supplied. |
| Affiliate URL | Required, valid HTTP(S), preserved exactly. |
| Coupon Code | Optional; copied exactly. |
| Commission | Informational only; never turned into a customer claim. |
| Country | `CA`/`Canada` or `US`/`United States`; must match the brand. |
| Status | Must be exactly `Active` (case-insensitive). |
| Image URL | Optional for text drafts; preserved exactly. |
| Notes | Source facts and restrictions only. |
| Last Used Date | ISO date (`YYYY-MM-DD`) used for rotation. |

## Selection and validation

1. Load the published CSV.
2. Normalize canonical and supported legacy header names.
3. Ignore blank and non-`Active` rows.
4. Reject missing affiliate URLs, invalid URLs, wrong markets and unapproved
   merchants.
5. Reject duplicate brand/country/product/link combinations.
6. Exclude the previous day's product.
7. Prefer seasonal and least-recently-used eligible products.
8. Generate the brand-specific draft package.
9. POST the source row and date to the Last Used Date update webhook.
10. Save the package as `Draft`; never publish it.

## Live-sheet upgrade completed on 2026-07-26

The six missing fields were added after the existing nine columns without
deleting or replacing source data:

`Category`, `Product URL`, `Coupon Code`, `Country`, `Image URL`,
`Last Used Date`.

Valid production URLs were marked `Active`. Ambiguous embed, instruction,
malformed and dashboard-verification rows were deliberately left unchanged for
manual review. Rocky Mountain Dog was added using:

- Brand: `TSC`
- Affiliate Name: `Rocky Mountain Dog`
- Category: `Pets`
- Affiliate URL:
  `https://rockymountaindog.ca/discount/RAYCUTTER10?ref=mcwboquj`
- Coupon Code: `RAYCUTTER10`
- Country: `CA`
- Status: `Active`

The Sprott URL must be consumed exactly as stored in the vault. The importer
does not normalize names or tracking parameters inside any URL.
