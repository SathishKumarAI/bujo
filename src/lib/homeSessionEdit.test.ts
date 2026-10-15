import { describe, expect, it } from 'vitest'
import { splitSessionLine, homeSetRows } from './homeExercises'

/**
 * A session you logged wrong used to be deletable and nothing else, so these
 * assert the round trip the editor depends on: a stored line splits back into
 * the two fields the form owns, and what the form writes back is the same
 * shape the logger wrote in the first place.
 */
describe('a stored line splits back into name and reps', () => {
  it('splits at the rep spec, not at the last space', () => {
    // A movement name has spaces in it and a spec does not start with one.
    expect(splitSessionLine('Single-leg glute bridge 3×15')).toEqual({ name: 'Single-leg glute bridge', reps: '3×15' })
    expect(splitSessionLine('Push-ups 3×12')).toEqual({ name: 'Push-ups', reps: '3×12' })
    expect(splitSessionLine('Dead bug 3×10/side')).toEqual({ name: 'Dead bug', reps: '3×10/side' })
    expect(splitSessionLine('Plank 3×30s')).toEqual({ name: 'Plank', reps: '3×30s' })
  })

  it('reads a line it cannot parse as all name', () => {
    // Keeps a hand-typed note editable instead of silently dropping it.
    expect(splitSessionLine('felt strong today')).toEqual({ name: 'felt strong today', reps: '' })
  })

  it('round-trips every line the logger writes', () => {
    const items = [{ name: 'Push-ups', reps: '3×12' }, { name: 'Plank', reps: '3×30s' }]
    const stored = items.map((i) => `${i.name} ${i.reps}`)
    expect(stored.map(splitSessionLine)).toEqual(items)
  })

  it('rebuilds the structured rows from the edited lines', () => {
    // The edit rewrites BOTH stored shapes. Rewriting the strings alone would
    // leave the muscle analytics reporting the pre-edit numbers for ever.
    const edited = [{ name: 'Push-ups', reps: '4×15' }]
    const rows = homeSetRows(edited)
    expect(rows).toHaveLength(4)
    expect(rows.every((r) => r.exercise === 'Push-ups' && r.reps === 15 && r.weight === 0)).toBe(true)
  })
})
