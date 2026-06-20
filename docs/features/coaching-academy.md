# Coaching Academy (Pickleball)

Session 2026-06-20. A new **Coaching** tab — a curriculum to *improve the game
and mindset*, not just track it. Content: `src/lib/pickleballAcademy.ts`
(research: `docs/research/pickleball-coaching-curriculum.md`).

## Sections (`src/views/Coaching.tsx`)
- **12-week program** — start it (`settings.coachingStart`) to track your week;
  progress + weeks-done tiles; reset.
- **Today's session** — the weekly split's focus for today + a 45–60 min session
  template + a 7-day strip.
- **12-week roadmap** — every week is **expandable**: a plain "do this", 2–3
  specific drills, and a measurable goal (easy to study). Tap the badge to mark a
  week done (`settings.coachingWeeksDone`).
- **Skill ladder** — DUPR 2.0→4.5+, the skills to master at each level, in order.
- **Drill library** — 21 drills grouped by skill (dinking, drop, reset, serve,
  return, hands, footwork, wall).
- **Knee rehab & prehab (ACL/MCL)** — prevention + recovery exercises, filterable
  by equipment (none / band / weights), phase-grouped, with a *not-medical-advice*
  disclaimer.
- **Mental game** — 16 mindset principles (presence, reset, patience, routine,
  breathing, tilt, growth mindset…).

## Logic audit (this feature)
Honest result: it's mostly static content + simple week tracking, so there isn't
a long bug list. Verified + handled:
- ✅ `week` math: `floor(daysSinceStart/7)+1`, clamped 1–12.
- 🔧 Future `coachingStart` (imported data) now treated as "not started" rather
  than showing Week 1 with progress.
- ✅ `todaySlot` Mon-first mapping (`(dow+6)%7`) verified for Sun–Sat.
- ✅ Mark-done is independent of the current week; progress = doneWeeks/12.
- ✅ Rehab equipment filter hides empty phase groups; every filter has content.
- ✅ Reset clears both `coachingStart` and `coachingWeeksDone`.
- ✅ `migrate()` (hardened earlier) defaults the new optional settings safely.

No data-loss or crash paths found in the feature. Broader app-wide logical gaps
are tracked in `docs/qa/logical-gaps-audit.md` (BUJO-201..214).

## Technique guide (the "how")
`TECHNIQUES` in the lib + the "How to play every shot" card: every core shot
(grip, ready, split-step, serve, return, dink, third-shot drop, reset, volley,
speed-up, stacking, Erne, ATP, lob) opens to **what it is · step-by-step how-to ·
key cues · common mistakes** — so you never need to leave the app to learn a shot.

## Mindset tab (app-wide) — `src/views/Mindset.tsx`, `src/lib/mindset.ts`
An interactive thinking-style tool (not just pickleball): a library of 26
principles across 7 themes (focus, resilience, growth, composure, confidence,
discipline, connection). Tap **+** to add a principle to **Your focus** (left
rail) and journal a note on how you’ll apply it. Stored in
`JournalData.mindsetFocus` (`addMindsetFocus` / `setMindsetNote` /
`removeMindsetFocus`; de-dupes). Keep it to 1–3 active — focus beats breadth.
