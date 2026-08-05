# The fold — collapse, disclosure and the caret

Every place in this app where content hides behind a header. One page, because
the app had **four** implementations of the same section and two different
answers to "what does clicking the title do", and nobody could see that from
inside any one file.

State: **done**, branch `feat/collapsible-header-ux` (2026-08-03). Numbers below
are counted from the tree, not estimated.

## Decisions (settled)

**The whole header folds, not just the caret.** An 18px chevron is a
miss-prone target on touch, and a header that *looks* like one control but
responds in one corner reads as broken. Clicking anywhere in the header
toggles.

**The caret stays a real `<button>`.** It carries `aria-expanded`, and it is
what a screen reader or keyboard user operates. The header click is a pointer
convenience layered on top — not a replacement, and not a `role="button"` div.

**Anything interactive in a card's `right` slot must not bubble.** "Mark all",
segmented controls and enlarge buttons live in the header; without a
`stopPropagation` wrapper, using them would collapse the card mid-click. The
cost is that a *non*-interactive `right` (a `Pill`) reads as a dead spot in an
otherwise clickable header. Accepted — collapsing the card when someone reaches
for a control in it is worse.

**A card that already owns a click keeps the caret-only target.** Two meanings
for one click is worse than a small target.

**One caret, rotated — never two glyphs swapped.** A swap is a cut; a rotation
is a state change you can see happen. This holds for the icon carets *and* for
the typographic marks (`▸ ▾ ▴`), which stay typographic — that glyph column is
deliberately outside `Icon` (see `src/components/Icon.tsx`).

**Open animates, close does not.** The body is unmounted while closed, and the
collapsed-by-default cards carry real weight (Coaching's drill library, Gym's
exercise database). Keeping that mounted just to animate a close is not worth
it. Everything opts out under `prefers-reduced-motion`.

**A fold has to earn itself.** It pays when the content is long or rarely
wanted. Plan's Setup was neither — two short cards that are the reason you
opened the page — so it is a plain titled section now, not a fold.

## The two primitives

Everything routes through one of these. There is no third.

| Primitive | Where | Look | Use for |
|---|---|---|---|
| `Card collapsible` | `src/components/ui.tsx` | Card header, caret right | A single card that compacts |
| `CollapsibleSection` | `src/components/CollapsibleSection.tsx` | `card`: header on its own card surface · `quiet`: bare caret + label | A *group* of cards |

`QuietSection` is `CollapsibleSection variant="quiet"` under its own name, so
call sites read clearly.

Both take optional controlled `open` / `onOpenChange`. Reach for it only when
something outside the fold has to drive it:

- `PenaltyCard` swaps its own subtitle based on open state.
- `Gym` seeds "Today's session" from viewport width.
- `Collections` opens Auto-pages before scrolling to a tag page.

Omit both and the component owns its state. `CollapsibleSection` also has
`stickyKey`, which persists open/closed across reloads — opt-in, because a
section that is deliberately closed every visit should not silently start
staying open.

## The CSS

Three utilities in `src/index.css`, built on the existing motion tokens — no new
durations or curves were introduced.

| Class | Does |
|---|---|
| `.collapse-in` | Body enter: fade + 6px slide, `--dur-fast` / `--ease-rise` |
| `.caret-turn` | Rotates 180° when `data-open="true"`, `--dur-base` / `--ease-emphasis` |
| `.caret-turn-quarter` | Modifier: 90° instead, for the `▸` disclosure look |

Usage is always `<span className="caret-turn" data-open={open}>`. The attribute
drives it, not a conditional class, so the transition has something to animate
between.

Do **not** put a Tailwind `transition-*` utility on the same element.
`.caret-turn` is unlayered CSS and wins over `@layer utilities`, so the Tailwind
transition silently does nothing.

## Inventory

**42** `Card collapsible` call sites across 15 files, and **30**
`CollapsibleSection` / `QuietSection` call sites. Both get header-click, caret
rotation and the open animation for free.

Nine folds are inline — genuinely part of a card or row, not a section — and
carry the utilities directly:

| Fold | File | Body animates |
|---|---|---|
| Aging bar | `views/Plan.tsx` | yes |
| Calendar grid | `views/Challenges.tsx` | yes |
| Add-a-habit form | `views/Trackers.tsx` | yes |
| Category rows | `views/Trackers.tsx` | **no** — body is `<tr>`s |
| Week rows | `views/Coaching.tsx` | yes |
| Technique rows | `views/Coaching.tsx` | yes |
| Workout history | `views/HomeWorkout.tsx` | yes |
| Workout formats | `views/Pullups.tsx` | yes |
| Notes toggle | `views/Reading.tsx` | pre-existing rotation |

Trackers' category rows are the one deliberate gap: their body is a run of
`<tr>`s, which cannot be wrapped in an animating element without breaking the
table grid. The caret still turns.

## What was deleted

Four implementations became two.

- `src/components/pickleball/Section.tsx` — copy three. Same full-width button,
  same classes, same state shape as `QuietSection`. Its four call sites moved to
  `CollapsibleSection`.
- `Disclosure` in `src/views/Settings.tsx` — copy four. Five call sites moved to
  `QuietSection`.
- Five more inline section folds (Challenges archived, Collections People +
  Auto-pages, Monthly analytics, Plan Setup) each open-coded the same markup and
  their own `useState`. All moved to `QuietSection`, ~15 lines lighter each.

A fifth private copy had already been deleted from Insights (F1, PR #90).

## Two traps this pass hit

**`npm run a11y` cannot see inside a closed fold.** Unhiding Plan's Setup
surfaced a *critical* `select-name` violation that had been shipping the whole
time — neither `<select>` in the recurring-rule form had an accessible name, and
axe had never scanned them because the section was collapsed. Assume every gate
result is conditional on what was open when it ran.

**`vite preview` serves a stale bundle through its service worker.** Twice this
session a screenshot showed pre-change markup against a freshly built `dist/`.
Unregister before believing what you see:

```js
navigator.serviceWorker.getRegistrations().then(r => r.forEach(x => x.unregister()))
caches.keys().then(k => k.forEach(c => caches.delete(c)))
```

## Adding a fold

1. Reach for `Card collapsible` or `CollapsibleSection` first. If neither fits,
   say why in a comment — that is how the app got to four copies.
2. Caret is a `<button>` with `aria-expanded`. Header click is extra.
3. Rotate one glyph with `.caret-turn`; never swap two.
4. Wrap the body in `.collapse-in` unless it is table rows.
5. Ask whether it should fold at all. Two short cards do not need a fold.
6. Re-run `npm run a11y` **with the fold open** — the gate cannot check what it
   cannot see.

**Read next:** `docs/ICON-BUTTON-SYSTEM.md` (the icon/button pass this grew out
of) · `docs/ACCESSIBILITY.md` (the rules) · `docs/DECISIONS.md` D-42/43/44.
