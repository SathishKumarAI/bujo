import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ALIAS_TARGETS, DEMO_CLIPS, demoClipId, normaliseLift } from './demoClips'
import { videoUrl } from './video'
import { EXERCISE_LIBRARY } from './fitness'
import { PROGRAMS } from './programs'
import { VideoLink } from '../components/VideoLink'

describe('demo clip catalogue', () => {
  it('holds the whole channel — 65 clips, no duplicate title or id', () => {
    expect(DEMO_CLIPS).toHaveLength(65)
    expect(new Set(DEMO_CLIPS.map(([t]) => normaliseLift(t))).size).toBe(65)
    expect(new Set(DEMO_CLIPS.map(([, id]) => id)).size).toBe(65)
    for (const [, id] of DEMO_CLIPS) expect(id).toMatch(/^[\w-]{11}$/)
  })

  it('points every alias at a clip that exists — a typo would silently fall back to search', () => {
    for (const t of ALIAS_TARGETS) expect(demoClipId(t), t).toBeDefined()
  })

  it('matches the app spelling of a lift, plural and shorthand included', () => {
    expect(demoClipId('Leg press')).toBe('t5Y7p1LcM5Q')
    expect(demoClipId('Flat dumbbell flys')).toBe('o-2l5tklWjQ')
    expect(demoClipId('Triceps DB overhead ext')).toBe('IV7SekKI7Ns')
    expect(demoClipId('Push-ups')).toBe('i_dDCs2CcD4')
    expect(demoClipId('  hanging LEG raises ')).toBe('3MVS21BhdEc')
  })

  it('never guesses — a lift without its own clip gets no clip', () => {
    // Every word of "Front squats" is in "Smith Machine Front Squat"; it is still a different lift.
    for (const n of ['Front squats', 'Bench Press', 'Pull-ups', 'Dip', 'V-bar lat pulldown']) {
      expect(demoClipId(n), n).toBeUndefined()
    }
  })

  it('reaches the program lifts, not only the catalogue', () => {
    const names = new Set([
      ...EXERCISE_LIBRARY,
      ...PROGRAMS.flatMap((p) => p.weeks.flatMap((w) => w.days.flatMap((d) => d.exercises.map((e) => e.name)))),
    ])
    const hit = [...names].filter((n) => demoClipId(n))
    // Measured when the catalogue landed: 35 of the 115 lift names in the app. A floor, so a dropped alias fails.
    expect(hit.length).toBeGreaterThanOrEqual(35)
  })
})

describe('videoUrl with the catalogue', () => {
  it('opens the clip for a catalogued lift, and an explicit pin still wins', () => {
    expect(videoUrl('Walking lunges')).toBe('https://www.youtube.com/watch?v=oN1uZAt9aYk')
    expect(videoUrl('Walking lunges', 'dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  })

  it('VideoLink — the call site every list uses — carries the clip', () => {
    const { getByRole } = render(<VideoLink name="Seated shoulder press" />)
    expect(getByRole('link').getAttribute('href')).toBe('https://www.youtube.com/watch?v=WMvbYow942A')
  })
})
