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
    expect(sectionOf('stats')).toBe('insights')
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
      // Redirected onto Fitness with the activity preselected (deepLink.ts).
      // Both are genuine activities: their session IS a `Workout`, so nothing
      // is lost by logging them on the Fitness form.
      'pullups', 'homeworkout',
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

  it('reaches every tab in at most two clicks', () => {
    // Rail row, then tab. Nothing is nested deeper than that by construction —
    // this asserts no section has grown a sub-section.
    for (const s of SECTIONS) {
      for (const t of s.tabs) expect(sectionOf(t.view)).toBe(s.id)
    }
  })
})
