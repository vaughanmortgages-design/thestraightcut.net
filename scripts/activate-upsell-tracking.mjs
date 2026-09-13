import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = process.cwd();

const groups = [
  {
    files: ['wedding-planners/index.html', 'wedding-planners/our-wedding-planner/index.html'],
    replacements: [
      ['https://littlelambsjourney.etsy.com', '/go/wedding-bundle'],
      ['https://straightcut.gumroad.com', '/go/wedding-bundle-gumroad'],
    ],
  },
  {
    files: ['littlelambs/index.html', 'books/index.html'],
    replacements: [
      ['https://littlelambsjourney.etsy.com', '/go/little-lambs-printables'],
      ['https://straightcut.gumroad.com', '/go/little-lambs-printables-gumroad'],
    ],
  },
];

for (const group of groups) {
  for (const file of group.files) {
    const path = join(ROOT, file);
    let html;
    try {
      html = await readFile(path, 'utf8');
    } catch {
      continue;
    }

    for (const [from, to] of group.replacements) {
      html = html.split(from).join(to);
    }

    await writeFile(path, html, 'utf8');
    console.log(`Upsell tracking activated: ${file}`);
  }
}
