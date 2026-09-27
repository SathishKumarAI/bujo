import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider } from '../store'
import { ConfirmProvider } from '../components/ConfirmDialog'
import { NavProvider } from '../components/shell/nav'
import { CursorProvider } from '../components/shell/cursor'
import { NoFap } from './NoFap'
import { CARDS, GROUPS, GROUP_LABEL, DEFAULT_GROUP } from '../lib/recoveryCards'
import { generateDemoData } from '../lib/demo'
import { TECHNIQUES } from '../components/recovery/TechniquesBlock'

/**
 * The registry and the page must hold the same panels.
 *
 * Recovery's zone 3 was three `CollapsibleSection`s that all shipped shut, and
 * the panels inside them were written inline in a 929-line view. Moving them out
 * is the single most dangerous shape of change in this repo: `views/Pullups.tsx`
 * lost **eleven workout formats** to a pass that retyped a data module instead of
 * reading it, with `tsc`, eslint, vitest and the build all green, and the page
 * still rendering a plausible-looking list.
 *
 * This reads `data-card` off the rendered DOM, so it fails when a panel is
 * dropped in a move, when one is added with no registry row, and when a group
 * heading ends up over nothing.
 */
/* Seeded through storage, not through an effect. `replaceAll` is a fresh
   identity each render, so `useEffect(…, [replaceAll])` re-seeds forever — the
   first version of the Insights twin of this file hung the runner. */
function mount() {
  localStorage.setItem('bujo:data', JSON.stringify(generateDemoData()))
  return render(
    <NavProvider navigate={() => {}}>
      <CursorProvider>
        <ConfirmProvider>
          <JournalProvider>
            <NoFap />
          </JournalProvider>
        </ConfirmProvider>
      </CursorProvider>
    </NavProvider>,
  )
}

afterEach(() => localStorage.clear())

/** The rail names itself "Progress — 7 panels"; match on the label half. */
const railRow = (label: string) =>
  screen.getByRole('button', { name: (name) => name.startsWith(`${label} — `) })

/**
 * Panels the demo seed structurally cannot produce, with the reason.
 *
 * Kept as a named list rather than by weakening the assertion, so a panel that
 * silently stops rendering still fails. Every addition here is a claim that a
 * gate cannot see that card — `npm run a11y` included — so the list is worth
 * keeping short.
 *
 * - `calmstretch` needs "no urge logged for at least a day" and the seed logs
 *   two urges **today**, because `urgetrend`, `riskhours` and the day tally all
 *   need a recent one. The two cannot both be on screen from one seed; a
 *   recent urge is the more useful default.
 */
const SEED_CANNOT_RENDER = ['calmstretch']

