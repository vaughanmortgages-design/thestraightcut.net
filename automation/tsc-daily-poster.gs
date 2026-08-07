const TSC_CONFIG = {
  spreadsheetId: '1LE-1Rmiw3ArQ55qLmvSv4gI_Ow9GiJLzOdnRIJm_ROg',
  sheetName: 'Deals_Master',
  presentationId: '1UZAoOz1eEuQc4F1QThj0HaYPtBTxG1FvPAMyphTEEpc',
  outputFolderId: '1hVTLzBbeXDRUCfQ3d6XlnDhHqE9uJqyW',
  siteUrl: 'https://thestraightcut.net',
  timezone: 'America/Toronto'
};

function buildDailyTscPoster() {
  const ss = SpreadsheetApp.openById(TSC_CONFIG.spreadsheetId);
  const sh = ss.getSheetByName(TSC_CONFIG.sheetName);
  if (!sh) throw new Error('Deals_Master not found');

  const values = sh.getDataRange().getValues();
  if (values.length < 2) throw new Error('Deals_Master has no data rows');

  const headers = values[0].map(String);
  const idx = name => headers.indexOf(name);
  const required = ['Product','Category','Approved','SocialEligible','DealScore','DropPct'];
  required.forEach(h => { if (idx(h) < 0) throw new Error('Missing column: ' + h); });

  const rows = values.slice(1).filter(r =>
    String(r[idx('Approved')]).toUpperCase() === 'TRUE' &&
    String(r[idx('SocialEligible')]).toUpperCase() === 'TRUE'
  );

  rows.sort((a,b) => {
    const score = Number(b[idx('DealScore')] || 0) - Number(a[idx('DealScore')] || 0);
    if (score) return score;
    return Number(b[idx('DropPct')] || 0) - Number(a[idx('DropPct')] || 0);
  });

  const best = rows[0] || null;
  const category = best ? String(best[idx('Category')] || 'Deals') : 'Deals';
  const product = best ? String(best[idx('Product')] || '') : '';

  const deck = SlidesApp.openById(TSC_CONFIG.presentationId);
  const slide = deck.getSlides()[0];
  slide.getPageElements().forEach(el => el.remove());
  slide.getBackground().setSolidFill('#09090A');

  const brand = slide.insertTextBox('THE STRAIGHT CUT', 160, 70, 400, 40);
  brand.getText().getTextStyle().setFontFamily('Arial').setFontSize(20).setBold(true).setForegroundColor('#C7A54B');
  brand.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  const headlineText = best ? 'TODAY\'S BEST FIND' : 'TODAY\'S BEST FINDS';
  const headline = slide.insertTextBox(headlineText, 155, 125, 410, 65);
  headline.getText().getTextStyle().setFontFamily('Arial').setFontSize(34).setBold(true).setForegroundColor('#FFFFFF');
  headline.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  const subText = best
    ? (category + '\n' + shorten(product, 68))
    : 'Pokemon  •  LEGO  •  Gaming  •  Collectibles\nFresh finds updated daily.';
  const sub = slide.insertTextBox(subText, 155, 210, 410, 75);
  sub.getText().getTextStyle().setFontFamily('Arial').setFontSize(15).setForegroundColor('#E7E7E7');
  sub.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  const cta = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 210, 315, 300, 48);
  cta.getFill().setSolidFill('#C7A54B');
  cta.getBorder().setTransparent();
  cta.getText().setText('THESTRAIGHTCUT.NET');
  cta.getText().getTextStyle().setFontFamily('Arial').setFontSize(17).setBold(true).setForegroundColor('#09090A');
  cta.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
  cta.setContentAlignment(SlidesApp.ContentAlignment.MIDDLE);

  deck.saveAndClose();
  Utilities.sleep(1200);

  const pageId = SlidesApp.openById(TSC_CONFIG.presentationId).getSlides()[0].getObjectId();
  const thumb = Slides.Presentations.Pages.getThumbnail(
    TSC_CONFIG.presentationId,
    pageId,
    {thumbnailProperties:{mimeType:'PNG',thumbnailSize:'LARGE'}}
  );
  const blob = UrlFetchApp.fetch(thumb.contentUrl).getBlob();
  const stamp = Utilities.formatDate(new Date(), TSC_CONFIG.timezone, 'yyyy-MM-dd');
  const file = DriveApp.getFolderById(TSC_CONFIG.outputFolderId)
    .createFile(blob.setName('TSC-Daily-Poster-' + stamp + '.png'));

  writeSocialQueue_(ss, {
    date: stamp,
    product: product,
    category: category,
    imageUrl: 'https://drive.google.com/open?id=' + file.getId(),
    website: TSC_CONFIG.siteUrl,
    status: 'READY'
  });
}

function writeSocialQueue_(ss, item) {
  let sh = ss.getSheetByName('Social_Queue');
  if (!sh) sh = ss.insertSheet('Social_Queue');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['Date','Product','Category','ImageURL','Website','Status']);
  }
  sh.appendRow([item.date,item.product,item.category,item.imageUrl,item.website,item.status]);
}

function shorten(text, maxLen) {
  text = String(text || '').trim();
  return text.length <= maxLen ? text : text.slice(0, maxLen - 1).trim() + '…';
}

function createDailyTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'buildDailyTscPoster')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('buildDailyTscPoster')
    .timeBased()
    .atHour(9)
    .everyDays(1)
    .inTimezone(TSC_CONFIG.timezone)
    .create();
}
