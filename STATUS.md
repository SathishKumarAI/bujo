# STATUS

**Stopped:** 2026-08-16, on `refactor/one-nav-bar` — PR #120 open against
`feat/modernist-shell`, all gates green, nothing in flight.

## Where the work stopped

The left rail is deleted. Navigation is `TopBar` in two rows (sections, then
tabs-or-title + date nav) on desktop, and `TopBar` + `BottomNav` on phones.
`Sidebar.tsx`, `classicNav.ts`, the mobile drawer, `sidebarCollapsed` and
`sidebarAutoHide` are gone; `settings.layout` now only picks which Today.

Full reasoning is in the commit body and PR #120 — not repeated here.

## Next action

Review / merge PR #120. It is stacked on `feat/modernist-shell`, so merge that
one first or retarget.

Then, if the direction holds:

1. **`TodayClassic`** is now the only thing `settings.layout` controls. Decide
   whether it earns a whole second Today, or whether the key retires with it.
2. **The tab row's scrollbar** shows on Windows Chrome under Body's six tabs.
   Pre-existing, but it is more visible now that the row is inside the header.
3. **`Sidebar` / `SidebarSimple` glyphs** are unused exports in the icon barrel.

## Traps hit on the way (the ones not already in CLAUDE.md)

- **`settings.layout` was two decisions in one key** — the nav *and* Today. The
  nav half could not survive a horizontal bar, so the key was narrowed rather
  than deleted. Anything else keyed on `layout` should be read as "which Today".
- **Alignment has to be measured, not eyeballed.** The tab label sat at x=28 and
  the page title at x=16 — same header, two rows, a 12px step that only showed
  when flipping between a tabbed page and an untabbed one. `-ml-3` on the tabs
  nav cancels the first tab's own `px-3`.
- **`.app-header` owns `padding-top: max(0.625rem, env(safe-area-inset-top))`**
  in `index.css`. The header keeps `pt-2.5` and lets each row own its own
  bottom padding — do not move padding onto the rows or the notch inset stops
  applying.
- The Chrome extension MCP was not connected this session; `chrome-devtools`
  MCP worked. Dev server was on port 5199 (other worktrees hold 4173 and 5174).
