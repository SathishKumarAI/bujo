import { useEffect, useRef } from 'react'
import { useJournal } from '../../../store'
import { Segmented } from '../../ui'
import { useCursor } from '../cursor'
import { SURFACE_LABEL, surfaceUntouched } from '../../../lib/surface'
import type { Surface } from '../../../lib/deepLink'

const SURFACES: Surface[] = ['morning', 'day', 'evening']

/**
 * THE SURFACE SWITCHER · navigation that also reports.
 *
 * Three words and nothing else was the whole control, so the row could tell you
 * where you *are* and never where you have not been. Each segment carries a
 * mark when that surface's own record is still empty for the day
 * (`surfaceUntouched`), which is the only fact a tab row is in a position to
 * state without duplicating the cards beneath it.
 *
 * The mark is a graphic, so the state is also in the accessible name — colour
 * and shape are never the only carrier. It inherits `currentColor`, so it picks
 * up the accent on the active segment and the muted foreground elsewhere: the
 * page's one accent, not a second one.
 *
 * A **square**, not a round dot, because `--radius-pill` is `0rem` here: radius
 * zero is one of the four rules the whole redesign is built on, and the design
 * gate rejects a full-radius utility for exactly that reason. It also happens to
 * be the right glyph — this is a bullet journal, and its marks are signifiers.
 * (The gate is a line-level regex, so it fired on the paragraph naming the class
 * as readily as on the class itself.)
 *
 * **It lives in the header's second row now, not in Today's masthead.** That row
 * is the app's "where you are" row — it holds the section tab row on the
 * fifteen views that have one, and centres it. Today has exactly one tab, so
 * `SectionTabs` renders nothing there and the row fell back to a centred title
 * that repeats the word already in the rail above it and in the date stepper to
 * its right. Meanwhile the three surfaces — which ARE Today's tabs in every way
 * that matters, one per third of the day — were parked at the right-hand end of
 * the day masthead inside the page.
 *
 * So the row that exists to say which surface you are on was saying nothing,
 * and the control that says it was somewhere else. Same axis, same centring,
 * same 44px targets as a section tab.
 *
 * **Focused layout only.** `settings.layout: 'classic'` puts every card on one
 * page and has no surfaces at all; a switcher there would move a cursor nothing
 * reads.
 */
export function SurfaceTabs() {
  const { data } = useJournal()
  const { day: date, surface, setSurface } = useCursor()
  const row = useRef<HTMLDivElement>(null)

  /**
   * Keep the ACTIVE surface in view when the row has to scroll.
   *
   * At 390px the three segments need ~226px and the row has ~218px beside the
   * date stepper, so it overflows by a hair. Left-aligned that renders the
   * current surface as "Eve" — a tab row disagreeing with the page, which is
   * the one thing a tab row must never do, and `SectionTabs` carries the same
   * fix for the same reason.
   *
   * `scrollLeft` from rect maths rather than `scrollIntoView`: the latter walks
   * every scrollable ancestor, so on a short viewport it would also scroll the
   * page and drag you past the header. Rect maths is position-aware, so running
   * it again is idempotent. The `ResizeObserver` covers a rotation or a resize,
   * which a one-shot effect keyed on `surface` would leave re-clipped.
   */
  useEffect(() => {
    const el = row.current
    if (!el) return
    const centre = () => {
      const on = el.querySelector('[data-state="on"]')
      if (!on) return
      const rr = el.getBoundingClientRect()
      const ar = on.getBoundingClientRect()
      if (ar.left >= rr.left && ar.right <= rr.right) return // already in view
      el.scrollLeft += ar.left - rr.left - (rr.width - ar.width) / 2
    }
    const id = requestAnimationFrame(centre)
    const ro = new ResizeObserver(centre)
    ro.observe(el)
    return () => { cancelAnimationFrame(id); ro.disconnect() }
  }, [surface])

  if ((data.settings.layout ?? 'focused') !== 'focused') return null
  const untouched = surfaceUntouched(data, date)
  return (
    // `overflow-x-auto` for the same reason `SectionTabs` has it: a segmented
    // control keeps its full intrinsic width inside a `min-w-0` flex child and
    // otherwise draws straight past its own box — at 390px that put "Evening"
    // underneath the date stepper and pushed its ‹ arrow off the row.
    <div
      ref={row}
      className="flex min-w-0 flex-1 items-center overflow-x-auto py-1 md:flex-none md:justify-center"
    >
      {/* Navigation, not a reveal: no transition beyond the page's existing
          220ms entrance. Switching surfaces is switching pages. */}
      <Segmented
        value={surface}
        onChange={setSurface}
        size="touch"
        // Neutral, not accent — and this only became a decision when the control
        // moved. Row 1's active section is an accent-filled pill; an accent
        // segment directly under it makes two rows both claiming to be where you
        // are. `SectionTabs` already settled this for the other fifteen views
        // ("the section owns the accent, the tab owns the surface") and this is
        // the same row. Inside the page masthead there was no row above it to
        // compete with, so accent was right there and is wrong here.
        tone="neutral"
        options={SURFACES.map((s) => ({
          value: s,
          label: (
            <span className="inline-flex items-center gap-1.5">
              {SURFACE_LABEL[s]}
              {untouched[s] && (
                <>
                  <span aria-hidden className="size-1.5 bg-current" />
                  <span className="sr-only">, nothing recorded yet</span>
                </>
              )}
            </span>
          ),
        }))}
      />
    </div>
  )
}
