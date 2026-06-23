// ── Recovery: urge-log analytics + trigger-plan matching ─────────────────────
import type { UrgeWin, TriggerPlan } from './types'

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
