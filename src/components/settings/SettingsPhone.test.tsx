import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider } from '../../store'
import { ConfirmProvider } from '../ConfirmDialog'
import { NavProvider } from '../shell/nav'
import { DeviceProvider } from '../shell/device'
import { Settings } from '../../views/Settings'
import { generateDemoData } from '../../lib/demo'
import type { Settings as JournalSettings } from '../../lib/types'

/**
 * Settings on a phone (iOS grouped rows), asserted on the JOURNAL, not the
 * DOM: a Seg or switch that lights up and writes nothing must fail here, and
 * a controlled input's DOM value cannot see that (the COD-533 trap). Every
 * value set is one the demo journal does NOT hold — XL text (demo: M), the
 * handwriting font (demo: off), Monday weeks and °C (demo: Sun, °F) — so a
 * seeded match cannot pass for a write.
 */
afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); window.history.replaceState(null, '', '/') })

const settings = () => (JSON.parse(localStorage.getItem('bujo:data')!) as { settings: JournalSettings }).settings

function mount(tab: string) {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: !q.includes('coarse'), media: q, addEventListener() {}, removeEventListener() {} }))
  window.history.replaceState(null, '', `/?view=settings&tab=${tab}`)
  localStorage.setItem('bujo:data', JSON.stringify(generateDemoData()))
  render(
    <DeviceProvider><NavProvider navigate={() => {}}><ConfirmProvider><JournalProvider>
      <Settings />
    </JournalProvider></ConfirmProvider></NavProvider></DeviceProvider>,
  )
}

describe('Settings on a phone', () => {
  it('Appearance: a one-tap segment and a row switch write the journal', async () => {
    mount('feel')
    expect(settings().fontScale ?? 1).toBe(1)
    expect(settings().handwriting).toBe(false)
    // The phone drawing: a segmented radiogroup, not the desktop's ToggleGroup.
    await userEvent.click(screen.getByRole('radio', { name: 'XL' }))
    await userEvent.click(screen.getByRole('switch', { name: 'Handwriting font' }))
    expect(settings().fontScale).toBe(1.25)
    expect(settings().handwriting).toBe(true)
  })

  it('Account: units are segments at the row edge, and tapping the lit one keeps it', async () => {
    mount('account')
    expect(settings().weekStart).toBe(0)
    await userEvent.click(within('Week starts', 'Mon'))
    await userEvent.click(within('Temperature', '°C'))
    expect(settings().weekStart).toBe(1)
    expect(settings().tempUnit).toBe('C')
    // A carried value is never cleared by a confirming tap (no `allowNone`).
    await userEvent.click(within('Week starts', 'Mon'))
    expect(settings().weekStart).toBe(1)
  })

  it('Data: the destructive row still asks first and names what it removes', async () => {
    mount('data')
    const before = JSON.parse(localStorage.getItem('bujo:data')!).entries.length
    await userEvent.click(screen.getByRole('button', { name: 'Clear all data' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(dialog.textContent).toContain(`${before} entries`)
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(JSON.parse(localStorage.getItem('bujo:data')!).entries.length).toBe(before)
  })
})

function within(group: string, option: string) {
  const g = screen.getByRole('radiogroup', { name: group })
  return [...g.querySelectorAll('[role="radio"]')].find((b) => b.textContent === option) as HTMLElement
}

describe('Settings on a phone · the Account tab as rows', () => {
  // The failure: the four tabs back on two lines, or the long name lost.
  it('draws the four tabs as one segmented row, Sync said in full', () => {
    mount('account')
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((t) => t.textContent?.trim())).toEqual(['Account', 'Appearance', 'Sync', 'Data'])
    expect(screen.getByRole('tab', { name: 'Sync & privacy' })).toBeTruthy()
    expect(tabs[0].closest('[role="tablist"]')!.classList.contains('seg')).toBe(true)
  })

  // The failure: the phone's name rows drawing a form that saves nothing.
  it('saves a name and a face from the You rows into the journal', async () => {
    const user = userEvent.setup()
    mount('account')
    const edit = screen.queryByRole('button', { name: /^Edit your name/ })
    if (edit) await user.click(edit)
    const field = screen.getByRole('textbox', { name: 'Name' })
    await user.clear(field)
    await user.type(field, 'Robin')
    await user.click(screen.getByRole('button', { name: 'Avatar 🦉' }))
    await user.click(screen.getByRole('button', { name: /^(Save|Create local account)/ }))
    expect(settings().profile).toEqual({ name: 'Robin', emoji: '🦉' })
  })
})
