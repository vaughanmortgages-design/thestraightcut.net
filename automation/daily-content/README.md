# Daily Content Automation

This automation creates one daily **Draft** package for Vaughan Mortgage Group,
eStack.ca and The Straight Cut. It does not publish content or modify any
website page.

## Daily outputs

| Brand | Drafts |
| --- | --- |
| Vaughan Mortgage Group | Article, Facebook, Instagram, LinkedIn |
| eStack.ca | Article, Facebook, Instagram, LinkedIn |
| The Straight Cut | Buying guide or featured-product post, Facebook, Instagram, LinkedIn, Pinterest title and description |

Every package has one of four approval states: `Draft`, `Approved`, `Rejected`
or `Published`. The generator always creates `Draft`; approval and publishing
remain manual.

## Run locally

```bash
node automation/daily-content/generate-daily-drafts.mjs --dry-run
node automation/daily-content/generate-daily-drafts.mjs --date 2026-07-26
node --test automation/daily-content/test.mjs
```

Drafts and logs are written to `content/drafts/YYYY-MM-DD/`. Rotation state is
stored in `automation/daily-content/state.json`, preventing the previous day's
category or product from being selected again.

## Affiliate Vault source

The production connection uses the Google Sheets API with the service account
stored in `GOOGLE_SERVICE_ACCOUNT_JSON`. The Vault spreadsheet ID and tab name
are detected from configuration, with safe defaults for the current production
Sheet. A published CSV remains supported as a read-only fallback.

The canonical columns, in order, are:

`Brand`, `Affiliate Name`, `Category`, `Product Name`, `Product URL`,
`Affiliate URL`, `Coupon Code`, `Commission`, `Country`, `Status`, `Image URL`,
`Notes`, `Last Used Date`.

The importer understands the current legacy names `Program Name`,
`Commission Terms`, `Offer/Link Name` and `Full URL`, but it reports the missing
canonical columns. Only the literal status `Active` is eligible. It rejects
missing/invalid affiliate URLs, wrong-country records, unsupported brands,
unapproved merchants and duplicates. Affiliate URLs, product URLs, image URLs
and coupon codes are never rewritten.

VMG never reads affiliate records. eStack.ca accepts Canadian Bullion and Loans
and Credit partners only. The Straight Cut accepts Amazon, eBay and Rocky
Mountain Dog only.

## Secrets and variables

| Name | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Recommended | Generates structured drafts. Without it, the safe editorial templates run. |
| `OPENAI_MODEL` | No | Defaults to `gpt-5.6`. |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Yes for production | Google service-account JSON. The service-account email must have Editor access to update Last Used Date. |
| `AFFILIATE_VAULT_CSV_URL` | Fallback only | Published CSV URL used when service-account credentials are unavailable. |
| `AFFILIATE_VAULT_SPREADSHEET_ID` | No | Defaults to the current Affiliate Link Vault spreadsheet ID. |
| `AFFILIATE_VAULT_SHEET_NAME` | No | Defaults to `Affiliate Link Vault`. |
| `AFFILIATE_VAULT_WEBHOOK_SECRET` | Yes for change-trigger refresh | Shared HMAC secret stored in Netlify and Apps Script; never committed. |
| `GITHUB_REPOSITORY_DISPATCH_TOKEN` | Yes for change-trigger refresh | Repository-scoped token stored in Netlify and used only after signature verification. |
| `GITHUB_REPOSITORY` | No | Defaults to `vaughanmortgages-design/thestraightcut.net`. |
| `AFFILIATE_VAULT_UPDATE_WEBHOOK_URL` | CSV fallback only | Make.com/Apps Script endpoint that updates `Last Used Date` when direct Sheets API access is not used. |
| `AFFILIATE_VAULT_UPDATE_WEBHOOK_TOKEN` | CSV fallback only | Bearer token protecting the fallback update endpoint. |
| `CONTENT_STUDIO_WEBHOOK_URL` | No | Sends the completed package to the existing PM Digital Content Studio/Make.com intake. |
| `CONTENT_STUDIO_WEBHOOK_TOKEN` | No | Bearer token for the intake webhook. |

GitHub repository variables are used for public catalog URLs and secrets are
used for credentials. Do not put credentials in catalog JSON or this repository.

## Add an affiliate partner

1. Add the approved partner name to the relevant brand in
   `config/brands.json`.
2. Add the partner/product row to the Affiliate Vault using every canonical
   column.
3. Paste the merchant-issued affiliate URL without changing it and set
   `Status` to `Active` only after approval.
4. Run the tests and a dry run.
5. Confirm the draft repeats the stored URL character-for-character and includes
   the brand disclosure.

Rocky Mountain Dog is validated against the approved link and coupon supplied by
the brand owner. Amazon and eBay content is generated only from tracked URLs in
the Affiliate Vault.

## Schedule and approval

`.github/workflows/daily-content-drafts.yml` runs once per day and may also be
started manually. It also accepts the `affiliate-vault-updated`
`repository_dispatch` event. The Apps Script trigger in
`google-apps-script/AffiliateVaultChangeTrigger.gs` sends a signed request to
the refresh endpoint after an edit to the production Vault tab. The endpoint
validates, deduplicates and safely retries the GitHub dispatch. The workflow
regenerates the read-only Active affiliate feed documented in
`CSV_PUBLISHER.md`, generates drafts, and commits only automation data, the
draft package, log and rotation state. It never deploys or publishes website
content. Keep the content in `Draft` until a person changes its approval
status. See `WEBHOOK.md` for authentication and retry details.
