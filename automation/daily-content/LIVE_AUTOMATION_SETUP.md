# Live Automation Setup

This checklist activates the existing draft-only Content Engine. It does not
publish social posts or website content.

## GitHub Actions secrets

| Exact name | Required | Source | Purpose |
| --- | --- | --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Yes | Google Cloud | Complete service-account JSON used to read the production Sheet and update `Last Used Date`. |
| `OPENAI_API_KEY` | No | OpenAI | Enables AI-assisted draft wording. The validated deterministic draft generator is used when omitted. |
| `AFFILIATE_VAULT_CSV_URL` | Fallback only | Google Sheets published CSV | Read-only fallback when the Sheets API connection is unavailable. |
| `AFFILIATE_VAULT_UPDATE_WEBHOOK_URL` | Fallback only | Make.com or an approved Apps Script web app | Updates `Last Used Date` when the CSV fallback is used. |
| `AFFILIATE_VAULT_UPDATE_WEBHOOK_TOKEN` | Fallback only | Same webhook owner | Bearer token for the fallback update webhook. |
| `CONTENT_STUDIO_WEBHOOK_URL` | Optional | Make.com | Receives generated draft packages. Omit to keep drafts only in GitHub. |
| `CONTENT_STUDIO_WEBHOOK_TOKEN` | Optional | Make.com | Bearer token paired with the Content Studio webhook. |

## GitHub Actions variables

| Exact name | Required | Value/source |
| --- | --- | --- |
| `AFFILIATE_VAULT_SPREADSHEET_ID` | No | Google Sheet ID. Defaults to `1KzunQnNsPPCvTW5UbFWz9z4zl1o7u1QFped2vhCN1wo`. |
| `AFFILIATE_VAULT_SHEET_NAME` | No | Google Sheet tab. Defaults to `Affiliate Link Vault`. |
| `OPENAI_MODEL` | No | Approved OpenAI model name. Defaults to the model configured in code. |

## Netlify runtime variables

| Exact name | Required | Source | Purpose |
| --- | --- | --- | --- |
| `AFFILIATE_VAULT_WEBHOOK_SECRET` | Yes | Generate with a cryptographically secure password manager or secret generator | Verifies Apps Script HMAC signatures. Store the same value in Apps Script; never commit it. |
| `GITHUB_REPOSITORY_DISPATCH_TOKEN` | Yes | GitHub fine-grained token or GitHub App credential | Creates `affiliate-vault-updated` repository dispatch events for this repository only. |
| `GITHUB_REPOSITORY` | No | GitHub | Defaults to `vaughanmortgages-design/thestraightcut.net`. |

The endpoint becomes live only after an approved Netlify deployment:

```text
POST https://straightcut.net/.netlify/functions/affiliate-vault-webhook
```

## Google Apps Script properties

| Exact name | Required | Value/source |
| --- | --- | --- |
| `AFFILIATE_VAULT_WEBHOOK_URL` | Yes | The deployed Netlify Function URL above |
| `AFFILIATE_VAULT_WEBHOOK_SECRET` | Yes | The exact same generated HMAC secret stored in Netlify |

Install `google-apps-script/AffiliateVaultChangeTrigger.gs` in a Sheet-bound
Apps Script project. After the endpoint is deployed and both properties exist,
run `installAffiliateVaultTrigger()` once and approve the requested
Spreadsheet, trigger and external-request permissions.

## Google Sheet authorization

1. Enable the Google Sheets API in the selected Google Cloud project.
2. Create a dedicated service account and JSON key.
3. Share spreadsheet
   `1KzunQnNsPPCvTW5UbFWz9z4zl1o7u1QFped2vhCN1wo` with the service-account
   email as **Editor**.
4. Store the complete JSON, unchanged, in the GitHub Actions secret
   `GOOGLE_SERVICE_ACCOUNT_JSON`.
5. Use only the production tab `Affiliate Link Vault`.

## Make.com and social connections

Make.com is optional for draft generation. If used, it supplies
`CONTENT_STUDIO_WEBHOOK_URL` and `CONTENT_STUDIO_WEBHOOK_TOKEN`. Facebook,
Instagram, LinkedIn and Pinterest credentials belong only in their respective
Make.com connections. No social access token is required by this repository,
and no social connection may auto-publish a package whose status is `Draft`.

## Safe test

1. Open **Actions → Daily Content Drafts → Run workflow**.
2. Leave **safe_test_mode** enabled.
3. Run the workflow.
4. Confirm the run uploads `daily-content-safe-test-<run-id>`.
5. Confirm the artifact contains Draft packages for `vmg`, `estack` and
   `straightcut`, all with `"testMode": true`.

Safe test mode uses only `fixtures/safe-test-vault.csv`. It does not call
Content Studio, update the Sheet, update production state, commit, push,
publish, or mark webhook events.

## Live activation order

1. Configure the GitHub secret and optional variables.
2. Configure the Netlify runtime variables.
3. Complete an approved deployment of the webhook endpoint.
4. Send one signed test payload and confirm HTTP `202`.
5. Add the two Apps Script properties.
6. Run `installAffiliateVaultTrigger()` and approve access.
7. Edit a non-URL test cell in the production tab.
8. Confirm one `affiliate-vault-updated` workflow run, one set of Draft
   packages and one `Last Used Date` update.
9. Repeat the same webhook event ID and confirm it is ignored as a duplicate.
10. Keep every generated package in `Draft` until human approval.

Do not activate the Sheet trigger before the webhook endpoint is deployed:
doing so would create repeated failed deliveries rather than a working
end-to-end integration.
