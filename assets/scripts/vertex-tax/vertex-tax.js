import { events } from '@dropins/tools/event-bus.js';
import { loadCSS } from '../aem.js';
// Namespace import: an older storefront without CORE_FETCH_GRAPHQL must not fail to load.
import * as commerce from '../commerce.js';
import { addsUpTo, breakdownRows } from './breakdown.js';
import { readSetting } from './config.js';
import { cartNeedsCheck, noticeText, orderNeedsCheck } from './fallback.js';
import { loadStrings } from './i18n.js';
import { createRecalcTracker, estimatedTaxes } from './recalc.js';
import { createStatusClient } from './status.js';
import { cartTaxRows, orderTaxRows } from './taxes.js';

/*
 * Vertex tax on any aem-boilerplate-commerce storefront, with no block edits.
 *
 * Loaded once per page from head.html (the installer adds the tag). It watches the
 * drop-ins' data events and finds their order summaries on the page by the drop-ins'
 * own class names, then:
 *
 *   - lists each tax (CGST, SGST, State, …) under the Tax line, styled with the
 *     drop-in's own row classes, when the summary shows a single Tax line. When
 *     Commerce's "Display Full Tax Summary" is on, the drop-in lists them itself and
 *     nothing is added;
 *   - shows "Tax to be confirmed" above the summary when the Vertex Tax app says the
 *     cart or order was priced by the merchant's fallback (status.js);
 *   - shimmers the Tax and Total amounts while Commerce recalculates the cart, and says
 *     so when it refused the change (an address Vertex cannot place) and the amounts
 *     shown are still the old ones (recalc.js).
 *
 * The drop-ins re-render their summaries, which removes anything added inside them, so
 * a MutationObserver puts it back. Every step is idempotent: a pass that finds nothing
 * to change changes nothing, so it settles. Nothing here may break the page
 * (STANDARDS.md, section 6): every pass is wrapped, and a failure only hides our output.
 */

/** The drop-ins' markup this relies on (cart drop-in for cart and checkout, order drop-in). */
const SURFACES = [
  {
    source: 'cart',
    summary: '.cart-order-summary',
    fullTaxes: '.cart-order-summary__taxes',
    taxLine: '[data-testid="tax-total-only"]',
    row: (label, price) => {
      const entry = el('div', 'cart-order-summary__entry cart-order-summary__taxEntry');
      entry.append(
        el('span', 'cart-order-summary__label cart-order-summary__label--muted', label),
        el('span', 'cart-order-summary__price cart-order-summary__price--muted', price),
      );
      return entry;
    },
  },
  {
    source: 'order',
    summary: '.order-cost-summary',
    fullTaxes: '.order-cost-summary-content__accordion',
    taxLine: '.order-cost-summary-content__description--tax',
    row: (label, price) => {
      const entry = el('div', 'order-cost-summary-content__accordion-row');
      entry.append(el('p', '', label), el('p', '', price));
      return entry;
    },
  },
];

