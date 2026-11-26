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

// The Vertex Tax app prices a cart whose address Vertex cannot place at zero tax, and
// refuses only the order: the notice is how the shopper learns to fix the address.
test('asks the shopper to check the address when Vertex could not place it', async () => {
  const { noticeText } = await loadAsset('fallback');
  const { createStrings } = await loadAsset('i18n');
  const t = createStrings({});

  assert.deepEqual(noticeText({ reason: 'address', message: 'Check the postcode.' }, t), {
    title: 'Check your address',
    body: 'Check the postcode.',
  });
  assert.deepEqual(noticeText({ reason: 'address' }, t).body, t('vertex-tax-address-notice'));
});

test("a cart's version changes with its address or totals, not with a re-render", async () => {
  const { cartVersion } = await loadAsset('fallback');
  const cart = {
    id: 'c1',
    totalQuantity: 1,
    addresses: { shipping: [{ postCode: '21131' }] },
    total: { includingTax: usd(25) },
  };

  assert.equal(cartVersion(cart), cartVersion(structuredClone(cart)));
  assert.notEqual(cartVersion(cart), cartVersion({ ...cart, addresses: { shipping: [{ postCode: '380001' }] } }));
  assert.match(cartVersion(cart), /^[a-z0-9]+$/);
});

// Block fallback: the cart stays usable at zero tax, and the order is refused until
// Vertex answers again, so the notice says that rather than "to be confirmed".
test('says tax cannot be calculated right now under the Block fallback', async () => {
  const { noticeText } = await loadAsset('fallback');
  const { createStrings } = await loadAsset('i18n');
  const t = createStrings({});

  assert.deepEqual(noticeText({ reason: 'unavailable', message: 'Try again soon.' }, t), {
    title: "Tax can't be calculated right now",
    body: 'Try again soon.',
  });
  assert.equal(noticeText({ reason: 'unavailable' }, t).body, t('vertex-tax-unavailable-notice'));
});

// #4: the notice follows the Tax line on screen, which on checkout can be an estimate
// for a half-filled address rather than the cart's saved tax.
test('reads whether the Tax line on screen shows zero', async () => {
  const { showsZero } = await loadAsset('fallback');

  assert.equal(showsZero('$0.00'), true);
  assert.equal(showsZero('0,00 €'), true);
  assert.equal(showsZero('$1.50'), false);
  assert.equal(showsZero(''), false);
});

test('asks about a cart whose estimate shows zero tax, even if its saved tax does not', async () => {
  const { cartCheckWanted } = await loadAsset('fallback');
  const taxed = { id: 'c1', totalQuantity: 1, totalTax: usd(13.14) };

  assert.equal(cartCheckWanted(taxed, null), false);
  assert.equal(cartCheckWanted(taxed, []), true);
  assert.equal(cartCheckWanted(taxed, [{ label: 'State', amount: usd(0) }]), true);
  assert.equal(cartCheckWanted(taxed, [{ label: 'State', amount: usd(1.5) }]), false);
  assert.equal(cartCheckWanted({ ...taxed, totalTax: usd(0) }, null), true);
  assert.equal(cartCheckWanted({ ...taxed, totalQuantity: 0 }, []), false);
});

test("a cart's version also changes with its estimate", async () => {
  const { cartVersion } = await loadAsset('fallback');
  const cart = { id: 'c1', totalQuantity: 1 };

  assert.notEqual(cartVersion(cart, []), cartVersion(cart, [{ label: 'State', amount: usd(1.5) }]));
  assert.equal(cartVersion(cart), cartVersion(cart, null));
});
