import type { JournalData } from './types'

// Collections keyed by a stable `id` — unioned by id on merge.
const ID_ARRAYS = [
  'entries', 'habits', 'workouts', 'fasts', 'routines', 'progressPhotos',
  'pickleball', 'friends', 'books', 'readLinks', 'pickleballEvents',
  'birthdays', 'challenges', 'devSessions', 'recurrences', 'collections',
] as const

// Collections keyed by a calendar field — unioned by that key on merge.
const KEYED_ARRAYS: [string, string][] = [
  ['metrics', 'date'], ['bodyMetrics', 'date'], ['gratitude', 'date'],
  ['memories', 'date'], ['monthly', 'ym'], ['cycle', 'date'],
]

// Plain `{ key: value }` maps — local-only keys are filled in on merge.
const MAPS = [
  'habitLog', 'habitValues', 'habitTimes', 'habitNotes', 'habitSkips',
  'stickers', 'challengeLog',
] as const

type Dict = Record<string, unknown>

function unionById(winner: unknown, loser: unknown): unknown[] {
  const w = Array.isArray(winner) ? winner : []
  const l = Array.isArray(loser) ? loser : []
  const seen = new Set(w.map((x) => (x as Dict)?.id))
  // Winner first (its versions take precedence on id collision), then any
  // loser-only items the winning snapshot never knew about.
  return [...w, ...l.filter((x) => !seen.has((x as Dict)?.id))]
}

function unionByKey(winner: unknown, loser: unknown, key: string): unknown[] {
  const w = Array.isArray(winner) ? winner : []
  const l = Array.isArray(loser) ? loser : []
  const seen = new Set(w.map((x) => (x as Dict)?.[key]))
  return [...w, ...l.filter((x) => !seen.has((x as Dict)?.[key]))]
}

function fillMap(winner: unknown, loser: unknown): Dict {
  const w = (winner && typeof winner === 'object' ? winner : {}) as Dict
  const l = (loser && typeof loser === 'object' ? loser : {}) as Dict
  const out: Dict = { ...l, ...w } // winner overrides on key collision; loser-only keys survive
  return out
}

/**
 * Merge a losing snapshot's *unique* items into the winning snapshot so a plain
 * last-write-wins adopt doesn't silently drop non-conflicting edits made on the
 * other (older) side. The winner's versions win on every collision; the loser
 * only contributes items/keys the winner never had.
 *
 * Tradeoff: a union resurrects an item the winner deleted while the loser still
 * held it (additions beat deletions). That's the accepted bias — losing a fresh
 * note is worse than re-seeing a deleted one.
 */
export function mergeJournals(winner: JournalData, loser: JournalData): JournalData {
  const w = winner as unknown as Dict
  const l = loser as unknown as Dict
  const out: Dict = { ...w }

  for (const k of ID_ARRAYS) out[k] = unionById(w[k], l[k])
  for (const [k, key] of KEYED_ARRAYS) out[k] = unionByKey(w[k], l[k], key)
  for (const k of MAPS) out[k] = fillMap(w[k], l[k])

  // nofap: keep the winner's scalars (startedOn/best) but union the dated logs so
  // a relapse/urge logged on the other device isn't lost.
  const wn = (w.nofap ?? {}) as Dict
  const ln = (l.nofap ?? {}) as Dict
  out.nofap = {
    ...ln, ...wn,
    relapses: unionById(wn.relapses, ln.relapses),
    urgeLog: unionById(wn.urgeLog, ln.urgeLog),
    plans: unionById(wn.plans, ln.plans),
  }

  return out as unknown as JournalData
}

/**
 * Decide whether an incoming cloud snapshot should replace the local journal.
 *
 * Silent in the common case: the remote is newer (expected multi-device sync) or
 * neither side is stamped (legacy data). Prompts ONLY on a real conflict — this
 * device holds edits *newer* than the cloud copy, so blindly applying the remote
 * would clobber unsynced local work (the "last-write-wins" footgun).
 *
 * When it does adopt the remote, it returns a UNION (remote ∪ local-only items)
 * via {@link mergeJournals} so non-conflicting local edits aren't dropped.
 *
 * Returns the data to adopt, or `null` to keep the local journal untouched.
 * `confirm` is injectable so the logic is unit-testable without a DOM.
 */
export function resolveIncoming(
  local: JournalData,
  remote: JournalData,
  ask: (msg: string) => boolean = (m) => (typeof confirm === 'function' ? confirm(m) : true),
): JournalData | null {
  const l = local.updatedAt
  const r = remote.updatedAt
  // Local has unsynced edits newer than the cloud copy → ask before overwriting.
  if (l && (!r || l > r)) {
    const useCloud = ask(
      'Sync conflict: this device has changes newer than the cloud copy.\n\n' +
        'OK = replace this device with the cloud version\n' +
        'Cancel = keep this device’s changes (they sync up on the next change)',
    )
    // Even on confirm, union local-only items so the user doesn't lose them.
    return useCloud ? mergeJournals(remote, local) : null
  }
  return mergeJournals(remote, local)
}
