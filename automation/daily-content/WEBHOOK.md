# Affiliate Vault Refresh Webhook

## Endpoint

After an approved deployment, the Netlify Function endpoint is:

```text
POST https://straightcut.net/.netlify/functions/affiliate-vault-webhook
```

This pull request does not deploy or activate the endpoint.

## Authentication

Every request must contain:

```text
X-Affiliate-Vault-Event-Id: <unique event id>
X-Affiliate-Vault-Timestamp: <10-digit Unix timestamp>
X-Affiliate-Vault-Signature: sha256=<64-character lowercase hex digest>
Content-Type: application/json
```

The signature is:

```text
HMAC-SHA256(
  AFFILIATE_VAULT_WEBHOOK_SECRET,
  "<timestamp>.<exact raw JSON body>"
)
```

The handler:

- compares signatures using a timing-safe comparison;
- rejects timestamps more than five minutes old;
- requires the event ID in the header and body to match;
- accepts only the production spreadsheet ID and tab;
- accepts bodies no larger than 64 KiB;
- never logs the secret, signature or request body.

Use the same randomly generated secret in:

- Netlify environment variable `AFFILIATE_VAULT_WEBHOOK_SECRET`;
- Apps Script property `AFFILIATE_VAULT_WEBHOOK_SECRET`.

## Duplicate protection

The function atomically claims a SHA-256 hash of each event ID in the
site-wide Netlify Blobs store `affiliate-vault-webhook-events` using
`onlyIfNew`.

A repeated event returns:

```json
{
  "status": "duplicate_ignored",
  "event_id": "vault-20260726-a1b2c3d4"
}
```

The GitHub workflow uses the same event ID as a second guard. Processed IDs are
stored in `automation/daily-content/state.json`, the workflow is serialized,
and duplicate events skip CSV generation and draft generation. Draft files use
deterministic daily paths. Downstream Content Studio requests also receive a
deterministic `Idempotency-Key` header.

## Retry behaviour

Google Apps Script makes up to three delivery attempts using the same event ID:

- first retry after 1 second;
- second retry after 3 seconds;
- no retries for permanent 4xx responses.

The webhook makes up to three GitHub dispatch attempts:

- retries HTTP 408, 425, 429 and 5xx responses;
- honors `Retry-After`, capped at 10 seconds;
- otherwise uses bounded delays of 500 ms and 1.5 seconds;
- does not retry permanent 4xx responses.

If every dispatch attempt fails, the endpoint:

1. writes a sanitized failure record to Netlify Blobs;
2. writes a structured error to Netlify Function logs;
3. releases the event claim so a later delivery can retry;
4. returns HTTP 503 with `Retry-After: 60`.

The daily scheduled Content Engine run remains the final recovery path.

## Example payload

```json
{
  "event": "affiliate-vault.updated",
  "event_id": "vault-20260726-a1b2c3d4",
  "occurred_at": "2026-07-26T17:30:00.000Z",
  "spreadsheet_id": "1KzunQnNsPPCvTW5UbFWz9z4zl1o7u1QFped2vhCN1wo",
  "tab": "Affiliate Link Vault",
  "change": {
    "row": 52,
    "column": 12,
    "a1_notation": "L52"
  }
}
```

No affiliate URL, coupon code or product data is included in the webhook.
The Content Engine reloads the authoritative Sheet after it accepts the event.

## Required configuration

### Netlify

- `AFFILIATE_VAULT_WEBHOOK_SECRET`
- `GITHUB_REPOSITORY_DISPATCH_TOKEN`
- `GITHUB_REPOSITORY` (optional; defaults to
  `vaughanmortgages-design/thestraightcut.net`)

The GitHub token must be limited to this repository and allowed to create
repository dispatch events.

### Apps Script

- `AFFILIATE_VAULT_WEBHOOK_URL`
- `AFFILIATE_VAULT_WEBHOOK_SECRET`

Install `google-apps-script/AffiliateVaultChangeTrigger.gs` as an installable
on-edit trigger after the endpoint is deployed and the secrets are configured.

## Safe test mode

Run the `Daily Content Drafts` workflow manually with `safe_test_mode` enabled.
Safe test mode:

- reads `fixtures/safe-test-vault.csv` instead of the production Sheet;
- writes only to `content/drafts/test/<date>`;
- uploads those drafts as a seven-day GitHub Actions artifact;
- does not call Content Studio or any Last Used Date webhook;
- does not update the production Sheet, state file, repository, or webhook
  idempotency history.

The checkbox defaults to enabled for manual runs. Scheduled and
`repository_dispatch` runs remain production-mode runs.
