/**
 * THE CYCLE EGRESS BOUNDARY.
 *
 * Named for the failures, because this is the one area of the app where being
 * wrong is not a cosmetic bug: a period log reaching a server the user did not
 * knowingly choose is the thing the disclaimer promises cannot happen.
 */
import { describe, expect, it } from 'vitest'
import { applyBackup, buildBackup, checkBackup, forEgress, forNetwork, mergePulled } from './cyclePrivacy'
import { mergeJournals } from './conflict'
import { emptyJournal } from './storage'
import type { CyclePoint, JournalData } from './types'

const day = (date: string, flags: string[] = ['period'], temp?: number): CyclePoint => ({ date, flags, temp })

function journal(cycle: CyclePoint[]): JournalData {
  return { ...emptyJournal(), cycle }
}

describe('nothing leaves the device unless the user opted in', () => {
  it('withholds the cycle log from a network payload by default', () => {
    const out = forNetwork(journal([day('2026-09-01'), day('2026-09-02')]))
    expect(out.cycle).toEqual([])
  })

  it('withholds it even when the journal is otherwise full', () => {
    const j = journal([day('2026-09-01')])
    j.updatedAt = '2026-09-01T00:00:00.000Z'
    expect(forNetwork(j).cycle).toEqual([])
    expect(forNetwork(j).updatedAt).toBe('2026-09-01T00:00:00.000Z')
  })

  it('leaves the rest of the journal untouched when it strips', () => {
    const j = journal([day('2026-09-01')])
    j.entries = [{ id: 'e1', date: '2026-09-01', type: 'note', text: 'hi', status: 'open', important: false, memory: false, tags: [], createdAt: '2026-09-01' }]
    const out = forNetwork(j)
    expect(out.entries).toHaveLength(1)
    expect(out.cycle).toEqual([])
  })

  it('has no setting that could turn the promise off', () => {
    // If this ever fails, the disclaimer text has to change in the same commit.
    const j = journal([day('2026-09-01')]) as JournalData & { settings: Record<string, unknown> }
    j.settings.cycleSync = true
    expect(forNetwork(j).cycle).toEqual([])
  })
})

describe('forEgress is the only door, and it carries both rules', () => {
  /**
   * COD-265. Four push paths each remembered the cycle rule and all four forgot
   * the secrets rule, so a GitHub PAT was written into the gist it
   * authenticates to. One function now carries both; these pin what it does.
   */
  const withSecrets = (): JournalData => {
    const j = journal([day('2026-09-01')])
    j.settings.githubToken = 'ghp_realtoken'
    j.settings.selfHostToken = 'eyJhbGciOi.jwt'
    j.settings.googleClientId = '123.apps.googleusercontent.com'
    j.settings.googleEmail = 'someone@example.com'
    j.settings.selfHostUrl = 'https://my-server:8443'
    return j
  }

  it('drops the cycle log and every sync secret in one pass', () => {
    const out = forEgress(withSecrets())
    expect(out.cycle).toEqual([])
    expect(out.settings.githubToken).toBeUndefined()
    expect(out.settings.selfHostToken).toBeUndefined()
    expect(out.settings.googleClientId).toBeUndefined()
    expect(out.settings.googleEmail).toBeUndefined()
    expect(out.settings.selfHostUrl).toBeUndefined()
  })

  it('does not mutate the journal it was handed', () => {
    // The live journal still needs its own tokens — this is the payload, not
    // the state. `forNetwork` returns the same object when there is nothing to
    // strip, so a careless copy here would have reached into the store.
    const j = withSecrets()
    forEgress(j)
    expect(j.settings.githubToken).toBe('ghp_realtoken')
    expect(j.cycle).toHaveLength(1)
  })

  it('keeps everything that is not a secret or a cycle day', () => {
    const j = withSecrets()
    j.settings.theme = 'latte'
    j.updatedAt = '2026-09-01T00:00:00.000Z'
    const out = forEgress(j)
    expect(out.settings.theme).toBe('latte')
    expect(out.updatedAt).toBe('2026-09-01T00:00:00.000Z')
  })

  it('leaves THIS device its token after pulling a payload that has none', () => {
    // The thing that would break if stripping were wrong: self-host sync pushes
    // a journal without its own JWT, then pulls it back. `mergeJournals`
    // spreads `{...loser.settings, ...winner.settings}`, so a key the winner
    // omits keeps the loser's value. Asserted, not reasoned about.
    const local = withSecrets()
    const pulledBack = forEgress(local)
    const merged = mergeJournals(pulledBack, local)
    expect(merged.settings.selfHostToken).toBe('eyJhbGciOi.jwt')
    expect(merged.settings.githubToken).toBe('ghp_realtoken')
  })
})

