import { describe, expect, it } from 'vitest'
import { todayISO } from './date'
import { canonicalizeDeepLink, readDeepLink, writeDeepLink } from './deepLink'

describe('readDeepLink — retired destinations', () => {
  /**
   * The alias table has been wrong three times in the same way, so these three
   * cases guard the rule rather than the entries.
   *
   * An id belongs in `VIEW_ALIASES` only when the page it names no longer
   * exists. Being an *activity* you pick inside Fitness is an argument about
   * the tab row, not about whether the id should resolve. Each of these views
   * holds things the Fitness activity form does not — a pickleball session's
   * games and scoring, the pull-up ability calculator and progressions, the
   * bodyweight library — so aliasing them deleted pages instead of moving them.
   */
  it('opens the views whose ids still name a real page', () => {
    expect(readDeepLink('?view=pickleball')).toMatchObject({ view: 'pickleball', activity: null })
    expect(readDeepLink('?view=pullups')).toMatchObject({ view: 'pullups', activity: null })
    expect(readDeepLink('?view=homeworkout')).toMatchObject({ view: 'homeworkout', activity: null })
  })

  it('accepts the hyphenated spelling the brief used', () => {
    expect(readDeepLink('?view=home-workout')).toMatchObject({ view: 'homeworkout', activity: null })
  })

  it('sends bare /body to Fitness with nothing preselected', () => {
    expect(readDeepLink('?view=body')).toMatchObject({ view: 'fitness', activity: null })
  })

  it('preserves the rest of the query string across the rewrite', () => {
    // The day cursor is the reason this matters: a link to a specific day on a
    // retired spelling must still land on that day.
    expect(readDeepLink('?view=home-workout&day=2026-06-10')).toEqual({
      view: 'homeworkout', day: '2026-06-10', activity: null, surface: null,
    })
  })

  it('passes an explicit ?activity= through untouched', () => {
    expect(readDeepLink('?view=fitness&activity=row')).toMatchObject({ view: 'fitness', activity: 'row' })
  })

  it('leaves every other view alone', () => {
    expect(readDeepLink('?view=today')).toMatchObject({ view: 'today', activity: null })
    expect(readDeepLink('')).toMatchObject({ view: null, activity: null })
  })

  it('still rejects a malformed day', () => {
    expect(readDeepLink('?view=today&day=nope').day).toBeNull()
  })
})

describe('readDeepLink — sections', () => {
  it('resolves a section id to its first view', () => {
    expect(readDeepLink('?view=mind').view).toBe('mindset')
    expect(readDeepLink('?view=review').view).toBe('insights')
    expect(readDeepLink('?view=day').view).toBe('today')
  })

  it('leaves `body` on the older activity alias, not the section', () => {
    // `body` predates the five sections as a Fitness alias; the alias wins so
    // an existing bookmark keeps landing where it always did.
    expect(readDeepLink('?view=body')).toMatchObject({ view: 'fitness', activity: null })
  })
})

describe('readDeepLink — Today surface', () => {
  it('accepts the three surfaces', () => {
    expect(readDeepLink('?surface=morning').surface).toBe('morning')
    expect(readDeepLink('?surface=day').surface).toBe('day')
    expect(readDeepLink('?surface=evening').surface).toBe('evening')
  })

  it('rejects anything else, so a bad link falls back to the clock', () => {
    expect(readDeepLink('?surface=afternoon').surface).toBeNull()
    expect(readDeepLink('').surface).toBeNull()
  })
})

/**
 * The tests above all pass a search string, which is exactly how an earlier bug
 * survived them: `readDeepLink('?view=…')` was always right. What was wrong was
 * the URL by the time the *lazy* Fitness chunk called it with no argument, long
 * after `DeepLinkSync` had rewritten the address bar. These go through
 * `window.location` for that reason.
 */
describe('canonicalizeDeepLink', () => {
  const at = (search: string) => window.history.replaceState(null, '', `/${search}`)

  it('rewrites a retired spelling to the view it means', () => {
    at('?view=home-workout')
    canonicalizeDeepLink()
    expect(readDeepLink()).toMatchObject({ view: 'homeworkout' })
    expect(window.location.search).toBe('?view=homeworkout')
  })

  it('survives the sync rewrite that follows it', () => {
    // End to end: land on the retired spelling, canonicalise, then let the sync
    // effect write the URL and read as the lazy chunk does on mount.
    at('?view=home-workout')
    canonicalizeDeepLink()
    writeDeepLink('homeworkout', todayISO())
    expect(readDeepLink().view).toBe('homeworkout')
  })

  it('keeps the day cursor across the redirect', () => {
    at('?view=home-workout&day=2026-06-10')
    canonicalizeDeepLink()
    expect(readDeepLink()).toMatchObject({ view: 'homeworkout', day: '2026-06-10' })
  })

  it('adds no activity of its own — an alias resolves a view and nothing else', () => {
    at('?view=body')
    canonicalizeDeepLink()
    expect(window.location.search).toBe('?view=fitness')
    expect(readDeepLink().activity).toBeNull()
  })

  it('leaves an explicit ?activity= alone while rewriting the view', () => {
    at('?view=body&activity=row')
    canonicalizeDeepLink()
    expect(readDeepLink()).toMatchObject({ view: 'fitness', activity: 'row' })
  })

  it('leaves a URL that is not an alias exactly as it found it', () => {
    at('?view=today&day=2026-06-10')
    canonicalizeDeepLink()
    expect(window.location.search).toBe('?view=today&day=2026-06-10')
  })

  it('replaces rather than pushes, so Back does not land on the retired URL', () => {
    at('?view=today')
    const before = window.history.length
    at('?view=home-workout')
    canonicalizeDeepLink()
    expect(window.history.length).toBe(before)
  })
})
