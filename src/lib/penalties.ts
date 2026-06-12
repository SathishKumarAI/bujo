// Anime-style "training penalties" — a light, gamified consequence for skipping
// tasks. 300 deterministic entries (30 techniques × 10 drills), tiered by how
// brutal the drill is. All are bodyweight/discipline tasks (this is a health app).
import type { JournalData } from './types'
import { todayISO, addDays } from './date'
import { habitStreak } from './stats'

export type PenaltyTier = 'light' | 'medium' | 'heavy' | 'legendary'

export interface Penalty {
  id: number
  tier: PenaltyTier
  title: string
  task: string
}

const TECHNIQUES = [
  'One Punch', 'Kamehameha', 'Rasengan', 'Bankai', 'Getsuga Tensho', 'Susanoo',
  'Gomu Gomu', 'Domain Expansion', 'Hollow Purge', 'Final Flash', 'Spirit Bomb',
  'Chidori', 'Sharingan Focus', 'Ultra Instinct', 'Nine-Tails Sprint', 'Thunderclap',
  'Star Platinum', 'Hundred Type', 'Tessaiga Cleave', 'Zenitsu Thunder', 'Water Breathing',
  'Deku Smash', 'Plus Ultra', 'Mugen Drill', 'Limit Break', 'Hokage Resolve',
  'Soul Reaper', 'Titan Shift', 'Nichirin Edge', 'Cursed Energy',
] // 30

// Ordered roughly easy → brutal; index drives the tier.
const DRILLS: { ex: string; base: number }[] = [
  { ex: 'push-ups', base: 20 },
  { ex: 'sit-ups', base: 25 },
  { ex: 'air squats', base: 30 },
  { ex: 'lunges (each leg)', base: 20 },
  { ex: 'mountain climbers', base: 40 },
  { ex: 'jump squats', base: 25 },
  { ex: 'burpees', base: 15 },
  { ex: '-second plank hold', base: 45 },
  { ex: '-minute cold shower', base: 2 },
  { ex: 'km run', base: 3 },
] // 10

function tierForDrill(i: number): PenaltyTier {
  if (i <= 2) return 'light'
  if (i <= 5) return 'medium'
  if (i <= 8) return 'heavy'
  return 'legendary'
}

/** The full deterministic catalogue (30 × 10 = 300). */
export const PENALTIES: Penalty[] = TECHNIQUES.flatMap((tech, t) =>
  DRILLS.map((drill, dgi) => {
    const reps = drill.base + (t % 5) * Math.max(1, Math.round(drill.base * 0.2))
    const task = drill.ex.startsWith('-') ? `${reps}${drill.ex}` : `${reps} ${drill.ex}`
    return {
      id: t * 10 + dgi,
      tier: tierForDrill(dgi),
      title: `${tech} Protocol`,
      task,
    }
  }),
)

export const TIER_META: Record<PenaltyTier, { label: string; color: string; weight: number }> = {
  light: { label: 'Light', color: 'green', weight: 0 },
  medium: { label: 'Medium', color: 'yellow', weight: 1 },
  heavy: { label: 'Heavy', color: 'peach', weight: 2 },
  legendary: { label: 'Legendary', color: 'red', weight: 3 },
}

export interface MissReport {
  items: string[] // human descriptions of what was skipped
  tier: PenaltyTier | null // null = nothing missed
}

/**
 * What did you skip *yesterday* (the closed-out day)? Severity rises with the
 * worst single miss and the number of misses:
 *  · overdue important task / broken ≥3-day streak / missed challenge day → heavy
 *  · normal overdue task / broken short streak → medium
 *  · ≥3 misses bumps the tier up one notch (capped at legendary)
 */
export function missesFor(data: JournalData, today = todayISO()): MissReport {
  const y = addDays(today, -1)
  const items: string[] = []
  let weight = 0

  // Broken habit streaks (scheduled yesterday, not done, not skipped).
  const yDow = new Date(y + 'T00:00').getDay()
  for (const h of data.habits) {
    if (h.archived) continue
    const scheduled = !h.activeDays?.length || h.activeDays.includes(yDow)
    if (!scheduled) continue
    const done = (data.habitLog[y] ?? []).includes(h.id)
    const skip = (data.habitSkips?.[h.id] ?? []).includes(y)
    if (done || skip) continue
    const streak = habitStreak(data, h.id, addDays(y, -1))
    items.push(`Missed ${h.name}${streak >= 3 ? ` (broke a ${streak}-day streak)` : ''}`)
    weight = Math.max(weight, streak >= 3 ? 2 : 1)
  }

  // Open tasks dated on/before yesterday that are still not done.
  const overdue = data.entries.filter((e) => e.type === 'task' && e.status === 'open' && e.date && e.date <= y)
  if (overdue.length) {
    const important = overdue.some((e) => e.important)
    items.push(`${overdue.length} task${overdue.length > 1 ? 's' : ''} left undone${important ? ' (one important!)' : ''}`)
    weight = Math.max(weight, important ? 2 : 1)
  }

  // Active challenge days left unfinished yesterday.
  for (const c of data.challenges ?? []) {
    if (c.archived) continue
    const start = c.startDate
    if (y < start) continue
    const dayNum = Math.floor((Date.parse(y) - Date.parse(start)) / 86_400_000) + 1
    if (dayNum < 1 || dayNum > c.durationDays) continue
    const done = (data.challengeLog?.[c.id]?.[y] ?? []).length
    if (done < c.rules.length) {
      items.push(`${c.name}: Day ${dayNum} incomplete`)
      weight = Math.max(weight, 2)
    }
  }

  if (items.length === 0) return { items, tier: null }
  if (items.length >= 3) weight = Math.min(3, weight + 1)
  const tier: PenaltyTier = weight >= 3 ? 'legendary' : weight === 2 ? 'heavy' : weight === 1 ? 'medium' : 'light'
  return { items, tier }
}

/** A stable daily pick from a tier (changes each day, not on every render). */
export function penaltyFor(tier: PenaltyTier, today = todayISO()): Penalty {
  const pool = PENALTIES.filter((p) => p.tier === tier)
  // Deterministic index from the date string — no Math.random (keeps it stable).
  const seed = [...today].reduce((a, c) => a + c.charCodeAt(0), 0)
  return pool[seed % pool.length]
}
