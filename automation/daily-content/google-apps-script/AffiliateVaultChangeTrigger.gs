/**
 * Installable Google Sheets change trigger for the Affiliate Link Vault.
 *
 * Required Script Properties:
 * - AFFILIATE_VAULT_WEBHOOK_URL
 * - AFFILIATE_VAULT_WEBHOOK_SECRET
 *
 * Run installAffiliateVaultTrigger() once from Apps Script. Do not use a simple
 * onEdit trigger because UrlFetchApp requires authorization.
 */

const AFFILIATE_VAULT_SPREADSHEET_ID =
  '1KzunQnNsPPCvTW5UbFWz9z4zl1o7u1QFped2vhCN1wo';
const AFFILIATE_VAULT_TAB = 'Affiliate Link Vault';

function installAffiliateVaultTrigger() {
  const spreadsheet = SpreadsheetApp.openById(AFFILIATE_VAULT_SPREADSHEET_ID);
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'onAffiliateVaultEdit')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('onAffiliateVaultEdit')
    .forSpreadsheet(spreadsheet)
    .onEdit()
    .create();
}

function onAffiliateVaultEdit(event) {
  if (!event || !event.range) {
    throw new Error('Affiliate Vault edit event is missing its range.');
  }
  const sheet = event.range.getSheet();
  if (
    sheet.getParent().getId() !== AFFILIATE_VAULT_SPREADSHEET_ID ||
    sheet.getName() !== AFFILIATE_VAULT_TAB
  ) {
    return;
  }

  const properties = PropertiesService.getScriptProperties();
  const webhookUrl = properties.getProperty('AFFILIATE_VAULT_WEBHOOK_URL');
  const webhookSecret = properties.getProperty('AFFILIATE_VAULT_WEBHOOK_SECRET');
  if (!webhookUrl || !webhookSecret) {
    throw new Error('Missing Affiliate Vault webhook URL or secret.');
  }

  const eventId = Utilities.getUuid();
  const payload = JSON.stringify({
    event: 'affiliate-vault.updated',
    event_id: eventId,
    occurred_at: new Date().toISOString(),
    spreadsheet_id: AFFILIATE_VAULT_SPREADSHEET_ID,
    tab: AFFILIATE_VAULT_TAB,
    change: {
      row: event.range.getRow(),
      column: event.range.getColumn(),
      a1_notation: event.range.getA1Notation()
    }
  });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signatureBytes = Utilities.computeHmacSha256Signature(
    `${timestamp}.${payload}`,
    webhookSecret,
    Utilities.Charset.UTF_8
  );
  const signature = signatureBytes
    .map(byte => (`0${(byte & 0xff).toString(16)}`).slice(-2))
    .join('');

  const retryable = code =>
    [408, 425, 429].includes(code) || code >= 500;
  const delays = [1000, 3000, 7000];
  let lastError;

  for (let attempt = 0; attempt < delays.length; attempt += 1) {
    try {
      const response = UrlFetchApp.fetch(webhookUrl, {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'X-Affiliate-Vault-Event-Id': eventId,
          'X-Affiliate-Vault-Timestamp': timestamp,
          'X-Affiliate-Vault-Signature': `sha256=${signature}`
        },
        payload,
        muteHttpExceptions: true
      });
      const code = response.getResponseCode();
      if (code === 202) return;
      lastError = new Error(
        `Affiliate Vault webhook returned HTTP ${code}: ` +
        response.getContentText()
      );
      if (!retryable(code)) break;
    } catch (error) {
      lastError = error;
    }

    if (attempt < delays.length - 1) Utilities.sleep(delays[attempt]);
  }

  console.error(JSON.stringify({
    component: 'affiliate-vault-trigger',
    event: 'delivery_failed',
    event_id: eventId,
    message: lastError ? lastError.message : 'unknown error'
  }));
  throw lastError || new Error('Affiliate Vault webhook delivery failed.');
}
