import { fetchPlaceholders } from '../commerce.js';

/**
 * Every shopper-facing string in the package, in English, keyed as the storefront's
 * placeholders key them. A storefront translates by adding the same keys to its
 * placeholders; anything it does not translate falls back to these (STANDARDS.md,
 * section 5). `{name}` marks a value filled in at runtime.
 */
export const DEFAULTS = {
  'vertex-tax-fallback-title': 'Tax to be confirmed',
  // Used only when the merchant wrote no message of their own.
  'vertex-tax-fallback-notice': 'Tax could not be calculated, so it is not included in this total. The store will confirm it with you.',
};

/**
 * A lookup over the storefront's placeholders: `t(key, values)`. A key with neither a
 * translation nor a default comes back as itself, so a gap is visible rather than blank.
 */
export function createStrings(placeholders = {}) {
  return (key, values = {}) => {
    const template = placeholders?.[key] ?? DEFAULTS[key] ?? key;
    return String(template).replace(/\{(\w+)\}/g, (match, name) => (
      Object.hasOwn(values, name) ? String(values[name]) : match
    ));
  };
}

/**
 * The storefront's strings. Placeholders that cannot be read leave the English
 * defaults in place: a missing translation is never a reason to fail the page.
 */
export async function loadStrings({ load = fetchPlaceholders } = {}) {
  try {
    return createStrings(await load());
  } catch (error) {
    console.warn('[vertex-tax] could not read placeholders, using English', error);
    return createStrings({});
  }
}
