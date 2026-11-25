# @magnetoitsolutionsllc/eds-vertex-tax

Vertex tax on any Adobe Commerce storefront built on Edge Delivery Services
(aem-boilerplate-commerce with drop-ins 3.x).

Tax on the storefront comes from Commerce, which gets it from the Vertex Tax App Builder
app's `collect_taxes` webhook, so the storefront always shows what checkout charges and
what is filed with Vertex. This package adds, on the cart, checkout, order confirmation
and account order pages:

- **Tax breakdown:** each tax by name under the Tax line (for example CGST and SGST, or
  State and County tax), with its amount, styled like the drop-ins' own summary.
- **"Tax to be confirmed" notice:** when Vertex could not be reached and the merchant's
  fallback priced the cart at zero tax, a notice above the summary says so, with the
  merchant's message, instead of a silent $0.00.

Install it once; no block needs editing.

**Quick start:** [docs/GO-LIVE.md](docs/GO-LIVE.md) is the short checklist.

## Requirements

- A storefront based on
  [aem-boilerplate-commerce](https://github.com/hlxsites/aem-boilerplate-commerce)
  with drop-ins 3.x (the installer looks for `scripts/initializers/index.js`).
- The Vertex Tax app installed and connected in the Commerce instance, with the Vertex
  tax integration active.

## Install

From the storefront root:

```sh
npm install --foreground-scripts @magnetoitsolutionsllc/eds-vertex-tax
```

The install:

1. copies the package's files into `scripts/vertex-tax/`;
2. adds one line to `head.html`, which loads it on every page:
   `<script type="module" src="/scripts/vertex-tax/vertex-tax.js"></script>`.

Then add the Vertex Tax app's address to `head.html` (see Configuration), and **commit
`scripts/vertex-tax/` and `head.html`**: Edge Delivery serves code from git, and
`node_modules` does not exist at runtime.

If `postinstall` did not run (for example `npm ci --ignore-scripts` in CI), run
`npx eds-vertex-tax` from the storefront root.

### Updates and local edits

Every copied file starts with a header holding a hash of its content. On the next
install a file is replaced only if that hash still matches, meaning nobody edited it in
the storefront. Edited files are skipped with a warning. Make the change in this package
and publish a new version, or run `npx eds-vertex-tax --force` to overwrite the edits.
The `head.html` line is added only when it is not there already.

## Configuration

Settings are `<meta>` tags in the storefront's `head.html`.

| Tag | Default | Purpose |
| --- | --- | --- |
| `vertex-tax-status-url` | none | The Vertex Tax app's `tax-status` action. **Needed for the notice**; without it the notice is off and the breakdown still works. |
| `vertex-tax-breakdown` | `true` | List each tax under the Tax line. |
| `vertex-tax-show-rates` | `true` | Add the rate to a tax's name where Commerce knows it (order pages): "IGST (18%)". |

The status address is the app's web action URL, which `aio app get-url` prints after a
deploy, for example:

```html
<meta name="vertex-tax-status-url" content="https://<namespace>.adobeioruntime.net/api/v1/web/vertex/tax-status">
```

## What the shopper sees

### Tax breakdown

Under the summary's Tax line, each tax by name with its amount. Commerce's *Display Full
Tax Summary* setting does the same inside the drop-ins; when it is on, the package sees
the drop-in's own list and adds nothing, so a tax is never listed twice.

### When Vertex cannot be reached

The Vertex Tax app applies the merchant's fallback (*Vertex Tax › Settings › Tax
Behaviour › When Vertex is unavailable*):

| Fallback | Storefront |
| --- | --- |
| **Block checkout** | The merchant's message, as the cart or checkout error. |
| **Charge zero tax and flag the order** | Tax shows as $0.00, with the **"Tax to be confirmed"** notice above the summary: the merchant's message, or "Tax could not be calculated, so it is not included in this total. The store will confirm it with you." |
| **Leave the totals as they are** | No Vertex tax, with the same notice. |

How it knows: Commerce keeps nothing on the cart that says tax was not calculated, so
when a cart or order shows zero tax the package asks the app's `tax-status` action, which
keeps that record. Taxed carts are never asked about; answers are cached for 30 seconds;
a slow or failed answer simply shows no notice.

## Translations

Shopper-facing text comes from the storefront's placeholders, keys `vertex-tax-*`. Add
a key to translate it; anything not translated falls back to English. The keys and
their English text are in `scripts/vertex-tax/i18n.js` (`DEFAULTS`). Tax names come from
Commerce as they are.

## How it attaches

`vertex-tax.js` listens to the drop-ins' `cart/data`, `order/data` and `order/placed`
events, and finds the order summaries on the page by the drop-ins' class names
(`.cart-order-summary`, `.order-cost-summary`). The drop-ins re-render their summaries,
so it re-applies its output when they do. Any failure hides the package's output and
logs a `[vertex-tax]` warning; it never breaks the page.

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
cd <storefront>
npm install <path>/magnetoitsolutionsllc-eds-vertex-tax-0.2.0.tgz --foreground-scripts
npx @adobe/aem-cli up
```

## License

Licensed under the Magneto IT Solutions LLC End-User License Agreement. See
[LICENSE.txt](LICENSE.txt).
