/**
 * DID YOU ACTUALLY PRACTISE IT · a dated tick per drill and per shot.
 *
 * Owns: the key a practised thing is stored under, and the pure functions that
 * add, remove and read back a date. Does not own where it is stored
 * (`Settings.practiceLog`), how it merges across devices (`lib/conflict.ts`),
 * or any of the rendering.
 *
 * **Why this and not another note field.** The page could already record a
 * sentence per program week (`coachingWeekNotes`) and nothing else. A sentence
 * is the right shape for "how it went" and the wrong shape for "did I do it":
 * asked twelve weeks later which of the nine footwork drills you have actually
 * run, prose cannot answer and a tick can. The week prescribes named drills
 * and the library holds twenty-one more; this is the yes/no beside each one.
 *
 * **Dates, not a count.** A counter answers "how many times" and nothing else;
 * a list of days answers that, plus when you last did it, plus whether it was
 * this week — which is the question somebody standing on a court actually has.
 * It is also the only shape that can merge: two devices each holding a count
 * can only disagree, while two sets of days union.
 *
 * **Keyed by a slug of the name, not by an id**, because the two call sites
 * name their drills differently — `ACADEMY_DRILLS` carries a short `name` and
 * a program week carries a whole instruction ("Return-and-rush: return, sprint
 * to the line, split-step"). Neither has an id and giving the week's free text
 * one would mean editing the curriculum every time a word changes. The cost is
 * stated plainly: **rewording a drill orphans its history**, which is why
 * `practiceKey` slugs the first clause only and is capped — the part before the
 * colon is the drill's name and the rest is how to run it.
 */

/** Days a thing was practised, newest last. Keyed by `practiceKey`. */
export type PracticeLog = Record<string, string[]>

/**
 * The storage key for a practised thing.
 *
 * `kind` is in the key because a shot and a drill can share a name — "Dink" is
 * both a technique in the manual and the first word of three drills — and
 * folding them together would report a drill you ran as a shot you studied.
 */
export function practiceKey(kind: 'drill' | 'shot', name: string): string {
  const head = name.split(':')[0]
  const slug = head
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return `${kind}:${slug}`
}

/**
 * Add the date, or remove it if it is already there. Returns a new log.
 *
 * A key with no dates left is DELETED rather than kept as `[]`, the same
 * distinction `coachingWeekNotes` makes for a cleared note: an empty array
 * persists as "asked and answered with nothing", and it would also make every
 * drill you ever un-ticked permanent storage.
 */
export function togglePractice(log: PracticeLog, key: string, date: string): PracticeLog {
  const next = { ...log }
  const days = next[key] ?? []
  const without = days.filter((d) => d !== date)
  if (without.length === days.length) next[key] = [...days, date].sort()
  else if (without.length === 0) delete next[key]
  else next[key] = without
  return next
}

export interface PracticeStat {
  /** Every day it was practised. */
  days: string[]
  /** `undefined` rather than `''` — no practice is an absence, not a date. */
  last?: string
  /** Whether it was practised on the day asked about. */
  onDate: boolean
}

/**
 * What is known about one practised thing, as of `date`.
 *
 * Returns `days` rather than only a count so the caller can say how many AND
 * when — `metricMean` threw its sample size away and that is exactly how the
 * momentum bug in CLAUDE.md compared one day against seven.
 */
export function practiceStat(log: PracticeLog | undefined, key: string, date: string): PracticeStat {
  const days = log?.[key] ?? []
  return { days, last: days.length ? days[days.length - 1] : undefined, onDate: days.includes(date) }
}

/** How many of `keys` were practised between `from` and `to`, inclusive. */
export function practisedInRange(log: PracticeLog | undefined, keys: string[], from: string, to: string): number {
  if (!log) return 0
  return keys.filter((k) => (log[k] ?? []).some((d) => d >= from && d <= to)).length
}
