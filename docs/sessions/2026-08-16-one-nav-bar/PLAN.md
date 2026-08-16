# Header scroll-collapse + TopBar modularisation

> The plan as approved, before any code. The prompts that produced it and the
> reasoning at each fork are in [`PROMPTS.md`](./PROMPTS.md).

## Context

PR #120 replaced the left rail with a two-row top bar. It works, but it costs
99px of vertical space on every page, at every scroll position, and it is now
the single largest fixed chrome in the app. On a phone that is ~12% of the
viewport permanently spent on navigation you already used.

The ask: animate the header so it gives that space back while scrolling, hiding
only the part you are not using, and split `TopBar.tsx` (~300 lines, at the
repo's file-size ceiling) into modules.

Decided with the user:

- **Row 1 collapses** (brand, sections, week, Quick add, account, overflow).
  **Row 2 stays** — the tab row and date nav ride up to the viewport top and
  remain pinned, so "where am I" and "switch tab" never leave.
- **Both widths.** Phones benefit most, and `BottomNav` already hides on scroll,
  so the two bars move in sympathy.

## The constraint that picks the technique

`useHeaderHeight` (`src/components/shell/useHeaderHeight.ts:23`) publishes
`.app-header`'s measured `getBoundingClientRect().height` as `--header-h`, via a
`ResizeObserver`. Three sticky elements park against it:

| Consumer | Offset |
|---|---|
| `src/styles/layout.css:82` — page-contract act column | `top: calc(var(--header-h, 3.5rem) + 1rem)` |
| `src/components/mindset/LibraryBar.tsx:35` | `sticky top-[var(--header-h)]` |
| `src/views/today/cards.tsx:130` — Today's CaptureBar (mobile) | `sticky top-[var(--header-h,3.25rem)]` |

So: **collapse row 1 by changing its real box height, never by `transform`.**
A transform leaves `getBoundingClientRect().height` at 99px, `--header-h` goes
stale, and all three park 46px too low — a gap that page content scrolls
through. That is the exact failure `LibraryBar.tsx:6-16` already documents.
Shrinking the real height makes the `ResizeObserver` fire per frame and drags
all three up in lockstep, with no new variable and no change to any consumer.

## Implementation

### 1. Extract the scroll hook — `src/components/shell/useHideOnScroll.ts` (new)

`useHideOnScroll` currently lives unexported inside `BottomNav.tsx:8-22`. Lift
it verbatim (8px dead zone, `y > last && y > 64`, `{ passive: true }`) into its
own shell file, add a `threshold` argument defaulting to today's 64, and import
it from both bars. Genuine dedupe — two bars, one rule for "the user is reading,
not navigating".

Leave a sibling `useHideOnScroll.test.ts`: dispatch scroll events against a
stubbed `window.scrollY` and assert the dead zone and the down/up flip. This is
the only piece of the feature vitest can reach — `src/test/setup.ts:9-15` stubs
`ResizeObserver` as a no-op, so nothing height-driven is testable there.

### 2. The collapsing row — `src/components/shell/topbar/HeaderRail.tsx` (new)

Wraps row 1. Takes `collapsed: boolean`, renders
`<div className="header-rail" data-collapsed={collapsed}><div>{children}</div></div>`.

CSS in `src/index.css`, beside the other named motion classes (~line 447, after
`.collapse-in`), using the existing tokens from `index.css:208-215` — no new
easing, no new duration:

```css
/* The header's first row folds away while you read. Height, not transform:
   `useHeaderHeight` republishes --header-h off this element's real box, and
   three sticky bars park against it. */
.header-rail { display: grid; grid-template-rows: 1fr; transition: grid-template-rows var(--dur-base) var(--ease-emphasis); }
.header-rail > * { overflow: hidden; opacity: 1; transition: opacity var(--dur-fast) var(--ease-rise); }
.header-rail[data-collapsed='true'] { grid-template-rows: 0fr; }
.header-rail[data-collapsed='true'] > * { opacity: 0; }
/* Tabbing into a folded row must open it — otherwise focus lands on a control
   with zero height. */
.header-rail[data-collapsed='true']:focus-within { grid-template-rows: 1fr; }
.header-rail[data-collapsed='true']:focus-within > * { opacity: 1; }
@media (prefers-reduced-motion: reduce) {
  .header-rail, .header-rail > * { transition: none; }
}
```

The `0fr`/`1fr` grid trick rather than `height`, because row 1's height is
content-derived (it grows with the notch inset and wraps at narrow widths) and
`auto` does not transition.

### 3. Split `TopBar.tsx` into `src/components/shell/topbar/`

Pure moves — no behaviour change, so the diff is reviewable against the
rendered page.

| New file | Owns |
|---|---|
| `topbar/HeaderRail.tsx` | the fold (above) |
| `topbar/SectionNav.tsx` | the five `SECTIONS` links, active rule, `landingOf` targets |
| `topbar/DateNav.tsx` | ‹ › stepper, the label button, `DateJumpPicker` wiring |
| `topbar/HelpMenu.tsx` | the ⓘ dropdown — `chrome.help` + `recommendations()` |
| `topbar/OverflowMenu.tsx` | the ⋯ menu — palette, theme, zoom, undo/redo, paper/handwriting/book |
| `topbar/README.md` | change → file table (repo rule for any dir past ~4 files) |

`TopBar.tsx` keeps `Brand` (12 lines, one concern, used nowhere else), the
`hasTabs` decision, and composition — lands ~80 lines. `WeekStrip.tsx`,
`AccountMenu.tsx`, `SectionTabs.tsx` and `DateJumpPicker.tsx` stay put; the
README records that `DateJumpPicker` is `DateNav`'s alone.

The README follows the house format already used by `src/components/focus/`,
`mindset/`, `collections/`, `reading/` and `mod/`: title, one line saying who
composes these, a `Change | File` table, then "Decisions worth keeping".
`src/components/shell/` itself has 15 files and no README — a pre-existing gap;
note it in `STATUS.md` rather than widening this branch to fix it.

### 4. Fix the two hard-coded header clearances found on the way

Out of the ask's scope but on its exact contract, and already wrong today —
CLAUDE.md says fix or file, so: fix.

- `src/components/collections/TagPages.tsx:27` and
  `src/components/collections/CustomCollections.tsx:43` use `scroll-mt-24`
  (96px) to clear the header for `Collections.tsx:35`'s
  `scrollIntoView({block:'start'})`. The header is 99px, so those jumps already
  land 3px under it. Replace with `scroll-mt-[calc(var(--header-h)+1rem)]`.
- `BottomNav.tsx:52` hardcodes `duration-300` and has no reduced-motion guard —
  the one motion site in the app that skips both. Give it the same token-driven
  class treatment while the file is open.

`PageLayout.tsx:53`'s `window.innerHeight - 64` slack stays as-is: the collapsed
header is ~53px, so 64 remains conservative in the direction that is safe.

## Trade-offs, stated not hidden

Quick add and the account menu ride up with row 1. Mitigations, both free: the
existing `n` hotkey (`AppShell.tsx:57`) opens Quick add from anywhere, and
`:focus-within` reopens the rail for keyboard users. One wheel notch up brings
it back for everyone else.

## Verification

Gates: `npx tsc -b`, `npx vitest run`, `npx eslint .`, `npm run build`,
`npm run a11y` — all must match the current baseline (769 tests, 0 eslint
errors, 0 serious/critical a11y).

In the browser (`npm run dev`, fresh port — other worktrees hold 4173/5174):

1. **The contract holds.** On Mindset (`?view=mindset`, has `LibraryBar`) scroll
   down, then read `getComputedStyle(document.documentElement).getPropertyValue('--header-h')`
   and `document.querySelector('[class*=sticky]').getBoundingClientRect().top`.
   The bar's top must equal the header's rendered bottom at rest **and** while
   collapsed — no slit, at either state.
2. Same check on a page-contract page with a sticky act column, and on Today at
   390px (the mobile CaptureBar).
3. **No observer loop.** Console must be clean of "ResizeObserver loop
   completed with undelivered notifications" through repeated scroll. (No loop
   is expected — nothing sizing the header reads `--header-h` — but a per-frame
   write from inside a `ResizeObserver` callback is exactly the shape that
   produces one, so check rather than reason.)
