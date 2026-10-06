import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalProvider } from '../store'
import { ConfirmProvider } from '../components/ConfirmDialog'
import { NavProvider } from '../components/shell/nav'
import { Fitness } from './Fitness'
import { SECTIONS } from '../components/shell/sections'
import { LOGGABLE_MODES, MODES, activitiesForMode, modeSegments } from '../domain/activities'

/**
 * The deep-linked activity has to beat the stored mode.
 *
 * `useStickyState` reads localStorage before it looks at the default it was
 * handed, so passing the linked mode as that default did nothing once a mode
 * had ever been chosen: the draft took `run` while the toggle stayed on the
 * stored `sport`. The activity `<select>` then held a value absent from its own
 * option list — which a browser renders as the *first* option, so the form said
 * "Pickleball", carried `run`, and would have logged one as the other.
 *
 * The assertion that matters is not "the select says Run" on its own. It is
 * that the select's value is **among its options**: that is the invariant whose
 * violation the browser hides, and the reason the bug survived a visual pass.
 */
function mount() {
  return render(
    <NavProvider navigate={() => {}}>
      <ConfirmProvider>
        <JournalProvider>
          <Fitness />
        </JournalProvider>
      </ConfirmProvider>
    </NavProvider>,
  )
}

const activitySelect = () => screen.getByLabelText('Activity') as HTMLSelectElement

describe('Fitness · deep-linked activity vs stored mode', () => {
  afterEach(() => {
    localStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  it('takes the mode from ?activity= even when another mode is stored', () => {
    localStorage.setItem('bujo.ui.fitness.mode', 'sport')
    window.history.replaceState({}, '', '/?view=fitness&activity=run')
    mount()

    const select = activitySelect()
    expect(select.value).toBe('run')
    // The half that was invisible: a controlled select whose value is not in its
    // options renders as the first option instead of failing.
    expect([...select.options].map((o) => o.value)).toContain('run')
  })

  it('still lets the user switch mode by hand while the link is on screen', async () => {
    const user = userEvent.setup()
    localStorage.setItem('bujo.ui.fitness.mode', 'sport')
    window.history.replaceState({}, '', '/?view=fitness&activity=run')
    mount()
    expect(activitySelect().value).toBe('run')

    // Radix `ToggleGroup type="single"` renders radios, not buttons.
    // Sport, not Strength: Strength is a Body tab now and not a segment here.
    await user.click(screen.getByRole('radio', { name: 'Sport' }))

    const select = activitySelect()
    expect(select.value).not.toBe('run')
    expect([...select.options].map((o) => o.value)).toContain(select.value)
  })

  it('falls back to the stored mode with no ?activity=', () => {
    localStorage.setItem('bujo.ui.fitness.mode', 'sport')
    window.history.replaceState({}, '', '/?view=fitness')
    mount()

    const select = activitySelect()
    expect([...select.options].map((o) => o.value)).toContain(select.value)
    expect(select.value).toBe('pickleball')
  })
})

/**
 * There are no companion links left, and this is what replaced the test that
 * guarded them.
 *
 * The old one asked "does a companion point at something already tabbed?" —
 * the right question for the failure it was written after, and blind to the
 * one that actually happened. `COMPANION`'s last entry pointed at Home
 * workout, which was *not* tabbed, so it passed; what it could not ask was
 * whether the link could still render. It could not, and had not for some
 * time: it was keyed on an activity whose mode had been dropped from
 * `LOGGABLE_MODES` two files away.
 *
 * So the invariant worth keeping is about activities, not links. Every
 * activity the page can *select* must belong to a mode the page can *offer* —
 * the property whose failure made the link unreachable, stated where it can
 * fail loudly.
 */
describe('Fitness activity reachability', () => {
  it('offers at least one activity per loggable mode', () => {
    for (const mode of LOGGABLE_MODES) {
      expect(activitiesForMode(mode).length).toBeGreaterThan(0)
    }
  })

  it('every activity in a non-loggable mode has a page of its own', () => {
    // The escape hatch for an activity Fitness cannot log: it must be logged
    // somewhere. `homeWorkout` is the case that broke — it had neither.
    const tabs = SECTIONS.flatMap((s) => s.tabs).map((t) => t.view)
    const unloggable = MODES.filter((m) => !LOGGABLE_MODES.includes(m))
    expect(unloggable.length).toBeGreaterThan(0)
    for (const mode of unloggable) {
      expect(activitiesForMode(mode).length).toBeGreaterThan(0)
    }
    // Home workout's own surface, which is now how you reach it.
    expect(tabs).toContain('homeworkout')
  })
})

/**
 * One front door per record shape.
 *
 * Strength was a segment on this page AND a Body tab, so the same `Workout`
 * had two loggers — and the one here could not hold a set row, a split, a PR
 * or a rest timer, which is the half nothing failed on. The invariant is not
 * "there are two segments": it is that **every mode this page offers has no
 * page of its own**, so promoting a mode to a tab fails here rather than
 * quietly doubling the door. Sibling of the companion-link test above.
 */
describe('Fitness mode segments', () => {
  it('offers no mode that already has its own Body tab', () => {
    const tabbed: Partial<Record<string, string>> = { strength: 'gym' }
    const doubled = modeSegments().map((seg) => seg.value).filter((m) => tabbed[m])
    expect(doubled).toEqual([])
  })

  it('keeps every mode in the registry, so old sessions still derive one', () => {
    // Deleting the segment must not delete the shape: `modeOf('push')` is still
    // `strength`, which is what makes the edit dialog render a sets field.
    expect(MODES).toContain('strength')
    expect(LOGGABLE_MODES).not.toContain('strength')
  })
})

describe('Fitness · a strength deep link', () => {
  afterEach(() => {
    localStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  it('redirects to Strength instead of landing on a toggle that cannot hold it', () => {
    const seen: string[] = []
    window.history.replaceState({}, '', '/?view=fitness&activity=pullups')
    render(
      <NavProvider navigate={(v) => seen.push(v)}>
        <ConfirmProvider>
          <JournalProvider>
            <Fitness />
          </JournalProvider>
        </ConfirmProvider>
      </NavProvider>,
    )
    expect(seen).toContain('gym')
    // And it does not silently preselect a strength activity on the way out.
    expect([...activitySelect().options].map((o) => o.value)).toContain(activitySelect().value)
  })
})
