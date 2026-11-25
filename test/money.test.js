const assert = require('node:assert/strict');
const { after, test } = require('node:test');
const { loadAsset, tearDown } = require('./helpers/load-asset.js');

after(tearDown);

test('formats an amount in its own currency for the given language', async () => {
  const { formatMoney } = await loadAsset('money');

  assert.equal(formatMoney({ value: 2.7, currency: 'INR' }, { locale: 'en-IN' }), '₹2.70');
  assert.equal(formatMoney({ value: 1234.5, currency: 'USD' }, { locale: 'en-US' }), '$1,234.50');
});

test('falls back to "value CODE" for a currency the browser does not know', async () => {
  const { formatMoney } = await loadAsset('money');

  assert.equal(formatMoney({ value: 3, currency: 'NOT-A-CODE' }, { locale: 'en-US' }), '3.00 NOT-A-CODE');
});

test('formats nothing for a missing or non-numeric amount, rather than "NaN"', async () => {
  const { formatMoney } = await loadAsset('money');

  assert.equal(formatMoney(undefined), '');
  assert.equal(formatMoney({ value: 'abc', currency: 'USD' }), '');
});

test('formats a rate given in percent, keeping only the decimals it has', async () => {
  const { formatRate } = await loadAsset('money');

  assert.equal(formatRate(9, { locale: 'en-US' }), '9%');
  assert.equal(formatRate(7.25, { locale: 'en-US' }), '7.25%');
  assert.equal(formatRate(null), '');
  assert.equal(formatRate(Number.NaN), '');
});
