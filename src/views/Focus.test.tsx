import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider } from '../store'
import { ConfirmProvider } from '../components/ConfirmDialog'
import { NavProvider } from '../components/shell/nav'
import { CursorProvider } from '../components/shell/cursor'
import { Focus } from './Focus'
import {
  FOCUS_CARDS, FOCUS_DEFAULT_GROUP, FOCUS_GROUPS, FOCUS_GROUP_LABEL,
} from '../lib/focusCards'
import { generateDemoData } from '../lib/demo'
import { DeviceProvider } from '../components/shell/device'
import { lastSession, shortMin } from '../lib/focusDraft'
import { addDays, todayISO } from '../lib/date'
import type { DevSession } from '../lib/types'

/**
 * The registry and the review zone must hold the same cards — Insights' contract
 * test (`views/Insights.test.tsx`), applied to the rail that replaced this page's
 * six-band flat stack.
 *
 * It exists because the alternative has already happened twice in this repo: on
 * Insights five habit grids rendered with no card id, so nothing could filter,
 * find or count them; and `views/Pullups.tsx` lost eleven workout formats to a
 * pass that retyped a data module instead of moving it, with `tsc -b`, eslint,
 * vitest and the build all green. A rail makes that failure *quieter*, not
 * louder — a card that no group reaches is simply never on screen — so the
 * assertion has to be the union over every rail row, in both directions.
 */
/* Seeded through storage, not through an effect: `replaceAll` is a fresh
   identity each render, so `useEffect(…, [replaceAll])` re-seeds forever. */
function mount() {
  localStorage.setItem('bujo:data', JSON.stringify(generateDemoData()))
  return render(
    <NavProvider navigate={() => {}}>
      <CursorProvider>
        <ConfirmProvider>
          <JournalProvider>
            <Focus />
          </JournalProvider>
        </ConfirmProvider>
      </CursorProvider>
    </NavProvider>,
  )
}

afterEach(() => localStorage.clear())

/** The rail names itself "Rhythm — 2 panels"; match on the label half. */
const railRow = (label: string) =>
  screen.getByRole('button', { name: (name) => name.startsWith(`${label} `) })

describe('Focus · the registry is the review zone', () => {
  it('reaches every registered card through the rail, and no unregistered one', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    const seen = new Set<string>()
    for (const g of FOCUS_GROUPS) {
      await user.click(railRow(FOCUS_GROUP_LABEL[g]))
      for (const el of container.querySelectorAll('[data-card]')) {
        seen.add(el.getAttribute('data-card')!)
      }
    }
    const registered = FOCUS_CARDS.map((c) => c.id).sort()
    expect([...seen].sort().filter((id) => !registered.includes(id))).toEqual([])
    expect(registered.filter((id) => !seen.has(id))).toEqual([])
  })

  it('shows one group at a time, and its heading and count match the rail row', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    for (const g of FOCUS_GROUPS) {
      await user.click(railRow(FOCUS_GROUP_LABEL[g]))
      const groups = [...container.querySelectorAll('[data-domain]')]
      expect(groups).toHaveLength(1)
      expect(groups[0].getAttribute('data-domain')).toBe(g)
      // A heading over an empty grid is the failure mode of grouping.
      const cards = groups[0].querySelectorAll('[data-card]')
      expect(cards.length).toBeGreaterThan(0)
      // The rail's count is a promise about what the row holds. Computed from a
      // different predicate than the render, it can lie in either direction.
      expect(railRow(FOCUS_GROUP_LABEL[g]).getAttribute('aria-label'))
        .toBe(`${FOCUS_GROUP_LABEL[g]} ${cards.length} ${cards.length === 1 ? 'panel' : 'panels'}`)
    }
  })

  it('opens on a real group, not on the whole page', () => {
    // Landing on everything is landing on the 5.7-screen phone page the rail
    // replaces, which is why there is no "All" row to default to either.
    const { container } = mount()
    const groups = container.querySelectorAll('[data-domain]')
    expect(groups).toHaveLength(1)
    expect(groups[0].getAttribute('data-domain')).toBe(FOCUS_DEFAULT_GROUP)
  })

  /**
   * The timer and the log form are zone 2, not rail rows.
   *
   * This is the structural claim of the whole pass — "a big timer on the right"
   * is the same statement as "the timer is the act", since `styles/layout.css`
   * puts the act column on the right above a 900px container. If either of these
   * ever drifts into zone 3 it becomes reachable only by selecting a rail row,
   * which is the opposite of what the page is for.
   */
  it('keeps the timer and the log form out of the rail, in every group', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    for (const g of FOCUS_GROUPS) {
      await user.click(railRow(FOCUS_GROUP_LABEL[g]))
      expect(screen.getByRole('button', { name: /^Start$/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Log session' })).toBeInTheDocument()
      const act = container.querySelector('.zone-act')!
      expect(act.textContent).toContain('Timer')
      expect(act.textContent).toContain('Log a session')
      // …and they are not ALSO in the review column, which a copy-paste move
      // would produce and which every other assertion here would still pass.
      expect(container.querySelector('.zone-review')!.textContent).not.toContain('Log a session')
    }
  })

  /**
   * The findings card states conclusions, and the failure mode is a fake one.
   *
   * `focusFindings` composes helpers that return `null` when they cannot answer,
   * and the demo seed is built to exhibit the two that matter. A finding list
   * that renders "0/10" or "not enough data" instead of omitting the row is the
   * `count ? sum/count : 0` trap in prose form.
   */
  it('states the findings the seed supports, and no placeholder', () => {
    mount()
    const card = document.querySelector('[data-card="findings"]')!
    expect(card.textContent).toMatch(/best focus comes in/i)
    expect(card.textContent).toMatch(/Uninterrupted sessions score/i)
    expect(card.textContent).not.toMatch(/not enough data/i)
    expect(card.textContent).not.toMatch(/0\/10/)
  })

  /**
   * Typing was the page's unseeded domain, so its two cards had never rendered
   * anything but em dashes and an empty list. Asserted on the rendered page and
   * not only in `lib/demo.test.ts`, because the two can disagree: the seed can
   * hold WPM readings while the card's own `wpmCount >= 2` gate keeps the chart
   * out of the DOM.
   */
  it('renders typing practice with real figures, not em dashes', async () => {
    const user = userEvent.setup()
    mount()
    await user.click(railRow(FOCUS_GROUP_LABEL.typing))
    const stats = document.querySelector('[data-card="typingstats"]')!
    expect(stats.textContent).not.toMatch(/Best WPM\s*—/)
    expect(stats.textContent).not.toMatch(/No typing sessions yet/)
    // The Recharts trend is behind `wpmCount >= 2`; `role="img"` is its wrapper.
    expect(stats.querySelector('[role="img"][aria-label^="Best WPM per practised day"]')).not.toBeNull()
  })
})

