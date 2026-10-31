import { describe, expect, it } from 'vitest'
import { setsIn } from './homeSets'

describe('setsIn', () => {
  it('reads the set count from every shape the library writes', () => {
    expect(setsIn('3×12')).toBe(3)
    expect(setsIn('3x10 per side')).toBe(3)
    expect(setsIn('4 × 45s')).toBe(4)
  })

  it('is one set when the line has no count, never zero', () => {
    expect(setsIn('to failure')).toBe(1)
    expect(setsIn('')).toBe(1)
  })
})
