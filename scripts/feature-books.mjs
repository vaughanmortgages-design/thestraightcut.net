import {readdir,readFile,writeFile} from 'node:fs/promises';
const feature = `<section class="section warm tsc-books-feature" aria-labelledby="tsc-books-title" id="little-lambs-books"><div class="tsc-books-layout"><a href="/littlelambs/" class="tsc-book-art"><img src="/assets/little-lambs-autumn-cover.webp" width="640" height="648" loading="lazy" alt="The Little Lamb's Autumn Journey book cover by Paul Malandrino"></a><div><span class="section-kicker">Books by Paul Malandrino</span><h2 id="tsc-books-title">Little Lambs. Big lessons.</h2><p>Share a little kindness at story time. Discover The Little Lamb's Autumn Journey, continue with Book Two, and explore printable activities for young readers.</p><div class="hero-actions"><a class="button gold" href="/littlelambs/">Explore Little Lambs Books →</a><a class="button dark" href="/books/">All books by Paul →</a></div><p class="tsc-books-retailers"><a href="https://www.amazon.ca/dp/B0HFBYRCVG" target="_blank" rel="noopener">View Autumn Journey on Amazon ↗</a><a href="/go/little-lambs-printables">Visit the Etsy shop ↗</a></p></div></div></section>`;
const style = `<style data-tsc-books>.tsc-books-layout{max-width:1120px;margin:auto;display:grid;grid-template-columns:minmax(220px,340px) 1fr;gap:clamp(24px,5vw,70px);align-items:center}.tsc-book-art{display:block}.tsc-book-art img{display:block;width:100%;height:auto;border-radius:4px;box-shadow:0 16px 32px #36261326}.tsc-books-feature h2{font-family:var(--serif);font-size:clamp(2.3rem,4vw,4rem);line-height:1.08;margin:12px 0 20px}.tsc-books-feature p{line-height:1.7;max-width:650px}.tsc-books-retailers{display:flex;flex-wrap:wrap;gap:12px 24px;font-size:.85rem}.tsc-books-retailers a{color:inherit;text-underline-offset:4px}.store-nav a[href="/books/"]{color:var(--gold-bright);font-weight:700}.book-cover.real-cover{display:block;padding:0;min-height:0;aspect-ratio:auto;background:none;box-shadow:none}.real-cover img{display:block;width:100%;height:auto;border-radius:12px}@media(max-width:700px){.tsc-books-layout{grid-template-columns:1fr}.tsc-book-art{max-width:260px;margin:auto}.tsc-books-feature .hero-actions{flex-direction:column;align-items:stretch}}</style>`;
for (const entry of await readdir('.', {withFileTypes:true})) {
 if(!entry.isFile()||!entry.name.endsWith('.html'))continue;
 let html=await readFile(entry.name,'utf8');
 html=html.replace(/(<nav\b[^>]*class="store-nav"[^>]*>)([\s\S]*?)(<\/nav>)/g,(all,start,links,end)=>links.includes('href="/books/"')?all:`${start}<a href="/books/">Books</a>${links}${end}`);
 if(html.includes('class="store-footer"')&&!html.includes('href="/littlelambs/"'))html=html.replace(/(<h2>Read<\/h2>)/,'$1<a href="/books/">Books by Paul</a><a href="/littlelambs/">Little Lambs Books</a>');
 if(['index.html','books-media.html'].includes(entry.name)&&!html.includes('id="little-lambs-books"')) {
  html=html.replace('</head>',style+'</head>');
  if(entry.name==='index.html')html=html.replace(/(<section class="home-hero"[\s\S]*?<\/section>)/,'$1'+feature);
  else html=html.replace(/(<section class="department-hero[^\"]*"[\s\S]*?<\/section>)/,'$1'+feature);
 }
 await writeFile(entry.name,html);
}
let lamb=await readFile('littlelambs/index.html','utf8');
if(!lamb.includes('class="book-cover real-cover"')){
 if(!lamb.includes('data-tsc-books'))lamb=lamb.replace('</head>',style+'</head>');
 lamb=lamb.replace(/<div class="book-cover"[^>]*>[\s\S]*?<\/div>(?=<div class="book-copy">)/,`<div class="book-cover real-cover"><img src="/assets/little-lambs-autumn-cover.webp" width="640" height="648" alt="The Little Lamb's Autumn Journey by Paul Malandrino"></div>`);
}
lamb=lamb.replace('It is the natural next purchase after a Little Lambs book.','Enjoy more time with Jesam after the story ends.').replace('then add the printable activity pack for a higher-value family bundle.','then explore printable activities for more family time.');
await writeFile('littlelambs/index.html',lamb);
let sitemap=await readFile('sitemap.xml','utf8');
for(const path of ['/books/','/littlelambs/','/books/solar-system/','/books/lost-gravity/'])if(!sitemap.includes(`https://thestraightcut.net${path}</loc>`))sitemap=sitemap.replace('</urlset>',`  <url><loc>https://thestraightcut.net${path}</loc></url>\n</urlset>`);
await writeFile('sitemap.xml',sitemap);
console.log('Books navigation, homepage feature, real cover and sitemap ready.');
