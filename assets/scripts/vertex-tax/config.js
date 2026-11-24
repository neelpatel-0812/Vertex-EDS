import { getMetadata } from '../aem.js';

/**
 * Storefront-wide settings, each read from a `<meta name="vertex-tax-…">` tag in
 * head.html (STANDARDS.md, section 4). This table is the one place a setting, its tag
 * and its default are defined; README.md documents the same list.
 */
export const SETTINGS = {
  /** Show each Vertex tax (CGST, State, …) instead of a single tax line. */
  breakdown: { meta: 'vertex-tax-breakdown', type: 'boolean', default: true },
  /** Add the rate to a tax's name when Commerce knows it: "CGST (9%)". */
  showRates: { meta: 'vertex-tax-show-rates', type: 'boolean', default: true },
};

const TRUE = new Set(['true', 'yes', 'on', '1']);
const FALSE = new Set(['false', 'no', 'off', '0']);

function parse(definition, raw) {
  if (definition.type === 'boolean') {
    const value = raw.trim().toLowerCase();
    if (TRUE.has(value)) return true;
    if (FALSE.has(value)) return false;
    return undefined;
  }
  return raw.trim();
}

/**
 * A setting's value: its tag's, or the default when the tag is missing. A value that
 * cannot be read also gives the default, with a warning that names the tag, so a typo
 * in head.html is found without breaking the page.
 */
export function readSetting(name, { read = getMetadata } = {}) {
  const definition = SETTINGS[name];
  if (!definition) throw new Error(`unknown vertex-tax setting '${name}'`);

  const raw = read(definition.meta);
  if (!raw) return definition.default;

  const value = parse(definition, raw);
  if (value === undefined) {
    console.warn(
      `[vertex-tax] <meta name="${definition.meta}"> has "${raw}", which is not understood; `
      + `using the default (${definition.default}).`,
    );
    return definition.default;
  }
  return value;
}
