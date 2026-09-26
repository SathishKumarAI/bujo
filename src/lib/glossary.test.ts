import { describe, expect, it } from 'vitest'
import { GLOSSARY, glossaryTerm, glossaryByDomain, GLOSSARY_DOMAIN_LABEL } from './glossary'

describe('glossary', () => {
  // A duplicate term is silent: the Map keeps the last one, the Help page prints
  // both, and the marker and the list then disagree — which is the exact failure
  // this file exists to make impossible.
  it('has no duplicate terms, case-insensitively', () => {
    const seen = GLOSSARY.map((t) => t.term.toLowerCase())
    expect(new Set(seen).size).toBe(seen.length)
  })

  // `<Abbr term="pms">` renders nothing useful if the lookup misses, and a
  // missing tooltip fails no gate — the abbreviation just sits there unexplained
  // exactly as before. Both cases, because the call sites disagree: the flag
  // chips are lowercase, the prose is uppercase.
  it('looks a term up in any case, and with surrounding space', () => {
    expect(glossaryTerm('PMS')?.expansion).toBe('Premenstrual syndrome')
    expect(glossaryTerm('pms')?.expansion).toBe('Premenstrual syndrome')
    expect(glossaryTerm('  Pms  ')?.expansion).toBe('Premenstrual syndrome')
    expect(glossaryTerm('not-a-term')).toBeUndefined()
  })

  it('every entry is complete enough to render', () => {
    for (const t of GLOSSARY) {
      expect(t.term, 'term').toBeTruthy()
      expect(t.expansion, `${t.term} expansion`).toBeTruthy()
      expect(t.long.length, `${t.term} long`).toBeGreaterThan(40)
      expect(GLOSSARY_DOMAIN_LABEL[t.domain], `${t.term} domain`).toBeTruthy()
      // A source is optional, but a half-written one is a broken link on screen.
      if (t.source) {
        expect(t.source.label, `${t.term} source label`).toBeTruthy()
        expect(t.source.url, `${t.term} source url`).toMatch(/^https:\/\//)
      }
    }
  })

  // The grouping is what Help renders. If a domain label is added to the record
  // without a term, or a term is given a domain with no label, the page loses a
  // heading or a whole group without failing anything.
  it('grouping covers every term exactly once', () => {
    const grouped = glossaryByDomain().flatMap((g) => g.terms)
    expect(grouped).toHaveLength(GLOSSARY.length)
    expect(new Set(grouped.map((t) => t.term)).size).toBe(GLOSSARY.length)
  })

  it('each group is alphabetical', () => {
    for (const g of glossaryByDomain()) {
      const sorted = [...g.terms].sort((a, b) => a.term.localeCompare(b.term))
      expect(g.terms.map((t) => t.term)).toEqual(sorted.map((t) => t.term))
    }
  })

  // The two terms that motivated the whole file. Named so the failure says which
  // promise broke, not "glossary 3".
  it('carries the abbreviations a first-time reader actually asked about', () => {
    expect(glossaryTerm('pms')).toBeDefined()
    expect(glossaryTerm('bbt')?.expansion).toBe('Basal body temperature')
    expect(glossaryTerm('halt')?.expansion).toContain('Hungry')
    expect(glossaryTerm('dupr')?.source?.url).toContain('dupr.com')
  })
})
