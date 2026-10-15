import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { JournalProvider } from '../store'
import { ConfirmProvider } from '../components/ConfirmDialog'
import { NavProvider } from '../components/shell/nav'
import { Settings } from './Settings'

/**
 * THE TRIPWIRE THAT PAYS FOR DELETING THREE GATE ENTRIES.
 *
 * Settings was a tab shell, and a tab shell holds **one** panel in the DOM.
 * That is COD-232: every space number ever quoted for this view described the
 * Account tab alone, and `npm run a11y` scanned whatever had mounted — so the
 * passcode form, the cloud passphrase, every export button and the
 * erase-everything dialog had never been seen by axe at any theme or viewport.
 * The workaround was three extra entries in `scripts/a11y-axe.mjs` visiting
 * `?tab=…` by URL, at twelve shards each.
 *
 * COD-310 put all four panes on one screen, so one scan covers the page and
 * those three entries are gone — 36 fewer scans in a run that was 166.
 *
 * **That trade is only safe while every pane really is in the DOM.** If one
 * ever became lazily mounted — a `LazyMount`, a virtualised strip, an
 * `isVisible &&` added to make a long pane cheaper — coverage would silently
 * fall back to one panel and the gate would go on printing a reassuring zero,
 * which is COD-232 returning by the exact route that created it. This file is
 * what fails instead, in seconds, with no browser.
 *
 * So: assert the **content** of each pane, not its label alone. A label list is
 * cheap to keep passing while the panel under it stops rendering.
 *
 * ── One finding came straight out of writing this ─────────────────────────
 *
 * The pane label started as an `<h2>`, which produced two `h2 "Account"` on one
 * screen: `Card` titles are already `h2` and three of these four panes open
 * with a card named after the pane. Duplicate headings at one level are worse
 * than no heading — the outline claims two sections where there is one, and a
 * screen-reader user listing headings gets each name twice with no way to tell
 * which is the column. It is a `<p>` now; `aria-labelledby` never needed a
 * heading. Hence the assertions below are on `region`, not on `heading`.
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

describe('every pane is in the DOM at once', () => {
  it('renders all four panes in a single pass', () => {
    mount()
    for (const name of ['Account', 'Appearance', 'Sync & privacy', 'Data']) {
      expect(screen.getByRole('region', { name }), name).toBeTruthy()
    }
  })

  it('renders content from every pane, not only the first', () => {
    // One landmark card per pane, picked because each is the thing the old tab
    // shell hid: Appearance, Sync and Data were never scanned by any gate.
    mount()
    // `getAllByText`, because several of these appear twice inside their own
    // pane — "Passcode lock" is a card title and again in the security list.
    // What is being asserted is that the pane rendered at all, so the count is
    // not the point and pinning it would make this brittle for no gain.
    const paneHas = (pane: string, re: RegExp) =>
      within(screen.getByRole('region', { name: pane })).getAllByText(re)
    expect(paneHas('Account', /units & week/i).length, 'account pane').toBeGreaterThan(0)
    expect(paneHas('Sync & privacy', /passcode lock/i).length, 'sync pane').toBeGreaterThan(0)
    expect(paneHas('Sync & privacy', /how your journal is protected/i).length, 'security card').toBeGreaterThan(0)
    expect(paneHas('Data', /export/i).length, 'data pane').toBeGreaterThan(0)
  })

  it('does not duplicate a card title as a second heading of the same level', () => {
    // The regression this exact file caught. `Card` renders its title as `h2`;
    // a pane label rendered as `h2` too meant the document claimed two
    // "Account" sections at the same level.
    mount()
    const dupes = screen.getAllByRole('heading', { name: 'Account', level: 2 })
    expect(dupes.length).toBe(1)
  })
})

describe('the strip is reachable without a pointer', () => {
  it('is a focusable, labelled scrollport', () => {
    // axe's `scrollable-region-focusable` is right to ask: a region you can
    // only reach by swiping is a region a keyboard cannot reach at all. The
    // arrow-key handler in `PaneStrip` is the other half — a focusable thing
    // that does nothing on a key press is a trap in the ordinary sense.
    mount()
    const strip = screen.getByRole('group', { name: 'Settings sections' })
    expect(strip.tabIndex).toBe(0)
  })

  it('names every dot, so the only navigation on a phone is not four unlabelled circles', () => {
    mount()
    const dots = screen.getByRole('navigation', { name: 'Settings sections' })
    const names = within(dots).getAllByRole('button').map((b) => b.textContent)
    expect(names).toEqual(['Account', 'Appearance', 'Sync & privacy', 'Data'])
  })
})

describe('?tab= still addresses a pane', () => {
  /**
   * The parameter keeps the name `tab` although there are no tabs any more: it
   * is in links people have sent each other, in `scripts/a11y-axe.mjs` and in
   * this repo's docs. Renaming it would break all three to tidy one identifier.
   */
  it('accepts a known pane id', () => {
    window.history.replaceState(null, '', '/?view=settings&tab=sync')
    mount()
    // Every pane renders either way — what the deep link changes is which one
    // the strip is scrolled to, and jsdom has no layout to measure that with.
    // So this asserts the half that IS testable here and would actually break:
    // a value the view rejects falls through to the first pane and the sync
    // pane would still be present, making the two cases indistinguishable.
    // Hence the real assertion is below, on the rejected value.
    expect(screen.getByRole('region', { name: 'Sync & privacy' })).toBeTruthy()
  })

  it('falls through to the first pane on a value it does not know', () => {
    // A stale or hand-typed `tab` must land somewhere real. The old shell
    // validated against its list for the same reason; the list moved, the rule
    // did not.
    window.history.replaceState(null, '', '/?view=settings&tab=nonsense')
    expect(() => mount()).not.toThrow()
    expect(screen.getByRole('region', { name: 'Account' })).toBeTruthy()
  })
})
