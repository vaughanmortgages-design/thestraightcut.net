const pageKey=(href='')=>new URL(href,location.origin).pathname.replace(/\.html$/, '').replace(/\/$/, '');
const pageLink=(root,href)=>[...(root?.querySelectorAll('a')||[])].find(link=>pageKey(link.getAttribute('href'))===pageKey(href));
const destinations=[
['Deals','deals.html','deals value seasonal offers'],['Top Picks','shop-picks.html','starter product lineup amazon ebay tracked links'],['Temu Offers','temu.html','temu affiliate savings campaign promo code als430197'],['Benable Lists','benable.html','benable storefront tech car home style travel gifts'],['Pokémon Deals','pokemon-deals.html','pokemon pokémon cards elite trainer box booster bundle funko collectibles'],['LEGO Deals','lego-deals.html','lego star wars technic speed champions collectibles building sets'],['Vintage Disney Finds','vintage-disney.html','disney amazon vintage ebay collectibles pins watches park souvenirs figurines animation art'],['Clearance','clearance.html','clearance end cap last chance'],['Hot Finds','hot-finds.html','trending new staff picks weekend finds'],['Refurbished Beauties','refurbished-beauties.html','renewed laptops phones tablets technology'],['Travel & Getaways','travel.html','hotels vacation rentals luxury travel weekend'],['Home & Kitchen','home.html','home kitchen storage organization'],['Electronics','electronics.html','electronics audio charging smart home'],['Automotive','auto.html','auto automotive dash cams garage'],['Sports & Outdoors','sports-outdoors.html','sports outdoors fitness camping'],['Pets','pets.html','pets dogs cats travel enrichment'],['Health & Beauty','health-beauty.html','health beauty bath grooming recovery'],['Garden','garden.html','garden patio outdoor'],['Workshop','tools.html','workshop tools diy organization'],['Books & Media','books-media.html','books media digital reading'],['Video Games','video-games.html','video games gaming console pc'],['Senior Living','senior-living.html','senior living comfort independence'],['Buying Guides','buying-guides.html','buying guides compare advice']];
const menuButton=document.querySelector('.menu-toggle');const nav=document.querySelector('#site-nav');
menuButton?.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!open));nav?.classList.toggle('open',!open)});
const searchButton=document.querySelector('.search-toggle');const searchPanel=document.querySelector('#global-search');const searchInput=document.querySelector('#global-search-input');const searchResults=document.querySelector('[data-search-results]');
function renderSearch(){if(!searchInput||!searchResults)return;const query=searchInput.value.trim().toLowerCase();if(!query){searchResults.innerHTML='';return}const matches=destinations.filter(([name,,keywords])=>`${name} ${keywords}`.toLowerCase().includes(query)).slice(0,6);searchResults.innerHTML=matches.length?matches.map(([name,href])=>`<a href="${href}">${name} <span aria-hidden="true">→</span></a>`).join(''):'<span>No exact match. Try “Pokémon,” “LEGO,” “travel,” “home” or “deals.”</span>'}
searchButton?.addEventListener('click',()=>{const open=searchButton.getAttribute('aria-expanded')==='true';searchButton.setAttribute('aria-expanded',String(!open));if(searchPanel)searchPanel.hidden=open;if(!open)searchInput?.focus()});
searchInput?.addEventListener('input',renderSearch);document.querySelector('[data-search-submit]')?.addEventListener('click',renderSearch);searchInput?.addEventListener('keydown',(event)=>{if(event.key==='Enter'){event.preventDefault();renderSearch()}});
document.querySelector('[data-newsletter-form]')?.addEventListener('submit',(event)=>{event.preventDefault();const form=event.currentTarget;const email=form.querySelector('input[type="email"]');const message=form.querySelector('[data-form-message]');if(!email?.value)return;if(message)message.textContent='Thanks—your email app will open to complete signup.';window.location.href=`mailto:hello@thestraightcut.net?subject=${encodeURIComponent('Join The Saturday Cut')}&body=${encodeURIComponent(`Please add ${email.value} to The Saturday Cut.`)}`});
(function addDealOfTheDay(){
  if(document.querySelector('[data-deal-of-day]'))return;
  const hero=document.querySelector('.home-hero');
  if(!hero)return;
  fetch('/data/deals.json',{cache:'no-store'})
    .then((response)=>response.ok?response.json():Promise.reject(new Error('feed unavailable')))
    .then((data)=>{
      const rows=Array.isArray(data?.deals)?data.deals:[];
      if(!rows.length)return;
      const deal=[...rows].sort((a,b)=>Number(b.dealScore||0)-Number(a.dealScore||0)||Number(b.dropPct||0)-Number(a.dropPct||0))[0];
      if(!deal?.affiliateURL||!deal?.product)return;
      const currency=deal.currency||'CAD';
      const current=Number(deal.currentPrice);
      const high=Number(deal.highPrice);
      const price=Number.isFinite(current)?new Intl.NumberFormat('en-CA',{style:'currency',currency}).format(current):deal.currentPrice||'';
      const highPrice=Number.isFinite(high)&&high>current?new Intl.NumberFormat('en-CA',{style:'currency',currency}).format(high):'';
      const rawDrop=Number(deal.dropPct||0);
      const dropPct=rawDrop>1?rawDrop:rawDrop*100;
      const image=String(deal.imageURL||'').replace(/"/g,'&quot;');
      const section=document.createElement('section');
      section.dataset.dealOfDay='';
      section.setAttribute('aria-label','Deal of the Day');
      section.style.cssText='background:#0d0d0f;color:#fff;padding:42px 20px;border-top:1px solid rgba(255,255,255,.08);border-bottom:1px solid rgba(255,255,255,.08)';
      section.innerHTML=`<div style="max-width:1180px;margin:0 auto;display:grid;grid-template-columns:minmax(220px,380px) 1fr;gap:34px;align-items:center"><div style="background:#fff;border-radius:18px;padding:18px;min-height:280px;display:flex;align-items:center;justify-content:center">${image?`<img src="${image}" alt="" loading="eager" style="max-width:100%;max-height:320px;object-fit:contain">`:''}</div><div><span style="display:inline-block;font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;color:#d5b85b;margin-bottom:10px">Deal of the Day · ${deal.category||'Featured'}</span><h2 style="font-size:clamp(2rem,5vw,4rem);line-height:1.02;margin:0 0 14px">${deal.product}</h2><div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin:0 0 12px"><strong style="font-size:2rem">${price}</strong>${highPrice?`<span style="text-decoration:line-through;color:#aaa">Tracked high ${highPrice}</span>`:''}${dropPct>0?`<span style="color:#65d487;font-weight:700">${Math.round(dropPct)}% below tracked high</span>`:''}</div><p style="max-width:720px;color:#d2d2d2;margin:0 0 18px">Selected automatically from approved, monetized listings in the TSC Deal Engine. Price and availability can change at the merchant.</p><div style="display:flex;gap:12px;flex-wrap:wrap"><a class="button gold" href="${deal.affiliateURL}" target="_blank" rel="sponsored nofollow noopener">View Deal ↗</a><a class="button glass" href="/live-deals.html">See All Live Deals</a></div><p style="font-size:.78rem;color:#9d9d9d;margin:14px 0 0">Affiliate disclosure: The Straight Cut may earn a commission from qualifying purchases or partner links, at no additional cost to you.</p></div></div>`;
      hero.insertAdjacentElement('afterend',section);
      const style=document.createElement('style');
      style.textContent='@media(max-width:760px){[data-deal-of-day]>div{grid-template-columns:1fr!important}[data-deal-of-day] h2{font-size:2rem!important}}';
      document.head.append(style);
    })
    .catch(()=>{});
})();
(function loadOfficialSocialLinks(){
  if(document.querySelector('script[data-straight-cut-social-links]'))return;
  const script=document.createElement('script');
  script.src='/assets/social-links.js';
  script.dataset.straightCutSocialLinks='';
  document.head.append(script);
})();
(function addPetsDepartmentNavigation(){
  const navigation=document.querySelector('#site-nav');
  if(!navigation||pageLink(navigation,'pets.html'))return;
  const departments=pageLink(navigation,'departments.html');
  if(!departments)return;
  const pets=document.createElement('a');
  pets.href='/pets';
  pets.textContent='Pets';
  departments.insertAdjacentElement('afterend',pets);
})();
(function addRetailerNavigation(){
  const navigation=document.querySelector('#site-nav');
  if(!navigation)return;
  const deals=pageLink(navigation,'deals.html');
  let anchor=deals;
  const retailerLinks=[
    ['shop-picks.html','Top Picks'],
    ['amazon.html','Amazon'],
    ['ebay.html','eBay'],
    ['temu.html','Temu'],
    ['benable.html','Benable']
  ];
  retailerLinks.forEach(([href,label])=>{
    let existing=pageLink(navigation,href);
    if(existing){anchor=existing;return}
    const link=document.createElement('a');
    link.href='/'+href;
    link.textContent=label;
    if(anchor){anchor.insertAdjacentElement('afterend',link);anchor=link}else{navigation.prepend(link);anchor=link}
  });
  document.querySelectorAll('.store-footer .footer-top > div').forEach((column)=>{
    const heading=column.querySelector('h2');
    if(heading?.textContent.trim()!=='Shop')return;
    retailerLinks.forEach(([href,label])=>{
      if(pageLink(column,href))return;
      const link=document.createElement('a');link.href='/'+href;link.textContent=label==='Temu'?'Temu Offers':label==='Benable'?'Benable Lists':label==='Top Picks'?'Top Picks':label+' Picks';column.prepend(link);
    });
  });
})();
(function addCollectiblesNavigation(){
  const navigation=document.querySelector('#site-nav');
  if(navigation){
    const deals=pageLink(navigation,'deals.html');
    let anchor=deals;
    if(!pageLink(navigation,'pokemon-deals.html')){
      const pokemon=document.createElement('a');pokemon.href='/pokemon-deals.html';pokemon.textContent='Pokémon';pokemon.setAttribute('aria-label','Pokémon Deals Canada');
      if(anchor){anchor.insertAdjacentElement('afterend',pokemon);anchor=pokemon}else navigation.prepend(pokemon);
    }else anchor=pageLink(navigation,'pokemon-deals.html');
    if(!pageLink(navigation,'lego-deals.html')){
      const lego=document.createElement('a');lego.href='/lego-deals.html';lego.textContent='LEGO';lego.setAttribute('aria-label','LEGO Deals Canada');
      if(anchor)anchor.insertAdjacentElement('afterend',lego);else navigation.prepend(lego);
    }
  }
  document.querySelectorAll('.store-footer .footer-top > div').forEach((column)=>{
    const heading=column.querySelector('h2');if(heading?.textContent.trim()!=='Shop')return;
    const deals=pageLink(column,'deals.html');
    let anchor=deals;
    if(!pageLink(column,'pokemon-deals.html')){const p=document.createElement('a');p.href='/pokemon-deals.html';p.textContent='Pokémon Deals';if(anchor){anchor.insertAdjacentElement('afterend',p);anchor=p}else column.append(p)}else anchor=pageLink(column,'pokemon-deals.html');
    if(!pageLink(column,'lego-deals.html')){const l=document.createElement('a');l.href='/lego-deals.html';l.textContent='LEGO Deals';if(anchor)anchor.insertAdjacentElement('afterend',l);else column.append(l)}
  });
})();

// The hosting snippet is appended after page scripts; repair it after parsing.
function repairBlogLink(){
 document.querySelectorAll('.sc-blog-bar a').forEach(link=>{
  if((link.getAttribute('href')||'').includes('fascinating-kheer'))link.href='/kitchen-upgrades-that-get-used.html';
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',repairBlogLink);else repairBlogLink();
