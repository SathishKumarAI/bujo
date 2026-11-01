import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { JournalProvider } from '../store'
import { ConfirmProvider } from '../components/ConfirmDialog'
import { NavProvider } from '../components/shell/nav'
import { Settings } from './Settings'

/**
 * Settings is a tab row over ONE section, and that section fills one screen.
 *
 * ── This file asserted the opposite an hour ago ───────────────────────────
 *
 * The attempt before this one put all four sections on screen at once, and
 * this file's job was to guarantee every one of them stayed mounted — because
 * that is what paid for deleting three `?tab=` entries from
 * `scripts/a11y-axe.mjs`. The layout was reverted (four quarter-width columns
 * is not a readable settings page), the gate entries are back, and this file's
 * job inverted with them.
 *
 * The mounting assertion is kept rather than dropped, now pointing the other
 * way. "Exactly one panel is in the DOM" is not an incidental detail: it is
 * the precondition for those three gate entries existing, and if it ever stops
 * being true someone should learn it from a test rather than from `npm run
 * a11y` quietly doing three navigations it no longer needs.
 */
function mount() {
  return render(
    <NavProvider navigate={() => {}}>
      <ConfirmProvider>
        <JournalProvider>
          <Settings />
        </JournalProvider>
      </ConfirmProvider>
    </NavProvider>,
  )
}

afterEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/')
})

describe('the section switcher', () => {
  it('offers all four sections', () => {
    mount()
    const names = screen.getAllByRole('tab').map((t) => t.textContent?.replace(/\s+/g, ' ').trim())
    expect(names).toEqual(['Account', 'Appearance', 'Sync & privacy', 'Data'])
  })

  it('mounts exactly one of them — which is why the a11y gate still visits ?tab=', () => {
    // COD-232 in its current state, asserted rather than assumed. `TabsContent`
    // renders only the open panel, so three of these four are absent from the
    // DOM and no rendering gate can reach them in this load. That is the whole
    // reason `scripts/a11y-axe.mjs` carries three extra `settings&tab=…`
    // entries.
    //
    // If this ever fails because every panel mounts, that is good news and
    // those three entries can go — but delete them in the same change, and
    // invert this test rather than removing it.
    mount()
    expect(screen.getAllByRole('tabpanel').length).toBe(1)
  })
})

describe('the open section is one screen, and reachable without a pointer', () => {
  it('is a labelled, focusable scrollport', () => {
    // It scrolls sideways when a section outgrows one screen, and a scrollport
    // reachable only by pointer is unreachable for a keyboard — axe's
    // `scrollable-region-focusable`. Horizontal is also the direction a
    // browser will not scroll for you on arrow keys unless the element has
    // focus.
    mount()
    const box = screen.getByRole('group', { name: 'Account' })
    expect(box.tabIndex).toBe(0)
    expect(box.className).toContain('section-screen')
  })

  it('names the box after the section it is showing', () => {
    // The name has to follow the tab, or a screen reader hears "Account" over
    // the Data panel. `LABEL` in the view is the single source for both.
    window.history.replaceState(null, '', '/?view=settings&tab=data')
    mount()
    const box = screen.getByRole('group', { name: 'Data' })
    expect(within(box).getByText(/everything stored on this device/i)).toBeTruthy()
  })
})

describe('?tab= addresses a section', () => {
  it('opens the one it names', () => {
    window.history.replaceState(null, '', '/?view=settings&tab=sync')
    mount()
    const open = screen.getByRole('tab', { selected: true })
    expect(open.textContent?.replace(/\s+/g, ' ').trim()).toBe('Sync & privacy')
    // And the panel really is the sync one, not merely the tab highlight.
    expect(screen.getAllByText(/passcode lock/i).length).toBeGreaterThan(0)
  })

  it('falls through to the first section on a value it does not know', () => {
    // A stale or hand-typed `tab` must land somewhere real, not on an empty
    // panel. Validated against the list rather than trusted.
    window.history.replaceState(null, '', '/?view=settings&tab=nonsense')
    mount()
    expect(screen.getByRole('tab', { selected: true }).textContent?.trim()).toBe('Account')
  })
})

describe('Settings tabs on a phone', () => {
  // The failure: a fourth tab off the right edge of a scrolling strip whose
  // clip fell in the gap, so the row looked complete with three. On a phone
  // the tabs are ONE segmented row (owner, 2026-11-01: "all in one line"),
  // and the long label is still the tab's name.
  afterEach(() => vi.unstubAllGlobals())

  it('lays the four tabs out in one segmented row with "Sync & privacy" as its name', async () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: !q.includes('coarse'), media: q, addEventListener() {}, removeEventListener() {} }))
    const { DeviceProvider } = await import('../components/shell/device')
    render(
      <DeviceProvider><NavProvider navigate={() => {}}><ConfirmProvider><JournalProvider>
        <Settings />
      </JournalProvider></ConfirmProvider></NavProvider></DeviceProvider>,
    )
    expect(screen.getByRole('tablist').classList.contains('seg')).toBe(true)
    expect(screen.getAllByRole('tab').map((t) => t.textContent?.trim())).toEqual(['Account', 'Appearance', 'Sync', 'Data'])
    expect(screen.getByRole('tab', { name: 'Sync & privacy' })).toBeTruthy()
  })
})
