import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider, useJournal } from './store'
import { todayISO } from './lib/date'

/**
 * WHAT A RELAPSE MUST NOT COST YOU.
 *
 * `logRelapse` built a fresh `Streak` out of three fields — `startedOn`, `best`,
 * `relapses` — with no `...d.nofap` in front of them, so logging a relapse
 * deleted the other six: every resisted urge ever logged, every if-then trigger
 * plan, every independently-tracked addiction with its own streak and personal
 * best, the per-day cost, and the quit-date commitment contract.
 *
 * Nothing failed. The types are all optional (`urgeLog?`, `plans?`,
 * `addictions?`), so dropping them is not a type error; the page re-rendered
 * with empty lists, which reads exactly like "you have not logged any yet"; and
 * it only fires on the one action a user takes when they have just relapsed and
 * are least able to notice, let alone afford it.
 *
 * So the test drives the real store through the real actions rather than
 * asserting on a hand-built object: every field is put there by the writer that
 * owns it, which is the only way to be sure the assertion covers what the app
 * actually stores.
 *
 * The day log (`logLapseDay`) is pinned in the same file because it is the
 * second writer of `nofap.relapses` and the only one that *edits* a row rather
 * than pushing one. Its quantity lives on `Relapse.count`, so it adds no field
 * to `Streak` and nothing new for the spread above to drop — but the count still
 * has to survive a later relapse, which is asserted below.
 */
function NofapProbe() {
  const { data, logRelapse, resistUrge, addTriggerPlan, addAddiction, setStreakCost, setCommitment, logLapseDay } = useJournal()
  const s = data.nofap
  const today = todayISO()
  const ad = (s.addictions ?? [])[0]
  return (
    <div>
      <button onClick={() => resistUrge({ trigger: 'boredom', intensity: 3 })}>resist</button>
      <button onClick={() => addTriggerPlan({ addiction: 'Smoking', trigger: 'after meals', coping: 'walk' })}>plan</button>
      <button onClick={() => addAddiction('Smoking')}>addiction</button>
      <button onClick={() => setStreakCost(7)}>cost</button>
      <button onClick={() => setCommitment({ quitDate: '2026-01-01', reason: 'sleep' })}>commit</button>
      <button onClick={() => logRelapse({ date: '2026-06-10', trigger: 'stress', note: 'late night' })}>relapse</button>
      <button onClick={() => logLapseDay(null)}>tap</button>
      <button onClick={() => logLapseDay(null, -1)}>untap</button>
      <button onClick={() => logLapseDay(ad?.id ?? null)}>tap addiction</button>

      <div data-testid="urges">{(s.urgeLog ?? []).length}</div>
      <div data-testid="plans">{(s.plans ?? []).length}</div>
      <div data-testid="addictions">{(s.addictions ?? []).map((a) => a.name).join(',')}</div>
      <div data-testid="cost">{String(s.costPerDay ?? '')}</div>
      <div data-testid="commitment">{s.commitment?.reason ?? ''}</div>
      <div data-testid="relapses">{s.relapses.length}</div>
      <div data-testid="startedOn">{s.startedOn}</div>
      <div data-testid="count">{String(s.relapses.find((r) => r.date === today)?.count ?? 0)}</div>
      <div data-testid="ad-resets">{ad?.relapses.length ?? 0}</div>
      <div data-testid="ad-count">{String(ad?.relapses.find((r) => r.date === today)?.count ?? 0)}</div>
    </div>
  )
}

const read = (id: string) => screen.getByTestId(id).textContent

/**
 * `JournalProvider` hydrates from `localStorage`, so without this a tap in one
 * test is still on the streak in the next — and the second test would read a
 * count it never logged and pass for the wrong reason.
 */
beforeEach(() => localStorage.clear())

function mount() {
  const user = userEvent.setup()
  render(
    <JournalProvider>
      <NofapProbe />
    </JournalProvider>,
  )
  return { user }
}

describe('logRelapse', () => {
  it('resets the streak without deleting everything else on it', async () => {
    const user = userEvent.setup()
    render(
      <JournalProvider>
        <NofapProbe />
      </JournalProvider>,
    )

    for (const label of ['resist', 'plan', 'addiction', 'cost', 'commit']) {
      await user.click(screen.getByText(label))
    }
    // Precondition, asserted rather than assumed: if the setup silently failed,
    // every check below would pass against empty state and this test would be
    // worse than not having one.
    expect(read('urges')).toBe('1')
    expect(read('plans')).toBe('1')
    expect(read('addictions')).toBe('Smoking')
    expect(read('cost')).toBe('7')
    expect(read('commitment')).toBe('sleep')

    await user.click(screen.getByText('relapse'))

    // What a relapse IS allowed to change.
    expect(read('relapses')).toBe('1')
    expect(read('startedOn')).toBe('2026-06-10')

    // What it must leave alone. Each of these was silently zeroed.
    expect(read('urges')).toBe('1')
    expect(read('plans')).toBe('1')
    expect(read('addictions')).toBe('Smoking')
    expect(read('cost')).toBe('7')
    expect(read('commitment')).toBe('sleep')
  })

  it('keeps a day count already logged on another day', async () => {
    // The quantity rides on a `Relapse` row, so it survives only because the
    // spread keeps `relapses`. Same class of loss, one level in.
    const { user } = mount()
    await user.click(screen.getByText('tap'))
    await user.click(screen.getByText('tap'))
    expect(read('count')).toBe('2')

    await user.click(screen.getByText('relapse'))

    expect(read('relapses')).toBe('2')
    expect(read('count')).toBe('2')
  })
})

describe('logLapseDay', () => {
  it('counts ten taps as one lapse day of ten, not ten resets', async () => {
    const { user } = mount()
    for (let i = 0; i < 10; i++) await user.click(screen.getByText('tap'))
    expect(read('relapses')).toBe('1')
    expect(read('count')).toBe('10')
    expect(read('startedOn')).toBe(todayISO())
  })

  it('walks an over-tap back to one and no further', async () => {
    const { user } = mount()
    for (let i = 0; i < 3; i++) await user.click(screen.getByText('tap'))
    expect(read('count')).toBe('3')
    for (let i = 0; i < 3; i++) await user.click(screen.getByText('untap'))
    expect(read('count')).toBe('1')
    expect(read('relapses')).toBe('1')
  })

  it('cannot start a lapse day with a minus tap on a clean day', async () => {
    const { user } = mount()
    const started = read('startedOn')
    await user.click(screen.getByText('untap'))
    expect(read('relapses')).toBe('0')
    expect(read('startedOn')).toBe(started)
  })

  it('logs against the addiction it was handed, leaving the primary streak clean', async () => {
    const { user } = mount()
    await user.click(screen.getByText('addiction'))
    await user.click(screen.getByText('tap addiction'))
    await user.click(screen.getByText('tap addiction'))
    expect(read('ad-resets')).toBe('1')
    expect(read('ad-count')).toBe('2')
    expect(read('relapses')).toBe('0')
  })
})
