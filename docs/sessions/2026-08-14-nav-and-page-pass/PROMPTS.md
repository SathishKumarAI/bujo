# Prompts

Each fix written as a self-contained prompt **before** the code — file path, exact
change, and the check that decides whether it worked. The step exists because if
you cannot name the file the prompt edits, the diagnosis is not finished.

---

## 1 · Restore Strength and Pickleball to the classic rail

> In `src/App.tsx`, the `NAV` list is the classic rail's destinations. It has no
> `gym` and no `pickleball` row, and classic renders no section tab row
> (`sectionTabs={focused}`), so both views are unreachable in that layout.
>
> 1. Move `NAV` and `GROUP_ORDER` to a new `src/components/shell/classicNav.ts` as
>    `CLASSIC_NAV` / `CLASSIC_GROUP_ORDER`. Reason: they must be importable without
>    dragging the whole app into a test.
> 2. Add `{ id: 'gym', label: 'Strength', icon: Barbell, group: 'Body' }` and
>    `{ id: 'pickleball', label: 'Pickleball', icon: Trophy, group: 'Body' }` after
>    `fitness`. Labels must match the focused rail's tab labels.
> 3. Delete the `help` and `settings` rows — `group: 'System'` is not in the group
>    order, so `Sidebar` has always filtered them out. Confirm first that Help is
>    reachable elsewhere before deleting it.
> 4. Add `classicNav.test.ts` asserting (a) every view in `SECTIONS` appears in
>    `CLASSIC_NAV`, (b) no item has a group absent from the order, (c) gating drops
>    exactly two rows, (d) no duplicate ids.
>
> **Check:** the test fails when the `gym` row is removed again, then passes when
> restored. In the browser on `layout: 'classic'`, read the rail rows from the DOM
> and confirm Strength and Pickleball sit between Fitness and Nutrition.

## 2 · Scroll the current section tab into view

> `src/components/shell/SectionTabs.tsx`. The row is `overflow-x-auto` and opens at
> `scrollLeft: 0`, so landing on a later tab leaves the active one clipped.
>
> Add a `useEffect` keyed on `[view, gates.cycle, gates.nofap]` that scrolls the
> active anchor into the middle of the row. Hooks go **above** the two early
> returns. Set `row.scrollLeft` directly rather than calling `scrollIntoView`,
> which walks every scrollable ancestor and would scroll the page past its header.
>
> **Check:** `?view=nofap` at ≤501px — `scrollLeft` non-zero, active tab's rect
> inside the row's rect, and `window.scrollY` still 0. `?view=fitness` leaves
> `scrollLeft` at 0.

*(Revised twice during the fix: `offsetLeft` measured against `<body>` because the
row is not positioned, and the first run fired before the fonts resolved. Final
version is rect-based and re-runs on `document.fonts.ready`.)*

## 3 · Stop drawing an ⓘ that repeats the subtitle

> `src/components/ui.tsx`, the `Card` header. `const info = hideInfo ? null : (help
> ?? subtitle)` gives every titled card with a subtitle an info popover whose
> contents are the sentence rendered directly below the title.
>
> Do **not** delete the fallback: the subtitle is `hidden … sm:block`, so on a
> phone the popover is the only way to read it. Instead add
> `infoOnlyRepeatsSubtitle = help === undefined && !!subtitle` and put `sm:hidden`
> on the trigger when it is true.
>
> **Check:** Insights at 1440 → 0 visible; at 390 → all 17 visible. Coaching at
> 1440 → 8 visible, because those pass real `help`.

## 4 · Make the bar charts draw bars

> Six charts render every bar at 0px: `views/Insights.tsx` (2),
> `components/trackers/TrackerVisuals.tsx` (2), `views/Reading.tsx`,
> `views/Trackers.tsx`.
>
> Each is a fixed-height row carrying `items-end`. Cross-axis `end` sizes each
> column to its content, so the `flex-1` bar track inside gets 0 height and the
> bar's percentage has nothing to resolve against. Change the **row** to
> `items-stretch`. Do not touch the track's own `items-end` — that is what
> baselines the bars.
>
> Confirm the hypothesis on a live node before editing: set `alignItems: 'stretch'`
> on one row and re-measure the column, the track and the bar.
>
> **Check:** on Trackers, Insights and Reading, count tracks whose height is 0.
> Expect 0, except where the underlying value is genuinely 0.

## 5 · Insights masonry should measure its container

> `src/components/shell/CardGrid.tsx`. `MASONRY` uses `md:columns-2`, a viewport
> query, but Insights lays its sections two-up so the masonry lives in a 446px
> column and still splits into two.
>
> Switch to `@container` + `@3xl:columns-2 @7xl:columns-3`. The marker and the
> `@`-variants cannot share an element, so `MasonryGrid` must render a wrapper —
> which means deleting the `MASONRY` class-string export and migrating the three
> raw uses in `Insights.tsx` to the component. Let TypeScript find them.
>
> **Check:** Tailwind v4 emits nothing for an unknown utility and exits 0, so read
> computed values, not classes: `containerType === 'inline-size'` on the wrappers,
> `columnCount === 1` on the 446px pair, `2` on the 912px one, and Mindset
> unchanged at 2 × 446px.

## 6 · The week strip should show tasks, not prefixes

> `src/views/Plan.tsx`, the `WeekAgenda` cell list (~line 477). Entries are
> `truncate`d to about eighteen characters at this column width.
>
> Use `line-clamp-2`. The rule is already stated in the `Card` header: wraps, never
> truncates. The cell stays bounded by the existing four-item + "+n more" cap.
>
> **Check:** count `li` elements in the strip where `scrollHeight > clientHeight`.
> Expect 0, and confirm a known-long title ("Get camp new food") reads in full.
