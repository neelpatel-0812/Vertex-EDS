# @magnetoitsolutionsllc/eds-vertex-tax

Vertex tax on Adobe Commerce storefronts built on Edge Delivery Services
(aem-boilerplate-commerce with drop-ins 3.x).

Tax on the storefront comes from Commerce, which gets it from the Vertex Tax App Builder
app's `collect_taxes` webhook. So the storefront always shows what checkout charges and
what is filed with Vertex. Most of the display is built into Adobe's drop-ins and only
needs switching on; this package documents that and adds what the drop-ins lack.

**Quick start:** [docs/GO-LIVE.md](docs/GO-LIVE.md) is the short checklist to install and go live.

## Requirements

- A storefront based on
  [aem-boilerplate-commerce](https://github.com/hlxsites/aem-boilerplate-commerce)
  (the installer looks for `scripts/initializers/index.js`).
- The Vertex Tax app installed and connected in the Commerce instance, with the Vertex
  tax integration active.

## Storefront setup

Three switches turn on Vertex tax display. None needs code.

| What the shopper sees | Where to switch it on |
| --- | --- |
| **Estimated tax on the cart page**, from a country, state and postcode, before checkout | The cart page's **Commerce Cart** block: set **Enable Estimate Shipping** to `true`. |
| **Each tax by name in the cart and checkout summary** (for example CGST and SGST, or State and County tax) instead of one "Tax" line | Commerce Admin › **Stores › Configuration › Sales › Tax › Shopping Cart Display Settings › Display Full Tax Summary** = **Yes** |
| **Each tax by name on the order confirmation and in My Account** | Commerce Admin › **Stores › Configuration › Sales › Tax › Orders, Invoices, Credit Memos Display Settings › Display Full Tax Summary** = **Yes** |

For the two Commerce settings, untick *Use system value*, choose **Yes** and save. They
can take a few minutes to reach the storefront.

### Checking it

1. Add a product to the cart, open the cart page, and use **Estimate Shipping** with a
   country, state and postcode: the summary shows the estimated tax.
2. Go to checkout and enter a full address: the summary lists each tax by name.
3. Place a test order: the confirmation page's **Tax** section lists the same taxes.

In the Vertex Tax app's **Vertex Report**, each step shows as a Quotation (and the order
as an Invoice) with the address that was priced.

If the tax names look wrong (for example IGST where CGST and SGST are expected), check
the ship-from address under **Vertex Tax › Settings › Company & Ship-From**: Vertex
needs its state to tell whether a sale stays within one state.

## Install

The package is on the public npm registry. From the storefront root:

```sh
npm install --foreground-scripts @magnetoitsolutionsllc/eds-vertex-tax
```

The `postinstall` hook copies the package's files into the storefront under
`scripts/vertex-tax/`. **Commit the copied files**: Edge Delivery serves code from git,
and `node_modules` does not exist at runtime.

If `postinstall` did not run (for example `npm ci --ignore-scripts` in CI), run:

```sh
npx eds-vertex-tax
```

### Updates and local edits

Every copied file starts with a header holding a hash of its content. On the next
install a file is replaced only if that hash still matches, meaning nobody edited it in
the storefront. Edited files are skipped with a warning. Make the change in this package
and publish a new version, or run `npx eds-vertex-tax --force` to overwrite the edits.

## Translations

Shopper-facing text comes from the storefront's placeholders, keys `vertex-tax-*`. Add
a key to translate it; anything not translated falls back to English. The keys and
their English text are in `scripts/vertex-tax/i18n.js` (`DEFAULTS`).

## Fallback notice

When Vertex cannot be reached, the Vertex Tax app applies the merchant's fallback
(*Vertex Tax › Settings › Tax Behaviour › When Vertex is unavailable*). With **Charge zero
tax and flag the order**, the cart is priced at zero tax and marked "Tax to be confirmed",
with the merchant's message. The package shows that as a notice next to the totals, so
a shopper does not take a zero for the final tax.

The host calls it once per page, with an empty element near the totals:

```js
import { mountFallbackNotice } from '../../scripts/vertex-tax/fallback-notice.js';

// Cart page (blocks/commerce-cart) and checkout (blocks/commerce-checkout):
const $vertexTaxNotice = document.createElement('div');
$summary.before($vertexTaxNotice); // the element the OrderSummary renders into
mountFallbackNotice($vertexTaxNotice);

// Order confirmation (blocks/commerce-checkout-success), before $orderCostSummary:
mountFallbackNotice($vertexTaxNotice, { source: 'order' });
```

On the **My Account order page** (and the guest order-status page), the order's totals
come from the **Commerce Order Cost Summary** block. In
`blocks/commerce-order-cost-summary/commerce-order-cost-summary.js`:

```js
import { mountFallbackNotice } from '../../scripts/vertex-tax/fallback-notice.js';

export default async function decorate(block) {
  const $vertexTaxNotice = document.createElement('div');
  block.before($vertexTaxNotice);
  mountFallbackNotice($vertexTaxNotice, { source: 'order' });

  await orderRenderer.render(OrderCostSummary, {})(block);
}
```

The notice stays hidden until a fallback happens, and loads its own CSS
(`scripts/vertex-tax/fallback-notice.css`). Its text is translatable
(`vertex-tax-fallback-title`, `vertex-tax-fallback-notice`).

Commerce also keeps the mark on the order, invoice and credit memo as a zero-amount tax
titled "Tax to be confirmed: …", so the Admin and order emails show it too.

## Development

See [STANDARDS.md](STANDARDS.md) for how code here is written and released.

```sh
npm install
npm run lint
npm test
```

To try it in a storefront, pack it and install the tarball there:

```sh
npm pack
cd ../vertex-storefront
npm install ../eds-vertex-tax/magnetoitsolutionsllc-eds-vertex-tax-0.2.0.tgz --foreground-scripts
npx @adobe/aem-cli up
```

`../vertex-storefront` is a boilerplate storefront whose `config.json` points at the
Vertex Dev store.

## License

Licensed under the Magneto IT Solutions LLC End-User License Agreement. See
[LICENSE.txt](LICENSE.txt).
