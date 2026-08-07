import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const approvedDir = path.join(root, 'data', 'approved');
const outFile = path.join(root, 'data', 'deals.json');

const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const clean = (d) => ({
  listingKey: String(d.listingKey || d.productKey || ''),
  category: String(d.category || 'Other'),
  product: String(d.product || ''),
  store: String(d.store || ''),
  currency: String(d.currency || 'CAD'),
  currentPrice: safeNum(d.currentPrice),
  highPrice: safeNum(d.highPrice),
  dropPct: safeNum(d.dropPct),
  imageURL: String(d.imageURL || ''),
  productURL: String(d.productURL || ''),
  affiliateURL: String(d.affiliateURL || ''),
  dealScore: safeNum(d.dealScore),
  tier: String(d.tier || ''),
  firstSeen: String(d.firstSeen || ''),
  lastChecked: String(d.lastChecked || '')
});

let deals = [];
if (fs.existsSync(approvedDir)) {
  for (const name of fs.readdirSync(approvedDir)) {
    if (!name.endsWith('.json')) continue;
    const full = path.join(approvedDir, name);
    try {
      const raw = JSON.parse(fs.readFileSync(full, 'utf8'));
      const items = Array.isArray(raw) ? raw : [raw];
      for (const item of items) {
        if (item.approved !== true || item.socialEligible !== true) continue;
        if (!item.product || !item.affiliateURL || !item.imageURL || !item.currentPrice) continue;
        deals.push(clean(item));
      }
    } catch (err) {
      console.warn(`Skipping ${name}: ${err.message}`);
    }
  }
}

const deduped = [...new Map(deals.map(d => [d.listingKey || d.affiliateURL, d])).values()]
  .sort((a,b) => (b.dealScore - a.dealScore) || (b.dropPct - a.dropPct));

const payload = {
  generatedAt: new Date().toISOString(),
  source: 'TSC Deal Engine Master',
  policy: 'Only approved, monetized listings with valid price history are published here.',
  count: deduped.length,
  deals: deduped
};

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(payload, null, 2) + '\n');
console.log(`Built ${deduped.length} approved deals.`);
