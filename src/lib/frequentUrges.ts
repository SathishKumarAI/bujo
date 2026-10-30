import { addDays, dayDiff, todayISO } from './date'
import { URGE_PRESETS } from './streak'
import type { JournalData } from './types'

export interface FrequentUrge {
  name: string
  /** Set when it is a tracked addiction, so a log lands on that streak. */
  addictionId?: string
  /** Over the window: urges you held, and the ones you gave in to. */
  held: number
  gaveIn: number
}

/**
 * THE URGES OFFERED FIRST on the phone — Recovery's "Your usual".
 *
 * Order: what you track (most-logged first), then what you have logged most
 * over `days` that you do not track, then presets to fill `limit`. One row a
 * name, matched case-blind, so "porn" and "Porn" are one row.
 *
 * Owner ask, 2026-10-30: "give me options like frequent options, just like
 * nutrition" — in place of a select and a 1-5 strength.
 */
export function frequentUrges(data: JournalData, { today = todayISO(), days = 30, limit = 6 } = {}): FrequentUrge[] {
  const since = addDays(today, -(days - 1))
  const recent = (data.nofap.urgeLog ?? []).filter((u) => dayDiff(since, u.date) >= 0 && dayDiff(u.date, today) >= 0)
  const tally = new Map<string, { name: string; held: number; gaveIn: number }>()
  const addictions = data.nofap.addictions ?? []
  for (const u of recent) {
    const name = addictions.find((a) => a.id === u.addictionId)?.name ?? u.trigger?.trim()
    if (!name) continue
    const k = name.toLowerCase()
    const row = tally.get(k) ?? { name, held: 0, gaveIn: 0 }
    if (u.outcome === 'followed') row.gaveIn += 1
    else row.held += 1
    tally.set(k, row)
  }
  const uses = (name: string) => { const t = tally.get(name.toLowerCase()); return t ? t.held + t.gaveIn : 0 }
  const of = (name: string, addictionId?: string): FrequentUrge => {
    const t = tally.get(name.toLowerCase())
    return { name, addictionId, held: t?.held ?? 0, gaveIn: t?.gaveIn ?? 0 }
  }

  const out: FrequentUrge[] = [...addictions].sort((a, b) => uses(b.name) - uses(a.name)).map((a) => of(a.name, a.id))
  const seen = new Set(out.map((u) => u.name.toLowerCase()))
  const add = (name: string) => {
    if (out.length >= limit || seen.has(name.toLowerCase())) return
    seen.add(name.toLowerCase())
    out.push(of(name))
  }
  ;[...tally.values()].sort((a, b) => (b.held + b.gaveIn) - (a.held + a.gaveIn)).forEach((t) => add(t.name))
  URGE_PRESETS.forEach(add)
  // Tracked ones always show; the rest fill up to the limit.
  return out.slice(0, Math.max(limit, addictions.length))
}
