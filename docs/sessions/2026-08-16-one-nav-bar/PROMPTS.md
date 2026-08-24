# One nav bar — the prompts, and what was decided at each fork

Session of 2026-08-16, continuing straight on from
[`2026-08-16-modernist-redesign`](../2026-08-16-modernist-redesign/PLAN.md)
(PRs #113–#119, which ended with the rail carrying a week strip and radius at 0
app-wide).

Two branches came out of it:

| Branch | PR | What |
|---|---|---|
| `refactor/one-nav-bar` | #120 | The rail is deleted; navigation is a two-row top bar |
| `feat/header-scroll-collapse` | — | Row 1 folds away on scroll; `TopBar` split into modules |

The plan for the second is [`PLAN.md`](./PLAN.md).

---

## Prompt 1 — the opening question

> lets have only one top nav bar what do you thibnkg in all the pags

A question, not an instruction, so it got an answer before it got a branch.

**What was found.** Three chrome layers stood between the viewport and the page:
the rail (`Sidebar.tsx`, 220 lines), `TopBar`, and a detached `SectionTabs` row.
On a phone, three again — top bar, tab row, `BottomNav` — plus a drawer holding
a fourth copy of the same five destinations.

**The answer given.** Yes, delete the rail — but *"one bar" cannot literally be
one row*. Five sections × up to seven tabs is 22 destinations; folding the tabs
into per-section dropdowns puts Body's seven surfaces behind a menu, which is
worse than the rail. The honest target is **one header block, two rows**.

Two costs were named up front rather than discovered later:

1. `WeekStrip` had gone into the rail one commit earlier and would have nowhere
   to live. A vertical week does not fit a header row.
2. The breadcrumb becomes the third statement of the same fact.

## Fork 1 — what happens to `layout: 'classic'`

Raised before writing any code, because it changed the whole diff.
`settings.layout` was **two decisions wearing one key**: it picked the nav
(five-section rail vs. seventeen-destination grouped rail) *and* it picked Today
(`TodayFocused` vs `TodayClassic`). The classic rail cannot become a horizontal
bar, so the key could not survive untouched.

Three options were put; **"retire classic nav, keep classic Today"** was chosen.

The key and its values are unchanged, so nobody's saved preference flips — it
now selects only which Today renders, which was always the half of it that was
a real choice. Settings relabelled to "Today layout".

> **The general shape, worth keeping:** a settings key that controls two things
> is a key that cannot be changed. Read every consumer of a flag before you
> assume you know what it means.

## What shipped in #120

```
row 1  bujo ▪  Today  Plan  Body  Mind  Insights  ·  week ·  + Quick add  ⓤ  ⋯
row 2  Fitness  Strength  Pickleball  Coaching  Nutrition  Recovery   ‹ Aug 2026 ›
```

Net **−303 lines**. Deleted: `Sidebar.tsx`, `classicNav.ts` + its test, the
mobile drawer and scrim, `sidebarCollapsed`, `sidebarAutoHide`, the breadcrumb,
and `BottomNav`'s `PRIMARY` list. Moved: `WeekStrip` into row 1 (compact,
`hidden lg:flex`), `AccountMenu` out of the rail footer.

**The `<h1>` goes `sr-only` whenever the tab row renders.** The heading still
exists for a screen reader and for the document outline; it just stops being
drawn when the `aria-current` tab already names the page.

### Measured, not assumed

The one thing eyeballing missed: the first tab's label sat at x=28 and the page
title at x=16 — a 12px step between the two rows that only appears when you flip
between a tabbed page and an untabbed one. `-ml-3` on the tabs nav cancels the
first tab's own `px-3`. That class exists because of a measurement, and its
comment says so.

Also confirmed by query rather than by screenshot: header 99.33px with
`--header-h` matching exactly, and `document.scrollWidth === clientWidth` (no
horizontal overflow) at both 1440 and 390.

---

## Prompt 2 — the animation

> add animation and hide the top nav bar some one its content if need for
> scrool efferct adn maks sure the cod emocualrised in nature think and slvo
> htis

