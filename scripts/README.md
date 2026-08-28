# scripts

## What am I looking for?

| I want to… | Run | File |
|---|---|---|
| Check accessibility (**the gate**) | `npm run a11y` | `a11y-axe.mjs` |
| Check a11y **inside folds a change closed** | `node scripts/verify-folds.mjs <view>` | `verify-folds.mjs` |
| Check every view still renders | `npm run smoke` | `smoke-views.mjs` |
| Check nothing is visually clipped | `npm run clipped` | `clipped-text.mjs` |
| Check design-token discipline | `npm run design` | `check-design-system.mjs` |
| See how tall / folded every page is | `node scripts/page-census.mjs` | `page-census.mjs` |
| Find an AA-passing value for an accent | `node scripts/solve-contrast.mjs` | `solve-contrast.mjs` |
| Regenerate the icon set | `npm run icons` | `build-icons.mjs` |
| Regenerate doc screenshots | `npm run shots` | `capture-screenshots.mjs` |
| Find unreferenced files | `node scripts/archive-orphans.mjs` | `archive-orphans.mjs` |
| Ship a branch | `bash scripts/ship.sh` | `ship.sh` |
| Add a routable view to the gates | *(edit)* | `view-ids.mjs` |

`codemod/` holds one-shot migrations. `verify-pickleball.mjs` is a frozen
per-change verifier from COD-12; `verify-folds.mjs` is its generalised
descendant and is the one to reach for.

## What actually gates CI

Three jobs: **`verify`** and **`a11y`** (`.github/workflows/ci.yml`), and
**`docs-guard`**. `verify` runs typecheck, tests, lint and build; `a11y` runs
`a11y-axe.mjs`.

**`smoke`, `clipped`, `design` and `page-census` are run by hand and gate
nothing.** Worth knowing before quoting one of them as evidence — a check that
CI does not run is a check that goes stale silently, which is how
`smoke-views.mjs` stayed broken on Windows across two sessions.

## Rules these scripts exist to enforce, and how each has lied

Every gate here has, at some point, printed a clean result for something it was
not looking at. That is the failure mode to design against — **a green gate is a
claim about what was scanned, never about the app.**

| Gate | What it could not see | Cost |
|---|---|---|
| `a11y-axe.mjs` | inside a **closed fold** | a `critical` `select-name` shipped for months |
| `a11y-axe.mjs` | a page **not on its `VIEWS` list** | Recovery excluded on a wrong assumption about an opt-in; failed on contrast the moment it was added |
| `a11y-axe.mjs` | a card with **no data to render** | **16** serious violations, hidden for the gate's whole existence, until it was made to seed `?demo=1` |
| `smoke-views.mjs` | anything, on Windows | a hardcoded Linux Chrome path meant it could not launch at all; "environmental, not a regression" carried it across two sessions |
| `page-census.mjs` | every `Card collapsible` toggle | it filtered `[aria-expanded]` on `textContent`, and that button holds a caret glyph with its name in `aria-label`. Coaching read as 14 folds instead of 32 |

Three consequences worth keeping:

1. **Assert the fixture, do not assume it.** `a11y-axe.mjs` exits 1 if the demo
   seed did not land. A gate that silently reverts to an empty journal prints
   the same reassuring zero as a gate that is working.
2. **Read the accessible name, not the text.** This app has two disclosure
   implementations and only `CollapsibleSection` puts words in its button.
3. **New surface ⇒ add it to `view-ids.mjs` and `a11y-axe.mjs`'s `VIEWS`.**
   `viewChrome.test.ts` keeps the first honest; nothing keeps the second honest
   but you.

## Pointing a script at a running app

All the browser-driven scripts default to `http://localhost:4173` (`vite
preview`). Preview ships a **service worker that serves a stale bundle**, so a
screenshot can show pre-change markup against a freshly built `dist/`. Point
them at the dev server instead and the problem does not arise:

```
BUJO_URL=http://localhost:5199 npm run a11y
BUJO_URL=http://localhost:5199 node scripts/page-census.mjs
```

`a11y-axe.mjs` also takes `BUJO_THEMES` and `BUJO_PHONE_THEMES` to narrow a run
while iterating — a full pass is five desktop themes and two phone themes and
takes several minutes.
