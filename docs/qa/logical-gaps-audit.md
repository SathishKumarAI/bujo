# Logical-gaps audit — 50+ findings

A 4-cluster code audit (Today/Trackers/capture · Fitness/Pickleball/Recovery ·
Reading/Goals/Stats · data/sync/auth). Status: 🔧 fixed this pass · 🔜 ticketed ·
ℹ️ verified-not-a-bug · 📋 noted/by-design.

## Data, persistence, sync, auth
1. 🔧 `migrate()` could leave core collections `undefined`/`null` on a corrupt/legacy import → `.map`/`.some` crash. Now strips null keys + defaults every core collection.
2. 🔧 `nofap` not deep-merged → malformed `nofap` broke `logRelapse`/`streakStats`. Now `{...base.nofap, ...data.nofap}`.
3. 🔜 Supabase realtime subscription reads `sbAuthed.current` (false at mount) → live multi-device sync never activates until reload. (BUJO-203)
4. 🔜 Supabase debounced push has no pull-first/adopt-newer guard (the blob + folder paths do) → two devices can clobber each other. (BUJO-203)
5. 🔜 `resolveIncoming` is whole-snapshot last-write-wins → non-conflicting edits on the "older" side are lost; needs per-collection union/merge. (BUJO-204)
6. 🔜 `silent` dispatch (mount recurrence/demo materialisation) doesn't stamp `updatedAt` → newly materialised entries can lose to a stale remote. (BUJO-203)
7. 🔜 `replaceAll`/import doesn't re-stamp `updatedAt` → a freshly imported backup can lose to remote on next sync. (BUJO-204)
8. 🔜 "leaving explore" clears to `emptyJournal()` on a *failed* pull (caught error) same as a confirmed-empty account → could overwrite real cloud data. (BUJO-204)
9. 🔜 `crypto.b64()` spreads the whole byte array into `String.fromCharCode(...)` → stack overflow on large (image-heavy) journals during encrypt. (BUJO-205)
10. 📋 `bulkAddEvents` dedupes from the closed-over `data` not inside the reducer → rare double-insert. (BUJO-205)
11. 📋 `unlock()` with an unexpectedly-absent blob `setUnlocked(true)` on the empty mount journal → could persist blank over recovery. (BUJO-205)
12. 📋 Undo coalesce keys not reset on `set`/`silent`/`undo` → a reused label can swallow a separate undo step. (low)

## Today / Trackers / capture
13. 🔧 *(separate fix already shipped)* Routine lens / Today numeric-habit handling — verified count habits use `habitValues`; the capture mis-route below remains.
14. 🔜 CaptureBar: a `count` habit logged via the bar calls `toggleHabit` (writes `habitLog`) so it never registers as done (`habitDoneOn` reads `habitValues`). Route by habit type. (BUJO-206)
15. 🔜 `capture.ts` gym match requires `weight×reps`; `bench 80` (weight only) or `pullups 12` (reps only) silently file as a journal note. (BUJO-206)
16. 🔜 `capture.ts` habit prefix-match can toggle the wrong habit ("med" → "Meditate"). Require exact name at submit. (BUJO-206)
17. 🔜 Monthly habit-progress bar uses `habitLog.length / totalHabits`; numeric (count/timer/rating) habits log to `habitValues` so the bar never reaches 100% for those users. (BUJO-207)
18. 🔜 Today carry-forward / TodayPlanCard compute "yesterday" from the page cursor, not actual today → misleading on a past day. (Today already only renders the card when `date===today`; low.) (BUJO-207)
19. 🔜 `recurrence.ts` 60-day backfill cap still advances `lastGenerated` to today → occurrences older than the cap are permanently skipped. (BUJO-208)
20. 📋 `recurrence.ts` changing a rule's weekdays/start to an earlier date never backfills (already-generated). (BUJO-208)
21. 📋 `nextStatus` cycle: a `scheduled` task clicked → `indexOf` −1 → jumps to `open`, discarding the scheduled state. (low)
22. ℹ️ Monthly mood avg rounds to int ("6.5"→"7") — cosmetic.

