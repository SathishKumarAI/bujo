import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider } from '../../../store'
import { ConfirmProvider } from '../../ConfirmDialog'
import { NavProvider } from '../../shell/nav'
import { CursorProvider } from '../../shell/cursor'
import { DeviceProvider } from '../../shell/device'
import { Pickleball } from '../../../views/Pickleball'
import { generateDemoData } from '../../../lib/demo'
import type { PickleballEvent } from '../../../lib/types'

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
})
