# `topbar/` — the header's controls

One control per file, composed by `shell/TopBar.tsx`. The header is the whole of
navigation on desktop since the rail was deleted (PR #120), so this directory is
where nav changes land.

| Change | File |
|---|---|
| The fold on scroll — timing, what collapses, the focus-within reopen | `HeaderRail.tsx` + `.header-rail` in `src/index.css` |
| *When* it folds — the scroll rule shared with `BottomNav` | `../useHideOnScroll.ts` |
| The five section links, active treatment, where a section click lands | `SectionNav.tsx` |
| ‹ date › stepper and the year-wise jump popover | `DateNav.tsx` (popover markup: `../DateJumpPicker.tsx`, its only caller) |
| The ⓘ blurb and the data-driven suggestions | `HelpMenu.tsx` |
| ⌘K, theme, zoom, undo/redo, paper/handwriting/book | `OverflowMenu.tsx` |
| Row order, brand, tabs-or-title, what row 2 holds | `../TopBar.tsx` |
| The tab row itself | `../SectionTabs.tsx` |
| Which sections exist and which tabs they hold | `../sections.ts` |
| A page's title, subtitle, help blurb, date cursor | `../viewChrome.ts` |

## Decisions worth keeping

- **The fold changes real height, never `transform`.** `useHeaderHeight`
  publishes `--header-h` off `.app-header`'s measured box and three sticky bars
  park against it — the page contract's act column, Mindset's `LibraryBar`,
  Today's mobile `CaptureBar`. A transform leaves the measured height full while
  half the header is off screen, dropping all three ~46px low with a slit for
  content to scroll through. Shrinking the box drags them along for free. This
  is the constraint that picked the whole implementation; do not "optimise" it
  into a transform.
- **Row 2 never folds.** Losing "which tab am I on" is the one thing a scrolled
  header must not do, so only row 1 collapses.
- **`SectionNav` is `hidden … md:flex`.** `BottomNav` carries the same five
  sections within thumb reach on a phone; two copies on a 390px bar is one too
  many, and the bottom one is the reachable one.
- **`HelpMenu` returns `null`** when the view has no blurb and the journal has
  no suggestions, rather than rendering a dead button.
- **Nothing here holds a hard-coded header height.** Three places in the app
  once did (`scroll-mt-24`, and two `top` fallbacks); all now read `--header-h`.
  If a new surface needs to clear the header, read the variable.