Two asks: a scroll effect that hides *part* of the header's content, and
modularisation (`TopBar.tsx` had reached ~300 lines, the repo's stated ceiling).

## Fork 2 — what actually moves on scroll

Three options were put. **"Row 1 hides, tabs stay"** was chosen, at **both
widths**.

Scrolling down folds row 1 away; the tab row and date nav ride to the viewport
top and stay pinned, so "where am I" and "switch tab" never leave the screen.
Phones included — the header is proportionally more of a 844px viewport, and
`BottomNav` already hides on scroll, so the two bars move in sympathy.

## The finding that picked the technique

Exploration turned up the constraint that decides the whole implementation, and
it is not obvious from reading `TopBar.tsx`:

`useHeaderHeight` publishes `.app-header`'s measured height as `--header-h` via
a `ResizeObserver`, and **three sticky elements park against it** — the
page-contract act column (`styles/layout.css:82`), Mindset's `LibraryBar`, and
Today's mobile `CaptureBar`.

So the obvious implementation is the wrong one:

| Technique | What happens |
|---|---|
| `transform: translateY(-46px)` | Box height stays 99px. `--header-h` goes stale. All three sticky bars park 46px too low and page content scrolls through the gap. |
| **Shrink the real height** | `ResizeObserver` fires per frame, `--header-h` follows, all three glide up in lockstep. No new variable, no consumer changed. |

That is the exact failure `LibraryBar.tsx:6-16` already documents from a
previous handoff ("a hard-coded value leaving a 6px slit that content scrolled
through"). The comment was right, and it was the reason to look.

Implementation follows from it: `grid-template-rows: 1fr → 0fr` on a wrapper,
transitioned with the existing `--dur-base` / `--ease-emphasis` tokens. The grid
trick rather than `height` because row 1's height is content-derived — it grows
with the notch inset and wraps at narrow widths — and `auto` does not
transition.

### Two bugs found on the way, both fixed rather than filed

- `scroll-mt-24` (96px) in `TagPages.tsx` and `CustomCollections.tsx` clears the
  header for `Collections.tsx`'s `scrollIntoView({block:'start'})`. The header
  is 99px, so those jumps **already** land under it. A third hard-coded
  header-height guess, never wired to `--header-h`.
- `BottomNav` hardcodes `duration-300` and carries no `prefers-reduced-motion`
  guard — the one motion site in the app that routes around both the duration
  tokens and the reduce convention.

### What cannot be tested in vitest, and why it is said out loud

`src/test/setup.ts` stubs `ResizeObserver` as a no-op so page-contract views can
render at all. Every callback in this feature is therefore invisible to the
suite. The one piece that *is* reachable — `useHideOnScroll`'s dead-zone and
direction logic — gets a real test; the height behaviour is verified in a
browser against measured values, and the plan says which.

## Fork 3 — slicing

> 12-Week Hypertrophy Block add this the body pages an move its related to the
> speated tab

Arrived mid-turn, a second and unrelated feature. **Two branches, header
first** was chosen: one increment per branch is this repo's rule, and a PR
mixing shell animation with a fitness feature is unreviewable.

The hypertrophy work is scoped at the end of [`PLAN.md`](./PLAN.md) — what
exists (`HYPERTROPHY_PROGRAM` in `lib/programs.ts`, rendered through the shared
`ProgramTracker` with `only="hyper12"`), the four-file checklist for adding a
Body tab, and the two decisions to settle first: Body would reach eight tabs,
and `ProgressPhotos` currently shares the collapsible that would move.

---

## The rules this session kept re-proving

- **Answer the question before opening the branch.** Prompt 1 was "what do you
  think", and the useful output was a recommendation with its two costs named,
  not a diff.
- **Read every consumer of a flag before changing it.** `settings.layout` and
  `--header-h` were both wider than they looked.
- **Measure the rendered marks.** The 12px gutter step and the 99px vs 96px
  scroll-margin were both invisible to reading the code and obvious to querying
  the page.
- **A found bug gets fixed or filed, never left.** Two were found; both are in
  the plan as fixes, and both are named in the PR.
