# Changelog

## 0.2.0 – in progress

- **Works in any aem-boilerplate-commerce storefront with no block edits.** The
  installer copies the files and adds one script tag to `head.html`;
  `scripts/vertex-tax/vertex-tax.js` attaches to the drop-ins' order summaries by itself.
- **Tax breakdown:** each tax by name with its amount under the Tax line on cart,
  checkout, order confirmation and account order pages, styled with the drop-ins' own
  row classes. Skipped where Commerce's *Display Full Tax Summary* already lists them.
- **"Tax to be confirmed" notice** above the summary when the cart or order was priced
  by the merchant's fallback. The package asks the Vertex Tax app's new `tax-status`
  action (`<meta name="vertex-tax-status-url">`), because Commerce drops the
  zero-amount mark the 0.2 drafts relied on. Shows the merchant's message, or a
  translatable default.
- Settings: `vertex-tax-status-url`, `vertex-tax-breakdown`, `vertex-tax-show-rates`.
- **Removed** the 0.1 `vertex-tax-estimate` block and its `estimate-tax` client: the cart
  drop-in's Estimate Shipping prices the cart through Vertex already. 0.1 was never
  published.
- Licensed under the Magneto IT Solutions LLC EULA (LICENSE.txt), published to the public
  npm registry like eds-pinterest-tracking.
- Needs the Vertex Tax app 0.9.3 or later (the `tax-status` action).

## 0.1.0 – unreleased

- `vertex-tax-estimate` block: estimates cart tax from country, region and postcode by
  calling the Vertex Tax `estimate-tax` action.
- `scripts/vertex-tax/api.js`: request mapping from the cart drop-in model, the call to
  `estimate-tax`, 8 second timeout.
- Installer that copies the files into the storefront and never overwrites files edited
  there (unless `--force`).
