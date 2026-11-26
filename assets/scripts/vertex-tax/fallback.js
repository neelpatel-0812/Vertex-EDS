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
 * Whether to ask about a cart: its saved tax is zero, or the cart drop-in's latest
 * estimate (`estimateTaxes`, its applied taxes; null when there is none) is. On checkout
 * the Tax line shows the estimate for a half-filled address, and the Vertex Tax app
 * prices that estimate too, so a fallback can show there while the saved tax is not zero.
 */
export function cartCheckWanted(cart, estimateTaxes) {
  if (!cart?.id || !(Number(cart?.totalQuantity) > 0)) return false;
  if (isZero(cart?.totalTax)) return true;
  return Array.isArray(estimateTaxes)
    && estimateTaxes.every((tax) => !Number(tax?.amount?.value));
}

/**
 * Whether the drop-in's Tax line text ("$0.00", "0,00 €") is zero. The notice is only
 * shown next to a zero: next to an amount it would contradict what the shopper sees.
 */
export function showsZero(text) {
  const digits = String(text ?? '').replace(/\D/g, '');
  return digits !== '' && /^0+$/.test(digits);
}

/**
 * A short fingerprint of what decides a cart's tax: its address, lines and totals. It
 * changes when the cart does and stays the same across the drop-ins' re-renders, so the
 * status is asked again for a changed cart, and only then.
 */
export function cartVersion(cart, estimateTaxes = null) {
  const text = JSON.stringify([
    cart?.addresses ?? null,
    cart?.totalQuantity ?? null,
    cart?.subtotal ?? null,
    cart?.total ?? null,
    estimateTaxes ?? null,
  ]);
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 33 + text.charCodeAt(i)) % 4294967291;
  return hash.toString(36);
}

/*
 * The cart key (the Vertex Tax app's src/lib/tax/cart-key.ts builds the same one from
 * the tax webhook). Commerce as a Cloud Service cannot look a cart up by the storefront's
 * cart id, so the app finds the cart by what was priced: where it ships, and which
 * products, how many. Only the hash leaves the page.
 *
 *   v1|<COUNTRY>|<POSTCODE>|<sku>*<qty>,...   (sorted, SKUs lower case)
 */

/** `{ countryCode, postcode }` of the cart drop-in's saved shipping address, or null. */
export function savedDestination(cart) {
  const address = Array.isArray(cart?.addresses?.shipping) ? cart.addresses.shipping[0] : null;
  return address ? { countryCode: address.countryCode, postcode: address.zipCode } : null;
}

/** The key's text for these cart items and destination, or null when either is missing. */
export function cartKeyText(items, destination) {
  const country = String(destination?.countryCode ?? '').trim().toUpperCase();
  const postcode = String(destination?.postcode ?? '').trim().toUpperCase().replace(/\s+/g, '');
  const lines = (Array.isArray(items) ? items : [])
    .filter((item) => String(item?.sku ?? '').trim())
    .map((item) => `${String(item.sku).trim().toLowerCase()}*${Number(item.quantity)}`)
    .sort();
  if (!country || !postcode || lines.length === 0) return null;
  return `v1|${country}|${postcode}|${lines.join(',')}`;
}

/** The first 32 hex characters of the text's SHA-256, or null (no text, no Web Crypto). */
export async function cartKey(text) {
  if (!text || typeof crypto === 'undefined' || !crypto.subtle) return null;
  try {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 32);
  } catch {
    return null;
  }
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
  // The merchant's Block fallback: the order waits until Vertex answers again.
  if (status?.reason === 'unavailable') {
    return {
      title: t('vertex-tax-unavailable-title'),
      body: status.message || t('vertex-tax-unavailable-notice'),
    };
  }
  return {
    title: t('vertex-tax-fallback-title'),
    body: status?.message || t('vertex-tax-fallback-notice'),
  };
}
