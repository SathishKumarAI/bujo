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

## Information architecture

**4 tabs.** It was 5 for one release — see the re-audit at the foot of this file
for why it is 4, with the per-tab measurements — and 4 before that, with the Data
tab carrying half the page.

1. **Profile** — gender, wellbeing toggles, units & week, the daily reminder
2. **Appearance** (was "Journal feel") — theme picker, accent, realism toggles, Today dashboard cards, penalty difficulty; **+ Reset appearance**
3. **Sync & privacy** — Cloud sync, Passcode, Weather & food lookup, Local model, Advanced sync (self-host / BYO storage / Drive)
4. **Data** — storage-at-a-glance, Backup & export, Tags, Demo & reset

The retired tab is **Reminders**. It held one local thing (the nudge) and three
outbound connections that answer the same question as cloud sync; both halves
moved to where that question is already asked.

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

---

## Re-audit, 2026-09-26 — and the measurement that was wrong

**`npm run space -- settings` reports `0.9 shipped / 0.9 open · 2 cards` and
that is the Profile tab.** The audit walks the rendered DOM; a tab shell holds
one panel at a time; nothing in the tool or in this document noticed. Every space
number ever quoted for this view measured a fraction of it — and `npm run a11y`
has the same hole, so the panels holding the passcode form, the cloud passphrase
and every export button have never been seen by axe at any theme. Filed as
**COD-232** with the implementation notes; the numbers below come from a
throwaway probe that drives the tab control, because `scripts/` belonged to
another branch the day this was measured.

Measured per tab, desktop 1440×900 (743px of viewport below the header) and phone
390×844, `?demo=1`:

| Tab | content px (desktop) | shipped → open, desktop | shipped → open, phone |
|---|---|---|---|
| Profile | 378 | 0.9 → 0.9 | 0.9 → 0.9 |
| Appearance | 941 | 1.1 → 1.1 | 2.0 → 2.0 |
| Reminders | 467 | 0.9 → 0.9 | 0.9 → 0.9 |
| Sync & privacy | 504 | 0.9 → 1.8 | 1.1 → 2.5 |
| Data | 1000 | 1.1 → 1.8 | 2.3 → 3.3 |

And after, four tabs:

| Tab | content px (desktop) | shipped → open, desktop | shipped → open, phone |
|---|---|---|---|
| Profile | 426 | 0.9 → 0.9 | 0.9 → 0.9 |
| Appearance | 941 | 1.1 → 1.1 | 2.0 → 2.0 |
| Sync & privacy | 790 | 0.9 → 2.1 | 1.7 → 3.0 |
| Data | 1000 | 1.1 → 1.8 | 2.3 → 3.3 |

What got worse is the Sync tab on a phone — 1.1 → 1.7 shipped, 2.5 → 3.0 open —
because the retired tab's content arrived there. Across both tabs it is less:
2167px over two surfaces became 1333px on one.

So: **2.7 screens of content spread over five tabs, three of them under half a
screen tall.** That is the "a lot of empty space, and a lot more width we could
use" report, and no gate could see it — the `space` budget only flags 3+ screens
and every card cleared the 45% fill floor.

### Which of the findings above are still true

| # | Then | Now |
|---|---|---|
| A | Data holds ~10 cards | **Fixed** (#264). Four: Your data, Backup, Tags, Demo & reset |
| B | Backup is a flat button wall | **Fixed** (SET-2). Three folds, `defaultOpen={false}` |
| C | Sync is a sub-section, not a tab | **Fixed** (SET-1) |
| D | No search across 30+ controls | **Still true, and deliberate** — SET-3 was built and reverted on user feedback |
| E | No reset-to-defaults for appearance | **Fixed** (SET-4) |
| F | Appearance mixes look with behaviour | **Still true.** Penalty difficulty and the Today-card toggles are behaviour. Left alone: the tab measures 1.1 screens and splitting it would add a fifth tab back |
| G | Accent swatches are static `cat()` hexes | **Still true** (SET-7, open) |

Two findings this pass adds, both invisible to every gate:

- **A tab is not free.** Five tabs for 2.7 screens meant three half-empty
  surfaces. `Reminders` is retired: its daily reminder is a block in the Profile
  card (on its own it was a 324×95 band at **44% fill**, the only thin card on
  the view), and its weather / food-lookup switches are `ConnectionsCard` on the
  Sync tab beside the local model — where "what does this app talk to" was
  already being answered for cloud sync, self-host and Drive. `RemindersTab`'s
  own docstring claimed to keep that question "in one place" while three larger
  answers sat one tab away.
- **Four controls behind default-off toggles had never been rendered by a
  gate** — one **critical** `label` violation at all five desktop themes once
  both toggles are forced on. The reminder time (`reminderEnabled: false` in the seed) and the local
  model's server, model select and model input (`voiceModel.enabled` unset) sit
  inside `Row`, whose label is a `<span>` and names nothing. Labelled. Same shape
  as latte's `yellow` at 2.02:1 behind a branch the seed never took.
