/**
 * The tax breakdown's rows: each tax by name with its amount, as the drop-ins' full tax
 * summary shows it. Pure; vertex-tax.js puts them on the page.
 */
import { formatMoney, formatRate } from './money.js';

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
