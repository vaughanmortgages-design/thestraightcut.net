# The Straight Cut Shop Catalog

The existing production publication remains unchanged. The catalog-powered shopping experience is generated only under `/shop/`.

## Product source

The build reads `PRODUCT_SHEET_CSV_URL`. If the environment variable is not configured, it reads the existing public `TSC Deals` CSV:

`https://docs.google.com/spreadsheets/d/1N5MWf_GMtVDUrLep9JchPKDWPHCLiufm-bY1KrA-IoE/gviz/tq?tqx=out:csv&sheet=Deals`

The importer rejects incomplete, inactive, duplicated or untracked rows. It never rewrites an affiliate URL.

## Required columns

- `Product ID`
- `Product Title`
- `Merchant`
- `Category`
- `Image URL`
- `Affiliate URL`

Supported optional columns:

- `Short Description`
- `Product URL`
- `Price`
- `Currency`
- `Availability`
- `Badge`
- `Featured`
- `Staff Pick`
- `Trending`
- `Clearance`
- `New Arrival`
- `Back to School`
- `Prime Pick`
- `eBay Find`
- `Active`
- `Last Updated`

Accepted merchants are exactly `Amazon` and `eBay`. Currency is `CAD`.

Amazon destinations must be merchant-issued `amzn.to` links or Amazon URLs carrying `tag=straightcutgu-20`. eBay URLs must use an approved EPN redirect or carry campaign `5339155090`.

## Build flow

1. Existing storefront build runs unchanged.
2. `scripts/refresh-catalog.mjs` reads and validates the product Sheet.
3. Valid products are written to:
   - `/shop/data/products.json`
   - `/shop/catalog.csv`
   - `/shop/catalog.xml`
4. `scripts/build-shop.mjs` generates `/shop/`, department pages, featured collections and product pages.
5. Invalid rows are listed in `/shop/data/catalog-validation.json`.

Make.com can update the Google Sheet and trigger the existing Netlify build hook. The next build refreshes the shop without changing the production publication pages.
