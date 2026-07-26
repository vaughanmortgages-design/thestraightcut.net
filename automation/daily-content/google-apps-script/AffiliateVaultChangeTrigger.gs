/**
 * Installable Google Sheets change trigger for the Affiliate Link Vault.
 *
 * Required Script Properties:
 * - GITHUB_REPOSITORY_DISPATCH_TOKEN
 * - GITHUB_REPOSITORY (defaults to vaughanmortgages-design/thestraightcut.net)
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
  const token = properties.getProperty('GITHUB_REPOSITORY_DISPATCH_TOKEN');
  const repository =
    properties.getProperty('GITHUB_REPOSITORY') ||
    'vaughanmortgages-design/thestraightcut.net';
  if (!token) {
    throw new Error(
      'Missing Script Property GITHUB_REPOSITORY_DISPATCH_TOKEN.'
    );
  }

  const response = UrlFetchApp.fetch(
    `https://api.github.com/repos/${repository}/dispatches`,
    {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28'
      },
      payload: JSON.stringify({
        event_type: 'affiliate-vault-updated',
        client_payload: {
          spreadsheet_id: AFFILIATE_VAULT_SPREADSHEET_ID,
          tab: AFFILIATE_VAULT_TAB,
          row: event.range.getRow(),
          column: event.range.getColumn(),
          edited_at: new Date().toISOString()
        }
      }),
      muteHttpExceptions: true
    }
  );

  if (response.getResponseCode() !== 204) {
    throw new Error(
      `GitHub repository dispatch failed with HTTP ${response.getResponseCode()}: ` +
      response.getContentText()
    );
  }
}
