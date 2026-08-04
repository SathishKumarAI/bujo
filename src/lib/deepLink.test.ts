import { describe, expect, it } from 'vitest'
import { readDeepLink } from './deepLink'

describe('readDeepLink — retired destinations', () => {
  it('rewrites the three activity views onto Fitness with the activity preselected', () => {
    expect(readDeepLink('?view=pullups')).toMatchObject({ view: 'fitness', activity: 'pullups' })
    expect(readDeepLink('?view=homeworkout')).toMatchObject({ view: 'fitness', activity: 'homeWorkout' })
    expect(readDeepLink('?view=pickleball')).toMatchObject({ view: 'fitness', activity: 'pickleball' })
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