## Fitness / Pickleball / Recovery
23. 🔧 Pickleball plan: a **future-dated** start showed "Day 1 / You're here". Now reads "not started" (planDay 0).
24. 🔜 Challenges strict `percentComplete`/`progressDay` use the *current streak*, while the card text uses `completedDays` → after one miss the ring and the "X of N days" text openly disagree. (BUJO-209)
25. 🔜 Zero-rule custom challenge can never complete a day → stuck at 0% (lib reachable even though the form requires ≥1). (BUJO-209)
26. 🔜 `streak.best` ignores a completed past streak longer than the stored best (the longest historical gap is discarded). (BUJO-210)
27. 🔜 `streak.avgGap` mishandles unsorted/duplicate/pre-start relapse dates. (BUJO-210)
28. 🔜 Gym `finish()` writes the set **index** into the rep slot of the `NxM` legacy string → rep-derived stats from legacy strings are wrong. (BUJO-211)
29. 🔜 Gym "Repeat last" (`lastSetFor`) returns the **heaviest** row, not the chronologically last set. (BUJO-211)
30. 🔜 Plate calculator: when the bar alone exceeds the target it presents the bare bar as "closest loadable" (a weight > target) with no warning. (BUJO-211)
31. 🔜 Pickleball sessions & Focus dev-sessions are **delete-only** — a mistyped score/duration is uncorrectable in place (and Focus avg is duration-weighted, so one bad session skews it). (BUJO-201)
32. 📋 `epley1RM` doesn't guard fractional/zero reps or zero weight. (low)
33. 📋 Pickleball weekly goal can be stored as `0` via the input (render guarded). (low)
34. 🔧 Recovery: ring/ladder clarified as the *main* streak; per-addiction streaks ticketed (BUJO-199).

## Reading / Goals / Stats / Insights / Collections
35. 🔧 `weeklyRadar` "Calm" was `10 − avg(stress)` = **10 (perfectly calm) with no stress data**. Now 0 when no samples.
36. 🔧 `weeklyRadar` habit adherence counted **archived** habits in the denominator and could exceed 10. Now active-only + clamped.
37. 🔧 Goals **program completion** counted rest/empty days in the target → 100% unreachable. Now denominator = days-with-exercises.
38. 🔧 Insights search: a stale **kind filter** produced a false "No matches" after changing the query. Now resets to "all" on query change.
39. 🔧 Collections: malformed friend/birthday could index `MONTHS[-1]`. Now month/day range-validated on both lists.
40. 🔜 Goals custom-goal Stepper is unbounded past target (shows e.g. "12/8 ✓"). Acceptable, but could cap/badge. (BUJO-212)
41. 🔜 Goals "Streak vs best" hidden while `nofap.best===0` → never shows on a first streak; `cur` can exceed `best`. (BUJO-212)
42. 🔜 `reading.pagesRead` counts an in-progress book's `currentPage` even with unknown total → arbitrary inflation. (BUJO-212)
43. 🔜 Stats "Workout minutes" bar chart has no empty-state → 8 flat bars look like a bug. (BUJO-212)
44. 🔜 Insights search caps at 50 with no "showing 50 of N". (low)
45. 🔜 `finishedThisYear` undercounts books finished without a `finishedOn`. (low)
46. ℹ️ `correlations` sleep↔stress text — verified **correct** (negative r → "less sleep means more stress").
47. ℹ️ `habitIntensity` vs grid opacity — consistent; intensity helper is just under-used.
48. 📋 Collections birthday day input accepts Feb 30 etc. (low validation)

## Recovery additions (this pass, per request)
49. 🔧 "Beat the urge" — expanded to 7 evidence-based techniques (surf · delay · HALT · play-it-forward · remove-cue · reach-out · log) + your trigger-plan reminder + a milestone-stakes nudge.
50. 🔧 Per-addiction "Urges by addiction" chart moved to the **right rail** (fits the narrow column) so visualizations support, not dominate.

## Tickets opened
BUJO-201 (edit sessions) · 203 (Supabase realtime+stamp) · 204 (sync merge / import stamp / explore-fail) · 205 (crypto/bulkAdd/unlock/undo) · 206 (capture routing) · 207 (numeric-habit surfaces) · 208 (recurrence backfill) · 209 (challenge strict math) · 210 (streak best/avgGap) · 211 (gym set-string/last/plates) · 212 (goals/reading/stats polish).
