const assert = require('node:assert/strict');
const { after, afterEach, test } = require('node:test');
const { loadAsset, tearDown } = require('./helpers/load-asset.js');

after(tearDown);
afterEach(() => { delete globalThis.META; });

test('reads a setting from its <meta> tag', async () => {
  const { readSetting } = await loadAsset('config');
  globalThis.META = { 'vertex-tax-breakdown': 'false' };

  assert.equal(readSetting('breakdown'), false);
});

test('uses the documented default when the tag is missing', async () => {
  const { readSetting } = await loadAsset('config');

  assert.equal(readSetting('breakdown'), true);
  assert.equal(readSetting('showRates'), true);
  assert.equal(readSetting('statusUrl'), '');
});

test('reads the Vertex Tax app address as text', async () => {
  const { readSetting } = await loadAsset('config');
  globalThis.META = { 'vertex-tax-status-url': ' https://example.adobeio-static.net/api/v1/web/vertex/tax-status ' };

  assert.equal(readSetting('statusUrl'), 'https://example.adobeio-static.net/api/v1/web/vertex/tax-status');
});

test('falls back to the default, with a warning naming the tag, for a value it cannot read', async () => {
  const { readSetting } = await loadAsset('config');
  globalThis.META = { 'vertex-tax-breakdown': 'maybe' };
  const warnings = [];
  const original = console.warn;
  console.warn = (message) => warnings.push(message);
  try {
    assert.equal(readSetting('breakdown'), true);
  } finally {
    console.warn = original;
  }
  assert.match(warnings[0], /\[vertex-tax\].*vertex-tax-breakdown/);
});
