const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { afterEach, beforeEach, test } = require('node:test');

const {
  addHeadTag,
  classify,
  install,
  listAssets,
  resolveProjectRoot,
  withHeader,
} = require('../scripts/install.js');

// Any file the package ships; the installer treats them all alike.
const SHIPPED = path.join('scripts', 'vertex-tax', 'taxes.js');

let root;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'eds-vertex-tax-'));
  fs.mkdirSync(path.join(root, 'scripts', 'initializers'), { recursive: true });
  fs.writeFileSync(path.join(root, 'scripts', 'initializers', 'index.js'), '');
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('ships the shared modules', () => {
  assert.deepEqual(listAssets().sort(), [
    ...['breakdown', 'config', 'fallback', 'i18n', 'money', 'recalc', 'status', 'taxes', 'vertex-tax']
      .map((name) => path.join('scripts', 'vertex-tax', `${name}.js`)),
    path.join('scripts', 'vertex-tax', 'vertex-tax.css'),
  ].sort());
});

test('finds the storefront root only where the marker exists', () => {
  assert.equal(resolveProjectRoot([undefined, '/nonexistent', root]), root);
  assert.equal(resolveProjectRoot(['/nonexistent']), null);
});

test('leaves a blank line after the header, so a file that opens with a comment still lints', () => {
  // The storefront's stylelint (comment-empty-line-before) refused the copied CSS when
  // its own opening comment sat right under the header.
  const written = withHeader('/* the file\'s own comment */\n.a {}\n');

  assert.match(written, /\*\/\n\n\/\* the file's own comment/);
});

test('first install writes every file with a header', () => {
  const report = install(root);
  assert.equal(report.written.length, listAssets().length);
  assert.equal(classify(path.join(root, SHIPPED)), 'ours');
});

test('second install leaves identical files alone', () => {
  install(root);
  const report = install(root);
  assert.equal(report.written.length, 0);
  assert.equal(report.unchanged.length, listAssets().length);
});

test('an outdated but unedited copy is upgraded', () => {
  install(root);
  const dest = path.join(root, SHIPPED);
  const old = fs.readFileSync(dest, 'utf8').replace(/@\d+\.\d+\.\d+ /, '@0.0.1 ');
  fs.writeFileSync(dest, old);

  assert.deepEqual(install(root).written, [SHIPPED]);
});

test('an edited copy is skipped, and --force overwrites it', () => {
  install(root);
  const dest = path.join(root, SHIPPED);
  fs.appendFileSync(dest, '\n// local change\n');
  assert.equal(classify(dest), 'modified');

  assert.deepEqual(install(root).skipped, [SHIPPED]);
  assert.match(fs.readFileSync(dest, 'utf8'), /local change/);

  assert.ok(install(root, { force: true }).written.includes(SHIPPED));
  assert.equal(classify(dest), 'ours');
});

test('a file without our header is treated as the storefront\'s own', () => {
  const dest = path.join(root, SHIPPED);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, 'export default function decorate() {}\n');

  assert.deepEqual(install(root).skipped, [SHIPPED]);
});

test('adds the one script tag to head.html, once', () => {
  const head = [
    '<meta name="viewport" content="width=device-width">',
    '<script src="/scripts/aem.js" type="module"></script>',
    '',
  ].join('\n');

  const once = addHeadTag(head);
  assert.match(once, /<script type="module" src="\/scripts\/vertex-tax\/vertex-tax\.js"><\/script>/);
  assert.equal(addHeadTag(once), once);
});

test('gives the tag the nonce the storefront\'s scripts carry, or its CSP blocks it', () => {
  // The boilerplate's head.html only runs scripts with nonce="aem".
  const head = [
    '<meta http-equiv="Content-Security-Policy" content="script-src \'nonce-aem\' \'strict-dynamic\'">',
    '<script nonce="aem" src="/scripts/aem.js" type="module"></script>',
    '',
  ].join('\n');

  assert.match(
    addHeadTag(head),
    /<script nonce="aem" type="module" src="\/scripts\/vertex-tax\/vertex-tax\.js"><\/script>/,
  );
});

test('replaces a tag added without the nonce by an earlier version', () => {
  const head = [
    '<script nonce="aem" src="/scripts/aem.js" type="module"></script>',
    '<script type="module" src="/scripts/vertex-tax/vertex-tax.js"></script>',
    '',
  ].join('\n');

  const fixed = addHeadTag(head);
  assert.equal(fixed.match(/vertex-tax\.js/g).length, 1);
  assert.match(fixed, /<script nonce="aem" type="module" src="\/scripts\/vertex-tax\/vertex-tax\.js">/);
});
