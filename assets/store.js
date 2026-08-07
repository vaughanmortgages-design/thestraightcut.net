const destinations=[
['Deals','deals.html','deals value seasonal offers'],['Pokémon Deals','pokemon-deals.html','pokemon pokémon cards elite trainer box booster bundle funko collectibles'],['LEGO Deals','lego-deals.html','lego star wars technic speed champions collectibles building sets'],['Clearance','clearance.html','clearance end cap last chance'],['Hot Finds','hot-finds.html','trending new staff picks weekend finds'],['Refurbished Beauties','refurbished-beauties.html','renewed laptops phones tablets technology'],['Travel & Getaways','travel.html','hotels vacation rentals luxury travel weekend'],['Home & Kitchen','home.html','home kitchen storage organization'],['Electronics','electronics.html','electronics audio charging smart home'],['Automotive','auto.html','auto automotive dash cams garage'],['Sports & Outdoors','sports-outdoors.html','sports outdoors fitness camping'],['Pets','pets.html','pets dogs cats travel enrichment'],['Health & Beauty','health-beauty.html','health beauty bath grooming recovery'],['Garden','garden.html','garden patio outdoor'],['Workshop','tools.html','workshop tools diy organization'],['Books & Media','books-media.html','books media digital reading'],['Video Games','video-games.html','video games gaming console pc'],['Senior Living','senior-living.html','senior living comfort independence'],['Buying Guides','buying-guides.html','buying guides compare advice']];
const menuButton=document.querySelector('.menu-toggle');const nav=document.querySelector('#site-nav');
menuButton?.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!open));nav?.classList.toggle('open',!open)});
const searchButton=document.querySelector('.search-toggle');const searchPanel=document.querySelector('#global-search');const searchInput=document.querySelector('#global-search-input');const searchResults=document.querySelector('[data-search-results]');
function renderSearch(){if(!searchInput||!searchResults)return;const query=searchInput.value.trim().toLowerCase();if(!query){searchResults.innerHTML='';return}const matches=destinations.filter(([name,,keywords])=>`${name} ${keywords}`.toLowerCase().includes(query)).slice(0,6);searchResults.innerHTML=matches.length?matches.map(([name,href])=>`<a href="${href}">${name} <span aria-hidden="true">→</span></a>`).join(''):'<span>No exact match. Try “Pokémon,” “LEGO,” “travel,” “home” or “deals.”</span>'}
searchButton?.addEventListener('click',()=>{const open=searchButton.getAttribute('aria-expanded')==='true';searchButton.setAttribute('aria-expanded',String(!open));if(searchPanel)searchPanel.hidden=open;if(!open)searchInput?.focus()});
searchInput?.addEventListener('input',renderSearch);document.querySelector('[data-search-submit]')?.addEventListener('click',renderSearch);searchInput?.addEventListener('keydown',(event)=>{if(event.key==='Enter'){event.preventDefault();renderSearch()}});
document.querySelector('[data-newsletter-form]')?.addEventListener('submit',(event)=>{event.preventDefault();const form=event.currentTarget;const email=form.querySelector('input[type="email"]');const message=form.querySelector('[data-form-message]');if(!email?.value)return;if(message)message.textContent='Thanks—your email app will open to complete signup.';window.location.href=`mailto:hello@thestraightcut.net?subject=${encodeURIComponent('Join The Saturday Cut')}&body=${encodeURIComponent(`Please add ${email.value} to The Saturday Cut.`)}`});
(function addAmazonShoppingStrip(){
  if(document.querySelector('[data-amazon-shopping-strip]'))return;
  const hero=document.querySelector('.home-hero');
  if(!hero)return;
  const strip=document.createElement('section');
  strip.dataset.amazonShoppingStrip='';
  strip.setAttribute('aria-label','Shop Amazon Canada');
  strip.innerHTML=`<div style="max-width:1180px;margin:0 auto;padding:22px 20px;text-align:center"><p style="margin:0 0 8px;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase">Amazon.ca shopping</p><h2 style="margin:0 0 10px">Shop useful everyday finds on Amazon Canada</h2><p style="margin:0 auto 16px;max-width:760px">Browse home, tools, electronics, automotive and more. As an Amazon Associate, The Straight Cut earns from qualifying purchases.</p><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><a class="button gold" href="https://www.amazon.ca/?tag=straightcutgu-20" target="_blank" rel="sponsored nofollow noopener">Shop Amazon.ca ↗</a><a class="button glass" href="https://www.amazon.ca/s?k=home+improvement&tag=straightcutgu-20" target="_blank" rel="sponsored nofollow noopener">Home Improvement ↗</a><a class="button glass" href="https://www.amazon.ca/s?k=tools&tag=straightcutgu-20" target="_blank" rel="sponsored nofollow noopener">Tools ↗</a><a class="button glass" href="https://www.amazon.ca/s?k=electronics&tag=straightcutgu-20" target="_blank" rel="sponsored nofollow noopener">Electronics ↗</a></div></div>`;
  hero.insertAdjacentElement('afterend',strip);
})();
(function addCollectiblesSpotlight(){
  if(document.querySelector('[data-collectibles-spotlight]'))return;
  const hero=document.querySelector('.home-hero');
  if(!hero)return;
  const section=document.createElement('section');
  section.dataset.collectiblesSpotlight='';
  section.className='section warm';
  section.innerHTML=`<div class="section-heading"><span class="section-kicker">Collectibles & Kids Picks</span><h2>Pokémon and LEGO, right up front.</h2><p>Two fast-growing deal sections with current Amazon.ca and eBay finds.</p></div><div class="editorial-grid"><a class="editorial-card" href="/pokemon-deals.html"><span class="editorial-card-copy"><span class="card-kicker">Pokémon Deals</span><h3>Cards, ETBs & collector finds</h3><p>Elite Trainer Boxes, booster bundles, Funko and more.</p><span class="card-action">Shop Pokémon →</span></span></a><a class="editorial-card" href="/lego-deals.html"><span class="editorial-card-copy"><span class="card-kicker">LEGO Deals</span><h3>Star Wars, Technic & Speed Champions</h3><p>Current LEGO listings pulled into one quick browse.</p><span class="card-action">Shop LEGO →</span></span></a></div>`;
  hero.insertAdjacentElement('afterend',section);
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
  if(!navigation||navigation.querySelector('a[href$="pets.html"]'))return;
  const departments=[...navigation.querySelectorAll('a')].find((link)=>link.getAttribute('href')?.endsWith('departments.html'));
  if(!departments)return;
  const pets=document.createElement('a');
  pets.href='/pets';
  pets.textContent='Pets';
  departments.insertAdjacentElement('afterend',pets);
})();
(function addCollectiblesNavigation(){
  const navigation=document.querySelector('#site-nav');
  if(navigation){
    const deals=[...navigation.querySelectorAll('a')].find((link)=>link.getAttribute('href')?.endsWith('deals.html'));
    let anchor=deals;
    if(!navigation.querySelector('a[href$="pokemon-deals.html"]')){
      const pokemon=document.createElement('a');pokemon.href='/pokemon-deals.html';pokemon.textContent='Pokémon';pokemon.setAttribute('aria-label','Pokémon Deals Canada');
      if(anchor){anchor.insertAdjacentElement('afterend',pokemon);anchor=pokemon}else navigation.prepend(pokemon);
    }else anchor=navigation.querySelector('a[href$="pokemon-deals.html"]');
    if(!navigation.querySelector('a[href$="lego-deals.html"]')){
      const lego=document.createElement('a');lego.href='/lego-deals.html';lego.textContent='LEGO';lego.setAttribute('aria-label','LEGO Deals Canada');
      if(anchor)anchor.insertAdjacentElement('afterend',lego);else navigation.prepend(lego);
    }
  }
  document.querySelectorAll('.store-footer .footer-top > div').forEach((column)=>{
    const heading=column.querySelector('h2');if(heading?.textContent.trim()!=='Shop')return;
    const deals=[...column.querySelectorAll('a')].find((link)=>link.getAttribute('href')?.endsWith('deals.html'));
    let anchor=deals;
    if(!column.querySelector('a[href$="pokemon-deals.html"]')){const p=document.createElement('a');p.href='/pokemon-deals.html';p.textContent='Pokémon Deals';if(anchor){anchor.insertAdjacentElement('afterend',p);anchor=p}else column.append(p)}else anchor=column.querySelector('a[href$="pokemon-deals.html"]');
    if(!column.querySelector('a[href$="lego-deals.html"]')){const l=document.createElement('a');l.href='/lego-deals.html';l.textContent='LEGO Deals';if(anchor)anchor.insertAdjacentElement('afterend',l);else column.append(l)}
  });
})();
