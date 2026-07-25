const destinations=[
['Deals','deals.html','deals value seasonal offers'],['Clearance','clearance.html','clearance end cap last chance'],['Hot Finds','hot-finds.html','trending new staff picks weekend finds'],['Refurbished Beauties','refurbished-beauties.html','renewed laptops phones tablets technology'],['Travel & Getaways','travel.html','hotels vacation rentals luxury travel weekend'],['Home & Kitchen','home.html','home kitchen storage organization'],['Electronics','electronics.html','electronics audio charging smart home'],['Automotive','auto.html','auto automotive dash cams garage'],['Sports & Outdoors','sports-outdoors.html','sports outdoors fitness camping'],['Pets','pets.html','pets dogs cats travel enrichment'],['Health & Beauty','health-beauty.html','health beauty bath grooming recovery'],['Garden','garden.html','garden patio outdoor'],['Workshop','tools.html','workshop tools diy organization'],['Books & Media','books-media.html','books media digital reading'],['Video Games','video-games.html','video games gaming console pc'],['Senior Living','senior-living.html','senior living comfort independence'],['Buying Guides','buying-guides.html','buying guides compare advice']];
const menuButton=document.querySelector('.menu-toggle');const nav=document.querySelector('#site-nav');
menuButton?.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!open));nav?.classList.toggle('open',!open)});
const searchButton=document.querySelector('.search-toggle');const searchPanel=document.querySelector('#global-search');const searchInput=document.querySelector('#global-search-input');const searchResults=document.querySelector('[data-search-results]');
function renderSearch(){if(!searchInput||!searchResults)return;const query=searchInput.value.trim().toLowerCase();if(!query){searchResults.innerHTML='';return}const matches=destinations.filter(([name,,keywords])=>`${name} ${keywords}`.toLowerCase().includes(query)).slice(0,6);searchResults.innerHTML=matches.length?matches.map(([name,href])=>`<a href="${href}">${name} <span aria-hidden="true">→</span></a>`).join(''):'<span>No exact match. Try “travel,” “home,” “electronics” or “deals.”</span>'}
searchButton?.addEventListener('click',()=>{const open=searchButton.getAttribute('aria-expanded')==='true';searchButton.setAttribute('aria-expanded',String(!open));if(searchPanel)searchPanel.hidden=open;if(!open)searchInput?.focus()});
searchInput?.addEventListener('input',renderSearch);document.querySelector('[data-search-submit]')?.addEventListener('click',renderSearch);searchInput?.addEventListener('keydown',(event)=>{if(event.key==='Enter'){event.preventDefault();renderSearch()}});
document.querySelector('[data-newsletter-form]')?.addEventListener('submit',(event)=>{event.preventDefault();const form=event.currentTarget;const email=form.querySelector('input[type="email"]');const message=form.querySelector('[data-form-message]');if(!email?.value)return;if(message)message.textContent='Thanks—your email app will open to complete signup.';window.location.href=`mailto:hello@thestraightcut.net?subject=${encodeURIComponent('Join The Saturday Cut')}&body=${encodeURIComponent(`Please add ${email.value} to The Saturday Cut.`)}`});

const money=(product)=>product.price===null||product.price===undefined?'':new Intl.NumberFormat('en-CA',{style:'currency',currency:product.currency||'CAD'}).format(product.price);
function productCard(product,merchantName){
  const article=document.createElement('article');article.className='product-card';
  const imageLink=document.createElement('a');imageLink.className='product-image';imageLink.href=product.affiliateUrl;imageLink.target='_blank';imageLink.rel='sponsored nofollow noopener';imageLink.setAttribute('aria-label',`Shop ${product.title} at ${merchantName}`);
  const image=document.createElement('img');image.loading='lazy';image.src=product.image;image.alt=product.title;image.width=600;image.height=600;imageLink.append(image);
  const body=document.createElement('div');body.className='product-copy';
  const meta=document.createElement('div');meta.className='product-meta';
  const merchant=document.createElement('span');merchant.className='merchant-badge';merchant.textContent=merchantName;
  const badge=document.createElement('span');badge.className=`status-badge ${product.status}`;badge.textContent=product.status==='new'?'New':product.status[0].toUpperCase()+product.status.slice(1);
  meta.append(merchant,badge);
  const title=document.createElement('h3');title.textContent=product.title;
  const description=document.createElement('p');description.textContent=product.description;
  body.append(meta,title,description);
  const price=money(product);if(price){const priceNode=document.createElement('strong');priceNode.className='product-price';priceNode.textContent=price;body.append(priceNode)}
  const cta=document.createElement('a');cta.className='button dark product-cta';cta.href=product.affiliateUrl;cta.target='_blank';cta.rel='sponsored nofollow noopener';cta.textContent='Shop Now';cta.setAttribute('aria-label',`Shop ${product.title} at ${merchantName}`);
  body.append(cta);article.append(imageLink,body);return article;
}
function rotateHero(){
  const slides=[...document.querySelectorAll('[data-hero-slide]')];const dots=[...document.querySelectorAll('[data-hero-dot]')];if(slides.length<2)return;
  let active=0;const show=(index)=>{active=index;slides.forEach((slide,i)=>{slide.classList.toggle('active',i===index);slide.setAttribute('aria-hidden',String(i!==index))});dots.forEach((dot,i)=>dot.classList.toggle('active',i===index))};
  dots.forEach((dot,index)=>dot.addEventListener('click',()=>show(index)));
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)setInterval(()=>show((active+1)%slides.length),6500);
}
async function loadDailyPublication(){
  if(!document.querySelector('[data-commerce-hero]'))return;
  try{
    const [feedResponse,merchantResponse]=await Promise.all([fetch('/data/storefront-products.json'),fetch('/data/storefront-merchants.json')]);
    if(!feedResponse.ok||!merchantResponse.ok)throw new Error('Daily product feed unavailable');
    const feed=await feedResponse.json();const merchantData=await merchantResponse.json();
    const merchants=new Map((merchantData.merchants||[]).map(item=>[item.id,item.name]));
    const products=Array.isArray(feed.products)?feed.products:[];
    for(const status of ['clearance','new','deal']){
      const grid=document.querySelector(`[data-product-grid="${status}"]`);const fallback=document.querySelector(`[data-commerce-fallback="${status}"]`);
      const matches=products.filter(product=>product.status===status).slice(0,4);
      if(!grid||!matches.length)continue;
      grid.replaceChildren(...matches.map(product=>productCard(product,merchants.get(product.merchant)||product.merchant)));
      if(fallback)fallback.hidden=true;
    }
    const heroProducts=['deal','clearance','new'].map(status=>products.find(product=>product.status===status&&product.featured)||products.find(product=>product.status===status));
    [...document.querySelectorAll('[data-hero-slide]')].forEach((slide,index)=>{
      const product=heroProducts[index];if(!product)return;
      slide.style.setProperty('--hero',`url("${product.image.replace(/["\\]/g,'')}")`);
      const title=slide.querySelector('h1');const description=slide.querySelector('.home-hero-copy>p');const cta=slide.querySelector('.button.gold');
      if(title)title.textContent=product.title;if(description)description.textContent=product.description;
      if(cta){cta.href=product.affiliateUrl;cta.target='_blank';cta.rel='sponsored nofollow noopener';cta.textContent='Shop Now'}
    });
  }catch(error){console.warn(error.message)}
  rotateHero();
}
loadDailyPublication();
