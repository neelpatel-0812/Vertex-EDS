import { events } from '@dropins/tools/event-bus.js';
import { loadCSS } from '../aem.js';
import { cartFallback, noticeText, orderFallback } from './fallback.js';
import { loadStrings } from './i18n.js';

/**
 * Shows a "Tax to be confirmed" notice in `container` while the cart (or order) was
 * priced by the Vertex Tax app's fallback, and hides it otherwise. The host calls it
 * once, with an element near its totals (see README, Fallback notice).
 *
 * Kept thin: what counts as a fallback, and what the notice says, are in fallback.js,
 * which is tested. Nothing here may break the host page (STANDARDS.md, section 6).
 *
 * @param {HTMLElement} container Where the notice goes; left empty when there is none.
 * @param {{ source?: 'cart' | 'order' }} [options] Which data to watch: the cart drop-in
 *   (cart and checkout pages) or the order drop-in (confirmation and account pages).
 * @returns {Promise<() => void>} Stops watching.
 */
export async function mountFallbackNotice(container, { source = 'cart' } = {}) {
  if (!container) return () => {};

  // Not a block, so the storefront does not load its CSS by itself.
  loadCSS(`${window.hlx?.codeBasePath ?? ''}/scripts/vertex-tax/fallback-notice.css`);
  const t = await loadStrings();
  const notice = document.createElement('div');
  notice.className = 'vertex-tax-fallback';
  notice.setAttribute('role', 'status');
  notice.hidden = true;
  const title = document.createElement('strong');
  title.className = 'vertex-tax-fallback-title';
  const body = document.createElement('p');
  body.className = 'vertex-tax-fallback-body';
  notice.append(title, body);
  container.append(notice);

  const show = (fallback) => {
    if (!fallback) {
      notice.hidden = true;
      return;
    }
    const text = noticeText(fallback, t);
    title.textContent = text.title;
    body.textContent = text.body;
    notice.hidden = false;
  };

  const read = source === 'order' ? orderFallback : cartFallback;
  const handler = (data) => {
    try {
      show(read(data));
    } catch (error) {
      notice.hidden = true;
      console.warn('[vertex-tax] could not read the fallback notice', error);
    }
  };

  const names = source === 'order' ? ['order/data', 'order/placed'] : ['cart/data'];
  const subscriptions = names.map((name) => events.on(name, handler, { eager: true }));
  return () => subscriptions.forEach((subscription) => subscription?.off?.());
}
