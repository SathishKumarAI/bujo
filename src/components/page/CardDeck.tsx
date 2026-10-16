import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { CaretLeft, CaretRight } from '@/components/icons'
import { Icon } from '@/components/Icon'

/**
 * ONE CARD AT A TIME, and the next one is a swipe away.
 *
 * WHAT THIS FILE OWNS: the scroller, which card is in view, and the controls
 * that move it.
 * WHAT IT DOES NOT OWN: the cards, or which cards there are.
 *
 * ── Why ──────────────────────────────────────────────────────────────────
 *
 * Asked for directly: *"we don't need to try it for everything at once — I'll
 * just show one card, and if they are interested they will go to another card,
 * like a loop scrolling. Focus on one thing at a time."*
 *
 * The measurement behind it: Recovery's `Patterns` row holds nine cards and
 * rendered **4,063px / 4.51 desktop screens and 6.37 on a phone** as a grid.
 * Sub-sections cut that to 1.2–2.5 screens by *hiding* six of them; a deck
 * shows one and keeps all nine a swipe away, which is the same reduction
 * without the hiding.
 *
 * ── Native scroll-snap, not a carousel library ───────────────────────────
 *
 * `overflow-x-auto snap-x snap-mandatory` plus `snap-center` children is the
 * whole mechanism. It gets momentum scrolling, trackpad swipes, touch flings
 * and keyboard scrolling from the platform, costs no dependency, and cannot
 * get out of step with the DOM the way an index-driven carousel does — the
 * scroller IS the state, and the dots read it rather than drive it.
 *
 * The arrows and dots scroll it; nothing here positions anything by hand.
 *
 * ── The accessibility that a scroller actually needs ─────────────────────
 *
 * A horizontally scrolling region is one `npm run a11y` has failed this repo
 * on before (`scrollable-region-focusable`, a serious violation on the Cycle
 * chart). So the track is a labelled `tabIndex={0}` region, the dots are real
 * buttons naming the card they go to, and the live count is announced. Arrow
 * keys work because the browser scrolls a focused scroll container for free.
 *
 * **The floor is TWO, and it moved there on a measurement.** It started at
 * four, on the reasoning that below that a deck is a control standing in front
 * of content that already fitted. Then Recovery's `Win or loss` row became two
 * cards — a wide ledger and the urge history — and stacking them measured
 * **2,057px of review** against roughly half that for a deck. Two large cards
 * stacked are not "content that already fitted"; they are the wall this
 * component exists to remove. One card is still a plain render, because a
 * one-card carousel is only furniture.
 */
