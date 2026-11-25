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

### 2. Fallback notice

In the "zero" fallback the shopper would see $0.00 tax with nothing saying why. The
first design had the app add a zero-amount "Tax to be confirmed" tax line for the
storefront to find; tested on Dev on 2026-11-25, Commerce drops a tax line whose amount
is zero, so the cart's `appliedTaxes` came back empty.

So the storefront asks the app. collect-taxes already records, per cart, that it was
priced by the fallback (with the merchant's message), and order-placed records the
order. The app's public `tax-status` action answers `{ fallback, message? }` for a
storefront cart id (resolved to Commerce's cart id through Commerce, cached by hash) or
an order number. The package asks only when a cart or order shows zero tax, caches the
answer for 30 seconds, and treats any failure as "no notice".

### 3. Tax breakdown

The drop-ins list each tax only when Commerce's *Display Full Tax Summary* is on. The
package lists them under the Tax line whatever that setting is, using the drop-ins' own
row classes so it looks the same, and adds nothing when the drop-in's list is there.

### 4. No block edits

`vertex-tax.js` is loaded from `head.html` (the installer adds the tag) and finds the
summaries by the drop-ins' class names (`.cart-order-summary`,
`.order-cost-summary`), re-applying its output when they re-render (MutationObserver,
idempotent passes). A storefront needs no code of its own beyond the install.

## Package contents

```
assets/scripts/vertex-tax/
  vertex-tax.js  the entry point: events, summaries, notice and breakdown (DOM)
  vertex-tax.css
  config.js      <meta name="vertex-tax-…"> settings with defaults
  status.js      asks the app's tax-status action                     (no DOM)
  fallback.js    when to ask, and the notice text                       (pure)
  breakdown.js   tax rows with formatted amounts                        (pure)
  taxes.js       cart and order tax data -> rows { label, amount, rate } (pure)
  money.js       Intl formatting for amounts and rates
  i18n.js        strings from the storefront's placeholders (vertex-tax-*)
scripts/install.js   copies assets/ into the storefront, adds the head.html tag
```

## Test storefront

A local aem-boilerplate-commerce 12.0.0 checkout (drop-ins 3.4) whose `config.json`
points at the Vertex Dev ACCS store (endpoint and store codes are kept with that local
storefront, not in this repository).
Start with `npx @adobe/aem-cli up` (http://localhost:3000). Page content comes from the
boilerplate's demo site; only the config is local.

## Distribution

Public npm registry under `@magnetoitsolutionsllc`, Magneto IT Solutions EULA, public
GitHub repository (neelpatel-0812/Vertex-EDS), as eds-pinterest-tracking is.
