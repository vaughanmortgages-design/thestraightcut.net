import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = (await readdir(ROOT)).filter((file) => file.endsWith('.html'));
const tag = '<link rel="stylesheet" href="assets/hero-fix.css">';
let changed = 0;

for (const file of files) {
  const path = join(ROOT, file);
  const html = await readFile(path, 'utf8');
  if (html.includes('assets/hero-fix.css')) continue;
  const output = html.replace('</head>', `${tag}</head>`);
  if (output !== html) {
    await writeFile(path, output, 'utf8');
    changed += 1;
  }
}

console.log(`Injected hero layout fix into ${changed} HTML files.`);
