import { describe, it, expect } from 'vitest'
import { currentSlot, orderedSlots } from './timeofday'

describe('currentSlot', () => {
  it('maps hours to slots', () => {
    expect(currentSlot(7)).toBe('morning')
    expect(currentSlot(13)).toBe('afternoon')
    expect(currentSlot(19)).toBe('evening')
    expect(currentSlot(2)).toBe('anytime')
    expect(currentSlot(23)).toBe('anytime')
  })
})

describe('orderedSlots', () => {
  it('puts the current slot first, anytime always last', () => {
    expect(orderedSlots(13)).toEqual(['afternoon', 'morning', 'evening', 'anytime'])
    expect(orderedSlots(7)).toEqual(['morning', 'afternoon', 'evening', 'anytime'])
    expect(orderedSlots(20)).toEqual(['evening', 'morning', 'afternoon', 'anytime'])
  })
  it('late night keeps chronological order', () => {
    expect(orderedSlots(2)).toEqual(['morning', 'afternoon', 'evening', 'anytime'])
  })
})
