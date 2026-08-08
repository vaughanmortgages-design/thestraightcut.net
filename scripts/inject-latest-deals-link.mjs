import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = join(ROOT, 'index.html');

const html = await readFile(indexPath, 'utf8');

if (html.includes('href="latest-deals.html"')) {
  console.log('Latest Deals link already present on homepage.');
  process.exit(0);
}

const marker = '<a href="deals.html">Deals</a>';
if (!html.includes(marker)) {
  throw new Error('Homepage Deals navigation link not found; Latest Deals link was not injected.');
}

const updated = html.replace(
  marker,
  `${marker}<a href="latest-deals.html">Latest Deals</a>`,
);

await writeFile(indexPath, updated, 'utf8');
console.log('Added Latest Deals link to homepage navigation.');
