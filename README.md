# @magnetoitsolutionsllc/eds-vertex-tax

Shows Vertex tax on Adobe Commerce storefronts built on Edge Delivery Services
(aem-boilerplate-commerce, drop-ins 3.x).

It adds two things to the cart, checkout and order pages:

- **Tax breakdown:** each tax by name under the Tax line, for example CGST and SGST.
- **"Tax to be confirmed" notice:** shown when Vertex could not be reached and the order
  was priced at zero tax.

No block needs editing.

## Before you start

- The **Vertex Tax** app is installed and connected in Commerce (Vertex Tax › Setup
  shows *Connected*).
- Your storefront is based on aem-boilerplate-commerce.

## Install

1. In the storefront folder, run:

   ```sh
   npm install --foreground-scripts @magnetoitsolutionsllc/eds-vertex-tax
   ```

   This copies the files to `scripts/vertex-tax/` and adds one script tag to `head.html`.

2. Add this line to `head.html`, with your Vertex Tax app's address:

   ```html
   <meta name="vertex-tax-status-url" content="https://<your-namespace>.adobeioruntime.net/api/v1/web/vertex/tax-status">
   ```

   Without it, the breakdown still works but the notice is off.

3. Commit and push:

   ```sh
   git add scripts/vertex-tax head.html
   git commit -m "Add Vertex tax display"
   git push
   ```

That's it. Once merged to `main`, it is live.

## Check it

Add a product to the cart and enter an address at checkout. Each tax should be listed
by name under the Tax line.

## Options

Optional `<meta>` tags in `head.html`:

| Tag | Default | What it does |
| --- | --- | --- |
| `vertex-tax-breakdown` | `true` | Set to `false` to hide the tax breakdown. |
| `vertex-tax-show-rates` | `true` | Set to `false` to hide rates, as in "IGST (18%)". |

To change the notice text, set the message under **Vertex Tax › Settings › Tax
Behaviour** in Commerce.

## Update

```sh
npm install @magnetoitsolutionsllc/eds-vertex-tax@latest
```

Then commit the changed files. Files you edited yourself are never overwritten.

## License

Magneto IT Solutions LLC End-User License Agreement. See [LICENSE.txt](LICENSE.txt).
