# 11 · Pages UI/UX polish

**Branch:** `feat/pages-ui-polish` · **Date:** 2026-08-02 · **Base:** `main` @ `922646e`

Everything here was found by driving the running app in Chrome, not by reading
the code. The method matters, because the two biggest findings are invisible in
source: a view that *looks* like it has section headings, and a transition that
only some pages have.

> **How to re-measure.** Click the real nav buttons. This router ignores
> `popstate`, so a URL-driven sweep silently re-measures whichever view is
> already mounted — the trap that invalidated the earlier "24 views × 5 themes"
> pass (see `TASKS.md`).

---

## What shipped

| # | Change | Before | After |
|---|---|---|---|
| 1 | Settings' duplicate page title removed | 2 `<h1>` per page | 1 (top bar only) |
| 2 | Settings tab pills sized to their text | 5 × 209px | 96–151px |
| 3 | Plan, Collections, Reading, Insights on the `Page` shell | no `.page-enter`, gaps 4/5/6 | `.page-enter`, 20px |
| 4 | Section headers are real headings | Reading 0 `<h2>` in `<main>` | 7 |
| 5 | Four `QuietSection` copies deleted | 4 implementations | 1 |

Final sweep, all 18 nav views: **0 `<h1>` inside `<main>`**, **every view ≥ 2
`<h2>`**, **0 horizontal overflow** at 390px and 1440px.

---

## 1 · Settings had two titles

The top bar renders the page title for every view from `VIEW_CHROME`. Settings
*also* rendered its own designed header — icon chip, `<h1>Settings</h1>`, and a
subtitle that paraphrased the top bar's own subtitle:

> Settings · Theme, profile, data      ← top bar
> Settings · Profile, appearance, reminders, and your data.   ← 110px lower

Two `<h1>`s in one document, and Settings was the only view in the app that put
any heading at that level inside `<main>`. Removed; the tab bar is now the first
thing under the top bar, and the page starts 110px higher.

## 2 · The tab pills were a segmented control that wasn't one

Every Settings tab measured exactly 209px. `TabsTrigger` (vendored shadcn) ships
`flex-1`, which stretches each trigger to fill the list — invisible at narrow
widths, obvious on the `wide` tier. `flex-none` at the call site wins through
tailwind-merge without touching the vendored file.

## 3 · Six views were not on the page shell

`Page` supplies three things: the container tier (`read` 820px / `wide` 1180px),
the `.page-enter` entrance transition, and `gap-4 sm:gap-5`. Six views hand-rolled
their own container instead and so had none of them:

| View | Was | Now |
|---|---|---|
| Plan | `mx-auto max-w-wide columns-1 …` | `Page width="wide"` wrapping the masonry |
| Collections | `mx-auto flex max-w-wide flex-col gap-5` | `Page width="wide"` |
| Reading | `mx-auto max-w-read space-y-6` | `Page` (read tier) |
| Insights | `mx-auto max-w-wide space-y-5` | `Page width="wide"` |
| Recovery | `mx-auto max-w-read space-y-5` | **not done** — see Deferred |
| Stats | hand-rolled | **not done** — see Deferred |

The user-visible symptom: navigating into these views *snapped* while the twelve
views on the shell faded in. It reads as a rendering bug, not a design choice.

Plan keeps its CSS multi-column masonry — that two-stack layout is the view's
whole point. `Page` wraps it and contributes only tier, transition and rhythm.

## 4 · Headings that only looked like headings

Reading rendered **zero** headings inside `<main>`; every other view rendered
between 2 and 12 (`TASKS.md` B5). The cause was not in Reading:

`CollapsibleSection` styles its title `font-display text-heading font-medium`
and then puts it in a `<span>`. It looks exactly like a section heading and
exposes nothing to assistive tech. Reading is simply the view where *all three*
sections are collapsible, so it hit zero while others only lost some.

Fixed in the shared component — heading wraps button, the WAI-ARIA accordion
pattern. Preflight zeroes the `h2`'s margin and font-size, so nothing moves.
Trackers, Focus, Fitness, Gym and Recovery gained their headings for free.

Reading's own headers were wrong too: the three shelves and "Stalled books" were
`<h3>` with no `<h2>` above them anywhere, so the outline jumped from the top
bar's `h1` straight to `h3`. They are top-level sections of the page, so they
are `h2` now, and each shelf is a `<section>`.

## 5 · One component, four implementations

`QuietSection` existed and was correct. Three views had hand-copied its markup
verbatim — same wrapper, same chevron span, same button classes, same title and
subtitle spans — and Insights kept a fourth copy as a local `Section` component:

- `Collections` → "People", "Auto-pages"
- `Plan` → "Setup"
- `Insights` → local `function Section()`, 22 lines, six call sites

All four had drifted: none grew the "SHOW" affordance the real component shows
when collapsed, and none would have become headings under the fix above.

**Auto-pages was hand-rolled for a real reason.** `jumpToTag` has to expand it
from outside before scrolling to the tag inside it, and `QuietSection` owned its
open state privately. Instead of leaving the copy in place, `CollapsibleSection`
now accepts optional `open` / `onOpenChange` and runs controlled when both are
passed. Five lines, the standard pattern, and the only thing that stood between
that call site and the shared component.

---

## Checked and dismissed

Do not spend a PR on these — they were measured and are fine:

- **Switch labelling.** `<label><span>text</span><Switch/></label>` looks broken
  to a naive scan but isn't: `button` is a labelable element, so the label both
  names it (the a11y tree reads `switch "Cycle / fertility tracker"`) and toggles
  it on click. Verified both.
- **The Trackers grid on mobile.** It sits in an `overflow-x-auto` container —
  873px of table scrolling inside a 390px viewport. Not clipped.
- **Sub-24px buttons on Trackers (260) and Today (35).** Heatmap and grid cells,
  deliberately dense. The genuinely too-small target is the card ⓘ (14×14),
  which is deferred below.

## Deferred, with reasons

| Item | Why not now |
|---|---|
| Recovery + Stats onto `Page` | Both files are being edited in a parallel session |
| Card ⓘ: name from title, pad to 24px | Lives in `src/components/ui.tsx`, same |
| Settings panel width | Three tabs are `max-w-2xl` inside the `wide` tier, so ~400px sits empty. A layout decision, not a defect |

The ⓘ finding is worth keeping: `ui.tsx:77` gives every titled card an ⓘ named
`"What is this?"`, so **Today alone exposes 34 identically-named buttons** to a
screen reader, and the box is 14×14 against the WCAG 2.5.8 24px floor. One file,
app-wide reach.

---

## Verification

| Check | Command | Result |
|---|---|---|
| Typecheck | `npx tsc -b` | ✅ exit 0 |
| Tests | `npx vitest run` | ✅ 41 files, 678 tests |
| Lint | `npx eslint .` | ✅ 0 errors, 2 pre-existing warnings |
| Build | `npm run build` | ✅ 417ms, PWA precache 62 entries |
| Live sweep | 18 views, clicked nav | ✅ 0 `h1` in `main`, all ≥2 `h2`, 0 overflow |
