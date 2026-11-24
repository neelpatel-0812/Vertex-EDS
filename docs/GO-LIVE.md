# Go live: Vertex tax on an EDS storefront

Short checklist. Details are in the [README](../README.md).

## Before you start

- The **Vertex Tax app** is installed and connected (Commerce Admin › Vertex Tax › Setup
  shows *Connected*).
- **Settings › Company & Ship-From** has a company and a full ship-from address,
  **state included**.

## 1. Turn on the tax display (no code)

1. Commerce Admin › **Stores › Configuration › Sales › Tax**:
   - *Shopping Cart Display Settings* › **Display Full Tax Summary = Yes**
   - *Orders, Invoices, Credit Memos Display Settings* › **Display Full Tax Summary = Yes**
   - **Save Config**.
2. On the storefront's **cart** page, in the **Commerce Cart** block: **Enable Estimate
   Shipping = true**. Publish the page.

## 2. Install the package (for the "Tax to be confirmed" notice)

In the storefront repository:

```sh
npm install --foreground-scripts @magnetoitsolutionsllc/eds-vertex-tax
```

(Needs the registry line in `.npmrc`, see README › Install.) It copies files into
`scripts/vertex-tax/`.

Add the notice to three blocks (copy from README › Fallback notice):

- `blocks/commerce-cart/commerce-cart.js`
- `blocks/commerce-checkout/commerce-checkout.js`
- `blocks/commerce-checkout-success/commerce-checkout-success.js` (with `{ source: 'order' }`)

## 3. Check locally

```sh
npm run lint
npx @adobe/aem-cli up        # http://localhost:3000
```

Add a product, estimate tax on the cart, go to checkout with a full address, place a test
order. Each tax shows by name, and the Vertex Report (Admin › Vertex Tax) has a matching
Quotation and Invoice.

## 4. Make it live

```sh
git add scripts/vertex-tax blocks/commerce-cart blocks/commerce-checkout blocks/commerce-checkout-success
git commit -m "Add Vertex tax display"
git push
```

Edge Delivery publishes code from git: once the branch is merged to `main`, it is live.
Never commit `.npmrc`.

## Updating later

`npm install @magnetoitsolutionsllc/eds-vertex-tax@latest`, then commit the changed
files under `scripts/vertex-tax/`. Files you edited in the storefront are skipped with a
warning, never overwritten.
