const assert = require('node:assert/strict');
const { after, test } = require('node:test');
const { loadAsset, tearDown } = require('./helpers/load-asset.js');

after(tearDown);

const post = (query) => ({ method: 'POST', body: JSON.stringify({ query, variables: {} }) });
const ADDRESS = post('mutation SET($input: X) { setShippingAddressesOnCart(input: $input) { cart { id } } }');

test('knows which calls make Commerce re-total the cart', async () => {
  const { changesTotals } = await loadAsset('recalc');

  assert.equal(changesTotals(ADDRESS), true);
  assert.equal(changesTotals(post('mutation { setShippingMethodsOnCart(input: {}) { cart { id } } }')), true);
  assert.equal(changesTotals(post('mutation { applyCouponsToCart(input: {}) { cart { id } } }')), true);
  assert.equal(changesTotals(post('query { cart(cart_id: "x") { id } }')), false);
  assert.equal(changesTotals({ method: 'GET' }), false);
  assert.equal(changesTotals(undefined), false);
});

test('is recalculating from the call until its answer', async () => {
  const { createRecalcTracker } = await loadAsset('recalc');
  const tracker = createRecalcTracker({ setTimer: () => 0, clearTimer: () => {} });

  tracker.before(ADDRESS);
  assert.equal(tracker.state().pending, true);

  tracker.after(ADDRESS, { data: { setShippingAddressesOnCart: { cart: { id: 'c' } } } });
  assert.deepEqual(tracker.state(), { pending: false, error: null });
});

// The checkout drop-in swallows this error (console.error), and Commerce keeps the last
// tax it calculated, so without this the shopper sees the old tax for the new address.
test('keeps the message when Commerce refuses the new address', async () => {
  const { createRecalcTracker } = await loadAsset('recalc');
  const tracker = createRecalcTracker({ setTimer: () => 0, clearTimer: () => {} });
  const message = "We couldn't calculate tax for this address. Please check the postcode, state and city, then try again.";

  tracker.before(ADDRESS);
  tracker.after(ADDRESS, { errors: [{ message }], data: null });

  assert.deepEqual(tracker.state(), { pending: false, error: { message } });
});

test('clears the error once a later change goes through', async () => {
  const { createRecalcTracker } = await loadAsset('recalc');
  const tracker = createRecalcTracker({ setTimer: () => 0, clearTimer: () => {} });

  tracker.before(ADDRESS);
  tracker.after(ADDRESS, { errors: [{ message: 'no' }] });
  tracker.before(ADDRESS);
  tracker.after(ADDRESS, { data: {} });

  assert.equal(tracker.state().error, null);
});

test('ignores calls that do not change totals', async () => {
  const { createRecalcTracker } = await loadAsset('recalc');
  const changes = [];
  const tracker = createRecalcTracker({
    setTimer: () => 0, clearTimer: () => {}, onChange: (s) => changes.push(s),
  });
  const query = post('query { cart(cart_id: "x") { id } }');

  tracker.before(query);
  tracker.after(query, { errors: [{ message: 'no' }] });

  assert.deepEqual(tracker.state(), { pending: false, error: null });
  assert.equal(changes.length, 0);
});

// A call that fails on the network never reaches the after hook.
test('stops showing the loader if no answer comes back', async () => {
  const { createRecalcTracker } = await loadAsset('recalc');
  let fire;
  const tracker = createRecalcTracker({
    setTimer: (fn) => { fire = fn; return 1; }, clearTimer: () => {},
  });

  tracker.before(ADDRESS);
  fire();

  assert.equal(tracker.state().pending, false);
});

test('waits for every call in flight', async () => {
  const { createRecalcTracker } = await loadAsset('recalc');
  const tracker = createRecalcTracker({ setTimer: () => 0, clearTimer: () => {} });

  tracker.before(ADDRESS);
  tracker.before(ADDRESS);
  tracker.after(ADDRESS, { data: {} });

  assert.equal(tracker.state().pending, true);
});

const ESTIMATE = post('mutation GET_ESTIMATED_TOTALS_MUTATION($cartId: String!) { estimateTotals(input: {}) { cart { id } } }');

test("reads the taxes from the cart drop-in's estimate", async () => {
  const { estimatedTaxes } = await loadAsset('recalc');
  const response = {
    data: {
      estimateTotals: {
        cart: {
          prices: {
            applied_taxes: [{ label: 'State', amount: { value: 4.38, currency: 'USD' } }],
          },
        },
      },
    },
  };

  assert.deepEqual(estimatedTaxes(ESTIMATE, response), [
    { label: 'State', amount: { value: 4.38, currency: 'USD' } },
  ]);
});

test('reads no estimate from other calls or a failed one', async () => {
  const { estimatedTaxes } = await loadAsset('recalc');

  assert.equal(estimatedTaxes(ADDRESS, { data: {} }), undefined);
  assert.equal(estimatedTaxes(ESTIMATE, { errors: [{ message: 'no' }], data: null }), undefined);
});