4. **No blur jank.** The header carries `backdrop-blur` and is `sticky`;
   animating a grid track on a blurred sticky layer is a known Chrome
   soft-spot. Watch a `performance_start_trace` over one collapse and confirm no
   dropped frames. If it janks, the fallback is to drop `backdrop-blur` for the
   duration of the transition, not to switch to `transform`.
5. **Row 2 never leaves.** Scrolled to the bottom of Body → Nutrition, the tab
   row is still at the viewport top with Nutrition marked.
6. **Keyboard.** Scroll down, press Tab into the header — the rail must reopen
   before focus lands.
7. **Reduced motion.** With `prefers-reduced-motion: reduce` emulated, the fold
   snaps and does not animate.
8. Screenshot at 1440 and 390, at rest and scrolled.

## Shipping

Branch `feat/header-scroll-collapse` off `refactor/one-nav-bar` (this work
builds on PR #120, so it stacks rather than branching from main). Two commits —
the modularisation move, then the animation — so the pure-move diff can be read
separately. PR against `refactor/one-nav-bar`.

---

## Next branch (not this one) — the 12-Week Hypertrophy Block as a Body tab

Requested mid-session; you chose to ship it separately, after the header. Not
planned in detail here — recorded so the next session starts from fact.

**What exists.** `HYPERTROPHY_PROGRAM` (`src/lib/programs.ts:65-105`,
`id: 'hyper12'`, `name: '12-Week Hypertrophy Block'`) — three phase entries of
four weeks each, six days a week, hand-written data-as-code. It renders through
the shared `src/components/ProgramTracker.tsx` (130 lines), whose `only` prop
already exists to pin the tracker to one program — `Pullups.tsx:26` uses
`only="pullup-zero"`, `Gym.tsx:511` uses `only="hyper12"`. Progress persists as
`settings.programDone` / `settings.programActuals`.

**What moves.** Exactly one block: the "Program & progress" `CollapsibleSection`
at `Gym.tsx:505-513`, ~8 lines of 709. The other ~695 lines of Gym (session
logger, body-weight chart, three analytics sections, the whole aside rail) stay.

**Adding the tab** is four files: `viewChrome.ts` (the `ViewId` union + a
`VIEW_CHROME` entry — both exhaustive `Record`s, so a miss is a compile error,
not a silent one), `sections.ts` (a tab in the `body` section — `MEMBERS`,
`tabsOf`, `landingOf` and the command palette all derive from it), `App.tsx`
(a `lazy()` import + the `VIEWS` entry), and the new `src/views/` file.

**Two decisions to make first, both real:**

1. **Body would go to eight tabs.** It already scrolls horizontally on a phone
   at six, and `SectionTabs` centre-scrolling exists precisely because of that.
   Eight may be the point at which Body needs splitting rather than extending.
2. **`ProgressPhotos` shares that collapsible** with the tracker and is not
   program data. Decide whether it follows to the new tab or stays in Gym —
   moving it silently would be the "extracted a duplicate and changed the
   content" failure the global standards warn about.

Also worth knowing: `TodayPlanCard.tsx:40-49` hardcodes `pullup-zero` when it
computes program progress, so the hypertrophy block does not reach Today's chip
today. `demo.ts` seeds no program progress at all, so any verification starts
from an empty tracker.