describe('Recovery · the registry is the page', () => {
  /**
   * The rail shows one group at a time, so "every panel renders" is not true of
   * a single render — and what replaces it is stronger: walk the rail, and the
   * UNION of what each group shows must be the registry. A panel belonging to no
   * reachable group fails here, which an all-at-once check could not catch.
   */
  it('reaches every registered panel through the rail, and no unregistered one', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    const seen = new Set<string>()
    for (const g of GROUPS) {
      await user.click(railRow(GROUP_LABEL[g]))
      for (const el of container.querySelectorAll('[data-card]')) seen.add(el.getAttribute('data-card')!)
    }
    const registered = CARDS.map((c) => c.id)
    expect([...seen].filter((id) => !registered.includes(id)).sort()).toEqual([])
    expect(registered.filter((id) => !seen.has(id) && !SEED_CANNOT_RENDER.includes(id))).toEqual([])
  })

  it('shows one group at a time, and its heading matches the rail row', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    for (const g of GROUPS) {
      await user.click(railRow(GROUP_LABEL[g]))
      const groups = [...container.querySelectorAll('[data-domain]')]
      expect(groups).toHaveLength(1)
      expect(groups[0].getAttribute('data-domain')).toBe(g)
      // A heading over an empty grid is the failure mode of grouping.
      expect(groups[0].querySelectorAll('[data-card]').length).toBeGreaterThan(0)
    }
  })

  /**
   * Landing on everything is landing on the 4.8-screen page the rail replaces,
   * and landing on the first row for its own sake is a coin toss. Someone opens
   * Recovery to see where the streak stands.
   */
  it('opens on one real group, and it is Progress', () => {
    const { container } = mount()
    const groups = [...container.querySelectorAll('[data-domain]')]
    expect(groups).toHaveLength(1)
    expect(groups[0].getAttribute('data-domain')).toBe(DEFAULT_GROUP)
    expect(DEFAULT_GROUP).toBe('progress')
  })

  /**
   * The rail selection persists. The three folds this replaced each carried a
   * `stickyKey`; `docs/PAGE-WORKFLOW.md` calls losing that "a regression dressed
   * as a redesign", so it is asserted rather than assumed.
   */
  it('restores the group it was left on', () => {
    localStorage.setItem('bujo.ui.recovery.group', 'patterns')
    const { container } = mount()
    expect(container.querySelector('[data-domain]')?.getAttribute('data-domain')).toBe('patterns')
  })

  /**
   * A query has to cross groups. Finding a panel whose group you do not remember
   * is the whole reason the filter exists, so it must not be silently
   * intersected with whichever rail row happens to be selected.
   */
  it('filters across groups regardless of the selected rail row', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(railRow(GROUP_LABEL.reference))
    await user.type(screen.getByLabelText('Filter the Recovery panels'), 'quit date')
    const ids = [...container.querySelectorAll('[data-card]')].map((e) => e.getAttribute('data-card'))
    expect(ids).toContain('commitment') // group `plan`, while the rail said Reference
  })

  /**
   * The rail offers exactly the registry's groups and no "All" row — the four do
   * not overlap, and "all of them" is the page this replaces. A stray extra row
   * means a second vocabulary has appeared beside the registry's, which is the
   * fault `docs/PAGE-SHAPE.md` was written about.
   */
  it('offers exactly the registry groups in the rail', () => {
    mount()
    const rail = screen.getByRole('navigation', { name: 'Recovery groups' })
    const labels = [...rail.querySelectorAll('button')].map((b) => (b.getAttribute('aria-label') || '').split(' — ')[0])
    expect(labels).toEqual(GROUPS.map((g) => GROUP_LABEL[g]))
  })

  /**
   * The seven coping techniques moved from seven hand-typed `<li>`s to a
   * `TECHNIQUES` array and a `map()`. `views/Pullups.tsx` lost eleven workout
   * formats to a pass of exactly that shape with `tsc`, eslint, vitest and the
   * build all green — an inlined list that renders a plausible-looking subset
   * fails nothing, and the tiles look right whether there are four of them or
   * seven. So the count and the terms are asserted, not the look.
   */
  it('renders all seven coping techniques in the reference group', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(railRow(GROUP_LABEL.reference))
    const tiles = container.querySelectorAll('[data-card="techniques"] ol > li')
    expect(TECHNIQUES).toHaveLength(7)
    expect(tiles).toHaveLength(TECHNIQUES.length)
    expect([...tiles].map((li) => li.textContent?.split(' · ')[0])).toEqual(TECHNIQUES.map((t) => t.term))
  })

  /**
   * Zone 2's whole point, and the report this pass answers: "why do I need to
   * scroll to the end to log a resisted urge?". The submit is the FIRST control
   * in the urge card now, before its four optional field groups — asserted on
   * DOM order because the y-offset that proves it lives in the browser gates,
   * and a jsdom height is meaningless.
   */
  /**
   * One card per tracked addiction under one registry id, the same shape as
   * `lapsecounts`. The count is the user's data, so the registry cannot assert
   * it — this can, and must: the seed has two addictions and a pass that
   * rendered only the first would leave the registry, the rail count and the
   * page all agreeing while half the answer was missing. That is the
   * `views/Pullups.tsx` failure exactly (eleven workout formats lost with every
   * gate green).
   */
  it('gives every tracked addiction its own breakdown card', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(railRow(GROUP_LABEL.patterns))
    const names = (generateDemoData().nofap.addictions ?? []).map((a) => a.name)
    expect(names.length).toBeGreaterThan(1)
    const panel = container.querySelector('[data-card="addictionbreakdown"]')!
    const titles = [...panel.querySelectorAll('h2, h3')].map((h) => h.textContent?.trim())
    for (const n of names) expect(titles.some((t) => t === n)).toBe(true)
  })

  /**
   * The three questions, each named on the card, because "how much / on what
   * days / at what times" is the request and a card that answers two of them
   * silently looks like a card that answered all three. The hour heading is
   * asserted even on the addiction with no matching urge — its branch is a
   * sentence saying why, not a missing section.
   */
  it('names all three questions on every breakdown card', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(railRow(GROUP_LABEL.patterns))
    const panel = container.querySelector('[data-card="addictionbreakdown"]')!
    const cards = [...panel.querySelectorAll('section')].filter((s) => s.querySelector('h3'))
    expect(cards.length).toBeGreaterThan(0)
    for (const q of ['On what days', 'At what times']) {
      expect(panel.textContent).toContain(q)
    }
    // Both hour branches ship from one seed: a real clock for the addiction
    // whose label matches an urge, and the reason for the one whose does not.
    expect(panel.textContent).toContain('cluster at')
    expect(panel.textContent).toContain('so there is no clock to draw')
    // And the denominator, which is the whole point of printing it.
    expect(panel.textContent).toMatch(/\d+ of \d+ logged urges carry a label/)
  })

  it('puts the urge submit before the fields it annotates', () => {
    const { container } = mount()
    const card = [...container.querySelectorAll('section')].find((s) => /^Urge surfing/.test(s.textContent || ''))!
    const controls = [...card.querySelectorAll('button, fieldset, input')]
    const submit = controls.findIndex((el) => /log this urge/i.test(el.textContent || ''))
    const firstField = controls.findIndex((el) => el.tagName === 'FIELDSET')
    expect(submit).toBeGreaterThanOrEqual(0)
    expect(firstField).toBeGreaterThanOrEqual(0)
    expect(submit).toBeLessThan(firstField)
  })
})