export function CardDeck({ items, label, minCards = 2 }: {
  /** One entry per card. `key` is also what the dot announces. */
  items: { key: string; title: string; node: ReactNode }[]
  /** Names the deck for assistive tech: "Patterns cards". */
  label: string
  /** Below this many, render a plain stack instead. Two is the floor — see above. */
  minCards?: number
}) {
  const track = useRef<HTMLDivElement>(null)
  const [at, setAt] = useState(0)
  /*
    THE TRACK IS AS TALL AS THE CARD YOU ARE LOOKING AT, not as its tallest.

    A flex row is the height of its tallest child, so a nine-card deck whose
    biggest panel is 1,519px gave every other card 1,519px of box — reported as
    "some of them are like there are some empty spaces". Measuring the active
    slide and setting the track to it is the only way a native scroller can
    follow the content, and it costs one `ResizeObserver`.

    `null` until measured, so the first paint is the natural height rather than
    a collapse to zero.
  */
  const [h, setH] = useState<number | null>(null)

  /* WHICH CARD IS IN VIEW, read FROM the scroller rather than pushed to it.
     An index that drives the scroll and a scroll that drives the index fight
     each other the moment someone flings the track; this way the scroll
     position is the single source and `at` is a view of it. */
  const sync = useCallback(() => {
    const el = track.current
    if (!el) return
    const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth))
    setAt(Math.max(0, Math.min(items.length - 1, i)))
  }, [items.length])

  useEffect(() => {
    const el = track.current
    if (!el) return
    el.addEventListener('scroll', sync, { passive: true })
    return () => el.removeEventListener('scroll', sync)
  }, [sync])

  /* Re-measure when the card changes AND when the card itself changes size —
     a fold opening inside a panel is the common case, and without the observer
     the deck would clip it. */
  useEffect(() => {
    const slide = track.current?.children[at] as HTMLElement | undefined
    if (!slide) return
    const read = () => setH(slide.getBoundingClientRect().height)
    read()
    const ro = new ResizeObserver(read)
    ro.observe(slide)
    return () => ro.disconnect()
  }, [at, items.length])

  const go = (i: number) => {
    const el = track.current
    if (!el) return
    const next = Math.max(0, Math.min(items.length - 1, i))
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
  }

  if (items.length < minCards) {
    return <div className="grid gap-3">{items.map((c) => <div key={c.key}>{c.node}</div>)}</div>
  }

  return (
    <div className="min-w-0">
      {/* THE CONTROLS ABOVE THE TRACK, so they do not move as you scroll and
          so the card below is the only thing that changes. The count says
          where you are without needing the dots to be counted. */}
      <div className="mb-2 flex items-center gap-2">
        <p className="text-label text-fg-2">
          <span className="num text-fg-1">{at + 1}</span> of <span className="num">{items.length}</span> · {items[at]?.title}
        </p>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => go(at - 1)}
            disabled={at === 0}
            aria-label={`Previous card${at > 0 ? `: ${items[at - 1].title}` : ''}`}
            className="grid h-11 w-11 place-items-center rounded-control text-fg-2 transition-colors hover:bg-ink-2 hover:text-fg-1 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Icon as={CaretLeft} size="sm" />
          </button>
          <button
            type="button"
            onClick={() => go(at + 1)}
            disabled={at === items.length - 1}
            aria-label={`Next card${at < items.length - 1 ? `: ${items[at + 1].title}` : ''}`}
            className="grid h-11 w-11 place-items-center rounded-control text-fg-2 transition-colors hover:bg-ink-2 hover:text-fg-1 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Icon as={CaretRight} size="sm" />
          </button>
        </div>
      </div>

      {/*
        `tabIndex={0}` and a name, because a scrollable region that keyboard
        users cannot reach is `scrollable-region-focusable` — a serious axe
        violation this repo has shipped once already. Focused, the browser
        scrolls it with the arrow keys for free.

        The scrollbar is the app's own thin one from `index.css`, the same as
        `SectionRail`'s. `scrollbar-none` is NOT a utility this Tailwind build
        defines — it would have emitted nothing, with no error and a perfectly
        valid class list, which is the stale-utility trap in CLAUDE.md.
      */}
      <div
        ref={track}
        tabIndex={0}
        role="group"
        aria-label={label}
        style={h == null ? undefined : { height: h }}
        className="-mx-1 flex snap-x snap-mandatory items-start gap-3 overflow-x-auto overflow-y-hidden px-1 pb-1 transition-[height] duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {items.map((c) => (
          <div key={c.key} className="h-fit w-full min-w-0 shrink-0 snap-center">{c.node}</div>
        ))}
      </div>

      {/* DOTS ONLY WHEN THEY ADD SOMETHING.

          Reviewed as "there's currently a 1 of 2 pager, left/right arrows, a
          horizontal scrollbar, pagination dots and Show all — use one way to
          navigate". Fair: at two or three cards the count and the arrows
          already say everything the dots do, and a row of two dots under a
          card is furniture. They earn their place once there are enough cards
          that jumping beats stepping.

          They name their destination — "a shortened label is a shortened name
          unless it is said somewhere" (§3) — and carry `aria-current` rather
          than relying on colour. */}
      {items.length > 3 && (
      <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
        {items.map((c, i) => (
          <button
            key={c.key}
            type="button"
            onClick={() => go(i)}
            aria-current={i === at ? 'true' : undefined}
            aria-label={`Card ${i + 1} of ${items.length}: ${c.title}`}
            className={`h-2.5 rounded-pill transition-all ${i === at ? 'w-6 bg-brand' : 'w-2.5 bg-ink-3 hover:bg-line-strong'}`}
          />
        ))}
      </div>
      )}
    </div>
  )
}
