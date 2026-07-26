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

## Product sources

- `ESTACK_CATALOG_URL` — JSON product feed for eStack.ca.
- `TSC_CATALOG_URL` — JSON product feed for The Straight Cut.

The loader accepts JSON (an array or an object containing `products`, `items` or
`data`) and published Google Sheets/CSV feeds. Common Sheet headers such as
`Product ID`, `Product Title`, `Merchant`, `Category`, `Affiliate URL` and
`Active` are normalized by the importer. It rejects inactive, duplicate or
incomplete products. Product-specific content is created only when a stored
affiliate URL exists. URLs are passed through without rewriting.

## Secrets and variables

| Name | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Recommended | Generates structured drafts. Without it, the safe editorial templates run. |
| `OPENAI_MODEL` | No | Defaults to `gpt-5.6`. |
| `ESTACK_CATALOG_URL` | Required for eStack product posts | Approved eStack product JSON feed. |
| `TSC_CATALOG_URL` | Required for Straight Cut product posts | Approved Straight Cut product JSON feed. |
| `CONTENT_STUDIO_WEBHOOK_URL` | No | Sends the completed package to the existing PM Digital Content Studio/Make.com intake. |
| `CONTENT_STUDIO_WEBHOOK_TOKEN` | No | Bearer token for the intake webhook. |

GitHub repository variables are used for public catalog URLs and secrets are
used for credentials. Do not put credentials in catalog JSON or this repository.

## Add an affiliate partner

1. Add the approved partner name to the relevant brand in
   `config/brands.json`.
2. Put the exact merchant-issued affiliate URL in the existing catalog or
   Google Sheet. Do not place product URLs in the prompt or templates.
3. Ensure the product feed exposes `id`, `title`, `merchant`, `category`,
   `affiliate_url` and `active`.
4. Run the tests and a dry run.
5. Confirm the draft repeats the stored URL character-for-character and includes
   the brand disclosure.

Rocky Mountain Dog is configured with the approved link and coupon supplied by
the brand owner. Amazon and eBay content is generated only from tracked URLs in
the production catalog.

## Schedule and approval

`.github/workflows/daily-content-drafts.yml` runs once per day and may also be
started manually. The workflow generates drafts, commits only the draft package,
log and rotation state, and never deploys or publishes. Keep the content in
`Draft` until a person changes its approval status.
