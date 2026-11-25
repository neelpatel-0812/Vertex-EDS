/**
 * The tax breakdown's rows: each tax by name with its amount, as the drop-ins' full tax
 * summary shows it. Pure; vertex-tax.js puts them on the page.
 */
import { formatMoney, formatRate } from './money.js';
import { totalOf } from './taxes.js';

/**
 * @param {{ label: string, amount: { value: number, currency: string }, rate: number|null }[]} rows
 *   From taxes.js (cartTaxRows / orderTaxRows).
 * @returns {{ label: string, price: string }[]}
 */
export function breakdownRows(rows, { showRates = true, locale } = {}) {
  return rows
    .filter((row) => row.label && Number(row.amount?.value) !== 0)
    .map((row) => {
      const rate = showRates ? formatRate(row.rate, { locale }) : '';
      return {
        label: rate ? `${row.label} (${rate})` : row.label,
        price: formatMoney(row.amount, { locale }),
      };
    });
}

const digits = (text) => String(text ?? '').replace(/\D/g, '');

/**
 * Whether the rows add up to the tax the drop-in shows (`shown`, its Tax line text).
 * The checkout shows an estimate for a half-filled address while the cart's saved taxes
 * belong to the last full address, so a breakdown is only shown when it adds up. Compares
 * digits only, so the drop-in's own symbol and separators never cause a mismatch.
 */
export function addsUpTo(rows, shown, { locale } = {}) {
  const total = totalOf(rows);
  if (!total || !digits(shown)) return false;
  return digits(formatMoney(total, { locale })) === digits(shown);
}
