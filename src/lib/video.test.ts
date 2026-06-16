import { describe, it, expect } from 'vitest'
import { videoUrl, videoSearchUrl } from './video'

describe('videoUrl', () => {
  it('uses a pinned clip when a yt id is given', () => {
    expect(videoUrl('Push-ups', 'dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  })

  it('falls back to a proper-form search when no id is given', () => {
    expect(videoUrl('Bench Press')).toBe(
      'https://www.youtube.com/results?search_query=Bench%20Press%20proper%20form%20technique',
    )
  })

  it('encodes special characters in the name', () => {
    expect(videoUrl('Pull-ups & dips')).toContain('Pull-ups%20%26%20dips')
  })
})

describe('videoSearchUrl', () => {
  it('builds a "how to" search link', () => {
    expect(videoSearchUrl('Squats')).toBe(
      'https://www.youtube.com/results?search_query=how%20to%20Squats%20exercise',
    )
  })
})
