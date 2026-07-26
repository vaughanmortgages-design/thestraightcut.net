const productSections = {
  featured: (product) => product.featured,
  weekly: (product) => product.weekly_deal || product.featured || product.trending,
  top: (product) => product.top_rated,
  clearance: (product) => product.clearance
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function approvedPetProduct(product) {
  if (product.category_slug !== "pets") return false;
  if (!["Amazon", "eBay"].includes(product.merchant)) return false;
  try {
    return new URL(product.affiliate_url).protocol === "https:";
  } catch {
    return false;
  }
}

function card(product) {
  const price = product.price
    ? `<p class="product-price">${escapeHtml(product.price)} ${escapeHtml(product.currency || "CAD")}</p>`
    : "";
  return `<article class="pets-product-card">
    <a href="${escapeHtml(product.affiliate_url)}" target="_blank" rel="sponsored nofollow noopener" aria-label="Shop ${escapeHtml(product.title)}"><img src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.title)}" loading="lazy" decoding="async"></a>
    <div class="pets-product-copy">
      <span class="pet-merchant">${escapeHtml(product.merchant)}</span>
      <h3><a href="${escapeHtml(product.affiliate_url)}" target="_blank" rel="sponsored nofollow noopener">${escapeHtml(product.title)}</a></h3>
      <p>${escapeHtml(product.description || "")}</p>
      ${price}
      <a class="button gold" href="${escapeHtml(product.affiliate_url)}" target="_blank" rel="sponsored nofollow noopener">Shop Now <span aria-hidden="true">↗</span></a>
    </div>
  </article>`;
}

async function loadPetProducts() {
  try {
    const response = await fetch("/shop/data/products.json", { credentials: "same-origin" });
    if (!response.ok) return;
    const payload = await response.json();
    const products = (Array.isArray(payload.products) ? payload.products : [])
      .filter(approvedPetProduct);

    for (const [name, predicate] of Object.entries(productSections)) {
      const section = document.querySelector(`[data-pet-products="${name}"]`);
      const grid = section?.querySelector("[data-pet-product-grid]");
      if (!section || !grid) continue;
      const matches = products.filter(predicate).slice(0, 8);
      if (!matches.length) continue;
      grid.innerHTML = matches.map(card).join("");
      section.hidden = false;
    }
  } catch {
    // The editorial department remains complete when the private catalog is unavailable.
  }
}

loadPetProducts();
