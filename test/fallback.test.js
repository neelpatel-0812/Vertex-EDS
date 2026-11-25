const assert = require('node:assert/strict');
const { after, test } = require('node:test');
const { loadAsset, tearDown } = require('./helpers/load-asset.js');

after(tearDown);

const usd = (value) => ({ value, currency: 'USD' });

// What the Vertex Tax app's "zero" fallback leaves on the cart: zero tax, plus one
// zero-amount tax titled "Tax to be confirmed: <the merchant's message>".
const FALLBACK_CART = {
  appliedTaxes: [{ label: 'Tax to be confirmed: We will email you the final tax.', amount: usd(0) }],
};

test('finds the fallback mark on a cart and reads the merchant message from it', async () => {
  const { cartFallback } = await loadAsset('fallback');

  assert.deepEqual(cartFallback(FALLBACK_CART), { message: 'We will email you the final tax.' });
});

test('finds it on an order too, where Commerce keeps it among the taxes', async () => {
  const { orderFallback } = await loadAsset('fallback');
  const order = { taxes: [{ title: 'Tax to be confirmed: We will email you.', rate: 0, amount: usd(0) }] };

  assert.deepEqual(orderFallback(order), { message: 'We will email you.' });
});

test('answers an empty message for the bare mark', async () => {
  const { cartFallback } = await loadAsset('fallback');

  assert.deepEqual(cartFallback({ appliedTaxes: [{ label: 'Tax to be confirmed', amount: usd(0) }] }), {
    message: '',
  });
});

test('finds nothing on a cart Vertex priced normally, or with no data', async () => {
  const { cartFallback, orderFallback } = await loadAsset('fallback');

  assert.equal(cartFallback({ appliedTaxes: [{ label: 'IGST', amount: usd(17.64) }] }), null);
  assert.equal(cartFallback(null), null);
  assert.equal(orderFallback(undefined), null);
});

test('reads the notice text, with the message or without', async () => {
  const { noticeText } = await loadAsset('fallback');
  const { createStrings } = await loadAsset('i18n');
  const t = createStrings({});

  // The merchant's message is the whole text: prefixing our own sentence made
  // "We could not calculate tax right now. We can't calculate tax right now."
  assert.deepEqual(noticeText({ message: 'We will email you.' }, t), {
    title: 'Tax to be confirmed',
    body: 'We will email you.',
  });
  // No message: the storefront's own, which says what happens next.
  assert.deepEqual(noticeText({ message: '' }, t), {
    title: 'Tax to be confirmed',
    body: 'Tax could not be calculated, so it is not included in this total. The store will confirm it with you.',
  });
});

test('keeps the mark out of the tax rows a page lists', async () => {
  const { withoutFallback } = await loadAsset('fallback');
  const rows = [
    { label: 'Tax to be confirmed: x', amount: usd(0), rate: null },
    { label: 'IGST', amount: usd(1), rate: null },
  ];

  assert.deepEqual(withoutFallback(rows).map((row) => row.label), ['IGST']);
});
