import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('keeps a size token beside a colour token instead of reading it as a colour', () => {
    expect(cn('text-heading text-fg-1')).toBe('text-heading text-fg-1')
    expect(cn('text-label', 'text-brand-text')).toBe('text-label text-brand-text')
  })

  it('still lets a later size win over an earlier one', () => {
    expect(cn('text-heading', 'text-title')).toBe('text-title')
  })
})
