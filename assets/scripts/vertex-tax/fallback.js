/**
 * When to ask the Vertex Tax app whether the merchant's fallback priced a cart or an
 * order, and what the notice then says. Pure functions; vertex-tax.js does the DOM.
 *
 * Only a cart or order showing zero tax is asked about: a taxed one was priced by
 * Vertex, so asking would only cost a request.
 */

function isZero(money) {
  return Number(money?.value) === 0;
}

/** A cart with goods, an id and zero tax. */
export function cartNeedsCheck(cart) {
  return Boolean(cart?.id) && Number(cart?.totalQuantity) > 0 && isZero(cart?.totalTax);
}

/** An order with a number and zero tax. */
export function orderNeedsCheck(order) {
  return Boolean(order?.number) && isZero(order?.totalTax);
}

/**
 * The notice's heading and text. The text is the merchant's own message when they
 * wrote one (in their store's language already), else the storefront's translatable
 * default. Never both: the merchant's message usually says the same thing.
 */
export function noticeText(status, t) {
  return {
    title: t('vertex-tax-fallback-title'),
    body: status?.message || t('vertex-tax-fallback-notice'),
  };
}
