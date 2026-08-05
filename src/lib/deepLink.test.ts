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
      view: 'fitness', day: '2026-06-10', activity: 'pullups',
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
