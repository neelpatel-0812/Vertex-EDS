# Changelog

## 0.2.0 – in progress

- **The package is now a setup guide and ships no code.** Cart estimate, tax by name in
  cart and checkout, and tax on order pages are Adobe's own drop-in features, switched on
  by the settings in the README (Storefront setup). Verified against the Vertex Dev store.
- **Removed** the 0.1 `vertex-tax-estimate` block and its `estimate-tax` client: the cart
  drop-in's Estimate Shipping prices the cart through Vertex already, with no public
  endpoint. 0.1 was never published.
- **Removed** the "Tax to be confirmed" fallback notice, its shared modules and the
  installer. Commerce drops a zero-amount tax line, so the Vertex Tax app's mark never
  reached the storefront (tested on Dev, 2026-11-25). The README says what a shopper sees
  under each fallback instead.
- Licensed under the Magneto IT Solutions LLC EULA (LICENSE.txt).
- STANDARDS.md, docs/DESIGN.md and docs/GO-LIVE.md added.

## 0.1.0 – unreleased

- `vertex-tax-estimate` block: estimates cart tax from country, region and postcode by
  calling the Vertex Tax `estimate-tax` action.
- `scripts/vertex-tax/api.js`: request mapping from the cart drop-in model, the call to
  `estimate-tax`, 8 second timeout.
- Installer that copies the files into the storefront and never overwrites files edited
  there (unless `--force`).
