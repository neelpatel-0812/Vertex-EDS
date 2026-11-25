# Go live: Vertex tax on an EDS storefront

Short checklist. Details are in the [README](../README.md).

## Before you start

- The **Vertex Tax app** is installed and connected (Commerce Admin › Vertex Tax › Setup
  shows *Connected*).
- **Settings › Company & Ship-From** has a company and a full ship-from address,
  **state included**.
- **Settings › Tax Behaviour › When Vertex is unavailable** is what you want, with a
  message for the shopper if you like.

## 1. Install the package

In the storefront repository:

```sh
npm install --foreground-scripts @magnetoitsolutionsllc/eds-vertex-tax
```

It copies files into `scripts/vertex-tax/` and adds one script tag to `head.html`.

## 2. Point it at the Vertex Tax app

In `head.html`, add the app's tax-status address (`aio app get-url` prints it):

```html
<meta name="vertex-tax-status-url" content="https://<namespace>.adobeioruntime.net/api/v1/web/vertex/tax-status">
```

## 3. Cart estimate (optional, no code)

On the storefront's **cart** page, in the **Commerce Cart** block: **Enable Estimate
Shipping = true**, so shoppers see tax before checkout. Publish the page.

## 4. Check locally

```sh
npm run lint
npx @adobe/aem-cli up        # http://localhost:3000
```

Add a product, estimate tax on the cart, go to checkout with a full address, place a test
order: each tax is listed by name under the Tax line, and the Vertex Report (Admin ›
Vertex Tax) has a matching Quotation and Invoice.

## 5. Make it live

```sh
git add scripts/vertex-tax head.html
git commit -m "Add Vertex tax display"
git push
```

Edge Delivery publishes code from git: once the branch is merged to `main`, it is live.

## Updating later

`npm install @magnetoitsolutionsllc/eds-vertex-tax@latest`, then commit the changed
files under `scripts/vertex-tax/`. Files you edited in the storefront are skipped with a
warning, never overwritten.
