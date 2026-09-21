import { describe, it, expect } from 'vitest'
import { CARDS, DOMAINS, DOMAIN_LABEL, sortResults, visibleCards, entriesPerWeek, type Domain } from './insightsFilter'
import type { JournalData } from './types'

/**
 * The filter row IS the page's information architecture now — there are no
 * folds and no second tab left to fall back on. So the assertions here are
 * about the thing that breaks silently: a card that stops being reachable.
 */

describe('the card registry', () => {
  it('has no duplicate ids', () => {
    const ids = CARDS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every domain at least one card', () => {
    // A chip that can only ever show "0" is a control that does nothing, and
    // it would look exactly like a working one.
    for (const d of DOMAINS) {
      expect(CARDS.filter((c) => c.domain === d).length, `${d} has no cards`).toBeGreaterThan(0)
    }
  })

  it('labels every domain', () => {
    for (const d of DOMAINS) expect(DOMAIN_LABEL[d]).toBeTruthy()
  })

  it('gives every card search words beyond its own title', () => {
    // The useful query is the measure ("sleep debt", "r"), not the heading
    // someone picked for the card.
    for (const c of CARDS) {
      expect(c.words.trim().length, `${c.id} has no keywords`).toBeGreaterThan(0)
    }
  })
})

describe('visibleCards', () => {
  it('shows everything when nothing is selected and nothing is typed', () => {
    // Empty means all. A filter row where deselecting the last chip blanks the
    // page teaches people not to touch it.
    expect(visibleCards(new Set(), '').size).toBe(CARDS.length)
  })

  it('narrows to the selected domains', () => {
    const only = visibleCards(new Set<Domain>(['tasks']), '')
    expect([...only].every((id) => CARDS.find((c) => c.id === id)?.domain === 'tasks')).toBe(true)
    expect(only.size).toBeGreaterThan(0)
  })

  it('unions multiple domains rather than intersecting them', () => {
    const a = visibleCards(new Set<Domain>(['tasks']), '').size
    const b = visibleCards(new Set<Domain>(['body']), '').size
    expect(visibleCards(new Set<Domain>(['tasks', 'body']), '').size).toBe(a + b)
  })

  it('matches a measure the card title never mentions', () => {
    // "sleep debt" is the point of the card titled "Sleep debt", but "r" is
    // the point of several cards whose titles do not contain it.
    const hits = visibleCards(new Set(), 'r')
    expect(hits.has('matrix')).toBe(true)
    expect(hits.has('focussleep')).toBe(true)
  })

  it('requires every term to match, not any', () => {
    // The failure this prevents: "sleep debt" returning every card that says
    // "sleep", which is most of the mood domain.
    const both = visibleCards(new Set(), 'sleep debt')
    expect(both.has('sleepdebt')).toBe(true)
    expect(both.has('sleepmood')).toBe(false)
  })

  it('is case- and whitespace-insensitive', () => {
    expect(visibleCards(new Set(), '  SLEEP   Debt ')).toEqual(visibleCards(new Set(), 'sleep debt'))
  })

  it('returns nothing for a query that matches nothing', () => {
    // The page renders an explicit empty state off this, so it must be able to
    // reach zero rather than silently falling back to everything.
    expect(visibleCards(new Set(), 'zzzznotathing').size).toBe(0)
  })
})

describe('sortResults', () => {
  const rows = [
    { kind: 'entry', text: 'b', date: '2026-06-02' },
    { kind: 'workout', text: 'a', date: '2026-06-09' },
    { kind: 'entry', text: 'c' },
    { kind: 'memory', text: 'd', date: '2026-05-30' },
  ]

  it('sorts newest first', () => {
    expect(sortResults(rows, 'newest').map((r) => r.text).slice(0, 3)).toEqual(['a', 'b', 'd'])
  })

  it('sorts oldest first', () => {
    expect(sortResults(rows, 'oldest').map((r) => r.text).slice(0, 3)).toEqual(['d', 'b', 'a'])
  })

  it('puts undated rows last in BOTH directions', () => {
    // "Undated" is not "oldest". Sorting it to the top of the oldest-first
    // list would read as a date of 0000-00-00.
    expect(sortResults(rows, 'newest').at(-1)?.text).toBe('c')
    expect(sortResults(rows, 'oldest').at(-1)?.text).toBe('c')
  })

  it('groups by kind, newest within a kind', () => {
    const out = sortResults(rows, 'kind')
    expect(out.map((r) => r.kind)).toEqual(['entry', 'entry', 'memory', 'workout'])
    expect(out[0].text).toBe('b') // dated entry before the undated one
  })

  it('does not mutate its input', () => {
    const before = rows.map((r) => r.text)
    sortResults(rows, 'oldest')
    expect(rows.map((r) => r.text)).toEqual(before)
  })
})

describe('entriesPerWeek', () => {
  const data = {
    entries: [
      { date: '2026-06-15', type: 'note', text: 'x' },
      { date: '2026-06-16', type: 'note', text: 'y' },
      { date: '2026-06-01', type: 'note', text: 'z' },
    ],
  } as unknown as JournalData

  it('returns one bucket per week, oldest first', () => {
    const out = entriesPerWeek(data, 4, '2026-06-18')
    expect(out).toHaveLength(4)
    expect(out.map((w) => w.week)).toEqual([...out.map((w) => w.week)].sort())
  })

  it('counts each entry exactly once across the buckets', () => {
    const out = entriesPerWeek(data, 12, '2026-06-18')
    expect(out.reduce((a, w) => a + w.entries, 0)).toBe(3)
  })

  it('reports an empty week as 0 rather than dropping it', () => {
    // A gap in the bars is the finding; a chart that silently skips quiet
    // weeks draws a flat line over them.
    const out = entriesPerWeek(data, 8, '2026-06-18')
    expect(out.some((w) => w.entries === 0)).toBe(true)
  })
})
