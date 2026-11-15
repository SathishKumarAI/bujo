import { describe, expect, it } from 'vitest'
import { DAILY_CARDS, dailyCardFor } from '.'

/**
 * The year of cards is static content; these are the only guards on it.
 * Each test is named for what a reader would see go wrong.
 */
describe('DAILY_CARDS', () => {
  it('holds a card for every day of the year', () => {
    expect(DAILY_CARDS.length).toBe(365)
  })

  it('never repeats a card or a quotation', () => {
    expect(new Set(DAILY_CARDS.map((c) => c.id)).size).toBe(365)
    const quotes = DAILY_CARDS.map((c) => c.quote.toLowerCase().replace(/\W+/g, ' ').trim())
    expect(quotes.filter((q, i) => quotes.indexOf(q) !== i)).toEqual([])
  })

  it('gives every card a practice you could do today, in words', () => {
    // A practice is one concrete action, not a slogan; the phone rule is no
    // symbols, so × → ± would read as glyphs where a word belongs.
    const bad = DAILY_CARDS.filter((c) => c.practice.length < 30 || c.practice.length > 180 || /[×→←±]/.test(c.practice + c.quote))
    expect(bad.map((c) => c.id)).toEqual([])
  })

  it('does not carry the well-known misattributions', () => {
    // Armed on a canary: each pattern below matches its sample, so a pattern
    // that silently stopped matching would fail here, not pass.
    const traps: [RegExp, string, string][] = [
      [/be the change/i, 'Gandhi', 'Be the change you wish to see'],
      [/insanity is doing the same/i, 'Einstein', 'Insanity is doing the same thing'],
      [/excellence.*not an act.*habit/i, 'Aristotle', 'Excellence, then, is not an act but a habit'],
      [/culture eats strategy/i, 'Drucker', 'Culture eats strategy for breakfast'],
      [/everyone you meet is fighting/i, 'Plato', 'Be kind, for everyone you meet is fighting a hard battle'],
    ]
    for (const [re, , sample] of traps) expect(re.test(sample)).toBe(true)
    const hits = DAILY_CARDS.filter((c) => traps.some(([re, who]) => re.test(c.quote) && c.by.includes(who)))
    expect(hits.map((c) => `${c.id}: ${c.by}`)).toEqual([])
  })

  it('deals the themes in turn, so two days running never share one', () => {
    const theme = (id: string) => id.split('-')[0]
    const same = DAILY_CARDS.slice(1).filter((c, i) => theme(c.id) === theme(DAILY_CARDS[i].id))
    expect(same.map((c) => c.id)).toEqual([])
  })
})

describe('dailyCardFor', () => {
  it('gives day N of the year card N, and wraps a leap day to the first', () => {
    expect(dailyCardFor('2026-01-01').n).toBe(1)
    expect(dailyCardFor('2026-12-31').n).toBe(365)
    expect(dailyCardFor('2028-12-31').n).toBe(1)
    expect(dailyCardFor('2026-11-14').card).toBe(DAILY_CARDS[317])
  })
})
