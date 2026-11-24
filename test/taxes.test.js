const assert = require('node:assert/strict');
const { after, test } = require('node:test');
const { loadAsset, tearDown } = require('./helpers/load-asset.js');

after(tearDown);

const inr = (value) => ({ value, currency: 'INR' });

test("reads the cart drop-in's applied taxes as rows", async () => {
  const { cartTaxRows } = await loadAsset('taxes');
  const cart = {
    appliedTaxes: [
      { label: 'CGST', amount: inr(1.35) },
      { label: 'SGST', amount: inr(1.35) },
    ],
  };

  assert.deepEqual(cartTaxRows(cart), [
    { label: 'CGST', amount: inr(1.35), rate: null },
    { label: 'SGST', amount: inr(1.35), rate: null },
  ]);
});

test("reads an order's taxes as rows, rate included", async () => {
  const { orderTaxRows } = await loadAsset('taxes');
  const order = { taxes: [{ title: 'IGST', rate: 18, amount: inr(2.7) }] };

  assert.deepEqual(orderTaxRows(order), [{ label: 'IGST', amount: inr(2.7), rate: 18 }]);
});

test('leaves out zero-amount taxes, which say nothing to the shopper', async () => {
  const { cartTaxRows } = await loadAsset('taxes');
  const cart = { appliedTaxes: [{ label: 'IGST', amount: inr(2.7) }, { label: 'Cess', amount: inr(0) }] };

  assert.deepEqual(cartTaxRows(cart).map((row) => row.label), ['IGST']);
  assert.equal(cartTaxRows(cart, { includeZero: true }).length, 2);
});

test('skips malformed entries instead of failing the page', async () => {
  const { cartTaxRows, orderTaxRows } = await loadAsset('taxes');

  assert.deepEqual(cartTaxRows(null), []);
  assert.deepEqual(cartTaxRows({ appliedTaxes: [null, { label: 'X' }, { amount: inr(1) }] }), [
    { label: '', amount: inr(1), rate: null },
  ]);
  assert.deepEqual(orderTaxRows({ taxes: 'nope' }), []);
});

test('adds the rows up, in their currency', async () => {
  const { totalOf } = await loadAsset('taxes');

  assert.deepEqual(
    totalOf([{ label: 'CGST', amount: inr(0.45), rate: null }, { label: 'SGST', amount: inr(0.45), rate: null }]),
    inr(0.9),
  );
  assert.equal(totalOf([]), null);
});
