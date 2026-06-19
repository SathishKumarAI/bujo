# Streak (abstinence) — redesign

Session 2026-06-18 (cont.). Rebuilt the Streak tab's logic + UI from a flat
counter into a motivating recovery hub. Private, local-only, judgement-free.

## Logic (`src/lib/streak.ts`, `streak.test.ts`)
`streakStats(data, today)` derives, purely + tested:
- **current** — days since the last reset.
- **best** — personal best (honours the live run).
- **totalClean** — *lifetime* clean days across **every** streak (current run +
  each completed gap between resets). A reset no longer zeroes your progress.
- **relapseCount**, **urges**, **avgGap** (days between resets).
- **milestone progress** — `next` / `prevDay` / `progressPct` / `daysToNext`.
- **topTriggers** — your reset reasons ranked by frequency.
- `STREAK_MILESTONES` — a ladder (1/3/7/14/30/60/90/180/365 d) each with a
  "what improves" benefit note. `unlockedBenefits(current)` returns reached rungs.

## UI (`src/views/NoFap.tsx`)
- **Progress-ring hero** — an SVG ring fills toward the next milestone (animated),
  big day count in the centre, next-benefit blurb + bar.
- **Lifetime stat tiles** — current · personal best · **total clean days** · urges.
- **Recovery ladder** — vertical timeline; reached rungs lit, next highlighted.
- **Trigger patterns** — bars of your most common reset reasons + avg gap.
- **Reset history** — collapsible, judgement-free.

## Urge log (was a bare counter)
Previously `urgesResisted` was just a number — no *when* or *what*. Now:
- **`UrgeWin { id, date, at, trigger?, note? }`** in `Streak.urgeLog[]` (the old
  `urgesResisted` number is kept and still added to the total for back-compat).
- **Quick-pick presets** (`URGE_PRESETS`: porn, masturbation, smoking, vaping,
  alcohol, junk food, sugar, doomscrolling, gaming, caffeine) **+ a custom field**
  (datalist) — pick or type any urge.
- `resistUrge({ trigger })` logs the win with **day + time**; the card shows a
  dated/timed list (`removeUrge` to delete) so you can see *exactly what you
  resisted and when* — and spot high-risk hours.

## Per-addiction visualization + rename
- **"Urges by addiction"** — a horizontal bar chart (`urgesByType`) counts every
  logged urge by type, each its own coloured bar; enlargeable (⛶ → centred modal).
- The tab is renamed **Streak → Recovery** (covers streak + urges + resilience,
  less loaded). `ViewId` stays `nofap` internally.

## "I slipped but want to continue"
On a reset day the hero shows a supportive panel: your **total clean days** and
**best are kept** — "one slip is a stumble, not a restart." The framing keeps
lifetime progress visible so a relapse doesn't feel like starting from zero.
