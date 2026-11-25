# eds-vertex-tax: package standards

How code in this package is written, organised, tested and released. Every change follows
these; a reviewer can point at a section instead of re-arguing it.

## 1. What the package is

A set of files copied into an **aem-boilerplate-commerce** storefront (Edge Delivery
Services) by `scripts/install.js`. The storefront commits the copies: Edge Delivery serves
code from git, and `node_modules` does not exist at runtime.

So every file under `assets/` must behave like the storefront's own code:

- **No build step.** Plain ES modules, loaded by the browser as written. No TypeScript, JSX
  or bundler in `assets/`.
- **Only the host's dependencies.** Import from the storefront (`scripts/aem.js`,
  `@dropins/*`) and nothing else. No npm runtime dependencies, ever.
- **Passes the host's lint.** `.eslintrc.cjs` mirrors aem-boilerplate-commerce
  (airbnb-base); CSS must pass its stylelint. A copy that fails the storefront's lint blocks
  their commit hook.

## 2. Where things go

```
assets/                         copied into the storefront at the same path
  blocks/vertex-tax-<name>/     one folder per authorable block
    vertex-tax-<name>.js        export default function decorate(block)
    vertex-tax-<name>.css
  scripts/vertex-tax/           shared modules, imported by blocks and by host wiring
    <module>.js
scripts/install.js              the installer (Node, CommonJS)
test/                           node --test, one file per module
docs/                           design notes, decisions
```

- **Names.** Every block is `vertex-tax-*`; every CSS class starts with the block name;
  shared modules live only under `scripts/vertex-tax/`. Nothing may collide with a
  boilerplate or drop-in name.
- **One job per module.** Pure logic (turning cart or order data into tax lines, reading
  config) is kept apart from DOM code, so it can be tested in Node without a browser.
- **Public surface.** A module's exports are its API for host wiring. Exports named in
  `README.md` are stable within a major version; anything else may change.

## 3. Data comes from Commerce

The storefront never computes or calls Vertex itself. Tax amounts come from Commerce
(cart, checkout and order data from the drop-ins), which got them from the Vertex Tax
app's `collect_taxes` webhook. That keeps one source of truth: what the shopper sees is
what checkout charges and what is filed with Vertex.

- Read cart data from the cart drop-in's `cart/data` event or its API
  (`getEstimatedTotals`), and order data from the order drop-in. Do not call Commerce
  GraphQL directly when a drop-in exposes the data.
- Never put a price or tax in a request the browser can change and then trust the answer.

## 4. Configuration

- **Storefront-wide settings**, when a feature needs one, come from `<meta>` tags in
  `head.html`, named `vertex-tax-<setting>`, read through one module that supplies the
  default. (0.2.0 has none: a setting is added with the feature that reads it, never
  ahead of it.)
- **Per-block settings** come from the block table (`readBlockConfig`), with documented
  defaults in the block's README section.
- A missing or invalid setting degrades to the documented default, or the feature hides
  itself with a `console.warn` that names the setting. It never throws during page load.

## 5. Text and languages

- No user-facing string is hard-coded in a block. Strings come from
  `scripts/vertex-tax/i18n.js`, which reads the storefront's placeholders (keys
  `vertex-tax-*`) and falls back to English defaults kept in one table.
- Money is formatted with `Intl.NumberFormat` using the page language and the amount's
  own currency. Never format by string concatenation.
- Tax names come from Commerce data as they are (for example `CGST`, `New York State`).
  The package adds the rate when known, but does not rename taxes.

## 6. Behaviour in the browser

- **Never break the page.** A failure in this package hides its own output and logs a
  `console.warn` prefixed `[vertex-tax]`. It must not throw into the drop-in or block that
  hosts it.
- **No layout shift.** Reserve space or replace an existing element; do not insert content
  above content the shopper is reading after load.
- **Stale data is cleared.** Anything derived from the cart is cleared or recomputed on
  every `cart/data` event, and in-flight requests are aborted when the cart changes.
- **Accessible.** Form fields have labels; results announced with `role="status"`; tax
  breakdowns are real lists or tables with text (never colour alone); all controls work
  with the keyboard.
- **Light.** No work on pages that do not use a feature; blocks load nothing until
  decorated; no polling.

## 7. Integrating with the host storefront

The package must work in any aem-boilerplate-commerce storefront with no block edits:

- **One entry point.** `scripts/vertex-tax/vertex-tax.js`, loaded from `head.html`. The
  installer adds that one script tag, only when it is missing, and changes nothing else
  in the host. No other host file is ever edited.
- **Attach through the drop-ins' public surface.** Their events (`cart/data`,
  `order/data`, `order/placed`) for data, and their documented container class names
  for where to put output. Anything added inside a drop-in's markup must survive its
  re-render (re-apply on change) and must never be duplicated.
- **Configuration is `<meta>` tags** (section 4); the README lists them.
- A drop-in change that moves a class name breaks only our output, never the page:
  the package then shows nothing and warns `[vertex-tax]`.

## 8. Tests and checks

- Every module under `scripts/vertex-tax/` has a `test/<module>.test.js` covering its
  behaviour, run with `node --test`. Pure functions are tested directly; DOM code is kept
  thin enough not to need a browser.
- A bug fix comes with a test that fails without it.
- `npm run lint` and `npm test` pass before every commit; `prepublishOnly` enforces it.
- Before a release, the package is installed into a storefront connected to a Vertex Dev
  store and each feature is checked in a browser (`docs/RELEASE-CHECKLIST.md`).

## 9. Versions and releases

- Semantic versioning. A change to a documented export, a config name, a block field or
  the HTML/CSS hooks a storefront may style is a **major** change.
- Every release has a `CHANGELOG.md` entry written for the storefront developer: what
  changed, and anything they must do.
- The installer's header hash means storefront edits to copied files are never
  overwritten silently; keep that behaviour.
- Published to the public npm registry under `@magnetoitsolutionsllc`, under the
  Magneto IT Solutions EULA (LICENSE.txt), as eds-pinterest-tracking is. npm tokens never
  enter git.

## 10. Writing

- Comments explain *why*, not *what*. A non-obvious decision gets a sentence where it is
  made.
- Shopper-facing copy is short, plain and never alarming: an estimate says it is an
  estimate; a failure says what happens next ("Tax will be calculated at checkout").
- Commit messages are one line and name the Jira ticket, e.g.
  `SCRUM-44: Show the Vertex tax breakdown in the cart summary`.
