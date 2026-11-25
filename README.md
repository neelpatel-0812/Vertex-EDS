# @magnetoitsolutionsllc/eds-vertex-tax

Vertex tax on Adobe Commerce storefronts built on Edge Delivery Services
(aem-boilerplate-commerce with drop-ins 3.x).

Tax on the storefront comes from Commerce, which gets it from the Vertex Tax App Builder
app's `collect_taxes` webhook. So the storefront always shows what checkout charges and
what is filed with Vertex. The display is built into Adobe's drop-ins and only needs
switching on; this package is the guide to doing that. It installs no code into the
storefront.

**Quick start:** [docs/GO-LIVE.md](docs/GO-LIVE.md) is the short checklist to go live.

## Requirements

- A storefront based on
  [aem-boilerplate-commerce](https://github.com/hlxsites/aem-boilerplate-commerce)
  with drop-ins 3.x.
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

## When Vertex cannot be reached

The Vertex Tax app applies the merchant's fallback (*Vertex Tax › Settings › Tax
Behaviour › When Vertex is unavailable*). What the shopper sees:

| Fallback | Storefront |
| --- | --- |
| **Block checkout** | The merchant's message, as the cart or checkout error. Nothing is ordered untaxed. |
| **Charge zero tax and flag the order** | Tax shows as $0.00, with no explanation. The order is flagged on the Vertex Report for the merchant to review. |
| **Leave the totals as they are** | No Vertex tax, with no explanation. |

There is no storefront notice for "zero tax". It was built and tested, but Commerce drops
a tax line whose amount is zero, so nothing reaches the storefront to show. Merchants who
need the shopper told should use **Block checkout**.

## License

Licensed under the Magneto IT Solutions LLC End-User License Agreement. See
[LICENSE.txt](LICENSE.txt).