const NO = { fallback: false };

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function start() {
  if (window.vertexTaxStarted) return;
  window.vertexTaxStarted = true;

  loadCSS(`${window.hlx?.codeBasePath ?? ''}/scripts/vertex-tax/vertex-tax.css`);

  const settings = {
    breakdown: readSetting('breakdown'),
    showRates: readSetting('showRates'),
    statusUrl: readSetting('statusUrl'),
  };
  const status = createStatusClient({ url: settings.statusUrl });
  const state = {
    cart: null,
    order: null,
    cartStatus: NO,
    orderStatus: NO,
    t: null,
    recalc: { pending: false, error: null },
    // Taxes from the cart drop-in's last estimate (a half-filled checkout address).
    estimate: null,
  };
  // Whether each breakdown is open. Kept here, not on the element: the drop-ins
  // re-render the summary, and the shopper's choice must survive that.
  const open = { cart: false, order: false };
  // Tax lines already listening for clicks, so a re-applied pass adds no second handler.
  const toggles = new WeakSet();

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      // eslint-disable-next-line no-use-before-define
      sync();
    });
  };

  function syncNotice(surface, summary) {
    const statusNow = surface.source === 'cart' ? state.cartStatus : state.orderStatus;
    let notice = summary.previousElementSibling;
    if (!notice?.hasAttribute('data-vertex-tax-notice')) {
      if (!statusNow.fallback) return;
      notice = el('div', 'vertex-tax-fallback');
      notice.setAttribute('data-vertex-tax-notice', '');
      notice.setAttribute('role', 'status');
      notice.append(
        el('strong', 'vertex-tax-fallback-title'),
        el('p', 'vertex-tax-fallback-body'),
      );
      summary.before(notice);
    }
    if (!statusNow.fallback || !state.t) {
      notice.hidden = true;
      return;
    }
    const text = noticeText(statusNow, state.t);
    const [title, body] = notice.children;
    if (title.textContent !== text.title) title.textContent = text.title;
    if (body.textContent !== text.body) body.textContent = text.body;
    notice.hidden = false;
  }

  /**
   * The drop-in's Tax line, made the accordion's header: a button with a chevron
   * that opens and closes the list under it, by mouse or keyboard.
   */
  function syncToggle(surface, taxLine, list) {
    const expanded = open[surface.source];
    if (list.hidden === expanded) list.hidden = !expanded;
    if (!taxLine.classList.contains('vertex-tax-toggle')) taxLine.classList.add('vertex-tax-toggle');
    if (taxLine.getAttribute('role') !== 'button') taxLine.setAttribute('role', 'button');
    if (taxLine.getAttribute('tabindex') !== '0') taxLine.setAttribute('tabindex', '0');
    if (taxLine.getAttribute('aria-expanded') !== String(expanded)) {
      taxLine.setAttribute('aria-expanded', String(expanded));
    }
    if (toggles.has(taxLine)) return;
    toggles.add(taxLine);
    const flip = () => {
      open[surface.source] = !open[surface.source];
      schedule();
    };
    taxLine.addEventListener('click', flip);
    taxLine.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        flip();
      }
    });
  }

  /** A Tax line that no longer has a list under it goes back to a plain line. */
  function clearToggle(taxLine) {
    if (!taxLine?.classList.contains('vertex-tax-toggle')) return;
    taxLine.classList.remove('vertex-tax-toggle');
    ['role', 'tabindex', 'aria-expanded'].forEach((name) => taxLine.removeAttribute(name));
  }

  /**
   * The taxes behind the Tax line shown. On checkout that is the cart's saved taxes, or
   * the estimate the drop-in made for a half-filled address; whichever adds up to the
   * amount on the line. Neither adding up means no breakdown: a wrong one is worse.
   */
  function taxRowsFor(surface, taxLine) {
    if (surface.source === 'order') return orderTaxRows(state.order);
    const shown = taxLine.querySelector('.cart-order-summary__price')?.textContent ?? '';
    const candidates = [cartTaxRows(state.cart), cartTaxRows({ appliedTaxes: state.estimate })];
    return candidates.find((rows) => addsUpTo(rows, shown)) ?? [];
  }

  function syncBreakdown(surface, summary) {
    const existing = summary.querySelector('[data-vertex-tax-breakdown]');
    const taxLine = summary.querySelector(surface.taxLine);
    const rows = settings.breakdown && taxLine && !summary.querySelector(surface.fullTaxes)
      ? breakdownRows(taxRowsFor(surface, taxLine), { showRates: settings.showRates })
      : [];

    if (rows.length === 0) {
      existing?.remove();
      clearToggle(taxLine);
      return;
    }
    const signature = JSON.stringify(rows);
    const inPlace = existing?.previousElementSibling === taxLine;
    let list = existing;
    if (!inPlace || existing.dataset.vertexTaxBreakdown !== signature) {
      existing?.remove();
      list = el('div', 'vertex-tax-breakdown');
      list.dataset.vertexTaxBreakdown = signature;
      rows.forEach((row) => list.append(surface.row(row.label, row.price)));
      taxLine.after(list);
    }
    syncToggle(surface, taxLine, list);
  }

  /**
   * While the cart is being re-totalled, a loader over the Tax and Total amounts; when
   * Commerce refused the change, a notice that they are out of date and why.
   */
  function syncRecalc(surface, summary) {
    if (surface.source !== 'cart') return;
    const { pending, error } = state.recalc;
    const stale = !pending && error !== null;
    if (summary.classList.contains('vertex-tax-loading') !== pending) {
      summary.classList.toggle('vertex-tax-loading', pending);
      summary.setAttribute('aria-busy', String(pending));
    }
    if (summary.classList.contains('vertex-tax-stale') !== stale) {
      summary.classList.toggle('vertex-tax-stale', stale);
    }

    let notice = summary.querySelector(':scope > [data-vertex-tax-error]');
    if (!stale || !state.t) {
      if (notice) notice.hidden = true;
      return;
    }
    if (!notice) {
      notice = el('div', 'vertex-tax-error');
      notice.setAttribute('data-vertex-tax-error', '');
      notice.setAttribute('role', 'alert');
      notice.append(el('strong', 'vertex-tax-error-title'), el('p', 'vertex-tax-error-body'));
      summary.prepend(notice);
    }
    const [title, body] = notice.children;
    const titleText = state.t('vertex-tax-error-title');
    const bodyText = error.message || state.t('vertex-tax-error-notice');
    if (title.textContent !== titleText) title.textContent = titleText;
    if (body.textContent !== bodyText) body.textContent = bodyText;
    notice.hidden = false;
  }

  function sync() {
    SURFACES.forEach((surface) => {
      document.querySelectorAll(surface.summary).forEach((summary) => {
        try {
          syncNotice(surface, summary);
          syncBreakdown(surface, summary);
          syncRecalc(surface, summary);
        } catch (error) {
          console.warn('[vertex-tax] could not update the tax summary', error);
        }
      });
    });
  }

  const onCart = (cart) => {
    state.cart = cart ?? null;
    if (cartNeedsCheck(cart)) {
      status({ cart: cart.id }).then((answer) => {
        if (state.cart === cart) {
          state.cartStatus = answer;
          schedule();
        }
      });
    } else {
      state.cartStatus = NO;
    }
    schedule();
  };

  const onOrder = (order) => {
    state.order = order ?? null;
    if (orderNeedsCheck(order)) {
      status({ order: order.number }).then((answer) => {
        if (state.order === order) {
          state.orderStatus = answer;
          schedule();
        }
      });
    } else {
      state.orderStatus = NO;
    }
    schedule();
  };

  // Commerce's GraphQL client, which the cart and checkout drop-ins send through. The
  // hooks only watch: each returns what it was given, and never throws.
  const tracker = createRecalcTracker({
    onChange: (next) => {
      state.recalc = next;
      schedule();
    },
  });
  const client = commerce.CORE_FETCH_GRAPHQL;
  if (typeof client?.addBeforeHook === 'function' && typeof client.addAfterHook === 'function') {
    client.addBeforeHook((requestInit) => {
      try {
        tracker.before(requestInit);
      } catch (error) {
        console.warn('[vertex-tax] could not watch a cart update', error);
      }
      return requestInit;
    });
    client.addAfterHook((requestInit, response) => {
      try {
        tracker.after(requestInit, response);
        const estimate = estimatedTaxes(requestInit, response);
        if (estimate) {
          state.estimate = estimate;
          schedule();
        }
      } catch (error) {
        console.warn('[vertex-tax] could not watch a cart update', error);
      }
      return response;
    });
  }

  loadStrings().then((t) => {
    state.t = t;
    schedule();
  });
  events.on('cart/data', onCart, { eager: true });
  events.on('order/data', onOrder, { eager: true });
  events.on('order/placed', onOrder, { eager: true });
  // characterData too: the drop-in changes the Tax amount's text in place.
  new MutationObserver(schedule).observe(document.body, {
    childList: true, subtree: true, characterData: true,
  });
  schedule();
}

try {
  if (document.body) {
    start();
  } else {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  }
} catch (error) {
  console.warn('[vertex-tax] could not start', error);
}
