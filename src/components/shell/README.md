# `shell/` — the frame every view renders inside

`App.tsx` picks a view; this directory draws everything around it. There is no
router: navigation is a `view` state plus a `?view=` parameter (`lib/deepLink`).

The header's individual controls live one level down in
[`topbar/`](./topbar/README.md) — start there for a nav change.

| Change | File |
|---|---|
| Which sections exist, which tabs they hold, what a gate hides | `sections.ts` |
| A page's title, subtitle, ⓘ help text, whether it has a date cursor | `viewChrome.ts` |
| Page frame, `<main>`, quick-add dialog, global hotkeys | `AppShell.tsx` |
| The two header rows and their order | `TopBar.tsx` (+ `topbar/`) |
| The tab row under the header, and centring the active tab | `SectionTabs.tsx` |
| The phone tab bar | `BottomNav.tsx` |
| When either bar hides on scroll | `useHideOnScroll.ts` |
| Publishing the header's height as `--header-h` | `useHeaderHeight.ts` |
| Column widths, the `read`/`wide` tiers, the optional right rail | `Page.tsx` |
| Responsive card grid inside a page | `CardGrid.tsx` |
| The shared day/month cursor and URL sync | `cursor.tsx` |
| `useNav()` — let a view switch views | `nav.tsx` |
| `useDevice()` — mobile vs desktop, by width *and* pointer | `device.tsx` |
| The week strip and streak in the header | `WeekStrip.tsx` |
| Account status, sign in/out | `AccountMenu.tsx` |
| Year/month jump popover behind the date label | `DateJumpPicker.tsx` |

## Decisions worth keeping

- **There is no rail.** Navigation is `TopBar`'s two rows on desktop and
  `TopBar` + `BottomNav` on phones. Deleting the sidebar also deleted collapse,
  auto-hide, the mobile drawer and its scrim — all of which existed only to win
  back the space the rail was spending.
- **`sections.ts` is the single source of nav truth.** `MEMBERS`, `tabsOf`,
  `landingOf`, both nav bars and the command palette all derive from it. There
  is no second hand-written id list anywhere, and there should not be — the one
  that used to exist (`BottomNav`'s `PRIMARY`) failed silently when an id was
  retired.
- **`--header-h` is measured, never a constant.** The header sizes to its
  content, grows by the notch inset, and now shrinks when its first row folds.
  Three sticky bars park against it. Anything clearing the header reads the
  variable; `scroll-mt-24`-style literals have been wrong every time.
- **`<main>` uses `overflow-x: clip`, not `hidden`.** `hidden` on one axis
  forces the other to `auto`, which makes the element a scroll container — and
  a `position: sticky` child sticks to its nearest *scrolling* ancestor. That
  silently broke every sticky-under-the-header element in the app.
- **A view id must resolve.** `lib/deepLink`'s alias table is for pages that no
  longer exist. Aliasing a page that does exist makes it reachable in-app and
  broken by URL — a defect no click-through test can see. It has happened three
  times; the rule is written above the table.
- **Contexts are co-located with their hooks** (`cursor`, `device`, `nav`), each
  with an eslint-disable for `react-refresh/only-export-components`. That is
  deliberate and matches `Page.tsx`'s re-export of `useCursor`.
