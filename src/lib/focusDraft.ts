import type { DevSession } from './types'

/**
 * THE PHONE'S FOCUS LOG DRAFT — what a new session starts from, and what it
 * writes.
 *
 * OWNS: carrying the last session over (minutes, project, tags, focus,
 * stress — the things you repeat), the choices each one-tap row offers, and
 * the draft → `DevSession` conversion.
 * DOES NOT OWN: the drawing (`components/focus/FocusPhone.tsx`) or the store
 * write. The desktop form (`LogSession.tsx`) keeps its own blank draft.
 *
 * NOT carried: the date (a session is today's unless you say so), the notes
 * and the interruption count — those describe one block, not your habit.
 */
export interface FocusDraft {
  date: string
  durationMin: number | undefined
  project: string
  tags: string[]
  /** Typed in the sheet as a comma list; merged with `tags` on log. */
  moreTags: string
  focus: number
  stress: number
  interruptions: number | undefined
  notes: string
}

/** The minute choices on the phone's bar — the desktop's chip list. */
export const MINUTE_CHOICES = [25, 45, 60, 90, 120] as const

/** Newest by date; on a tie the one written last, which is the array's later row. */
export function lastSession(sessions: readonly DevSession[]): DevSession | undefined {
  let best: DevSession | undefined
  for (const s of sessions) if (!best || s.date >= best.date) best = s
  return best
}

export function draftFrom(last: DevSession | undefined, today: string): FocusDraft {
  return {
    date: today,
    durationMin: last?.durationMin,
    project: last?.project ?? '',
    tags: [...(last?.tags ?? [])],
    moreTags: '',
    focus: last?.focus ?? 7,
    stress: last?.stress ?? 3,
    interruptions: undefined,
    notes: '',
  }
}

/**
 * The first `n` of `top`, with `keep` guaranteed a place: a carried-over value
 * that is not on the bar would be selected and invisible, so it takes the last
 * slot. Numbers come back sorted, names in the order given.
 */
export function withChoice<T extends string | number>(top: readonly T[], keep: T | undefined | '', n: number): T[] {
  const out = top.slice(0, n)
  if (keep !== undefined && keep !== '' && !out.includes(keep as T)) out.splice(Math.max(0, n - 1), out.length, keep as T)
  return typeof out[0] === 'number' ? [...out].sort((a, b) => (a as number) - (b as number)) : out
}

/** "45m", "1h", "1½h", "110m" — short enough for a five-way segmented bar. */
export function shortMin(m: number): string {
  if (m < 60 || m % 30 !== 0) return `${m}m`
  return m % 60 === 0 ? `${m / 60}h` : `${Math.floor(m / 60)}½h`
}

export function toggle(list: readonly string[], v: string): string[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
}

/** The session to store, or null when there are no minutes — the one field a session needs. */
export function toSession(d: FocusDraft): Omit<DevSession, 'id'> | null {
  if (!d.durationMin || d.durationMin <= 0) return null
  const tags = [...d.tags, ...d.moreTags.split(',')].map((t) => t.trim().toLowerCase()).filter(Boolean)
  return {
    date: d.date,
    durationMin: d.durationMin,
    project: d.project.trim() || undefined,
    focus: d.focus,
    stress: d.stress,
    interruptions: d.interruptions,
    tags: [...new Set(tags)],
    notes: d.notes.trim() || undefined,
  }
}
