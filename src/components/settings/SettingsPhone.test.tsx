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

describe('Settings on a phone · Sync and Data as rows', () => {
  // The failure: a desktop card left on the phone. A `Card` draws its title in
  // a <header>; a `Cells` group never does.
  it.each(['sync', 'data'])('%s: no card is drawn, every group is rows', async (tab) => {
    mount(tab)
    // Open the one fold (Advanced sync), so whatever sits behind it counts too.
    for (const b of screen.queryAllByRole('button', { expanded: false })) await userEvent.click(b)
    const panel = screen.getByRole('tabpanel')
    expect(panel.querySelectorAll('section > header')).toHaveLength(0)
    expect(panel.querySelectorAll('.cells').length).toBeGreaterThan(3)
  })

  // The failure: a phone field that lights up and saves nothing. The demo
  // journal seeds none of these settings, so a seeded match cannot pass.
  it('Sync: the rows write the journal — local model, self-host, gist token, Drive client', async () => {
    const user = userEvent.setup()
    mount('sync')
    expect(settings().voiceModel).toBeUndefined()
    await user.click(screen.getByRole('switch', { name: /Use a model on this machine/ }))
    expect(settings().voiceModel?.enabled).toBe(true)
    await user.click(screen.getByRole('button', { name: /Advanced sync/ }))
    await user.type(screen.getByRole('textbox', { name: 'API URL' }), 'https://h:8443')
    await user.type(screen.getByPlaceholderText('ghp_…'), 'ghp_x')
    await user.type(screen.getByRole('textbox', { name: 'Client ID' }), 'abc.apps')
    expect(settings().selfHostUrl).toBe('https://h:8443')
    expect(settings().githubToken).toBe('ghp_x')
    expect(settings().googleClientId).toBe('abc.apps')
  })

  // The failure: a tag row that opens an editor which renames nothing.
  it('Data: a tag row renames the tag across every entry', async () => {
    const user = userEvent.setup()
    mount('data')
    const texts = () => (JSON.parse(localStorage.getItem('bujo:data')!) as { entries: { text: string }[] }).entries.map((e) => e.text).join('\n')
    expect(texts()).toContain('#travel')
    expect(texts()).not.toContain('#voyage')
    await user.click(screen.getByRole('button', { name: /^Rename\s*#travel/ }))
    const field = screen.getByRole('textbox', { name: 'Rename tag travel' })
    await user.clear(field)
    await user.type(field, 'voyage')
    await user.click(screen.getByRole('button', { name: 'Save tag' }))
    expect(texts()).toContain('#voyage')
    expect(texts()).not.toContain('#travel')
  })

  // The failure: a number on the phone that disagrees with the journal.
  it('Data: Your data counts the journal’s own records', () => {
    mount('data')
    const rows = [...screen.getByRole('region', { name: 'Your data' }).querySelectorAll('.cell')]
    const records = rows.find((r) => r.textContent?.startsWith('Records'))
    expect(records?.textContent).toMatch(/^Records\d+$/)
    expect(Number(records!.textContent!.replace('Records', ''))).toBeGreaterThan(100)
  })
})

describe('Settings · Import JSON (COD-569)', () => {
  // The failure: picking a file replaced the whole journal with no question.
  // Asserted on the journal: Cancel keeps every entry, confirming swaps them.
  it('asks before replacing the journal, and Cancel keeps it', async () => {
    const user = userEvent.setup()
    mount('data')
    const before = JSON.parse(localStorage.getItem('bujo:data')!).entries.length
    const small = generateDemoData()
    small.entries = small.entries.slice(0, 2)
    const file = new File([JSON.stringify(small)], 'old-backup.json', { type: 'application/json' })
    const input = document.querySelector<HTMLInputElement>('input[type="file"][accept="application/json"]')!

    await user.upload(input, file)
    const dialog = await screen.findByRole('alertdialog')
    expect(dialog.textContent).toContain('old-backup.json')
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(JSON.parse(localStorage.getItem('bujo:data')!).entries.length).toBe(before)

    await user.upload(input, file)
    await user.click(await screen.findByRole('button', { name: 'Replace journal' }))
    expect(JSON.parse(localStorage.getItem('bujo:data')!).entries.length).toBe(2)
  })
})
