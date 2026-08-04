import { describe, expect, it } from 'vitest'
import { surfaceForHour } from './surface'

describe('surfaceForHour', () => {
  it('splits the day at 11:00 and 18:00', () => {
    expect(surfaceForHour(0)).toBe('morning')
    expect(surfaceForHour(10)).toBe('morning')
    expect(surfaceForHour(11)).toBe('day')
    expect(surfaceForHour(17)).toBe('day')
    expect(surfaceForHour(18)).toBe('evening')
    expect(surfaceForHour(23)).toBe('evening')
  })
})
