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

`AFFILIATE_VAULT_CSV_URL` points to the published CSV for the current Affiliate
Link Vault Google Sheet. The vault is the only monetized-content source.

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
| `AFFILIATE_VAULT_CSV_URL` | Yes | Published CSV URL for the Affiliate Vault sheet. |
| `AFFILIATE_VAULT_SPREADSHEET_ID` | No | Defaults to the current Affiliate Link Vault spreadsheet ID. |
| `AFFILIATE_VAULT_SHEET_NAME` | No | Defaults to `Affiliate Link Vault`. |
| `AFFILIATE_VAULT_UPDATE_WEBHOOK_URL` | Required when a product is selected | Make.com/Apps Script endpoint that updates `Last Used Date`. |
| `AFFILIATE_VAULT_UPDATE_WEBHOOK_TOKEN` | Recommended | Bearer token protecting the update endpoint. |
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
started manually. The workflow generates drafts, commits only the draft package,
log and rotation state, and never deploys or publishes. Keep the content in
`Draft` until a person changes its approval status.
