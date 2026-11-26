# Changelog

## 0.2.0 – in progress

- **Works in any aem-boilerplate-commerce storefront with no block edits.** The
  installer copies the files and adds one script tag to `head.html`, with the nonce the
  storefront's Content-Security-Policy requires;
  `scripts/vertex-tax/vertex-tax.js` attaches to the drop-ins' order summaries by itself.
- **Tax breakdown:** each tax by name with its amount under the Tax line on cart,
  checkout, order confirmation and account order pages, styled with the drop-ins' own
  row classes. Skipped where Commerce's *Display Full Tax Summary* already lists them.
- **"Tax to be confirmed" notice** above the summary when the cart or order was priced
  by the merchant's fallback. The package asks the Vertex Tax app's new `tax-status`
  action (`<meta name="vertex-tax-status-url">`), because Commerce drops the
  zero-amount mark the 0.2 drafts relied on. Shows the merchant's message, or a
  translatable default.
- **Recalculating loader and "Tax not updated" notice:** the Tax and Total amounts
  shimmer while Commerce re-totals the cart (new address, shipping method, coupon or
  cart line). When Commerce refuses the change, for example an address Vertex cannot
  place, the old amounts are struck through and the reason is shown. Before, the
  checkout drop-in only logged that error, and the previous address's tax stayed on
  screen. Watches the storefront's `CORE_FETCH_GRAPHQL` client. Only an address or
  shipping-method update raises or clears it: coupon and cart errors are the cart
  drop-in's own, and an estimate saves nothing.
- **"Check your address" notice** when the Vertex Tax app could not place the address
  (app 0.9.4: the cart is priced at zero tax and only the order is refused). The status
  is asked again whenever the cart changes, not once per 30 seconds.
- **The breakdown always adds up to the Tax line.** For a half-filled checkout address
  the cart drop-in shows an estimate (`estimateTotals`) while the cart's saved taxes are
  still the last full address's; the breakdown now follows whichever the Tax line shows,
  and is left out when neither adds up.
- Settings: `vertex-tax-status-url`, `vertex-tax-breakdown`, `vertex-tax-show-rates`.
- **Removed** the 0.1 `vertex-tax-estimate` block and its `estimate-tax` client: the cart
  drop-in's Estimate Shipping prices the cart through Vertex already. 0.1 was never
  published.
- Licensed under the Magneto IT Solutions LLC EULA (LICENSE.txt), published to the public
  npm registry like eds-pinterest-tracking.
- Needs the Vertex Tax app 0.9.4 or later (the `tax-status` action, and its address reason).

## 0.1.0 – unreleased

- `vertex-tax-estimate` block: estimates cart tax from country, region and postcode by
  calling the Vertex Tax `estimate-tax` action.
- `scripts/vertex-tax/api.js`: request mapping from the cart drop-in model, the call to
  `estimate-tax`, 8 second timeout.
- Installer that copies the files into the storefront and never overwrites files edited
  there (unless `--force`).