/**
 * THE PHONE LOG (`FocusPhone`) — asserted on the JOURNAL, not on the DOM: a
 * segmented control reads back whatever React last rendered, so a tap that
 * never reached the draft can still look selected (the controlled-input trap
 * in CLAUDE.md). Each value tapped is one the carried-over draft does NOT
 * already hold, or a seeded match would pass for us.
 */
describe('Focus · on a phone', () => {
  afterEach(() => vi.unstubAllGlobals())

  function mountPhone() {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: !q.includes('coarse'), media: q, addEventListener() {}, removeEventListener() {} }))
    localStorage.setItem('bujo:data', JSON.stringify(generateDemoData()))
    return render(
      <DeviceProvider>
        <NavProvider navigate={() => {}}>
          <CursorProvider>
            <ConfirmProvider>
              <JournalProvider>
                <Focus />
              </JournalProvider>
            </ConfirmProvider>
          </CursorProvider>
        </NavProvider>
      </DeviceProvider>,
    )
  }
  const stored = (): DevSession[] => JSON.parse(localStorage.getItem('bujo:data')!).devSessions
  const unpicked = (group: string) =>
    within(screen.getByRole('radiogroup', { name: group })).getAllByRole('radio', { checked: false })[0]

  it('logs a session from taps alone, carrying the rest from the last one', async () => {
    const user = userEvent.setup()
    mountPhone()
    // The desktop form is not drawn — one log, not two.
    expect(screen.queryByRole('button', { name: 'Log session' })).toBeNull()
    const before = stored()
    const last = lastSession(before)!

    const minutes = unpicked('Minutes')
    const project = unpicked('Project')
    const tag = within(screen.getByRole('group', { name: 'Tags' })).getAllByRole('button', { pressed: false })[0]
    await user.click(minutes)
    await user.click(project)
    await user.click(tag)
    // The day is the shared strip (in the top bar on a real phone): its
    // second-to-last chip is yesterday on a trailing week ending today.
    const days = within(screen.getByRole('radiogroup', { name: 'Day to log' })).getAllByRole('radio')
    await user.click(days[days.length - 2])
    await user.click(screen.getByRole('button', { name: 'Log' }))

    const after = stored()
    expect(after).toHaveLength(before.length + 1)
    const s = after.find((x) => !before.some((y) => y.id === x.id))!
    expect(shortMin(s.durationMin)).toBe(minutes.textContent)
    expect(s.project).toBe(project.textContent)
    expect(s.date).toBe(addDays(todayISO(), -1))
    // The tapped tag joins the ones carried over from last time.
    expect(s.tags).toEqual([...(last.tags ?? []), tag.textContent])
    expect([s.focus, s.stress, s.interruptions]).toEqual([last.focus, last.stress, undefined])
  })
})
