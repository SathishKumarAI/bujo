import { describe, expect, it } from 'vitest'
import { todayISO } from './date'
import { canonicalizeDeepLink, readDeepLink, writeDeepLink } from './deepLink'

describe('readDeepLink — retired destinations', () => {
  it('rewrites the two activity views onto Fitness with the activity preselected', () => {
    expect(readDeepLink('?view=pullups')).toMatchObject({ view: 'fitness', activity: 'pullups' })
    expect(readDeepLink('?view=homeworkout')).toMatchObject({ view: 'fitness', activity: 'homeWorkout' })
  })

  /**
   * Pickleball was in that table and should not have been. A pull-up session
   * IS a `Workout`; a pickleball session is a `PickleballSession` with format,
   * games won/lost, scoring format, partner and points. The Fitness sport form
   * asks for `durationMin` alone, so the redirect did not relocate the page,
   * it made all of those fields unreachable from a link.
   */
  it('leaves Pickleball alone — it is a surface with its own record, not an activity', () => {
    expect(readDeepLink('?view=pickleball')).toMatchObject({ view: 'pickleball', activity: null })
  })

  it('accepts the hyphenated spelling the brief used', () => {
    expect(readDeepLink('?view=home-workout')).toMatchObject({ view: 'fitness', activity: 'homeWorkout' })
  })

  it('sends bare /body to Fitness with nothing preselected', () => {
    expect(readDeepLink('?view=body')).toMatchObject({ view: 'fitness', activity: null })
  })

  it('preserves the rest of the query string across the rewrite', () => {
    // The day cursor is the reason this matters: a link to a specific day on a
    // retired view must still land on that day.
    expect(readDeepLink('?view=pullups&day=2026-06-10')).toEqual({
      view: 'fitness', day: '2026-06-10', activity: 'pullups', surface: null,
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
 * The tests above all pass a search string, which is exactly how the bug
 * survived them: `readDeepLink('?view=pullups')` was always right. What was
 * wrong was the URL by the time the *lazy* Fitness chunk called it with no
 * argument, long after `DeepLinkSync` had rewritten the address bar. These go
 * through `window.location` for that reason.
 */
describe('canonicalizeDeepLink', () => {
  const at = (search: string) => window.history.replaceState(null, '', `/${search}`)

  it('writes the alias activity into the URL, so a later reader can still see it', () => {
    at('?view=pullups')
    canonicalizeDeepLink()
    expect(readDeepLink()).toMatchObject({ view: 'fitness', activity: 'pullups' })
    expect(window.location.search).toBe('?view=fitness&activity=pullups')
  })

  it('survives the rewrite that used to eat it', () => {
    // The actual defect, end to end: land on the retired link, let the sync
    // effect write `?view=fitness`, then read as the lazy chunk does on mount.
    at('?view=pullups')
    canonicalizeDeepLink()
    writeDeepLink('fitness', todayISO())
    expect(readDeepLink().activity).toBe('pullups')
  })

  it('keeps the day cursor across the redirect', () => {
    at('?view=homeworkout&day=2026-06-10')
    canonicalizeDeepLink()
    expect(readDeepLink()).toMatchObject({ day: '2026-06-10', activity: 'homeWorkout' })
  })

  it('adds no activity for an alias that names none', () => {
    at('?view=body')
    canonicalizeDeepLink()
    expect(window.location.search).toBe('?view=fitness')
  })

  it('leaves a URL that is not an alias exactly as it found it', () => {
    at('?view=today&day=2026-06-10')
    canonicalizeDeepLink()
    expect(window.location.search).toBe('?view=today&day=2026-06-10')
  })

  it('replaces rather than pushes, so Back does not land on the retired URL', () => {
    at('?view=today')
    const before = window.history.length
    at('?view=pullups')
    canonicalizeDeepLink()
    expect(window.history.length).toBe(before)
  })
})
