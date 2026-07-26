#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  assertDraftPackage,
  chooseRotatingCategory,
  safeFileName,
  selectProduct
} from "./lib.mjs";
import {
  loadAffiliateVault,
  updateLastUsedDate
} from "./affiliate-vault.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const args = new Set(process.argv.slice(2));
const dateArgIndex = process.argv.indexOf("--date");
const date =
  dateArgIndex >= 0
    ? process.argv[dateArgIndex + 1]
    : new Date().toISOString().slice(0, 10);
const brandArgIndex = process.argv.indexOf("--brand");
const selectedBrand = brandArgIndex >= 0 ? process.argv[brandArgIndex + 1] : null;
const dryRun = args.has("--dry-run");

const config = JSON.parse(
  await fs.readFile(path.join(here, "config/brands.json"), "utf8")
);
const statePath = path.join(here, "state.json");
const state = JSON.parse(await fs.readFile(statePath, "utf8"));

function fallbackDraft(brandKey, brand, category, product) {
  const link = product?.affiliateUrl;
  const productLine = product
    ? `${product.title} from ${product.merchant}${product.price ? ` (${product.price} ${product.currency})` : ""}`
    : null;

  if (brandKey === "vmg") {
    const title = `${category}: Questions to Review Before Your Next Mortgage Decision`;
    const article = `# ${title}

Mortgage decisions are easier to compare when the borrower starts with the right questions. Review your timeline, current mortgage terms, household cash flow, future plans and the documents a lender may request.

## A practical review

- Confirm the date that matters for your mortgage decision.
- Review current terms, penalties and available options.
- Separate short-term payment goals from long-term borrowing costs.
- Prepare income, property and debt documents before requesting options.
- Ask how each option fits the full scenario rather than focusing on one number.

This is general information, not a promise of approval or a specific rate. Mortgage options depend on lender criteria, borrower qualification, property review and documentation.

${brand.compliance}`;
    return {
      title,
      article,
      facebook: `${category} decisions deserve more than a quick headline. Start with your timing, current terms, documents and long-term goals, then compare the complete mortgage scenario. General information only; qualification and lender criteria apply.\n\n${brand.compliance}`,
      instagram: `${category} mortgage checklist:\n\n• Confirm your timing\n• Review current terms\n• Prepare your documents\n• Compare the complete scenario\n\nGeneral information only. Mortgage options depend on lender criteria, borrower qualification, property review and documentation.\n\n${brand.compliance}`,
      linkedin: `${category}: a useful client review starts with timing, current terms, cash flow, future plans and complete documentation. Looking at the full scenario helps borrowers compare options more clearly. General information only; lender criteria and qualification apply.\n\n${brand.compliance}`
    };
  }

  if (brandKey === "estack") {
    const title = productLine
      ? `What to Check Before Exploring ${product.title}`
      : `${category}: A Clear Comparison Checklist`;
    const cta = link ? `\n\nView the approved partner offer: ${link}` : "";
    const article = `# ${title}

Canadian shoppers should compare the details supplied by the provider before making a decision. Check the provider, product terms, availability, total cost and any eligibility or delivery requirements that apply.

## What to compare

- Confirm that the provider and product match your needs.
- Review current terms directly on the partner website.
- Compare total costs rather than relying on a headline.
- Keep records of the information shown when you apply or purchase.

${productLine ? `Featured source: ${productLine}.` : `Today’s editorial focus: ${category}.`}${cta}

${brand.disclosure}`;
    return {
      title,
      article,
      facebook: `${title}. Review the current details directly with the provider and compare the complete offer before acting.${cta}\n\n${brand.disclosure}`,
      instagram: `${title}\n\nA short checklist: provider, terms, total cost, availability and fit.${cta}\n\n${brand.disclosure}`,
      linkedin: `${title}. A disciplined comparison considers the provider, current terms, total cost, availability and suitability—not a single headline number.${cta}\n\n${brand.disclosure}`
    };
  }

  const effectiveLink = link || "";
  const title = productLine
    ? `${product.title}: What to Know Before You Buy`
    : `${category} Buying Guide: A Smarter Shortlist`;
  const offer = product?.couponCode
    ? `${product.merchant} shoppers can use code ${product.couponCode}.`
    : "";
  const cta = effectiveLink ? `\n\nShop through the approved link: ${effectiveLink}` : "";
  const article = `# ${title}

The best shopping shortlist starts with the job the item needs to do. Compare materials, sizing or compatibility, care requirements, return terms and the total delivered cost before choosing.

## The Straight Cut checklist

- Start with the intended use.
- Confirm dimensions, fit or compatibility.
- Review the merchant’s current product details.
- Compare the total price only when a verified price is available.
- Keep the return policy in mind.

${productLine ? `Featured item: ${productLine}.` : `This is an editorial ${category} collection; no unverified product claims or prices are included.`}

${offer}${cta}

${brand.disclosure}`;
  return {
    title,
    article,
    facebook: `${title}. Compare fit, materials, compatibility and the total delivered cost before choosing. ${offer}${cta}\n\n${brand.disclosure}`,
    instagram: `${title}\n\nA cleaner shortlist starts with fit, function, compatibility and care. ${offer}${cta}\n\n${brand.disclosure}`,
    linkedin: `${title}. The editorial approach is simple: define the use case, verify compatibility, compare the complete cost and avoid unsupported claims. ${offer}${cta}\n\n${brand.disclosure}`,
    pinterestTitle: title.slice(0, 100),
    pinterestDescription: `${title}. Save this practical checklist for comparing fit, function, compatibility, care and total cost. ${offer} ${brand.disclosure}`.trim()
  };
}

