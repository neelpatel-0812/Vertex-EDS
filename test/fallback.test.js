const assert = require('node:assert/strict');
const { after, test } = require('node:test');
const { loadAsset, tearDown } = require('./helpers/load-asset.js');

after(tearDown);

const usd = (value) => ({ value, currency: 'USD' });

// Commerce drops a zero-amount tax line, so nothing on a cart says it was priced by
// the fallback: the package asks the Vertex Tax app (status.js) when tax shows as zero.
test('asks about a cart with goods and zero tax', async () => {
  const { cartNeedsCheck } = await loadAsset('fallback');

  assert.equal(cartNeedsCheck({ id: 'c1', totalQuantity: 2, totalTax: usd(0) }), true);
});

test('does not ask about a taxed cart, an empty one, or one with no id', async () => {
  const { cartNeedsCheck } = await loadAsset('fallback');

  assert.equal(cartNeedsCheck({ id: 'c1', totalQuantity: 2, totalTax: usd(26.28) }), false);
  assert.equal(cartNeedsCheck({ id: 'c1', totalQuantity: 0, totalTax: usd(0) }), false);
  assert.equal(cartNeedsCheck({ totalQuantity: 1, totalTax: usd(0) }), false);
  assert.equal(cartNeedsCheck(null), false);
});

test('asks about an order with zero tax, by its number', async () => {
  const { orderNeedsCheck } = await loadAsset('fallback');

  assert.equal(orderNeedsCheck({ number: '000000060', totalTax: usd(0) }), true);
  assert.equal(orderNeedsCheck({ number: '000000060', totalTax: usd(3) }), false);
  assert.equal(orderNeedsCheck({ totalTax: usd(0) }), false);
});

test('reads the notice text: the merchant message on its own, else the default', async () => {
  const { noticeText } = await loadAsset('fallback');
  const { createStrings } = await loadAsset('i18n');
  const t = createStrings({});

  assert.deepEqual(noticeText({ message: 'We will email you.' }, t), {
    title: 'Tax to be confirmed',
    body: 'We will email you.',
  });
  assert.deepEqual(noticeText({}, t), {
    title: 'Tax to be confirmed',
    body: 'Tax could not be calculated, so it is not included in this total. The store will confirm it with you.',
  });
});
