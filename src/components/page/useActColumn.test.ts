import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

let device: 'mobile' | 'desktop' = 'desktop'
vi.mock('../shell/device', () => ({ useDevice: () => device }))
const { useActColumn } = await import('./useActColumn')

describe('useActColumn', () => {
  it('shuts a stacked act on a desktop window — the record comes first there', () => {
    device = 'desktop'
    const { result } = renderHook(() => useActColumn('t-desk'))
    act(() => result.current.onSplitChange(false))
    expect(result.current.shut).toBe(true)
  })

  it('keeps a stacked act OPEN on a phone, where the page is for logging (COD-467)', () => {
    device = 'mobile'
    const { result } = renderHook(() => useActColumn('t-phone'))
    act(() => result.current.onSplitChange(false))
    expect(result.current.shut).toBe(false)
    act(() => result.current.close())
    expect(result.current.shut).toBe(true)
  })
})
