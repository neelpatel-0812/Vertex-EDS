const assert = require('node:assert/strict');
const { after, afterEach, test } = require('node:test');
const { loadAsset, tearDown } = require('./helpers/load-asset.js');

after(tearDown);
afterEach(() => { delete globalThis.PLACEHOLDERS; });

test('uses the English default for a string the storefront does not translate', async () => {
  const { createStrings, DEFAULTS } = await loadAsset('i18n');
  const t = createStrings({});

  assert.equal(t('vertex-tax-fallback-title'), DEFAULTS['vertex-tax-fallback-title']);
});

test("uses the storefront's placeholder when it has one", async () => {
  const { createStrings } = await loadAsset('i18n');
  const t = createStrings({ 'vertex-tax-fallback-title': 'Steuer folgt' });

  assert.equal(t('vertex-tax-fallback-title'), 'Steuer folgt');
});

test('fills {placeholders} in a string, leaving unknown ones visible', async () => {
  const { createStrings } = await loadAsset('i18n');
  const t = createStrings({});

  assert.equal(
    createStrings({ greeting: 'Hello {name}.' })('greeting', { name: 'Ana' }),
    'Hello Ana.',
  );
  assert.equal(t('vertex-tax-missing-key'), 'vertex-tax-missing-key');
  assert.equal(createStrings({ x: 'a {b} {c}' })('x', { b: 1 }), 'a 1 {c}');
});

test('answers the key itself for a string with no default, so a gap is visible not blank', async () => {
  const { createStrings } = await loadAsset('i18n');

  assert.equal(createStrings({})('vertex-tax-nope'), 'vertex-tax-nope');
});

test("loads the storefront's placeholders, and keeps working when they cannot be read", async () => {
  const { loadStrings } = await loadAsset('i18n');

  globalThis.PLACEHOLDERS = { 'vertex-tax-fallback-title': 'Impuesto por confirmar' };
  assert.equal((await loadStrings())('vertex-tax-fallback-title'), 'Impuesto por confirmar');

  globalThis.PLACEHOLDERS = new Error('offline');
  assert.equal((await loadStrings())('vertex-tax-fallback-title'), 'Tax to be confirmed');
});
