import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider, useJournal } from './store'

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
 */
function NofapProbe() {
  const { data, logRelapse, resistUrge, addTriggerPlan, addAddiction, setStreakCost, setCommitment } = useJournal()
  const s = data.nofap
  return (
    <div>
      <button onClick={() => resistUrge({ trigger: 'boredom', intensity: 3 })}>resist</button>
      <button onClick={() => addTriggerPlan({ addiction: 'Smoking', trigger: 'after meals', coping: 'walk' })}>plan</button>
      <button onClick={() => addAddiction('Smoking')}>addiction</button>
      <button onClick={() => setStreakCost(7)}>cost</button>
      <button onClick={() => setCommitment({ quitDate: '2026-01-01', reason: 'sleep' })}>commit</button>
      <button onClick={() => logRelapse({ date: '2026-06-10', trigger: 'stress', note: 'late night' })}>relapse</button>

      <div data-testid="urges">{(s.urgeLog ?? []).length}</div>
      <div data-testid="plans">{(s.plans ?? []).length}</div>
      <div data-testid="addictions">{(s.addictions ?? []).map((a) => a.name).join(',')}</div>
      <div data-testid="cost">{String(s.costPerDay ?? '')}</div>
      <div data-testid="commitment">{s.commitment?.reason ?? ''}</div>
      <div data-testid="relapses">{s.relapses.length}</div>
      <div data-testid="startedOn">{s.startedOn}</div>
    </div>
  )
}

const read = (id: string) => screen.getByTestId(id).textContent

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
})
