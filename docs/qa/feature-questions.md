# Feature QA — 20+ questions, answers & gaps

A user-perspective audit: one+ pointed "how do I…?" per feature. ✅ = already
works (with where). 🔧 = was a gap, fixed this pass. 🔜 = gap, ticketed.

## Today / capture
1. **How do I capture for a past day?** ✅ Use the date-nav in the top bar (the cursor drives Today).
2. **How do I edit or delete an entry?** ✅ Tap the entry (EntryRow) — edit text inline; the glyph cycles status; delete from its menu.
3. **What if I typo an exercise/food in the smart bar?** ✅ `lib/capture.ts` fuzzy-matches the library and normalises spoken numbers.
4. **How do I undo a mistake?** ✅ ⌘Z / ⌘⇧Z anywhere (80-step history).

## Trackers
5. **How do I reorder / archive a habit?** ✅ Drag the grip to reorder; archive in the habit detail; "Show archived" in the ⚙ options.
6. **How do I see one habit's history?** ✅ Tap the habit name → detail (streak, consistency, heatmap, per-day notes).
7. **How do I run my day by time-of-day?** ✅ Switch the layout to **routine** (⏰) — sections by morning/afternoon/evening; jot per-habit notes.
8. **Where are the tracker options?** ✅ The ⚙ in the card header (density, hide weekends, show archived).

## Reading
9. **How do I bump pages without opening the book?** ✅ The page field is inline on the "reading" shelf card.
10. **How do I record what I learned / a review / a link?** ✅ Expand a book (📝 Notes) — dated learnings, review, and a link; plus the **Read-later** links list.

## Pickleball / Recovery / Fitness
11. **How do I log a tournament vs a casual game?** ✅ "Leagues & tournaments" card (8 formats) is separate from session logging.
12. **How do I follow a structured improvement plan?** ✅ The 75-day 3.5→4.0 plan with phases + drills; the coach surfaces today's phase.
13. **How do I edit a logged session?** 🔜 Pickleball/Focus sessions are delete-and-re-log today (Fitness workouts *are* editable). Ticketed (BUJO-200).
14. **How do I know what urge I resisted and when?** 🔧 The Recovery **urge log** now records each win with day + time + type (quick-pick presets + custom).
15. **How do I plan for an addiction's trigger?** 🔧 Recovery **trigger plans** — if-then per trigger point.
16. **Does the streak ladder cover multiple addictions?** 🔜 It tracks one main streak (clarified in the UI); per-addiction streaks ticketed (BUJO-199).

## Goals / Insights / Stats
17. **How do I add a goal that isn't derived from another view?** 🔧 **Custom goals** card in Goals — add any target with manual progress (stepper).
18. **How do I find an old entry?** ✅ Insights → Search (full-text, filter by type), or ⌘K.
19. **How do I enlarge / compare a chart?** ✅ Every chart card's ⛶ opens a screen-centred large modal; Stats mood/year toggle side-by-side ↔ stacked.
20. **What does a card/chart mean?** ✅ The ⓘ on every card explains it; the top-bar `?` explains the view.

## Data / account
21. **How do I back up or move my data?** ✅ Settings → Data & Cloud: JSON / Markdown / CSV / ICS export, print/PDF.
22. **How do I keep it private on a shared device?** ✅ Settings → passcode (AES-GCM at-rest encryption).
23. **How do I sync across devices?** ✅ Account (Supabase), or your own cloud folder / gist / self-host — all opt-in.
24. **How do I sign in / out without digging through Settings?** ✅ The top-bar account menu → the dedicated Recovery-style Account page.

## Fixed this pass
- 🔧 **Custom goals** (Goals) — `CustomGoal` type + store + UI.
- 🔧 **Urge log + trigger plans** (Recovery) — see `features/streak-redesign.md`.

## Ticketed gaps
- 🔜 BUJO-199 per-addiction streaks · BUJO-200 edit logged Pickleball/Focus sessions · BUJO-197 modern light theme.
