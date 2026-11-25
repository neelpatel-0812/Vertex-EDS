/*
 * Whether the cart's tax is being recalculated, and whether the last recalculation failed.
 *
 * Fed from GraphQL hooks on the storefront's Commerce client (vertex-tax.js): a call that
 * makes Commerce re-total the cart (a new address, shipping method, coupon or cart line)
 * is what asks Vertex for tax. While one is in flight the Tax line shows a loader.
 *
 * When Vertex cannot place an address, Commerce refuses the call and keeps the tax it
 * calculated last. The checkout drop-in only logs that error, so without this the
 * shopper sees the old tax under the new address with nothing to say it is out of date.
 */

/** The cart mutations that make Commerce collect totals again. */
const TOTALS_CALLS = /\b(setShippingAddressesOnCart|setBillingAddressOnCart|setShippingMethodsOnCart|estimateTotals|applyCouponsToCart|applyCouponToCart|removeCouponsFromCart|removeCouponFromCart|addProductsToCart|updateCartItems|removeItemFromCart)\s*\(/;

/** Longest a loader stays up when no answer comes back (a network failure skips the hook). */
export const MAX_WAIT_MS = 15000;

/** Whether this GraphQL request (a fetch RequestInit) re-totals the cart. */
export function changesTotals(requestInit) {
  if (requestInit?.method !== 'POST' || typeof requestInit.body !== 'string') return false;
  try {
    return TOTALS_CALLS.test(JSON.parse(requestInit.body)?.query ?? '');
  } catch {
    return false;
  }
}

function firstError(response) {
  const errors = Array.isArray(response?.errors) ? response.errors : [];
  if (errors.length === 0) return null;
  return { message: String(errors[0]?.message ?? '') };
}

/**
 * `before(requestInit)` and `after(requestInit, response)` are the hooks' halves;
 * `state()` is `{ pending, error }`; `onChange(state)` runs whenever that changes.
 */
export function createRecalcTracker({
  onChange = () => {},
  setTimer = setTimeout,
  clearTimer = clearTimeout,
} = {}) {
  let inFlight = 0;
  let error = null;
  let timer;

  const state = () => ({ pending: inFlight > 0, error });
  const changed = () => onChange(state());

  return {
    state,
    before(requestInit) {
      if (!changesTotals(requestInit)) return;
      inFlight += 1;
      clearTimer(timer);
      timer = setTimer(() => {
        inFlight = 0;
        changed();
      }, MAX_WAIT_MS);
      changed();
    },
    after(requestInit, response) {
      if (!changesTotals(requestInit)) return;
      inFlight = Math.max(0, inFlight - 1);
      if (inFlight === 0) clearTimer(timer);
      error = firstError(response);
      changed();
    },
  };
}

/**
 * The taxes in the cart drop-in's estimate (`estimateTotals`, run for a half-filled
 * checkout address), shaped like the drop-in's `appliedTaxes`; undefined for any other
 * call. The drop-in shows the estimate's tax on the Tax line but emits no cart data for
 * it, so this is the only place its breakdown can come from.
 */
export function estimatedTaxes(requestInit, response) {
  if (!changesTotals(requestInit) || !/\bestimateTotals\s*\(/.test(JSON.parse(requestInit.body).query)) {
    return undefined;
  }
  const taxes = response?.data?.estimateTotals?.cart?.prices?.applied_taxes;
  if (!Array.isArray(taxes)) return undefined;
  return taxes.map((tax) => ({ label: tax?.label, amount: tax?.amount }));
}
