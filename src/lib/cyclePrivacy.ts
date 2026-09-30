/**
 * CYCLE PRIVACY · the one place that decides whether cycle data may leave.
 *
 * ## Why this file exists rather than a separate cycle store
 *
 * The obvious reading of "all cycle reads and writes go through one storage
 * module" is a second persistence layer for `data.cycle`. That would be wrong
 * here. This app keeps **one journal blob** (`localStorage['bujo:data']`), and
 * export, undo, encryption-at-rest and restore all operate on it as a unit.
 * Splitting one domain out would give cycle data its own private failure modes
 * — an export that silently omits it, an undo that restores half a day — in
 * exchange for a boundary that is really about *egress*, not storage.
 *
 * So the boundary is drawn where the risk actually is: **nothing leaves the
 * device without passing through here.**
 *
 * ## What was true before this file
 *
 * `cycle: CyclePoint[]` is a field of `JournalData`, and every sync path takes
 * the whole object:
 *
 * | Path | Destination | Encrypted |
 * |---|---|---|
 * | `bujocloud.pushCloud` | `POST /api/sync` | yes, client-side passphrase |
 * | `serverSync.pushJournalToServer` | self-hosted PostgREST | **no** |
 * | `github.pushGist` | a GitHub gist | no |
 * | `fscloud.saveToFolder` | a local folder | n/a — never leaves the device |
 *
 * All are opt-in and off by default, but a user who had enabled one was
 * uploading their cycle log without the page ever having said so.
 *
 * ## The rule
 *
 * Cycle data is **excluded from every network path, unconditionally**. Not by
 * default — always. There is no setting, because the page makes an absolute
 * promise ("never uploaded, synced, or sent to us or anyone else") and a
 * promise with a toggle beside it is not a promise.
 *
 * `fscloud` is deliberately NOT stripped: a folder on this machine is this
 * device, and that path is how "Export backup" keeps working.
 */
import type { CyclePoint, JournalData } from './types'

/**
 * The payload to send, with the cycle log removed. Always.
 *
 * **There is deliberately no opt-in.** An earlier draft of this gated it on a
 * `settings.cycleSync` switch, which was wrong: the page tells the user
 * "It is never uploaded, synced, or sent to us or anyone else", and a setting
 * that can falsify that sentence makes it a lie for exactly the users who most
 * needed it to be true. A promise with a toggle is not a promise. If cycle
 * sync is ever wanted, the disclaimer has to change first and this function is
 * where the change lands.
 *
 * Returns the SAME object when there is nothing to strip, so the common path
 * allocates nothing; callers must not assume a copy.
 */
export function forNetwork<T extends JournalData>(data: T): T {
  if (!data.cycle?.length) return data
  return { ...data, cycle: [] }
}

/**
 * Merge a pulled journal over the local one **without letting a remote wipe the
 * local cycle log**.
 *
 * The subtle failure this prevents: this device uploads `cycle: []` because the
 * log is withheld. Another device pulls that and, taking the payload at face
 * value, erases its own log. Stripping on the way out is only half a boundary —
 * the other half is refusing to treat "absent because withheld" as "deleted".
 */
export function mergePulled(local: JournalData, pulled: JournalData): JournalData {
  // A pulled journal can never legitimately carry cycle data — nothing this app
  // runs uploads it. So the local log always wins, and a remote that DOES carry
  // some (a hand-edited server row, an older client from before this boundary)
  // is not allowed to overwrite what is on this device.
  if (local.cycle?.length) return { ...pulled, cycle: local.cycle }
  return { ...pulled, cycle: [] }
}

/** Schema version stamped into an export, so an import can refuse a stranger. */
export const CYCLE_BACKUP_VERSION = 1

export interface CycleBackup {
  kind: 'bujo-cycle-backup'
  version: number
  exportedAt: string
  tempUnit: string
  cycle: CyclePoint[]
}

/** Everything needed to restore the cycle log, and nothing else from the journal. */
export function buildBackup(data: JournalData, now = new Date()): CycleBackup {
  return {
    kind: 'bujo-cycle-backup',
    version: CYCLE_BACKUP_VERSION,
    exportedAt: now.toISOString(),
    // The unit travels with the readings. Without it a °C backup restored on an
    // °F device reads as a catastrophic fever and the chart is nonsense.
    tempUnit: data.settings?.tempUnit ?? 'F',
    cycle: data.cycle ?? [],
  }
}

export interface BackupCheck {
  ok: boolean
  /** Why it was refused, for the user — not a stack trace. */
  problem?: string
  backup?: CycleBackup
  /** Counts to show before anything is written. */
  days?: number
  cycles?: number
}

/**
 * Validate a parsed file before any of it is trusted.
 *
 * Deliberately strict about `kind` and shape and deliberately *lenient* about
 * unknown extra fields: a backup taken by a later version of the app should
 * restore its days here rather than be refused wholesale, and a `CyclePoint`
 * only ever gains optional fields.
 */
export function checkBackup(parsed: unknown): BackupCheck {
  if (typeof parsed !== 'object' || parsed === null) return { ok: false, problem: 'That file is not a backup.' }
  const b = parsed as Partial<CycleBackup>
  if (b.kind !== 'bujo-cycle-backup') return { ok: false, problem: 'That file is not a bujo cycle backup.' }
  if (typeof b.version !== 'number' || b.version > CYCLE_BACKUP_VERSION) {
    return { ok: false, problem: `That backup was written by a newer version of bujo (v${String(b.version)}).` }
  }
  if (!Array.isArray(b.cycle)) return { ok: false, problem: 'That backup has no cycle data in it.' }
  const bad = b.cycle.find((e) => typeof e?.date !== 'string' || !Array.isArray(e?.flags))
  if (bad) return { ok: false, problem: 'That backup has entries this version cannot read.' }
  const days = b.cycle.length
  const cycles = countPeriodRuns(b.cycle)
  return { ok: true, backup: b as CycleBackup, days, cycles }
}

/** Period runs in a log — the "3 cycles, 84 days" the import preview promises. */
function countPeriodRuns(entries: CyclePoint[]): number {
  const dates = entries.filter((e) => e.flags.includes('period')).map((e) => e.date).sort()
  let runs = 0
  let prev: string | null = null
  for (const d of dates) {
    const consecutive = prev != null && Date.parse(d) - Date.parse(prev) <= 86_400_000 * 1.5
    if (!consecutive) runs++
    prev = d
  }
  return runs
}

/**
 * Apply a validated backup.
 *
 * `replace` swaps the log wholesale. `merge` keeps both, and on a date collision
 * the **existing** entry wins — an import must never silently overwrite
 * something the user typed today with something from a file they forgot the
 * contents of. That is the asymmetry the two-option prompt exists to express.
 */
export function applyBackup(
  local: CyclePoint[],
  backup: CycleBackup,
  mode: 'replace' | 'merge',
): CyclePoint[] {
  if (mode === 'replace') return [...backup.cycle]
  const byDate = new Map(backup.cycle.map((e) => [e.date, e]))
  for (const e of local) byDate.set(e.date, e)
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1))
}
