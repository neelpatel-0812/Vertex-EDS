# eds-vertex-tax 0.2: design

Status: agreed 2026-11-24, after testing on a storefront connected to the Vertex Dev
store. Follows [STANDARDS.md](../STANDARDS.md).

## Goal

Show Vertex tax clearly wherever a shopper meets tax on an Adobe Commerce storefront
(Edge Delivery Services, aem-boilerplate-commerce with drop-ins 3.x), using the amounts
Commerce already holds, so the storefront always agrees with checkout and with what is
filed in Vertex.

## What the drop-ins already do (verified)

With the Vertex integration active, Commerce asks the Vertex Tax app's `collect_taxes`
webhook for tax whenever it totals a cart, and keeps each tax's name and amount. The
Adobe drop-ins show it with no code from this package, once switched on:

| Where | Drop-in feature | Switch | Verified |
| --- | --- | --- | --- |
| Cart estimate by address | Cart `EstimateShipping` form; the summary shows the estimated taxes | Cart block field **Enable Estimate Shipping = true** | Vertex priced the cart from a partial address (postcode only) |
| Tax per name in cart and checkout | Cart `OrderSummary` lists each applied tax | Commerce: *Sales › Tax › Shopping Cart Display Settings › Display Full Tax Summary = Yes* | Checkout listed the Vertex tax with its amount |
| Tax per name on order pages | Order `OrderCostSummary` "Tax" accordion | Commerce: *Sales › Tax › Orders, Invoices, Credit Memos Display Settings › Display Full Tax Summary = Yes* | Confirmation page of a test order |

So the package does not rebuild these. The 0.1 `vertex-tax-estimate` block and its
`estimate-tax` client are retired: the native form runs the exact checkout logic and
needs no public endpoint. 0.1 was never published, so nothing depends on them.

Two fixes made on the app side during this work, which the storefront shows as-is:

- Tax names: the app now names a tax by Vertex's imposition when that is its real name
  (IGST, CGST, SGST, VAT) instead of "India Country Tax". US taxes keep
  "New York State Tax".
- The Admin warns when the ship-from address has no state; without it Vertex charged
  IGST on a sale within Gujarat.

## What the package adds

### 1. Setup guide (README)

The three switches above, exactly where they are and what each shows, plus how to check
them. Every storefront needs them, and nothing else tells a merchant they exist.

### 2. Fallback notice (dropped)

The idea: in the "zero" fallback the app adds one zero-amount tax titled "Tax to be
confirmed: <message>", and the storefront shows it as a notice. Built and unit-tested,
then tested on Dev on 2026-11-25: Commerce drops a tax line whose amount is zero, so the
cart's `appliedTaxes` came back empty and there was nothing to show. The code was removed
from the app and the package.

If a notice is wanted later, the storefront has to ask the app: the app already records,
per cart, that it was priced by the fallback (quotation-cache.ts, `QuoteFallback`). A
small read-only web action looked up by the storefront's cart id would answer it. Not
built: it adds a public endpoint, and "Block checkout" already tells the shopper.

## Package contents

Documentation only: README (setup), docs/GO-LIVE.md, this design, STANDARDS.md.

## Test storefront

A local aem-boilerplate-commerce 12.0.0 checkout (drop-ins 3.4) whose `config.json`
points at the Vertex Dev ACCS store (endpoint and store codes are kept with that local
storefront, not in this repository).
Start with `npx @adobe/aem-cli up` (http://localhost:3000). Page content comes from the
boilerplate's demo site; only the config is local.

## Distribution

Public npm registry under `@magnetoitsolutionsllc`, Magneto IT Solutions EULA, public
GitHub repository (neelpatel-0812/Vertex-EDS), as eds-pinterest-tracking is.
