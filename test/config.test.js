const assert = require('node:assert/strict');
const { after, afterEach, test } = require('node:test');
const { loadAsset, tearDown } = require('./helpers/load-asset.js');

after(tearDown);
afterEach(() => { delete globalThis.META; });

test('reads a setting from its <meta> tag', async () => {
  const { readSetting } = await loadAsset('config');
  globalThis.META = { 'vertex-tax-show-rates': 'false' };

  assert.equal(readSetting('showRates'), false);
});

test('uses the documented default when the tag is missing', async () => {
  const { readSetting, SETTINGS } = await loadAsset('config');

  assert.equal(readSetting('showRates'), SETTINGS.showRates.default);
  assert.equal(readSetting('breakdown'), true);
});

test('reads yes/no/on/off/1/0 as booleans, ignoring case and spaces', async () => {
  const { readSetting } = await loadAsset('config');

  ['yes', ' ON ', 'True', '1'].forEach((value) => {
    globalThis.META = { 'vertex-tax-breakdown': value };
    assert.equal(readSetting('breakdown'), true, value);
  });
  ['no', 'off', 'FALSE', '0'].forEach((value) => {
    globalThis.META = { 'vertex-tax-breakdown': value };
    assert.equal(readSetting('breakdown'), false, value);
  });
});

test('falls back to the default, with a warning naming the tag, for a value it cannot read', async () => {
  const { readSetting } = await loadAsset('config');
  globalThis.META = { 'vertex-tax-breakdown': 'maybe' };
  const warnings = [];
  const { warn } = console;
  console.warn = (...args) => warnings.push(args.join(' '));
  try {
    assert.equal(readSetting('breakdown'), true);
  } finally {
    console.warn = warn;
  }
  assert.match(warnings[0], /\[vertex-tax\].*vertex-tax-breakdown/);
});

test('refuses a setting name it does not define, so a typo cannot pass silently', async () => {
  const { readSetting } = await loadAsset('config');

  assert.throws(() => readSetting('showRate'), /unknown vertex-tax setting 'showRate'/);
});
