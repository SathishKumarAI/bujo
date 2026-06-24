# Settings — UX audit & feature backlog

_Audited 2026-06-24. Scope: `src/views/Settings.tsx` (739 lines, 4 tabs). Goal:
make Settings easy to scan and act in — the same daily-use-first, progressive-
disclosure principles from `UX-CARD-LAYOUT.md`, applied to the config surface._

## Audit — what's wrong today

| # | Problem | Why it hurts |
|---|---|---|
| A | **"Data & Cloud" tab holds ~10 cards** — storage meter, Backup (~15 buttons), Demo/reset, Account, Cloud sync, Passcode, Advanced sync (3 cards), Journal summary | One tab carries half the page. You scroll a wall to find anything. |
| B | **Backup card is a flat button wall** — JSON / Markdown / calendar / 8 section-CSVs / per-collection CSV / 3 `.ics` feeds / metrics-import / checksum export+verify / print, all at one level | The 90%-case (Export/Import JSON) is buried among power-user exports. |
| C | **Sync & account are a sub-section**, not a tab — wrapped under an uppercase `Account, sync & privacy` heading inside Data | Sync is a top-level job; it should be one click, not a scroll inside Data. |
| D | **No search** across 30+ controls | "Where's the week-start toggle?" means hunting tab by tab. |
| E | **No reset-to-defaults** for appearance | Experimenting with themes/toggles is a one-way door. |
| F | Appearance tab mixes **look** (theme, accent, paper) with **behaviour** (penalty difficulty, Today dashboard cards) | Minor — grouping could be clearer. |
| G | Accent swatches use static `cat()` hexes, so they don't reflect the active theme | Cosmetic; pre-existing. |

## Target information architecture

**5 tabs** (was 4) — split the overloaded Data tab; promote Sync:

1. **Profile** — gender, wellbeing toggles, units _(unchanged)_
2. **Appearance** (rename "Journal feel") — theme picker, accent, realism toggles, Today dashboard cards, penalty difficulty; **+ Reset appearance**
3. **Reminders** — daily reminder, weather _(unchanged)_
4. **Sync & privacy** _(new)_ — Account, Cloud sync, Passcode, Advanced sync (self-host / BYO storage / Drive)
5. **Data** — storage-at-a-glance, Backup & export, Demo & reset, Journal summary

## Backlog (prioritised)

| ID | Title | Priority | Status |
|---|---|---|---|
| SET-1 | Split tabs: move Account/Cloud/Passcode/Advanced into a new **Sync & privacy** tab; rename "Journal feel" → **Appearance** | P0 | ✅ |
| SET-2 | **Group the Backup card** — keep Export/Import JSON primary; fold "Spreadsheets (CSV)", "Calendar feeds (.ics)" and "Backup integrity" into default-collapsed sections | P0 | ✅ |
| SET-3 | ~~Settings search box~~ | P1 | ✗ removed — user feedback: didn't want a category-search inside Settings. Built then reverted. |
| SET-4 | **Reset appearance to defaults** button (theme, accent, realism toggles, dashboard cards) | P1 | ✅ |
| SET-5 | Shared `Disclosure` collapsible primitive (de-dup the 3 ad-hoc disclosure buttons) | P2 | ✅ |
| SET-9 | **Horizontal pill tab bar** replacing the stacked/clipped vertical rail — every section visible at once, wraps on narrow screens, content full-width below (user feedback: "don't like the stack view, make it easy to get the view") | P0 | ✅ |
| SET-6 | Per-tab one-line description under each tab heading for orientation | P2 | 🔜 |
| SET-7 | Accent swatches read live theme tokens (fix G) | P3 | 🔜 |
| SET-8 | "Recently changed" / unsaved-state affordance (settings persist instantly today; document that) | P3 | 🔜 |

## Principles applied
- **Most-used first:** Export/Import JSON stays one tap; power exports collapse.
- **One job per tab:** sync is its own tab, not buried in Data.
- **Progressive disclosure:** CSV/ICS/integrity + Journal summary are default-collapsed.
- **Findable:** every section is one click on the always-visible pill bar (a
  search box was tried and removed — the user preferred direct tabs over typing).
