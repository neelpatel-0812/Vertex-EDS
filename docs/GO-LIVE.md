# Go live: Vertex tax on an EDS storefront

Short checklist. Details are in the [README](../README.md). Nothing is installed into the
storefront: it is all configuration.

## Before you start

- The **Vertex Tax app** is installed and connected (Commerce Admin › Vertex Tax › Setup
  shows *Connected*).
- **Settings › Company & Ship-From** has a company and a full ship-from address,
  **state included**.
- **Settings › Tax Behaviour › When Vertex is unavailable** is the behaviour you want
  (README › When Vertex cannot be reached).

## 1. Turn on the tax display

1. Commerce Admin › **Stores › Configuration › Sales › Tax**:
   - *Shopping Cart Display Settings* › **Display Full Tax Summary = Yes**
   - *Orders, Invoices, Credit Memos Display Settings* › **Display Full Tax Summary = Yes**
   - **Save Config**.
2. On the storefront's **cart** page, in the **Commerce Cart** block: **Enable Estimate
   Shipping = true**. Publish the page.

## 2. Check it

Add a product, estimate tax on the cart, go to checkout with a full address, place a test
order. Each tax shows by name, and the Vertex Report (Admin › Vertex Tax) has a matching
Quotation and Invoice.
