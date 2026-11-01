import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { JournalProvider } from '../store'
import { NavProvider } from '../components/shell/nav'
import { DeviceProvider } from '../components/shell/device'
import { addDays, todayISO } from '../lib/date'
import { Program } from './Program'
import { Pullups } from './Pullups'

/**
 * THE DAY STRIP ON THE TRAINING PAGES (COD-558): one picker per page, and the
 * day you pick in it is the day the log writes. Each test picks a PAST day in
 * the strip, logs, and reads the journal (`bujo:data`) — not the strip's
 * `aria-checked`, which a strip whose choice never reached the form would
 * still pass. Armed on a canary: with the strip's `onChange` a no-op, every
 * one of these goes red on the date.
 *
 * jsdom has no phone bar, so the strip draws inline here (`ui/dayStrip.tsx`);
 * the radios are the same days either way.
 */
const media = (matches: (q: string) => boolean) => vi.stubGlobal('matchMedia', (q: string) => ({ matches: matches(q), media: q, addEventListener() {}, removeEventListener() {} }))
const phone = () => media((q) => !q.includes('coarse'))
const desktop = () => media(() => false)
const wrap = (ui: ReactNode) =>
  render(<DeviceProvider><JournalProvider><NavProvider navigate={() => {}}>{ui}</NavProvider></JournalProvider></DeviceProvider>)
const journal = () => JSON.parse(localStorage.getItem('bujo:data')!) as { workouts: { date: string; activity: string; notes?: string }[] }

/** Two days back: radio 6 of a trailing strip is today. */
async function pickTwoDaysAgo() {
  const radios = within(screen.getByRole('radiogroup', { name: 'Day to log' })).getAllByRole('radio')
  await userEvent.click(radios[4])
  return addDays(todayISO(), -2)
}

afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals() })

describe('Program on a phone', () => {
  it('logs the session on the day picked in the strip, and has no other date control', async () => {
    phone()
    const { container } = wrap(<Program />)
    expect(container.querySelector('input[type="date"]')).toBeNull()
    const day = await pickTwoDaysAgo()
    await userEvent.click(screen.getByRole('button', { name: 'Tick every set' }))
    await userEvent.click(screen.getByRole('button', { name: /^Log workout/ }))
    expect(journal().workouts.map((w) => w.date)).toEqual([day])
  })
})

describe('Pull-ups', () => {
  it('phone: the program day logs on the picked day, with no date chip in its dock', async () => {
    phone()
    const { container } = wrap(<Pullups />)
    expect(container.querySelector('input[type="date"]')).toBeNull()
    const day = await pickTwoDaysAgo()
    await userEvent.click(screen.getByRole('button', { name: /^Pull-up assessment/, expanded: false }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Pull-up assessment, what you did' }), '3')
    await userEvent.click(screen.getByRole('button', { name: /^Log day 1/ }))
    expect(journal().workouts.map((w) => w.date)).toEqual([day])
  })

  it('phone: the free session in its sheet logs on the day picked in the page strip', async () => {
    phone()
    wrap(<Pullups />)
    const day = await pickTwoDaysAgo()
    await userEvent.click(screen.getByRole('button', { name: /Log a free session/ }))
    const sheet = await screen.findByRole('dialog')
    expect(sheet.querySelector('input[type="date"]')).toBeNull()
    await userEvent.click(within(sheet).getByRole('button', { name: /^Log · \d+ reps/ }))
    expect(journal().workouts.map((w) => w.date)).toEqual([day])
  })

  it('desktop: the strip heads the act column and replaces Today / Yesterday', async () => {
    desktop()
    wrap(<Pullups />)
    // jsdom's 0px shell is the stacked layout, where the act starts shut.
    await userEvent.click(screen.getAllByRole('button', { expanded: false }).find((b) => /log/i.test(b.textContent ?? ''))!)
    expect(screen.queryByRole('button', { name: 'Yesterday' })).toBeNull()
    expect(screen.queryByLabelText('Another date')).toBeNull()
    const day = await pickTwoDaysAgo()
    await userEvent.click(screen.getByRole('button', { name: /^Log session/ }))
    expect(journal().workouts.map((w) => w.date)).toEqual([day])
  })
})
