import crypto from "node:crypto";

export const REQUIRED_PRODUCT_FIELDS = ["id", "title", "merchant", "affiliateUrl"];

export function asBoolean(value) {
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "active", "in stock"].includes(
    String(value ?? "").trim().toLowerCase()
  );
}

export function normalizeProduct(row) {
  const product = {
    id: String(row.id ?? row.product_id ?? row.productId ?? row.sku ?? "").trim(),
    title: String(row.title ?? row.product_title ?? row.name ?? "").trim(),
    description: String(
      row.description ?? row.short_description ?? row.shortDescription ?? ""
    ).trim(),
    merchant: String(row.merchant ?? row.dealer ?? "").trim(),
    category: String(row.category ?? row.department ?? row.metal_type ?? "").trim(),
    affiliateUrl: String(
      row.affiliate_url ?? row.affiliateUrl ?? row.link ?? ""
    ).trim(),
    price: String(row.price ?? row.current_price ?? "").trim(),
    currency: String(row.currency ?? "CAD").trim(),
    active: row.active === undefined ? true : asBoolean(row.active),
    featured: asBoolean(row.featured),
    seasonal: asBoolean(row.seasonal)
  };

  if (!product.id && product.title && product.merchant) {
    product.id = crypto
      .createHash("sha256")
      .update(`${product.merchant}:${product.title}`)
      .digest("hex")
      .slice(0, 16);
  }
  return product;
}

export function validateProduct(product) {
  const missing = REQUIRED_PRODUCT_FIELDS.filter((field) => !product[field]);
  if (missing.length) return { valid: false, reason: `missing ${missing.join(", ")}` };
  try {
    const url = new URL(product.affiliateUrl);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("invalid protocol");
  } catch {
    return { valid: false, reason: "invalid affiliateUrl" };
  }
  return { valid: true, reason: "" };
}

export function extractProducts(payload) {
  const rows = Array.isArray(payload)
    ? payload
    : payload.products ?? payload.items ?? payload.data ?? [];
  const seen = new Set();
  const products = [];
  const errors = [];

  for (const row of rows) {
    const product = normalizeProduct(row);
    const validation = validateProduct(product);
    if (!validation.valid) {
      errors.push({ id: product.id || null, reason: validation.reason });
      continue;
    }
    if (!product.active) continue;
    if (seen.has(product.id)) {
      errors.push({ id: product.id, reason: "duplicate product id" });
      continue;
    }
    seen.add(product.id);
    products.push(product);
  }
  return { products, errors };
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }
  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push(row);
  if (quoted) throw new Error("CSV contains an unterminated quoted field");
  if (rows.length < 2) return [];

  const headers = rows[0].map((header) =>
    header.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
  );
  return rows.slice(1).map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]))
  );
}

export function chooseRotatingCategory(categories, lastCategory, date) {
  const dayNumber = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
  let index = Math.abs(dayNumber) % categories.length;
  if (categories[index] === lastCategory) index = (index + 1) % categories.length;
  return categories[index];
}

export function seasonalCategories(date) {
  const month = Number(date.slice(5, 7));
  if ([7, 8, 9].includes(month)) return ["Back to School"];
  if ([11, 12].includes(month)) return ["Clearance", "Home and Kitchen", "Electronics"];
  if ([4, 5, 6].includes(month)) return ["Sports", "Pets", "Automotive"];
  return [];
}

export function selectProduct(products, brandKey, config, state, date) {
  const lastProductId = state.lastProductId;
  const preferredCategories =
    brandKey === "straightcut" ? seasonalCategories(date) : [];
  const merchantAllowed = (product) =>
    !config.approvedMerchants ||
    config.approvedMerchants.some(
      (merchant) => merchant.toLowerCase() === product.merchant.toLowerCase()
    );
  const eligible = products.filter(
    (product) => product.id !== lastProductId && merchantAllowed(product)
  );
  const preferred = eligible.filter((product) =>
    preferredCategories.some(
      (category) => category.toLowerCase() === product.category.toLowerCase()
    )
  );
  const pool = preferred.length ? preferred : eligible;
  return (
    pool.sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        Number(b.seasonal) - Number(a.seasonal) ||
        a.id.localeCompare(b.id)
    )[0] ?? null
  );
}

export function assertDraftPackage(draft, brandConfig) {
  if (draft.status !== "Draft") throw new Error("Generated content must remain Draft");
  for (const output of brandConfig.outputs) {
    if (!String(draft[output] ?? "").trim()) {
      throw new Error(`Missing required ${output} output`);
    }
  }
  if (draft.product?.affiliateUrl) {
    const outputs = draft.outputs.map((output) => draft[output]).join("\n");
    if (!outputs.includes(draft.product.affiliateUrl)) {
      throw new Error("Stored affiliate URL was not used in a content output");
    }
  }
}

export function safeFileName(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
