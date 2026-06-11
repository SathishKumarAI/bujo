import { describe, it, expect } from 'vitest'
import { suggest, normalize, similarity, findDuplicates } from './suggest'

const ctx = {
  tags: ['travel', 'work', 'health'],
  recents: ['Book the campsite', 'Call mom', 'Buy groceries'],
  habits: ['Water', 'Exercise', 'Read'],
}

describe('suggest', () => {
  it('returns recents when the query is empty', () => {
    expect(suggest('', ctx).map((s) => s.value)).toEqual(['Book the campsite', 'Call mom', 'Buy groceries'])
  })
  it('completes #tags on the active token', () => {
    const out = suggest('pack for trip #tra', ctx)
    expect(out).toEqual([{ kind: 'tag', value: '#travel', hint: 'tag' }])
  })
  it('suggests slash commands', () => {
    const out = suggest('/', ctx)
    expect(out.some((s) => s.kind === 'command' && s.value === 't ')).toBe(true)
  })
  it('matches habits + recents, prefix first', () => {
    const out = suggest('ca', ctx).map((s) => s.value)
    expect(out[0]).toBe('Call mom') // prefix match ranks first
  })
})

describe('duplicate detection', () => {
  it('normalizes text', () => {
    expect(normalize('  Buy   Groceries! ')).toBe('buy groceries')
  })
  it('scores exact matches as 1', () => {
    expect(similarity('Buy groceries', 'buy groceries')).toBe(1)
  })
  it('finds near-duplicates above the threshold', () => {
    const items = [
      { id: '1', text: 'Buy groceries' },
      { id: '2', text: 'Call the dentist' },
    ]
    const dupes = findDuplicates('buy groceries', items)
    expect(dupes.map((d) => d.id)).toEqual(['1'])
    expect(dupes[0].score).toBe(1)
  })
  it('ignores weak overlaps', () => {
    const items = [{ id: '1', text: 'Call the dentist' }]
    expect(findDuplicates('buy groceries', items)).toEqual([])
  })
})
