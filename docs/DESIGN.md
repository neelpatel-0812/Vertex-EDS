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

### 2. Fallback notice (built; verify on Dev)

When Vertex cannot be reached, the app applies the merchant's fallback. "Block" stops
checkout with the merchant's message; "zero" and "leave totals" leave no sign on the
storefront, so a shopper sees no tax or Commerce's tax with nothing saying why.

- **App:** in the "zero" fallback, add one zero-amount tax entry whose title carries the
  merchant's fallback message, so Commerce keeps it with the cart and order.
- **Storefront:** the cart and order data carry a tax's title and amount only (no code),
  so the package recognises the entry by its title. `scripts/vertex-tax/fallback.js`
  finds it in the cart (`cart/data` event) and order data, and shows the message as a
  notice next to the totals.
- **Verify first:** whether Commerce keeps a zero-amount tax in `appliedTaxes` and order
  `taxes` (and whether *Display Zero Tax* affects it), and whether the native full tax
  summary already shows it as a row. If the native summary shows it legibly, the package
  may only need to style or move it.

## Package contents

```
assets/scripts/vertex-tax/
  config.js     <meta name="vertex-tax-…"> settings with defaults
  i18n.js       strings from the storefront's placeholders (vertex-tax-*), English defaults
  money.js      Intl formatting for amounts and rates
  taxes.js      cart and order tax data -> rows { label, amount, rate }   (pure)
  fallback.js         detects the fallback mark on cart and order data       (pure)
  fallback-notice.js  mountFallbackNotice(): shows/hides the notice             (DOM)
  fallback-notice.css
scripts/install.js   copies assets/ into the storefront, never overwriting local edits
```

## Test storefront

A local aem-boilerplate-commerce 12.0.0 checkout (drop-ins 3.4) whose `config.json`
points at the Vertex Dev ACCS store (endpoint and store codes are kept with that local
storefront, not in this repository).
Start with `npx @adobe/aem-cli up` (http://localhost:3000). Page content comes from the
boilerplate's demo site; only the config is local.

## Open items

- Licence (LICENSE.txt is still a placeholder): Magneto IT Solutions EULA like
  eds-pinterest-tracking, or other terms. Needed before the first publish.
- GitLab repository and private registry: not created yet.
