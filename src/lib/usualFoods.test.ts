import { describe, expect, it } from 'vitest'
import { togglePin, usualFoods } from './usualFoods'
import type { JournalData, LoggedFood } from './types'

const T = '2026-10-30'
const log = (name: string, servings = 1): LoggedFood => ({ id: name + servings, name, kcal: 100, protein: 1, carbs: 1, fat: 1, servings })
const journal = (days: Record<string, LoggedFood[]>, pinnedFoods?: string[]) =>
  ({ metrics: Object.entries(days).map(([date, foodLog]) => ({ date, foodLog })), settings: { pinnedFoods } }) as unknown as JournalData
const names = (j: JournalData) => usualFoods(j, { today: T }).map((f) => f.name)

describe('usualFoods', () => {
  it('starts a new journal on Indian staples, chicken curry first', () => {
    expect(names(journal({}))).toEqual(['Chicken curry', 'White rice (cooked)', 'Paneer (cubed)', 'Dal (lentil curry)', 'Roti / chapati', 'Idli', 'Plain dosa', 'Masala omelette', 'Boiled eggs', 'Poha'])
  })

  it('shows one rice row however many kinds you logged, and it is white rice', () => {
    const n = names(journal({ [T]: [log('Brown rice (cooked)'), log('Basmati rice (cooked)')] }))
    expect(n[0]).toBe('White rice (cooked)')
    expect(n.filter((x) => /rice/i.test(x))).toEqual(['White rice (cooked)'])
  })

  it('shows one paneer row', () => {
    expect(names(journal({ [T]: [log('Palak paneer')] })).filter((x) => /paneer/i.test(x))).toEqual(['Paneer (cubed)'])
  })

  it('moves with usage: what you log most comes first', () => {
    const n = names(journal({ [T]: [log('Idli', 3)], '2026-10-29': [log('Plain dosa'), log('Idli')] }))
    expect(n.slice(0, 2)).toEqual(['Idli', 'Plain dosa'])
  })

  it('puts pins first, and a pinned variant stands for its family', () => {
    const n = names(journal({ [T]: [log('Idli', 5)] }, ['Brown rice (cooked)', 'Boiled eggs']))
    expect(n.slice(0, 3)).toEqual(['Brown rice (cooked)', 'Boiled eggs', 'Idli'])
    expect(n.filter((x) => /rice/i.test(x))).toHaveLength(1)
  })

  it('keeps chicken curry, white rice and paneer however much else you log', () => {
    const lots = ['Idli', 'Poha', 'Sambar', 'Upma', 'Plain dosa', 'Masala omelette', 'Boiled eggs', 'Roti / chapati', 'Dal (lentil curry)', 'Curd rice', 'Greek yogurt']
    const n = names(journal({ [T]: lots.map((x) => log(x, 3)) }))
    expect(n).toHaveLength(10)
    expect(n).toEqual(expect.arrayContaining(['Chicken curry', 'White rice (cooked)', 'Paneer (cubed)']))
  })

  it('pins and unpins by name', () => {
    expect(togglePin(['A'], 'B')).toEqual(['A', 'B'])
    expect(togglePin(['A', 'B'], 'A')).toEqual(['B'])
  })
})
