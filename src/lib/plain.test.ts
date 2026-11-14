import { describe, expect, it } from 'vitest'
import { plain } from './plain'

describe('plain, copy without symbols', () => {
  it.each([
    ['3×12', '3 sets of 12'],
    ['3x10 per side', '3 sets of 10 per side'],
    ['3×45s', '3 sets of 45 s'],
    ['Three or four sets each, 8–12 reps', 'Three or four sets each, 8 to 12 reps'],
    ['Full body · no kit', 'Full body, no kit'],
    ['Tuck the pelvis — hold it', 'Tuck the pelvis, hold it'],
    ['25–50 progression reps', '25 to 50 progression reps'],
    ['Vegetables, 5× this week', 'Vegetables, 5 times this week'],
    ['5/10 ↑ from 4.7', '5 of 10 up from 4.7'],
    ['avg 4.8/10 · swing ±1.98', 'avg 4.8 of 10, swing 1.98'],
    ['4/7 this week — do it today', '4 of 7 this week, do it today'],
    ['33% (13/40)', '33% (13 of 40)'],
    ['due 11/13/2026', 'due 11/13/2026'],
  ])('%s', (from, to) => expect(plain(from)).toBe(to))

  it('leaves no symbol behind in any home routine or exercise', async () => {
    const { HOME_ROUTINES } = await import('./homeProgramming')
    const { HOME_EXERCISES } = await import('./homeExercises')
    const text = [...HOME_ROUTINES.flatMap((r) => [r.name, r.focus, r.needs, r.how]), ...HOME_EXERCISES.flatMap((e) => [e.name, e.reps])]
    expect(text.map(plain).filter((t) => /[→×…–—·]/.test(t))).toEqual([])
  })
})
