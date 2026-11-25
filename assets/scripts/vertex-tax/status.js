/**
 * Asks the Vertex Tax app whether a cart or an order was priced by the merchant's
 * fallback (its `tax-status` action).
 *
 * The storefront cannot tell by itself: under the "zero" fallback the cart just shows
 * $0.00 tax, and Commerce drops a zero-amount tax line, so nothing on the cart says why.
 * The app keeps that record and answers `{ fallback, message? }`.
 *
 * Never throws and never waits long: the notice is a courtesy, and a slow or failing
 * answer must not affect the page (STANDARDS.md, section 6).
 */

/** Matches the action's own Cache-Control: one question per cart per 30 seconds. */
const MEMO_MS = 30000;
const TIMEOUT_MS = 3000;
const NO = Object.freeze({ fallback: false });

function readAnswer(body) {
  if (!body || typeof body !== 'object' || body.fallback !== true) return NO;
  return typeof body.message === 'string' && body.message.trim()
    ? { fallback: true, message: body.message.trim() }
    : { fallback: true };
}

/**
 * @param {{ url: string, fetchImpl?: typeof fetch, now?: () => number }} options
 * @returns {(subject: { cart?: string, order?: string }) =>
 *   Promise<{ fallback: boolean, message?: string }>}
 */
export function createStatusClient({
  url,
  fetchImpl = typeof fetch === 'function' ? fetch : undefined,
  now = Date.now,
}) {
  const memo = new Map();

  return async (subject) => {
    if (!url || !fetchImpl) return NO;
    const [kind, value] = subject.cart ? ['cart', subject.cart] : ['order', subject.order];
    if (!value) return NO;

    const key = `${kind}:${value}`;
    const remembered = memo.get(key);
    if (remembered && now() - remembered.at < MEMO_MS) return remembered.answer;

    const pending = (async () => {
      const controller = typeof AbortController === 'function' ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null;
      try {
        const separator = url.includes('?') ? '&' : '?';
        const response = await fetchImpl(
          `${url}${separator}${kind}=${encodeURIComponent(value)}`,
          controller ? { signal: controller.signal } : undefined,
        );
        if (!response.ok) return NO;
        return readAnswer(await response.json());
      } catch {
        return NO;
      } finally {
        if (timer) clearTimeout(timer);
      }
    })();

    memo.set(key, { at: now(), answer: pending });
    return pending;
  };
}
