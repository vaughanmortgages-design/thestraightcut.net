/* Include existing GA4 measurement and click tracking on every published page.
 * Netlify builds publish the repository root; this post-build step is idempotent. */
import {readdir, readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const root = process.cwd();
const skip = new Set(['.git','.netlify','node_modules','assets','data','automation','content','scripts','netlify','.github','docs','tests']);
const measurement = 'G-4JLT5L2ZD5';
const affiliateTag = '<script defer src="/assets/affiliate-clicks.js"></script>';
const gaTag = '<script async src="https://www.googletagmanager.com/gtag/js?id=' + measurement + '"></script>' +
  '<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","' + measurement + '");</script>';
let checked = 0, updated = 0;
async function walk(dir, depth = 0) {
  for (const entry of await readdir(dir, {withFileTypes: true})) {
    if (entry.isDirectory()) {
      if (depth < 5 && !skip.has(entry.name) && !entry.name.startsWith('.')) await walk(join(dir, entry.name), depth + 1);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const file = join(dir, entry.name);
    let html = await readFile(file, 'utf8');
    checked++;
    if (!/<\/body>/i.test(html)) continue;
    let next = html;
    if (!next.includes(affiliateTag)) next = next.replace(/<\/body>/i, affiliateTag + '</body>');
    if (!next.includes(measurement) && !next.includes('googletagmanager.com/gtag/js')) {
      next = next.replace(/<\/head>/i, gaTag + '</head>');
    }
    if (next !== html) { await writeFile(file, next, 'utf8'); updated++; }
  }
}
await walk(root);
console.log('Analytics injection: examined ' + checked + ' HTML pages, updated ' + updated + '.');
