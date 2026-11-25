/**
 * Tax data from the drop-ins, as one shape: rows of `{ label, amount, rate }`.
 *
 * The amounts are Vertex's: the Vertex Tax app answered Commerce's tax request, and
 * Commerce keeps what it said. Nothing here calculates tax (STANDARDS.md, section 3).
 *
 * Pure functions only, so they run in Node tests without a browser.
 */

function money(value) {
  const amount = Number(value?.value);
  if (value?.value === null || value?.value === undefined || !Number.isFinite(amount)) return null;
  return { value: amount, currency: String(value.currency ?? '') };
}

function toRows(entries, read, { includeZero = false } = {}) {
  if (!Array.isArray(entries)) return [];
  return entries
    .map((entry) => (entry && typeof entry === 'object' ? read(entry) : null))
    .filter((row) => row && row.amount && (includeZero || row.amount.value !== 0));
}

/**
 * The cart drop-in's `appliedTaxes`: one entry per tax, `{ label, amount }`. Commerce
 * gives no rate here, so `rate` is null.
 */
export function cartTaxRows(cart, options) {
  return toRows(cart?.appliedTaxes, (entry) => ({
    label: typeof entry.label === 'string' ? entry.label.trim() : '',
    amount: money(entry.amount),
    rate: null,
  }), options);
}

/** The order drop-in's `taxes`: `{ title, rate, amount }`, rate in percent. */
export function orderTaxRows(order, options) {
  return toRows(order?.taxes, (entry) => {
    const rate = Number(entry.rate);
    return {
      label: typeof entry.title === 'string' ? entry.title.trim() : '',
      amount: money(entry.amount),
      rate: entry.rate === null || entry.rate === undefined || !Number.isFinite(rate) ? null : rate,
    };
  }, options);
}

/** The rows' total in their currency, or null when there are none. */
export function totalOf(rows) {
  if (!rows.length) return null;
  // Cents, so 0.45 + 0.45 is 0.9 and not 0.9000000000000001.
  const cents = rows.reduce((sum, row) => sum + Math.round(row.amount.value * 100), 0);
  return { value: cents / 100, currency: rows[0].amount.currency };
}
