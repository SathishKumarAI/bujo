// ── Recovery: urge-log analytics + trigger-plan matching ─────────────────────
import type { UrgeWin, TriggerPlan, Relapse } from './types'
import { dayDiff, todayISO } from './date'

/** The coping techniques an urge can be tagged with. */
export type UrgeTechnique = NonNullable<UrgeWin['technique']>

/** One technique row in the effectiveness tally. */
export interface TechniqueRank {
  technique: UrgeTechnique
  /** How many resisted urges used this technique. */
  count: number
}

/**
 * Tally resisted urges by the coping technique used, most-used first.
 * Logs missing a `technique` are ignored. Pure; ties keep first-seen order
 * (stable sort), so the most-effective technique is `[0]`.
 */
export function techniqueRanking(urgeLog: UrgeWin[] = []): TechniqueRank[] {
  const counts = new Map<UrgeTechnique, number>()
  for (const u of urgeLog) {
    if (!u || !u.technique) continue
    counts.set(u.technique, (counts.get(u.technique) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([technique, count]) => ({ technique, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Find the first trigger plan whose `trigger` matches the typed/picked urge
 * trigger, case-insensitively. Matches when either string contains the other
 * (substring both ways) or they share a word — so "stress" finds a plan for
 * "stress at work" and vice-versa. Returns undefined when nothing matches or
 * the input is empty.
 */
export function matchPlanForTrigger(
  plans: TriggerPlan[] = [],
  triggerText: string,
): TriggerPlan | undefined {
  const q = triggerText.trim().toLowerCase()
  if (!q) return undefined
  const qWords = q.split(/\W+/).filter(Boolean)
  return plans.find((p) => {
    const t = (p.trigger ?? '').trim().toLowerCase()
    if (!t) return false
    if (t.includes(q) || q.includes(t)) return true
    const tWords = new Set(t.split(/\W+/).filter(Boolean))
    return qWords.some((w) => tWords.has(w))
  })
}

/** Current streak length measured against the personal best, for the ghost bar. */
export interface StreakVsBest {
  /** Days in the live run. */
  current: number
  /** Longest streak ever (the ghost/target length). */
  best: number
  /** 0–100: how far the current run has come toward equalling the best. 100 when
   *  current ≥ best (i.e. a new record, or no best to beat yet). */
  pct: number
  /** Days still needed to match the best (0 once equalled or exceeded). */
  daysToBeat: number
  /** True once the current run has reached or passed the previous best. */
  isRecord: boolean
}

/**
 * Compare the current streak with the personal best for a ghost-bar render.
 * Pure. `best` should already include the live run (as streakStats computes it),
 * so when `current` equals `best` the run IS the record and pct is 100.
 */
export function streakVsBest(current: number, best: number): StreakVsBest {
  const cur = Math.max(0, current)
  const bst = Math.max(0, best)
  // The bar fills toward the *previous* best — the longest streak excluding the
  // live run. If best == current the live run is the record, so target is itself.
  const isRecord = cur >= bst
  const pct = bst <= 0 ? 100 : Math.min(100, Math.round((cur / bst) * 100))
  const daysToBeat = Math.max(0, bst - cur)
  return { current: cur, best: bst, pct, daysToBeat, isRecord }
}

/** Result of the comeback check — a streak that has out-grown the one before it. */
export interface Comeback {
  /** True when the current run is longer than the immediately-prior completed streak. */
  isComeback: boolean
  /** Length of the previous (most-recent completed) streak, in days. */
  prevStreak: number
  /** Days the current run beats the previous one by (0 when not a comeback). */
  by: number
}

/**
 * Comeback badge: fires when the CURRENT run has grown longer than the streak that
 * preceded the most-recent relapse. Computed purely from the relapse history +
 * the current start day. The "previous streak" is the gap between the last two
 * relapses (or, before the second relapse, from `startedOn`-of-first back to the
 * very first relapse — i.e. how long the run was that ended at the latest reset).
 *
 * Needs at least one relapse to have something to beat; returns isComeback=false
 * with prevStreak=0 when there's no prior streak to compare against.
 */
export function comebackStatus(
  relapses: Relapse[] = [],
  currentStartedOn: string,
  today = todayISO(),
): Comeback {
  const current = Math.max(0, dayDiff(currentStartedOn, today))
  // Dedupe + sort relapse dates ascending; ignore anything after the current start
  // (defensive — the live run begins at the latest relapse).
  const dates = [...new Set(relapses.map((r) => r.date))]
    .filter((d) => dayDiff(d, currentStartedOn) >= 0)
    .sort()
  if (dates.length === 0) return { isComeback: false, prevStreak: 0, by: 0 }

  // The previous streak is the one that ENDED at the most-recent relapse: the gap
  // between the last two relapses, or from the first relapse to itself (0) when
  // there's only been one reset.
  const last = dates[dates.length - 1]
  const prev = dates.length >= 2 ? dates[dates.length - 2] : last
  const prevStreak = Math.max(0, dayDiff(prev, last))

  const isComeback = prevStreak > 0 && current > prevStreak
  return { isComeback, prevStreak, by: isComeback ? current - prevStreak : 0 }
}
