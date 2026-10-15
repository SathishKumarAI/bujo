import { generateDemoData } from './demo'
import { describe, expect, it, vi } from 'vitest'
import { resolveIncoming, mergeJournals } from './conflict'
import { emptyJournal } from './storage'

const at = (iso?: string) => ({ ...emptyJournal(), updatedAt: iso })
const entry = (id: string, date = '2026-06-15', text = id) => ({
  id, date, type: 'note' as const, text, status: 'open' as const,
  important: false, memory: false, tags: [], createdAt: date,
})

describe('resolveIncoming', () => {
  it('adopts remote when it is newer (normal sync, no prompt)', async () => {
    const ask = vi.fn(() => false)
    const local = at('2026-06-15T10:00:00.000Z')
    const remote = at('2026-06-15T12:00:00.000Z')
    await expect(resolveIncoming(local, remote, ask)).resolves.toMatchObject({ updatedAt: '2026-06-15T12:00:00.000Z' })
    expect(ask).not.toHaveBeenCalled()
  })

  it('adopts remote when neither side is stamped (legacy)', async () => {
    const ask = vi.fn(() => false)
    await expect(resolveIncoming(at(undefined), at(undefined), ask)).resolves.toMatchObject({ updatedAt: undefined })
    expect(ask).not.toHaveBeenCalled()
  })

  /**
   * ── These three used to assert the prompt, and the prompt is gone ────────
   *
   * It fired whenever local was newer than the cloud copy, which is the
   * EXPECTED state after any offline edit rather than a conflict. Edit on a
   * plane, land, reconnect, and a destructive-styled dialog asked whether to
   * throw away your own work — and `onAuthChange` does not filter the event
   * type, so a routine token refresh could pop it mid-sentence.
   *
   * What makes removing it an improvement rather than a shortcut is that both
   * of its answers could lose data and the union cannot:
   *
   *   cancel  -> `null`, keeping local and discarding the remote entirely,
   *              so anything written on the other device was gone.
   *   confirm -> the OLDER side won every scalar, overwriting the newer edits
   *              it had just asked you to protect.
   *
   * So the assertions move from "it asked" to "nothing was lost either way",
   * which is the property that actually matters.
   */
  it('never prompts when local is newer — it unions instead', async () => {
    const ask = vi.fn(() => false)
    const local = { ...at('2026-06-15T12:00:00.000Z'), entries: [entry('local-only')] }
    const remote = { ...at('2026-06-15T10:00:00.000Z'), entries: [entry('remote-only')] }
    const out = (await resolveIncoming(local, remote, ask))!
    expect(ask).not.toHaveBeenCalled()
    // Never null: null meant "discard the remote", which is the loss.
    expect(out).not.toBeNull()
    // The newer side wins the stamp, and BOTH sides' entries survive.
    expect(out.updatedAt).toBe('2026-06-15T12:00:00.000Z')
    expect(out.entries.map((e) => e.id).sort()).toEqual(['local-only', 'remote-only'])
  })

  it('does not let an older remote overwrite newer local work', async () => {
    // The old confirm branch did exactly this. It is the reason the dialog was
    // worse than no dialog: the reassuring answer was the destructive one.
    const local = at('2026-06-15T12:00:00.000Z')
    const remote = at('2026-06-15T10:00:00.000Z')
    const out = (await resolveIncoming(local, remote))!
    expect(out.updatedAt).toBe('2026-06-15T12:00:00.000Z')
  })

  it('treats an unstamped remote as older, and keeps both sides', async () => {
    // A journal with no `updatedAt` has never synced. Local wins the stamp;
    // the remote's items still come across.
    const ask = vi.fn(() => true)
    const local = { ...at('2026-06-15T12:00:00.000Z'), entries: [entry('mine')] }
    const remote = { ...at(undefined), entries: [entry('theirs')] }
    const out = (await resolveIncoming(local, remote, ask))!
    expect(ask).not.toHaveBeenCalled()
    expect(out.updatedAt).toBe('2026-06-15T12:00:00.000Z')
    expect(out.entries.map((e) => e.id).sort()).toEqual(['mine', 'theirs'])
  })

  it('keeps local-only entries when adopting a newer remote (no silent loss)', async () => {
    const local = { ...at('2026-06-15T10:00:00.000Z'), entries: [entry('a'), entry('local-only')] }
    const remote = { ...at('2026-06-15T12:00:00.000Z'), entries: [entry('a'), entry('remote-only')] }
    const out = (await resolveIncoming(local, remote))!
    const ids = out.entries.map((e) => e.id).sort()
    expect(ids).toEqual(['a', 'local-only', 'remote-only'])
    expect(out.updatedAt).toBe('2026-06-15T12:00:00.000Z') // remote wins the stamp
  })
})

