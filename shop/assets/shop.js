const menu = document.querySelector('.shop-menu');
const navigation = document.querySelector('#shop-nav');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
  navigation?.classList.toggle('open', !open);
});

const search = document.querySelector('[data-product-search]');
const merchant = document.querySelector('[data-merchant-filter]');
const cards = [...document.querySelectorAll('[data-product-card]')];
const empty = document.querySelector('[data-no-results]');

function filterProducts() {
  const query = search?.value.trim().toLowerCase() || '';
  const selectedMerchant = merchant?.value || '';
  let visible = 0;
  cards.forEach((card) => {
    const matchesQuery = !query || card.dataset.search.includes(query);
    const matchesMerchant = !selectedMerchant || card.dataset.merchant === selectedMerchant;
    const show = matchesQuery && matchesMerchant;
    card.hidden = !show;
    if (show) visible += 1;
  });
  if (empty) empty.hidden = visible !== 0;
}

search?.addEventListener('input', filterProducts);
merchant?.addEventListener('change', filterProducts);
