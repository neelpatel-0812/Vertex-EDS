// The modules under assets/scripts/vertex-tax are browser ES modules that import the
// host storefront's scripts/aem.js and scripts/commerce.js. Node has neither, so each test
// copies the modules into a temp "scripts" folder next to small stubs of those two files,
// and imports from there. The stubs read globalThis so a test can set what they return.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const SOURCE = path.join(__dirname, '..', '..', 'assets', 'scripts', 'vertex-tax');

const STUBS = {
  'aem.js': 'export const getMetadata = (name) => globalThis.META?.[name] ?? "";\n',
  'commerce.js': [
    'export async function fetchPlaceholders() {',
    '  if (globalThis.PLACEHOLDERS instanceof Error) throw globalThis.PLACEHOLDERS;',
    '  return globalThis.PLACEHOLDERS ?? {};',
    '}',
    '',
  ].join('\n'),
};

let root;

function setUp() {
  if (root) return root;
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'eds-vertex-tax-'));
  const scripts = path.join(root, 'scripts');
  fs.mkdirSync(path.join(scripts, 'vertex-tax'), { recursive: true });
  fs.writeFileSync(path.join(root, 'package.json'), '{"type":"module"}');
  Object.entries(STUBS).forEach(([file, body]) => fs.writeFileSync(path.join(scripts, file), body));
  fs.readdirSync(SOURCE).forEach((file) => {
    fs.copyFileSync(path.join(SOURCE, file), path.join(scripts, 'vertex-tax', file));
  });
  return root;
}

/** Imports assets/scripts/vertex-tax/<name>.js with the host stubs in place. */
async function loadAsset(name) {
  const dir = setUp();
  return import(pathToFileURL(path.join(dir, 'scripts', 'vertex-tax', `${name}.js`)).href);
}

function tearDown() {
  if (root) fs.rmSync(root, { recursive: true, force: true });
  root = undefined;
  delete globalThis.META;
  delete globalThis.PLACEHOLDERS;
}

module.exports = { loadAsset, tearDown };