describe('mergeJournals', () => {
  it('winner version wins on id collision', () => {
    const winner = { ...emptyJournal(), entries: [entry('a', '2026-06-15', 'WIN')] }
    const loser = { ...emptyJournal(), entries: [entry('a', '2026-06-15', 'lose')] }
    const out = mergeJournals(winner, loser)
    expect(out.entries).toHaveLength(1)
    expect(out.entries[0].text).toBe('WIN')
  })

  it('unions date-keyed collections and fills map-only keys', () => {
    const winner = { ...emptyJournal(), metrics: [{ date: '2026-06-15', mood: 8 }], habitLog: { '2026-06-15': ['h1'] } }
    const loser = { ...emptyJournal(), metrics: [{ date: '2026-06-14', mood: 5 }], habitLog: { '2026-06-14': ['h2'] } }
    const out = mergeJournals(winner, loser)
    expect(out.metrics.map((m) => m.date).sort()).toEqual(['2026-06-14', '2026-06-15'])
    expect(out.habitLog).toEqual({ '2026-06-14': ['h2'], '2026-06-15': ['h1'] })
  })

  it('unions nofap dated logs but keeps winner scalars', () => {
    const rel = (id: string, date: string) => ({ id, date, trigger: '', note: '' })
    const winner = { ...emptyJournal(), nofap: { startedOn: '2026-06-10', best: 30, relapses: [rel('r1', '2026-06-09')], urgeLog: [], plans: [] } }
    const loser = { ...emptyJournal(), nofap: { startedOn: '2026-06-01', best: 5, relapses: [rel('r2', '2026-05-20')], urgeLog: [], plans: [] } }
    const out = mergeJournals(winner, loser)
    expect(out.nofap.startedOn).toBe('2026-06-10') // winner scalar
    expect(out.nofap.best).toBe(30)
    expect(out.nofap.relapses.map((r) => r.id).sort()).toEqual(['r1', 'r2']) // union
  })
})

describe('mergeJournals · no collection is left behind', () => {
  /**
   * The regression guard for the bug this was written after: `ID_ARRAYS` is a
   * hand-maintained list, `JournalData` grows feature by feature, and a
   * collection missing from the list is not merged — it falls through to the
   * winner and the loser's rows vanish with no error. `typingSessions`,
   * `customGoals` and `mindsetFocus` were all missing at once.
   *
   * Derived from `emptyJournal()` rather than a hand-written fixture, so a
   * collection added tomorrow is covered without anyone remembering to.
   */
  it('keeps a loser-only item in EVERY array collection of an empty journal', () => {
    const winner = { ...emptyJournal(), updatedAt: '2026-06-15T12:00:00.000Z' }
    const loser = { ...emptyJournal(), updatedAt: '2026-06-15T10:00:00.000Z' } as Record<string, unknown>

    // One synthetic row per array collection, carrying every key the merge might
    // join on (`id`, `date`, `ym`) so it is unique whichever rule applies.
    const arrayKeys = Object.entries(loser)
      .filter(([, v]) => Array.isArray(v))
      .map(([k]) => k)
    expect(arrayKeys.length).toBeGreaterThan(15) // sanity: we found the collections

    for (const k of arrayKeys) {
      loser[k] = [{ id: `only-${k}`, date: '2026-01-01', ym: '2026-01', flags: [] }]
    }

    const out = mergeJournals(winner, loser as never) as unknown as Record<string, unknown[]>

    const dropped = arrayKeys.filter((k) => (out[k] ?? []).length === 0)
    expect(dropped, `mergeJournals dropped loser-only rows from: ${dropped.join(', ')}. Add them to ID_ARRAYS or KEYED_ARRAYS in conflict.ts`).toEqual([])
  })

  it('unions the data logs hidden inside settings', () => {
    const winner = { ...emptyJournal(), updatedAt: '2026-06-15T12:00:00.000Z' }
    winner.settings = { ...winner.settings, duprLog: [{ date: '2026-06-15', rating: 4.0 }], programDone: ['w1d1'] }
    const loser = { ...emptyJournal(), updatedAt: '2026-06-15T10:00:00.000Z' }
    loser.settings = { ...loser.settings, duprLog: [{ date: '2026-06-14', rating: 3.75 }], programDone: ['w1d2'] }

    const out = mergeJournals(winner, loser)
    expect(out.settings.duprLog?.map((d) => d.date).sort()).toEqual(['2026-06-14', '2026-06-15'])
    expect(out.settings.programDone?.sort()).toEqual(['w1d1', 'w1d2'])
  })

  it('does not invent settings log keys on journals that never had them', () => {
    const out = mergeJournals(emptyJournal(), emptyJournal())
    expect(out.settings.duprLog).toBeUndefined()
    expect(out.settings.programDone).toBeUndefined()
    expect(out.settings.programActuals).toBeUndefined()
  })
})

