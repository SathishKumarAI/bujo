import { afterEach, describe, expect, it } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import { DayStrip } from './dayStrip'
import { setBarSlot } from '../shell/barSlot'

const T = '2026-10-30'
const strip = <DayStrip value={T} onChange={() => {}} today={T} label="Day to log" mark={(d) => (d === T ? '2/3' : null)} />

afterEach(() => act(() => setBarSlot(null)))

describe('DayStrip', () => {
  it('draws inline, seven days, when there is no phone bar to sit in', () => {
    render(strip)
    expect(within(screen.getByRole('radiogroup', { name: 'Day to log' })).getAllByRole('radio')).toHaveLength(7)
  })

  it('moves into the bar slot, three days ending today, and still says each mark', () => {
    const slot = document.createElement('div')
    document.body.append(slot)
    act(() => setBarSlot(slot))
    const { container } = render(strip)
    const group = within(slot).getByRole('radiogroup', { name: 'Day to log' })
    expect(container.querySelector('[role="radiogroup"]')).toBeNull()
    const days = within(group).getAllByRole('radio')
    expect(days).toHaveLength(3)
    expect(days[2].getAttribute('aria-checked')).toBe('true')
    expect(days[2].textContent).toContain('2/3')
    slot.remove()
  })
})
