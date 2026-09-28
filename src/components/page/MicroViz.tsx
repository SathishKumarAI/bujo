/**
 * MICRO VIZ · the picture behind a figure in zone 1 and zone 3's strip.
 *
 * `StatBar` and `SummaryStrip` print seven numbers between them and drew
 * nothing. That is the right default for a fact with no series — "Train next ·
 * Pull" is a decision, not a trend — and the wrong one for the four here that
 * *do* have one. A number with no shape behind it cannot say whether 39 sets
 * is a normal week or a spike, which is the question you actually have while
 * reading it.
 *
 * Two forms, and the choice is not stylistic:
 *
 * | Form | For |
 * |---|---|
 * | `bars` | a magnitude per bucket — sets per day, volume per week |
 * | `pips` | a calendar — one cell per day, present or absent, coloured by kind |
 *
 * Deliberately not Recharts. These are 24px tall and 60–90px wide with no
 * axis, no tooltip and no legend; a `ResponsiveContainer` per stat tile would
 * mount seven charts above the fold to draw what flexbox draws for free, and
 * `defer`/`enlargeable` — the repo's answer for real charts — mean nothing at
 * this size.
 *
 * **Every instance renders its frame at zero data.** An empty track, not
 * nothing: a visual that disappears until it has data is invisible to exactly
 * the people who have not started. And the bars floor at 2px rather than 0, so
 * an empty day is a visible gap in a row rather than a chart that reads as
 * broken — `references/contract.md` has this one both ways round, and the trap
 * in `CLAUDE.md` about a chart that is not empty because a screenshot says so
 * is the other half of it.
 *
 * **Colour never carries the meaning alone.** Each instance takes a `label`
 * that states the figures in words and renders as `role="img"`, because the
 * accent on a pip is the split it was, and a screen reader gets none of it.
 */

/** One bar: a magnitude, and the words for it. */
export interface MicroBar {
  value: number
  /** Optional per-bar colour. Omit for the neutral accent. */
  color?: string
}

/** One pip: a day, present or absent, optionally coloured by what it was. */
export interface MicroPip {
  on: boolean
  color?: string
  /** Ring this one — "the most recent", "today". */
  mark?: boolean
}

/**
 * A row of bars, scaled to the largest.
 *
 * `max` is taken from the data rather than passed, because these sit beside
 * the figure they describe: the number says the absolute, the bars say the
 * shape. A fixed ceiling would flatten every real week to nothing the first
 * time someone had an unusual one.
 */
export function MicroBars({ bars, label, className = '' }: { bars: MicroBar[]; label: string; className?: string }) {
  const max = Math.max(1, ...bars.map((b) => b.value))
  return (
    /* `w-fit` with a fixed bar width, NOT `flex-1`.
       Stretching to the container made the count decide the reading: fourteen
       pips drew as a sparkline and three stalled lifts drew as a 400px red
       banner across zone 1, which says "alarm" where the figure says "3". A
       spark is a fixed-density thing — its width should be the number of
       buckets, not the width of the box it happens to sit in. */
    <span role="img" aria-label={label} className={`flex h-6 w-fit max-w-full items-end gap-px overflow-hidden ${className}`}>
      {bars.map((b, i) => (
        <span
          key={i}
          className="w-[5px] shrink-0 rounded-[1px]"
          style={{
            // Floor at 2px: a zero day must read as an empty slot in a row,
            // not as a chart that failed to draw.
            height: `${Math.max(8, (b.value / max) * 100)}%`,
            background: b.value > 0 ? (b.color ?? 'var(--color-mauve)') : 'var(--color-surface1)',
          }}
        />
      ))}
    </span>
  )
}

/** A calendar strip. One cell per day, oldest first. */
export function MicroPips({ pips, label, className = '' }: { pips: MicroPip[]; label: string; className?: string }) {
  return (
    <span role="img" aria-label={label} className={`flex h-6 w-fit max-w-full items-center gap-[3px] overflow-hidden ${className}`}>
      {pips.map((p, i) => (
        <span
          key={i}
          className="h-2.5 w-[5px] shrink-0 rounded-[2px]"
          style={{
            background: p.on ? (p.color ?? 'var(--color-mauve)') : 'var(--color-surface1)',
            // The ring is the only thing distinguishing "most recent" from
            // "some day you trained", and it has to survive the pip being the
            // same colour as its neighbour.
            outline: p.mark ? '1.5px solid var(--color-fg-1)' : undefined,
            outlineOffset: p.mark ? '1.5px' : undefined,
          }}
        />
      ))}
    </span>
  )
}
