# Active Affiliate CSV Publisher

The publisher creates a read-only, UTF-8 CSV feed from the production
`Affiliate Link Vault` tab.

## Feed

Pull-request branch:

```text
https://raw.githubusercontent.com/vaughanmortgages-design/thestraightcut.net/refs/heads/agent/daily-content-automation-20260726/automation/daily-content/public/affiliate-vault-active.csv
```

After this branch is approved and merged, the permanent URL will be:

```text
https://raw.githubusercontent.com/vaughanmortgages-design/thestraightcut.net/main/automation/daily-content/public/affiliate-vault-active.csv
```

The raw GitHub endpoint is read-only. It returns the committed CSV bytes and
cannot modify the source Google Sheet.

Validation report:

```text
https://raw.githubusercontent.com/vaughanmortgages-design/thestraightcut.net/refs/heads/agent/daily-content-automation-20260726/automation/daily-content/public/affiliate-vault-active.validation.json
```

## Rules

- The source is spreadsheet
  `1KzunQnNsPPCvTW5UbFWz9z4zl1o7u1QFped2vhCN1wo`, tab
  `Affiliate Link Vault`.
- Only rows whose `Status` cell equals `Active` are published.
- Header aliases support the current production names such as `Program Name`,
  `Offer/Link Name` and `Full URL`.
- Affiliate URLs, product URLs and coupon codes are copied without
  normalization or rewriting.
- Output is written using Node's UTF-8 encoding.
- Missing required columns stop the run with
  `Affiliate Vault CSV schema mismatch`.
- Active rows with a missing/invalid affiliate URL or missing category are
  excluded and recorded in the validation report.
- Exact duplicate Active rows are excluded and recorded.

## Automatic refresh

`daily-content-drafts.yml` runs the publisher:

1. on the daily schedule;
2. on manual workflow dispatch;
3. when the Affiliate Vault Apps Script sends
   `affiliate-vault-updated`.

The workflow commits both:

- `public/affiliate-vault-active.csv`
- `public/affiliate-vault-active.validation.json`

Immediate refresh becomes active after the Sheet trigger and required GitHub
secrets are configured. The workflow is not deployed by this pull request.

## Column mapping

| CSV column | Affiliate Vault source |
| --- | --- |
| Brand | `Brand` |
| Affiliate Name | `Affiliate Name` or current `Program Name` |
| Category | `Category` |
| Product Name | `Product Name` or current `Offer/Link Name` |
| Product URL | `Product URL` |
| Affiliate URL | `Affiliate URL` or current `Full URL` |
| Coupon Code | `Coupon Code` |
| Country | `Country` |
| Status | `Status` |
