# Changelog

## 0.2.0 – in progress

- **Cart estimate, tax per name in cart/checkout, and order pages are now Adobe's own
  drop-in features**, switched on by settings documented in the README (Storefront
  setup). Verified against the Vertex Dev store.
- **Removed** the 0.1 `vertex-tax-estimate` block and its `scripts/vertex-tax/api.js`
  client for an `estimate-tax` action: the cart drop-in's Estimate Shipping prices the
  cart through Vertex already, with no public endpoint. 0.1 was never published.
- Shared modules under `scripts/vertex-tax/`, used by the fallback notice:
  - `taxes.js` turns the cart drop-in's `appliedTaxes` and the order drop-in's `taxes`
    into one row shape `{ label, amount, rate }`, leaving out zero amounts.
  - `i18n.js` reads shopper-facing strings from the storefront's placeholders
    (`vertex-tax-*` keys), falling back to English.
- **Fallback notice:** `scripts/vertex-tax/fallback-notice.js` (`mountFallbackNotice`)
  shows "Tax to be confirmed" with the merchant's message when the Vertex Tax app priced
  the cart or order with its zero-tax fallback; `fallback.js` holds the detection. Host
  snippets for cart, checkout, order confirmation and the My Account order page.
  The notice shows the merchant's message on its own, or the storefront's default
  when there is none (needs the Vertex Tax app from 2026-11-25, which no longer sends
  its "try again" default in zero mode). Needs
  the Vertex Tax app version that marks its zero-tax fallback.
- The installer leaves a blank line after its header, so copied files that open with a
  comment pass the storefront's stylelint.
- Licensed under the Magneto IT Solutions LLC EULA (LICENSE.txt), published to the public
  npm registry like eds-pinterest-tracking.
- `npm test` runs on Node 24 (`node --test` no longer accepts a folder).
- STANDARDS.md and docs/DESIGN.md added.

## 0.1.0 – unreleased

- `vertex-tax-estimate` block: estimates cart tax from country, region and postcode by
  calling the Vertex Tax `estimate-tax` action.
- `scripts/vertex-tax/api.js`: request mapping from the cart drop-in model, the call to
  `estimate-tax`, 8 second timeout.
- Installer that copies the files into the storefront and never overwrites files edited
  there (unless `--force`).
