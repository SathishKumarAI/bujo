import { describe, expect, it } from 'vitest'
import { ENTRIES, GUIDE, TUTORIALS, UNGUIDED, guideByGroup, searchGuide } from './guide'
import { SECTIONS } from '../components/shell/sections'
import { VIEW_CHROME, type ViewId } from '../components/shell/viewChrome'

/**
 * These are the tests that make the guide worth reading.
 *
 * The page it replaces was hand-written prose naming fifteen of twenty-four
 * screens, and nothing failed when a screen was added — an undocumented page
 * looks exactly like a page nobody needed documented. Coverage is asserted in
 * both directions so neither adding a view nor retiring one can pass silently.
 */

const NAV_VIEWS = SECTIONS.flatMap((s) => s.tabs.map((t) => t.view))

describe('guide coverage', () => {
  it('documents every view reachable from the nav', () => {
    const covered = new Set(GUIDE.map((c) => c.view))
    const missing = NAV_VIEWS.filter((v) => !covered.has(v))
    expect(missing, `add a guide entry in lib/guide.ts for: ${missing.join(', ')}`).toEqual([])
  })

  it('documents every view in VIEW_CHROME except the ones explicitly excluded', () => {
    const covered = new Set(GUIDE.map((c) => c.view))
    const missing = (Object.keys(VIEW_CHROME) as ViewId[]).filter(
      (v) => !covered.has(v) && !UNGUIDED.includes(v),
    )
    expect(
      missing,
      `either write a guide entry for these, or add them to UNGUIDED with a reason: ${missing.join(', ')}`,
    ).toEqual([])
  })

  it('has no entry for a view that no longer exists', () => {
    const real = new Set(Object.keys(VIEW_CHROME))
    const orphans = Object.keys(ENTRIES).filter((v) => !real.has(v))
    expect(orphans, `retired views still carrying guide prose: ${orphans.join(', ')}`).toEqual([])
  })

  it('never restates what VIEW_CHROME already says', () => {
    // `what` must BE the chrome blurb, not a second copy of it. A paraphrase
    // here is the drift this module exists to prevent.
    for (const card of GUIDE) expect(card.what).toBe(VIEW_CHROME[card.view].help)
  })
})

describe('guide entries', () => {
  it('gives every card a why and at least two how-steps', () => {
    for (const card of GUIDE) {
      expect(card.why.length, `${card.view} why`).toBeGreaterThan(20)
      expect(card.how.length, `${card.view} how`).toBeGreaterThanOrEqual(2)
      for (const step of card.how) expect(step.length, `${card.view} step`).toBeGreaterThan(20)
    }
  })

  it('titles and nav labels come from the app, not from this file', () => {
    // `nofap` is the case that catches a hand-typed label: its page title is
    // "Recovery" in the chrome and its tab label is "Recovery" in the nav,
    // while the view id says otherwise.
    const recovery = GUIDE.find((c) => c.view === 'nofap')
    expect(recovery?.navLabel).toBe('Recovery')
    expect(recovery?.title).toBe(VIEW_CHROME.nofap.title)
  })

  it('groups every card under a real nav section, in nav order', () => {
    const groups = guideByGroup()
    expect(groups.map((g) => g.id)).toEqual(['today', 'plan', 'body', 'mind', 'insights', 'setup'])
    expect(groups.flatMap((g) => g.cards).length).toBe(GUIDE.length)
  })

  it('puts Home workout under Body even though it is not a tab', () => {
    expect(GUIDE.find((c) => c.view === 'homeworkout')?.group).toBe('body')
  })
})

describe('searchGuide', () => {
  it('returns everything for an empty query', () => {
    expect(searchGuide('')).toHaveLength(GUIDE.length)
    expect(searchGuide('   ')).toHaveLength(GUIDE.length)
  })

  it('finds a page by a word that appears in no title', () => {
    // "backup" is the word a frightened user types. It is in Settings' how and
    // keywords, and in no page title anywhere.
    expect(searchGuide('backup').map((c) => c.view)).toContain('settings')
  })

  it('requires all words, across any field', () => {
    const hits = searchGuide('log workout').map((c) => c.view)
    expect(hits).toContain('fitness')
    // A phrase no card satisfies in full returns nothing rather than everything.
    expect(searchGuide('backup pickleball ladder')).toEqual([])
  })

  it('is case-insensitive', () => {
    expect(searchGuide('HABIT').length).toBe(searchGuide('habit').length)
  })
})

describe('tutorials', () => {
  it('has three tracks at three time-scales', () => {
    expect(TUTORIALS.map((t) => t.id)).toEqual(['first-five-minutes', 'first-week', 'first-month'])
  })

  it('points every step that names a screen at a real view', () => {
    for (const t of TUTORIALS) {
      expect(t.steps.length, t.id).toBeGreaterThanOrEqual(4)
      for (const s of t.steps) {
        if (s.to) expect(VIEW_CHROME[s.to], `${t.id} → ${s.to}`).toBeDefined()
        expect(s.body.length, `${t.id} · ${s.title}`).toBeGreaterThan(40)
      }
    }
  })

  it('ends the first-run track on the backup step', () => {
    // The one instruction whose absence loses data. If a later edit reorders
    // these steps, it should have to say so here.
    const last = TUTORIALS[0].steps.at(-1)
    expect(last?.to).toBe('settings')
    expect(last?.title.toLowerCase()).toContain('backup')
  })
})
