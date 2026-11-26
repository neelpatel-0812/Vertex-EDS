const assert = require('node:assert/strict');
const { after, test } = require('node:test');
const { loadAsset, tearDown } = require('./helpers/load-asset.js');

after(tearDown);

const APP_URL = 'https://app.example/api/v1/web/vertex/tax-status';

function fakeFetch(body, { ok = true } = {}) {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    return { ok, json: async () => body };
  };
  return { calls, fetchImpl };
}

test('asks the Vertex Tax app about a cart by its storefront id', async () => {
  const { createStatusClient } = await loadAsset('status');
  const { calls, fetchImpl } = fakeFetch({ fallback: true, message: 'Later.' });
  const status = createStatusClient({ url: APP_URL, fetchImpl });

  assert.deepEqual(await status({ cart: 'abc' }), { fallback: true, message: 'Later.' });
  assert.equal(calls[0], `${APP_URL}?cart=abc`);
});

test('asks about an order by its number', async () => {
  const { createStatusClient } = await loadAsset('status');
  const { calls, fetchImpl } = fakeFetch({ fallback: false });

  await createStatusClient({ url: APP_URL, fetchImpl })({ order: '000000060' });

  assert.equal(calls[0], `${APP_URL}?order=000000060`);
});

test('asks once per cart within a short time, as checkout re-renders often', async () => {
  const { createStatusClient } = await loadAsset('status');
  const { calls, fetchImpl } = fakeFetch({ fallback: false });
  let now = 0;
  const status = createStatusClient({ url: APP_URL, fetchImpl, now: () => now });

  await status({ cart: 'abc' });
  await status({ cart: 'abc' });
  now += 31000;
  await status({ cart: 'abc' });

  assert.equal(calls.length, 2);
});

test('answers "no fallback" on any failure, so the page is never affected', async () => {
  const { createStatusClient } = await loadAsset('status');
  const failing = createStatusClient({
    url: APP_URL,
    fetchImpl: async () => { throw new Error('offline'); },
  });
  const refused = createStatusClient({
    url: APP_URL,
    fetchImpl: fakeFetch({}, { ok: false }).fetchImpl,
  });
  const odd = createStatusClient({ url: APP_URL, fetchImpl: fakeFetch('nonsense').fetchImpl });

  assert.deepEqual(await failing({ cart: 'abc' }), { fallback: false });
  assert.deepEqual(await refused({ cart: 'abc' }), { fallback: false });
  assert.deepEqual(await odd({ cart: 'abc' }), { fallback: false });
});

test('asks nothing when the app address is not configured', async () => {
  const { createStatusClient } = await loadAsset('status');
  const { calls, fetchImpl } = fakeFetch({ fallback: true });

  assert.deepEqual(await createStatusClient({ url: '', fetchImpl })({ cart: 'abc' }), { fallback: false });
  assert.equal(calls.length, 0);
});

test('passes on why, so the notice can ask the shopper to check the address', async () => {
  const { createStatusClient } = await loadAsset('status');
  const { fetchImpl } = fakeFetch({ fallback: true, reason: 'address', message: 'Check it.' });

  assert.deepEqual(await createStatusClient({ url: APP_URL, fetchImpl })({ cart: 'abc' }), {
    fallback: true,
    reason: 'address',
    message: 'Check it.',
  });
});

// A cart asked about before its address was entered must not keep that answer once the
// address is rejected: the cart changed, so the question is new (and so is the URL, which
// the browser would otherwise serve from its 30-second cache).
test('asks again as soon as the cart changes', async () => {
  const { createStatusClient } = await loadAsset('status');
  const { calls, fetchImpl } = fakeFetch({ fallback: false });
  const status = createStatusClient({ url: APP_URL, fetchImpl, now: () => 0 });

  await status({ cart: 'abc', version: 'v1' });
  await status({ cart: 'abc', version: 'v1' });
  await status({ cart: 'abc', version: 'v2' });

  assert.equal(calls.length, 2);
  assert.equal(calls[1], `${APP_URL}?cart=abc&v=v2`);
});

test('passes on the Block fallback as its own reason', async () => {
  const { createStatusClient } = await loadAsset('status');
  const { fetchImpl } = fakeFetch({ fallback: true, reason: 'unavailable' });

  assert.deepEqual(await createStatusClient({ url: APP_URL, fetchImpl })({ cart: 'abc' }), {
    fallback: true,
    reason: 'unavailable',
  });
});

test('sends the cart keys along with the cart id', async () => {
  const { createStatusClient } = await loadAsset('status');
  const { calls, fetchImpl } = fakeFetch({ fallback: false });
  const keys = ['00066b5711fc3fa4644ee3ec05c461bc', '1234567890abcdef1234567890abcdef'];

  await createStatusClient({ url: APP_URL, fetchImpl })({ cart: 'abc', version: 'v1', keys });

  assert.equal(calls[0], `${APP_URL}?cart=abc&v=v1&key=${keys.join(',')}`);
});
