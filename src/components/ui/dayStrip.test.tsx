import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { DayStrip } from './dayStrip'
import { setBarSlot } from '../shell/barSlot'

const T = '2026-10-30'
const onChange = vi.fn()
const strip = <DayStrip value={T} onChange={onChange} today={T} label="Day to log" mark={(d) => (d === T ? '2/3' : null)} />

afterEach(() => act(() => setBarSlot(null)))

describe('DayStrip', () => {
  it('draws inline, seven days, when there is no phone bar to sit in', () => {
    render(strip)
    expect(within(screen.getByRole('radiogroup', { name: 'Day to log' })).getAllByRole('radio')).toHaveLength(7)
  })

  it('moves into the bar slot as ONE day pill, no calendar, and picks any day', () => {
    // Owner, 2026-11-13: the three day chips "looked like a calendar on the
    // top". One pill, the phone's date wheel behind it (COD-600).
    const slot = document.createElement('div')
    document.body.append(slot)
    act(() => setBarSlot(slot))
    const { container } = render(strip)
    expect(within(slot).queryAllByRole('radio')).toHaveLength(0)
    expect(container.querySelector('[role="radiogroup"]')).toBeNull()
    const input = within(slot).getByLabelText(/^Day to log: /) as HTMLInputElement
    expect(input.type).toBe('date')
    fireEvent.change(input, { target: { value: '2026-10-20' } })
    expect(onChange).toHaveBeenCalledWith('2026-10-20')
    slot.remove()
  })
})