describe('withheld is not deleted', () => {
  /**
   * The failure this prevents: device A has sync off, so it uploads `cycle: []`.
   * Device B pulls that and erases its own log. Stripping on the way out is only
   * half a boundary.
   */
  it('keeps the local log when the remote arrives empty', () => {
    const local = journal([day('2026-09-01'), day('2026-09-02')])
    const remote = journal([])
    expect(mergePulled(local, remote).cycle).toHaveLength(2)
  })

  it('refuses to let a remote that somehow carries cycle data overwrite this device', () => {
    // A hand-edited server row, or a client older than this boundary.
    const local = journal([day('2026-09-01')])
    const remote = journal([day('2026-08-01'), day('2026-08-02')])
    expect(mergePulled(local, remote).cycle.map((e) => e.date)).toEqual(['2026-09-01'])
  })

  it('does not resurrect a log the user deleted locally when neither side has one', () => {
    expect(mergePulled(journal([]), journal([])).cycle).toEqual([])
  })
})

describe('backup round-trips, and refuses a stranger', () => {
  const log = [day('2026-09-01'), day('2026-09-02'), day('2026-09-20', ['pms'], 97.8)]

  it('carries the temperature unit with the readings', () => {
    const j = journal(log)
    j.settings.tempUnit = 'C'
    // Without the unit a °C backup restored on an °F device reads as a fever.
    expect(buildBackup(j).tempUnit).toBe('C')
  })

  it('counts days and period runs for the import preview', () => {
    const check = checkBackup(buildBackup(journal(log)))
    expect(check.ok).toBe(true)
    expect(check.days).toBe(3)
    expect(check.cycles).toBe(1)
  })

  it('round-trips the log byte-for-byte through replace', () => {
    const backup = buildBackup(journal(log))
    const parsed = checkBackup(JSON.parse(JSON.stringify(backup)))
    expect(parsed.ok).toBe(true)
    expect(applyBackup([], parsed.backup!, 'replace')).toEqual(log)
  })

  it('refuses a file that is not a bujo cycle backup', () => {
    expect(checkBackup({ kind: 'something-else' }).ok).toBe(false)
    expect(checkBackup(null).ok).toBe(false)
    expect(checkBackup('{}').ok).toBe(false)
  })

  it('refuses a backup from a newer schema rather than guessing', () => {
    const r = checkBackup({ kind: 'bujo-cycle-backup', version: 99, cycle: [] })
    expect(r.ok).toBe(false)
    expect(r.problem).toMatch(/newer version/)
  })

  it('refuses entries it cannot read', () => {
    const r = checkBackup({ kind: 'bujo-cycle-backup', version: 1, cycle: [{ date: 1 }] })
    expect(r.ok).toBe(false)
  })
})

describe('merge never silently overwrites what is already here', () => {
  it('keeps the LOCAL entry when both have the same date', () => {
    const local = [day('2026-09-01', ['period', 'cramps'], 98.1)]
    const backup = buildBackup(journal([day('2026-09-01', ['spotting'], 97.0)]))
    const merged = applyBackup(local, backup, 'merge')
    expect(merged).toHaveLength(1)
    expect(merged[0].flags).toEqual(['period', 'cramps'])
    expect(merged[0].temp).toBe(98.1)
  })

  it('adds dates the local log does not have, in date order', () => {
    const local = [day('2026-09-05')]
    const backup = buildBackup(journal([day('2026-09-01'), day('2026-09-09')]))
    expect(applyBackup(local, backup, 'merge').map((e) => e.date))
      .toEqual(['2026-09-01', '2026-09-05', '2026-09-09'])
  })

  it('replace does exactly that, because the user chose it', () => {
    const backup = buildBackup(journal([day('2026-08-01')]))
    expect(applyBackup([day('2026-09-01')], backup, 'replace').map((e) => e.date)).toEqual(['2026-08-01'])
  })
})
