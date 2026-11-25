const assert = require('node:assert/strict');
const { after, test } = require('node:test');
const { loadAsset, tearDown } = require('./helpers/load-asset.js');

after(tearDown);

const usd = (value) => ({ value, currency: 'USD' });

test('lists each tax by name with its amount, as the drop-in full summary does', async () => {
  const { breakdownRows } = await loadAsset('breakdown');
  const rows = [
    { label: 'CGST', amount: usd(13.14), rate: null },
    { label: 'SGST', amount: usd(13.14), rate: null },
  ];

  assert.deepEqual(breakdownRows(rows, { locale: 'en-US' }), [
    { label: 'CGST', price: '$13.14' },
    { label: 'SGST', price: '$13.14' },
  ]);
});

test('adds the rate to the name when it is known', async () => {
  const { breakdownRows } = await loadAsset('breakdown');

  assert.deepEqual(breakdownRows([{ label: 'IGST', amount: usd(26.28), rate: 18 }], { locale: 'en-US' }), [
    { label: 'IGST (18%)', price: '$26.28' },
  ]);
  assert.deepEqual(
    breakdownRows([{ label: 'IGST', amount: usd(26.28), rate: 18 }], { locale: 'en-US', showRates: false }),
    [{ label: 'IGST', price: '$26.28' }],
  );
});

test('has nothing to show when there are no taxes, and leaves out zero amounts', async () => {
  const { breakdownRows } = await loadAsset('breakdown');
  assert.deepEqual(breakdownRows([{ label: 'X', amount: usd(0), rate: null }], {}), []);

  assert.deepEqual(breakdownRows([], {}), []);
});
