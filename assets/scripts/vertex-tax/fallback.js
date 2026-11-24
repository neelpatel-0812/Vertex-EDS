import { cartTaxRows, orderTaxRows } from './taxes.js';

/**
 * The Vertex Tax app's fallback mark.
 *
 * When Vertex cannot be reached and the merchant's fallback is "charge zero tax", the
 * app adds one zero-amount tax titled "Tax to be confirmed: <the merchant's message>".
 * Commerce keeps a tax's title, but not its code, on the cart and the order, so the
 * title is the mark. It must match FALLBACK_TAX_TITLE in the app's
 * src/lib/tax/operations.ts.
 *
 * Pure functions; fallback-notice.js puts the result on the page.
 */
export const FALLBACK_TITLE = 'Tax to be confirmed';

function isMark(label) {
  return label === FALLBACK_TITLE || label.startsWith(`${FALLBACK_TITLE}:`);
}

function findFallback(rows) {
  const mark = rows.find((row) => isMark(row.label));
  if (!mark) return null;
  return { message: mark.label.slice(FALLBACK_TITLE.length).replace(/^:\s*/, '').trim() };
}

/** `{ message }` when the cart was priced by the fallback, else null. */
export function cartFallback(cart) {
  return findFallback(cartTaxRows(cart, { includeZero: true }));
}

/** `{ message }` when the order was placed under the fallback, else null. */
export function orderFallback(order) {
  return findFallback(orderTaxRows(order, { includeZero: true }));
}

/** The rows without the mark, for anything that lists taxes. */
export function withoutFallback(rows) {
  return rows.filter((row) => !isMark(row.label));
}

/** The notice's heading and text, in the storefront's language. */
export function noticeText(fallback, t) {
  return {
    title: t('vertex-tax-fallback-title'),
    body: t('vertex-tax-fallback-notice', { message: fallback.message }).trim(),
  };
}
