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

/**
 * A short fingerprint of what decides a cart's tax: its address, lines and totals. It
 * changes when the cart does and stays the same across the drop-ins' re-renders, so the
 * status is asked again for a changed cart, and only then.
 */
export function cartVersion(cart) {
  const text = JSON.stringify([
    cart?.addresses ?? null,
    cart?.totalQuantity ?? null,
    cart?.subtotal ?? null,
    cart?.total ?? null,
  ]);
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 33 + text.charCodeAt(i)) % 4294967291;
  return hash.toString(36);
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
  // The Vertex Tax app could not place the address: the shopper can fix that, and the
  // order is refused until they do.
  if (status?.reason === 'address') {
    return {
      title: t('vertex-tax-address-title'),
      body: status.message || t('vertex-tax-address-notice'),
    };
  }
  return {
    title: t('vertex-tax-fallback-title'),
    body: status?.message || t('vertex-tax-fallback-notice'),
  };
}
