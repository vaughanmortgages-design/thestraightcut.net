# Production Google Sheets Connector

## Detected source

| Setting | Value |
| --- | --- |
| Spreadsheet ID | `1KzunQnNsPPCvTW5UbFWz9z4zl1o7u1QFped2vhCN1wo` |
| Spreadsheet title | `Affiliate Link Vault` |
| Production tab | `Affiliate Link Vault` |
| Production tab ID | `1637561516` |
| Other tabs detected | `TSC Deals`, `Notes` |
| Tabs consumed by Content Engine | `Affiliate Link Vault` only |

`TSC Deals` and `Notes` are intentionally excluded. They are not authoritative
affiliate-product sources.

## Runtime connection

The Content Engine authenticates with a Google service account and reads:

```text
'Affiliate Link Vault'!A:Z
```

The connector:

1. reads the header row by name rather than fixed column position;
2. validates the complete logical schema;
3. selects only `Active` rows;
4. detects affiliate links, coupon codes and categories;
5. preserves every stored URL exactly;
6. writes the generation date to the detected `Last Used Date` column;
7. fails before content generation when required headers disappear or are
   renamed to unsupported values.

## Required permissions

### Google Cloud service account

- Enable the Google Sheets API in the Google Cloud project.
- Share the production spreadsheet with the service-account email.
- Grant **Editor** access because the engine updates `Last Used Date`.
- Store the complete service-account JSON as the GitHub secret
  `GOOGLE_SERVICE_ACCOUNT_JSON`.
- OAuth scope used:
  `https://www.googleapis.com/auth/spreadsheets`.

No API key is used. Never commit the JSON credentials.

### Automatic refresh trigger

The workflow listens for:

```text
repository_dispatch: affiliate-vault-updated
```

Install `google-apps-script/AffiliateVaultChangeTrigger.gs` as an installable
on-edit trigger. Its Script Properties require:

- `GITHUB_REPOSITORY_DISPATCH_TOKEN`
- `GITHUB_REPOSITORY` (optional; defaults to
  `vaughanmortgages-design/thestraightcut.net`)

The GitHub token needs permission to create repository dispatch events for this
repository. Apps Script requires access to the spreadsheet, installable
triggers, Script Properties and external HTTP requests.

The daily schedule remains as a recovery run if an edit event is missed.

## Data mapping

| Sheet column | Engine field | Example |
| --- | --- | --- |
| Brand | `sourceBrand` / `brandKey` | `estack.ca` → `estack` |
| Program Name | `affiliateName` | `Sprott Money` |
| Offer/Link Name | `title` | `Sprott Money Canada` |
| Full URL | `affiliateUrl` | Merchant-issued tracked URL, unchanged |
| Status | `active` | `Active` → eligible |
| Category | `category` | `Bullion` |
| Product URL | `productUrl` | Optional merchant product page |
| Coupon Code | `couponCode` | `RAYCUTTER10` |
| Country | `country` | `CA` |
| Image URL | `imageUrl` | Optional HTTPS image |
| Notes | `description` / restrictions | Source facts only |
| Last Used Date | `lastUsedDate` | `2026-07-26` |

Legacy names remain supported:

- `Program Name` → Affiliate Name
- `Offer/Link Name` → Product Name
- `Full URL` → Affiliate URL
- `Commission Terms` → Commission

## Safe failure

The run exits with a logged `Affiliate Vault schema mismatch` error when any
logical field is missing. It also logs row-specific errors for invalid URLs,
unapproved merchants, duplicate products, wrong countries, missing categories
or non-Active records. No affiliate content is produced from rejected rows.
