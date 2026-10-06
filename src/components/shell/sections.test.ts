import { describe, expect, it } from 'vitest'
import { SECTIONS, MEMBERS, landingOf, sectionOf, tabsOf } from './sections'
import { VIEW_CHROME, type ViewId } from './viewChrome'

const ALL: SectionGatesish = { cycle: true, nofap: true }
type SectionGatesish = { cycle: boolean; nofap: boolean }

describe('the five sections', () => {
  it('is exactly five — the count the phone tab bar is built around', () => {
    expect(SECTIONS).toHaveLength(5)
  })

  it('lands every section on its first visible tab', () => {
    expect(landingOf('body', ALL)).toBe('fitness')
    expect(landingOf('mind', ALL)).toBe('mindset')
  })

  it('skips a gated first tab when the gate is off', () => {
    // Recovery is not first, but the principle has to hold for whichever tab
    // is: a landing view that the settings have hidden is a dead rail row.
    const off = { cycle: false, nofap: false }
    expect(tabsOf('body', off).map((t) => t.view)).not.toContain('nofap')
    expect(tabsOf('body', off).map((t) => t.view)).not.toContain('cycle')
  })

  it('matches on the section, not the landing view', () => {
    // This is what keeps Body lit on ?view=nutrition.
    expect(sectionOf('nutrition')).toBe('body')
    expect(sectionOf('gym')).toBe('body')
  })

  it('leaves the app-preference views out of the sections', () => {
    // They live in the top bar and the rail footer on purpose.
    for (const v of ['settings', 'help', 'account', 'kitchen-sink'] as ViewId[]) {
      expect(sectionOf(v)).toBeUndefined()
    }
  })

  /**
   * The gap this catches is the one that shipped twice: Strength tools was a
   * real view with no rail entry, reachable only from a conditional link
   * inside Fitness. Anything with page chrome is a destination and needs a
   * door.
   *
   * The exempt list is the loophole, so keep it short and justify each entry.
   * Pickleball sat on it — "redirected onto Fitness" — and the redirect landed
   * on a form that asks for a duration and nothing else, so the exemption was
   * hiding a page that had effectively been deleted.
   */
  it('gives every non-preference view a section', () => {
    const exempt = new Set<ViewId>([
      'settings', 'help', 'account', 'kitchen-sink',
      // A redirect, not a page: the habit grid is Today's `habits` surface
      // now, and `views/Trackers.tsx` only forwards there. Fifteen places
      // still link to the id, which is why it exists at all — see the file.
      'trackers',
      // `homeworkout` sat here, on the wording "reached from a companion link
      // inside Fitness" — the THIRD page exempted on that exact sentence,
      // after Pickleball and Pull-ups. It is a tab now, and the entry is gone.
      //
      // What makes the sentence dangerous is that it is unfalsifiable by this
      // test: the exemption asserts a route exists somewhere else, and nothing
      // here can check that the route still renders. Home workout's did not.
      // The link was keyed on an activity in `mode: 'strength'`, and strength
      // left `LOGGABLE_MODES` when Fitness's strength segment was deleted — so
      // the only door to the page closed as a side effect of a change in
      // another file, silently, and this test went on passing because the
      // page was on the list that says "trust me".
      //
      // Rule for the next entry: "reached from a link in X" is not a reason to
      // exempt a page. Either the route is a tab, or the exemption is a bet
      // that nothing will ever change X.
    ])
    const orphans = (Object.keys(VIEW_CHROME) as ViewId[]).filter((v) => !exempt.has(v) && !MEMBERS[v])
    expect(orphans).toEqual([])
  })

  /**
   * A view may only be redirected onto another if the target can actually hold
   * its data. Pickleball's record has fields no `Workout` has, which is what
   * made its redirect a deletion.
   */
  it('keeps Pickleball a destination, because its record is not a Workout', () => {
    expect(sectionOf('pickleball')).toBe('body')
    expect(tabsOf('body', ALL).map((t) => t.view)).toContain('pickleball')
  })

  /**
   * The same rule, third application. Pull-ups' record IS a `Workout`, which is
   * why the exempt list held it for three releases — but the test is about the
   * page, not the record, and the page carries a program tracker, a calculator
   * and a manual that no activity form has.
   */
  it('keeps Pull-ups a destination, because the page is more than its record', () => {
    expect(sectionOf('pullups')).toBe('body')
    expect(tabsOf('body', ALL).map((t) => t.view)).toContain('pullups')
  })

  it('reaches every tab in at most two clicks', () => {
    // Rail row, then tab. Nothing is nested deeper than that by construction —
    // this asserts no section has grown a sub-section.
    for (const s of SECTIONS) {
      for (const t of s.tabs) expect(sectionOf(t.view)).toBe(s.id)
    }
  })
})