async function aiDraft(brandKey, brand, category, product, fallback) {
  if (!process.env.OPENAI_API_KEY) return fallback;
  const prompt = {
    date,
    brand: brand.name,
    category,
    contentType: brand.contentType,
    permittedOutputs: brand.outputs,
    product,
    rules: {
      status: "Draft",
      factualGrounding: "Use only supplied product data. Never invent prices, specifications, rates, reviews, availability or affiliate URLs.",
      affiliateLink: product?.affiliateUrl ?? null,
      disclosure: brand.disclosure,
      compliance: brand.compliance ?? null,
      forbiddenTopics: brand.forbiddenTopics ?? [],
      linkedinRequired: true
    },
    fallbackReference: fallback
  };
  const properties = Object.fromEntries(
    brand.outputs.map((name) => [name, { type: "string" }])
  );
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.6",
      store: false,
      input: [
        {
          role: "system",
          content:
            "Create concise, accurate Canadian brand content. Return only the requested schema. Preserve supplied URLs character-for-character."
        },
        { role: "user", content: JSON.stringify(prompt) }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "daily_content_draft",
          strict: true,
          schema: {
            type: "object",
            properties: { title: { type: "string" }, ...properties },
            required: ["title", ...brand.outputs],
            additionalProperties: false
          }
        }
      }
    }),
    signal: AbortSignal.timeout(60_000)
  });
  if (!response.ok) throw new Error(`OpenAI returned HTTP ${response.status}`);
  const payload = await response.json();
  const text = payload.output
    ?.flatMap((item) => item.content ?? [])
    .find((item) => item.type === "output_text")?.text;
  if (!text) throw new Error("OpenAI response did not contain output_text");
  return JSON.parse(text);
}

async function writeDraft(brandKey, draft) {
  const directory = path.join(root, "content/drafts", date, brandKey);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(
    path.join(directory, "draft.json"),
    `${JSON.stringify(draft, null, 2)}\n`
  );
  for (const output of draft.outputs) {
    await fs.writeFile(
      path.join(directory, `${safeFileName(output)}.md`),
      `${draft[output]}\n`
    );
  }
}

async function sendToContentStudio(draft) {
  if (!process.env.CONTENT_STUDIO_WEBHOOK_URL) return "not configured";
  const response = await fetch(process.env.CONTENT_STUDIO_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(process.env.CONTENT_STUDIO_WEBHOOK_TOKEN
        ? { authorization: `Bearer ${process.env.CONTENT_STUDIO_WEBHOOK_TOKEN}` }
        : {})
    },
    body: JSON.stringify(draft),
    signal: AbortSignal.timeout(20_000)
  });
  if (!response.ok) throw new Error(`Content Studio webhook returned HTTP ${response.status}`);
  return "draft sent";
}

let vault;
try {
  vault = await loadAffiliateVault(
    process.env.AFFILIATE_VAULT_CSV_URL,
    config.brands
  );
} catch (error) {
  if (!dryRun) throw error;
  vault = {
    products: { estack: [], straightcut: [] },
    errors: [{ row: null, errors: [error.message] }],
    skipped: [],
    duplicates: [],
    missingColumns: [],
    source: "not configured"
  };
}
const runLog = { date, startedAt: new Date().toISOString(), status: "running", brands: {} };

for (const [brandKey, brand] of Object.entries(config.brands)) {
  if (selectedBrand && selectedBrand !== brandKey) continue;
  try {
    const brandState = state.brands[brandKey];
    let category = chooseRotatingCategory(brand.categories, brandState.lastCategory, date);
    const catalog = {
      products: vault.products[brandKey] ?? [],
      source: brandKey === "vmg" ? "not applicable" : vault.source
    };
    const product =
      brandKey === "vmg"
        ? null
        : selectProduct(catalog.products, brandKey, brand, brandState, date);
    if (product?.category) category = product.category;
    const generated = await aiDraft(
      brandKey,
      brand,
      category,
      product,
      fallbackDraft(brandKey, brand, category, product)
    );
    const draft = {
      schemaVersion: 1,
      brand: brand.name,
      brandKey,
      date,
      category,
      title: generated.title,
      status: "Draft",
      approvalOptions: config.approvalStatuses,
      product,
      outputs: brand.outputs,
      ...Object.fromEntries(brand.outputs.map((output) => [output, generated[output]])),
      generatedAt: new Date().toISOString()
    };
    assertDraftPackage(draft, brand);
    if (!dryRun) {
      await writeDraft(brandKey, draft);
      await sendToContentStudio(draft);
      if (product) await updateLastUsedDate(product, date);
      brandState.lastCategory = category;
      brandState.lastProductId = product?.id ?? null;
      brandState.lastRun = date;
    }
    runLog.brands[brandKey] = {
      status: "success",
      category,
      productId: product?.id ?? null,
      catalogSource: catalog.source,
      vaultValidationErrors: brandKey === "vmg" ? [] : vault.errors,
      vaultSkippedRows: brandKey === "vmg" ? [] : vault.skipped,
      vaultDuplicateRows: brandKey === "vmg" ? [] : vault.duplicates,
      vaultMissingColumns: brandKey === "vmg" ? [] : vault.missingColumns
    };
  } catch (error) {
    runLog.brands[brandKey] = { status: "error", message: error.message };
    process.exitCode = 1;
  }
}

runLog.status = Object.values(runLog.brands).some((brand) => brand.status === "error")
  ? "failed"
  : "success";
runLog.finishedAt = new Date().toISOString();

if (dryRun) {
  console.log(JSON.stringify(runLog, null, 2));
} else {
  await fs.writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
  const logDirectory = path.join(root, "content/drafts", date);
  await fs.mkdir(logDirectory, { recursive: true });
  await fs.writeFile(
    path.join(logDirectory, "run-log.json"),
    `${JSON.stringify(runLog, null, 2)}\n`
  );
}