describe('a map-shaped collection survives a merge too', () => {
  /**
   * THE HOLE THE ARRAY GUARD ABOVE STRUCTURALLY CANNOT SEE.
   *
   * That test derives its key list with `Array.isArray`, so a collection
   * stored as `Record<string, …>` is invisible to it — and `MAPS` in
   * `conflict.ts` is a hand-written list, which is the other half of the same
   * problem. `mindsetPractice` was missing from it: a merge took
   * `out = { ...winner }`, so every day the LOSING device had practised a
   * principle on was dropped, silently, with no error and nothing in the UI to
   * notice.
   *
   * ── Why this derives from the DEMO seed and not `emptyJournal()` ─────────
   *
   * Because `emptyJournal()` is where the array guard's blind spot came from.
   * Map collections are optional, so most of them are simply absent from an
   * empty journal — a guard built on it can only ever check the keys that
   * happen to be initialised, which is 5 of the 7 that exist. The demo seed is
   * the most populated journal available at runtime, so it is the closest
   * thing to the real key space a test can reach.
   *
   * It is still not the type. A map key that the seed never writes stays
   * invisible here, and the honest answer to that is the assertion below on
   * the count: if the seed stops populating these, this test says so instead
   * of quietly checking nothing.
   */
  const mapKeys = (j: Record<string, unknown>) =>
    Object.entries(j)
      .filter(([k, v]) =>
        // `settings` is merged field-by-field by its own rules above, not as a
        // map, so it is deliberately out of scope here.
        k !== 'settings' && v != null && typeof v === 'object' && !Array.isArray(v))
      .map(([k]) => k)

  it('keeps a loser-only day in EVERY map collection the demo seeds', () => {
    const seeded = generateDemoData() as unknown as Record<string, unknown>
    const keys = mapKeys(seeded)

    // The tripwire. A scan that silently matches nothing passes, and this repo
    // has shipped two of those.
    expect(keys.length, `found map keys: ${keys.join(', ')}`).toBeGreaterThan(3)

    const winner = { ...emptyJournal(), updatedAt: '2026-06-15T12:00:00.000Z' } as Record<string, unknown>
    const loser = { ...emptyJournal(), updatedAt: '2026-06-15T10:00:00.000Z' } as Record<string, unknown>
    for (const k of keys) {
      winner[k] = { '2026-01-01': ['winner-side'] }
      loser[k] = { '2026-01-01': ['winner-side'], '2026-02-02': ['loser-only'] }
    }

    const out = mergeJournals(winner as never, loser as never) as unknown as Record<string, Record<string, unknown>>

    const dropped = keys.filter((k) => out[k]?.['2026-02-02'] == null)
    expect(dropped, `merge dropped the loser's day from: ${dropped.join(', ')}`).toEqual([])
  })

  it('still lets the winner win on a key both sides hold', () => {
    // The other half of the rule. Union must not become "loser wins".
    const winner = { ...emptyJournal(), updatedAt: '2026-06-15T12:00:00.000Z', mindsetPractice: { d: ['w'] } }
    const loser = { ...emptyJournal(), updatedAt: '2026-06-15T10:00:00.000Z', mindsetPractice: { d: ['l'] } }
    const out = mergeJournals(winner as never, loser as never) as unknown as { mindsetPractice: Record<string, string[]> }
    expect(out.mindsetPractice.d).toEqual(['w'])
  })
})
