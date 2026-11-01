import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { JournalProvider } from '../store'
import { NavProvider } from '../components/shell/nav'
import { DeviceProvider } from '../components/shell/device'
import { STORAGE_KEY } from '../lib/storage'
import { addDays, todayISO } from '../lib/date'
import { Pickleball } from './Pickleball'

/**
 * THE LOG WRITES TO THE DAY THE STRIP SHOWS — on every session page, both
 * devices. The failure each test catches: the shared `DayStrip` drawn beside a
 * form that still files the record under its own (old) date, or the page's old
 * date control left in place as a second picker for the same day.
 *
 * The day picked is YESTERDAY, never today: the draft already holds today, so
 * a strip that wrote nothing would still pass a today assertion. Asserted on
 * the journal in storage, not on a field (CLAUDE.md, COD-533).
 */
const media = (matches: (q: string) => boolean) => vi.stubGlobal('matchMedia', (q: string) => ({ matches: matches(q), media: q, addEventListener() {}, removeEventListener() {} }))
const phone = () => media((q) => !q.includes('coarse'))
const desktop = () => media(() => false)
const wrap = (ui: ReactNode) =>
  render(<DeviceProvider><JournalProvider><NavProvider navigate={() => {}}>{ui}</NavProvider></JournalProvider></DeviceProvider>)
const journal = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
const yesterday = () => addDays(todayISO(), -1)

/** Picks yesterday in the strip: a trailing strip ends on today, so it is the
 *  sixth of seven chips. */
async function pickYesterday() {
  const radios = within(screen.getByRole('radiogroup', { name: 'Day to log' })).getAllByRole('radio')
  expect(radios).toHaveLength(7)
  await userEvent.click(radios[5])
  expect(radios[5].getAttribute('aria-checked')).toBe('true')
}

/** jsdom's 0px shell is the stacked layout, where the act starts shut. */
async function openAct(name: RegExp) {
  await userEvent.click(screen.getAllByRole('button', { expanded: false }).find((b) => name.test(b.textContent ?? ''))!)
}

afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals() })

describe('Pickleball logs on the strip’s day', () => {
  it('phone: no date pill, and the session lands on the picked day', async () => {
    phone()
    wrap(<Pickleball />)
    expect(screen.queryByLabelText(/^Date/)).toBeNull()
    await pickYesterday()
    await userEvent.click(screen.getByRole('button', { name: 'One more game won' }))
    await userEvent.click(screen.getByRole('button', { name: /Log session/ }))
    await waitFor(() => expect(journal().pickleball ?? []).toHaveLength(1))
    expect(journal().pickleball[0].date).toBe(yesterday())
  })

  it('desktop: no Today/Yesterday chips, and the session lands on the picked day', async () => {
    desktop()
    wrap(<Pickleball />)
    await openAct(/Log a session/)
    expect(screen.queryByRole('button', { name: 'Yesterday' })).toBeNull()
    expect(screen.queryByLabelText('Another date')).toBeNull()
    await pickYesterday()
    await userEvent.click(screen.getByRole('button', { name: 'Increase Games won' }))
    await userEvent.click(screen.getByRole('button', { name: 'Log session' }))
    await waitFor(() => expect(journal().pickleball ?? []).toHaveLength(1))
    expect(journal().pickleball[0].date).toBe(yesterday())
  })
})
