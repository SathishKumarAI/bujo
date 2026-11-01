import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider } from '../../../store'
import { ConfirmProvider } from '../../ConfirmDialog'
import { NavProvider } from '../../shell/nav'
import { CursorProvider } from '../../shell/cursor'
import { DeviceProvider } from '../../shell/device'
import { Pickleball } from '../../../views/Pickleball'
import { generateDemoData } from '../../../lib/demo'
import type { PickleballEvent } from '../../../lib/types'
import { prettyDay } from '../../../lib/date'

/**
 * The Competition sheet on a phone (COD-553), asserted on the JOURNAL: a
 * stepper that counts and writes nothing must fail, and the DOM cannot see
 * that. The values are ones the demo does not hold (a league named for this
 * ticket, 4–2, Gold), so a seeded event cannot pass for the new one.
 */
afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals() })

const events = () => (JSON.parse(localStorage.getItem('bujo:data')!) as { pickleballEvents?: PickleballEvent[] }).pickleballEvents ?? []

async function openSheet() {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: !q.includes('coarse'), media: q, addEventListener() {}, removeEventListener() {} }))
  localStorage.setItem('bujo:data', JSON.stringify(generateDemoData()))
  render(
    <DeviceProvider><NavProvider navigate={() => {}}><CursorProvider><ConfirmProvider><JournalProvider>
      <Pickleball />
    </JournalProvider></ConfirmProvider></CursorProvider></NavProvider></DeviceProvider>,
  )
  await userEvent.click(await screen.findByRole('button', { name: /Events & DUPR rating/ }))
  return screen.getByRole('dialog', { name: 'Competition' })
}

describe('Pickleball Competition sheet on a phone', () => {
  it('logs kind, record and placement from taps into the journal', async () => {
    const sheet = await openSheet()
    expect(events().some((e) => e.name === 'COD-553 League')).toBe(false)
    // The phone drawing, not the desktop panel's chip pickers or its "+".
    expect(within(sheet).queryByRole('button', { name: 'Log an event' })).toBeNull()
    await userEvent.type(within(sheet).getByRole('textbox', { name: 'Event' }), 'COD-553 League')
    await userEvent.click(within(sheet).getByRole('radio', { name: 'League' }))
    for (let i = 0; i < 4; i++) await userEvent.click(within(sheet).getByRole('button', { name: 'More wins' }))
    for (let i = 0; i < 2; i++) await userEvent.click(within(sheet).getByRole('button', { name: 'More losses' }))
    await userEvent.click(within(sheet).getByRole('button', { name: 'Gold' }))
    await userEvent.click(within(sheet).getByRole('button', { name: /Save event/ }))
    expect(events().find((e) => e.name === 'COD-553 League')).toMatchObject({ kind: 'league', wins: 4, losses: 2, placement: 'Gold', format: 'pool-play' })
  })

  it('stores an untouched record as no record, not 0–0', async () => {
    const sheet = await openSheet()
    await userEvent.type(within(sheet).getByRole('textbox', { name: 'Event' }), 'COD-553 Open')
    await userEvent.click(within(sheet).getByRole('button', { name: /Save event/ }))
    const e = events().find((x) => x.name === 'COD-553 Open')!
    expect(e).toBeTruthy()
    expect(e.wins).toBeUndefined()
    expect(e.losses).toBeUndefined()
  })

  /* COD-556. Asserted on the journal and on the COUNT: an edit that appends a
     copy shows the new name too, so "still one record with this id" is the
     half that catches it. The new name is one the demo does not hold. */
  it('a tapped event row loads the form and saving rewrites that record', async () => {
    const sheet = await openSheet()
    const before = events()
    const target = [...before].sort((a, b) => (a.date < b.date ? 1 : -1))[0]
    await userEvent.click(within(sheet).getByRole('button', { name: new RegExp(String.raw`^Edit\s*${target.name}`) }))
    const name = within(sheet).getByRole('textbox', { name: 'Event' })
    expect(name).toHaveProperty('value', target.name)
    await userEvent.clear(name)
    await userEvent.type(name, 'COD-556 Renamed')
    await userEvent.click(within(sheet).getByRole('button', { name: /Save changes/ }))
    const after = events()
    expect(after).toHaveLength(before.length)
    expect(after.filter((e) => e.id === target.id)).toEqual([{ ...target, name: 'COD-556 Renamed' }])
  })

  it('a tapped rating row edits that rating, and saving onto another day asks first', async () => {
    const sheet = await openSheet()
    const log = () => (JSON.parse(localStorage.getItem('bujo:data')!) as { settings: { duprLog?: { date: string; rating: number }[] } }).settings.duprLog ?? []
    const before = log()
    const [older, newest] = before.slice(-2)
    await userEvent.click(within(sheet).getByRole('button', { name: new RegExp(String.raw`^Edit rating,\s*${prettyDay(newest.date)}`) }))
    const rating = within(sheet).getByRole('spinbutton', { name: 'Rating' })
    expect(rating).toHaveProperty('value', String(newest.rating))
    await userEvent.clear(rating)
    await userEvent.type(rating, '4.99')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    expect(log()).toHaveLength(before.length)
    expect(log().find((p) => p.date === newest.date)?.rating).toBe(4.99)

    // Moving it onto a day that already holds a rating is a replace: it asks.
    await userEvent.click(within(sheet).getByRole('button', { name: new RegExp(String.raw`^Edit rating,\s*${prettyDay(newest.date)}`) }))
    fireEvent.change(within(sheet).getByLabelText('Rating date'), { target: { value: older.date } })
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Replace it' }))
    expect(log()).toHaveLength(before.length - 1)
    expect(log().find((p) => p.date === older.date)?.rating).toBe(4.99)
    expect(log().some((p) => p.date === newest.date)).toBe(false)
  })
})
