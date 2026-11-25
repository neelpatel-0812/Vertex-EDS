/**
 * Money and rates as the shopper reads them.
 *
 * Formatting goes through Intl so the currency symbol, separators and decimals follow
 * the page language and the amount's own currency, as the drop-ins do. Nothing is
 * formatted by string concatenation (STANDARDS.md, section 5).
 */

function pageLocale() {
  return (typeof document !== 'undefined' && document.documentElement.lang) || undefined;
}

/**
 * `{ value, currency }` as "₹2.70". An empty string for a missing or non-numeric amount,
 * so a gap never shows as "NaN"; "3.00 XYZ" for a currency the browser cannot format.
 */
export function formatMoney(money, { locale = pageLocale() } = {}) {
  const value = Number(money?.value);
  if (money?.value === null || money?.value === undefined || !Number.isFinite(value)) return '';
  const currency = String(money.currency ?? '');
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`.trim();
  }
}

/** A rate given in percent (Commerce's unit), as "9%" or "7.25%". Empty when unknown. */
export function formatRate(rate, { locale = pageLocale() } = {}) {
  const value = Number(rate);
  if (rate === null || rate === undefined || !Number.isFinite(value)) return '';
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 4 })
    .format(value / 100);
}
