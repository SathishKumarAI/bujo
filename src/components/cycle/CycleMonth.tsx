import { cardSurface, cat, onAccent, over } from '../../lib/colors'
import { fromISODay, prettyDay } from '../../lib/date'
import type { CyclePoint } from '../../lib/types'
import { FLAGS, FLAG_COLOR } from './flags'
import { LH_GLYPH, MUCUS_GLYPH } from './dayFields'

/**
 * THE MONTH, SHAPED LIKE A MONTH.
 *
 * WHAT THIS FILE OWNS: the calendar in the act column — where the period
 * fell, which days were logged, and which day the editor above is pointing at.
 * WHAT IT DOES NOT OWN: the fields on a day (`DayMore` writes them, `DayLog`
 * reads them all back), or what the marks mean (`FlagLegend`).
 *
 * ── What it replaces, and why the list could not be rescued ──────────────
 *
 * `MonthList` drew the month as **31 rows in two 180px sub-columns**, each
 * row `1 d3 97.37° ∴− ■`. Reported by pasting it back: *"these are looking
 * quite bad… it's looking like a mere pair made by an undergrad"*. Measured
 * at 1440 on `?demo=1`, three separate faults, none of them a styling one:
 *
 * **1 · Thirteen of its thirty-one rows were days that had not happened**,
 * and each carried an invented cycle day — `19 d21` through `31 d33`. There
 * is no day 33; the number was counted forward from the last period start
 * past the point the same page's zone 1 estimates the next period (Oct 28).
 * So 42% of the list was a prediction drawn as a record, on a page whose
 * docstring says nothing here predicts. They were also pressable, which is
 * how a temperature or a `period` flag got written onto a future day —
 * `avgCycleLength` then averaged over it (fixed in `cycleInsights.ts`).
 *
 * **2 · It did not fit, and could not be made to.** 31 rows × 32px is 549px
 * of a 1208px card inside a `.zone-act` that is `sticky` with a **868px**
 * cap, so the act column had its own scrollbar and the editor you came to use
 * shared it with a list. The sub-columns are 180px because they are a half of
 * 384 — two bare numbers, a temperature, two glyphs and five dots in 180px is
 * why every column was shaved to the pixel and why `npm run clipped` kept
 * finding it.
 *
 * **3 · A month is a calendar.** `CalendarSpan`'s docstring already argued
 * this for the heatmap and the argument is the same here: a list cannot show
 * that the bleed ran Mon–Fri, because a list has no weeks in it. Seven
 * columns of 44px bands is **~280px** for the same thirty-one days, fills the
 * width it is given instead of being shaved into it, and answers the question
 * a cycle calendar exists to answer from across the room.
 *
 * ── The marks, and what each one costs ──────────────────────────────────
 *
 * A 48px cell is not a row, so the four things it draws are chosen rather
 * than inherited:
 *
 *   fill      a `period` day, washed red. **Only `period` fills**, so the
 *             bleed reads as one block across the week. Every other flag is a
 *             dot — including `spotting`, which is a different event rather
 *             than a lighter one (`flags.ts`) and would be indistinguishable
 *             from red as a second fill.
 *   dots      the other flags, in `FLAGS` order, each in its own hue. Same
 *             map as the editor chips and the chart shading, never a copy.
 *   glyph     mucus and LH, the two a chart reader cross-references against
 *             the temperature. `FlagLegend`'s `MarkKey` decodes them, and it
 *             is built from the same two maps.
 *   underline a temperature was taken. The VALUE is not drawn — three figures
 *             do not fit under a date, the chart above plots all of them
 *             against cycle day, and `DayLog` prints each one — but *whether
 *             you measured* is the thing you check while holding the
 *             thermometer, so the fact survives as a rule and the number is
 *             in the cell's name.
 *
 * The cycle day is deliberately **not** on every cell: 31 extra numbers in
 * 31 cells is the density the list died of, and the one that matters —
 * today's, and the selected day's — is drawn in the editor's own header,
 * once, where it is read.
 *
 * ── The future ──────────────────────────────────────────────────────────
 *
 * Drawn, dated, quieter, and **not a button**. A month has to show all 31
 * days or it is not a month, but a day that has not happened is not a day
 * with nothing on it — the same rule `DayCell.future` states for the
 * heatmaps, and the reason `onSelect` can no longer reach one.
 */
export function CycleMonth({ days, entries, selected, today, onSelect }: {
  /** Every day of the month being browsed, ascending. */
  days: string[]
  entries: CyclePoint[]
  selected: string
  today: string
  onSelect: (date: string) => void
}) {
  const ground = cardSurface()
  /* The wash is 0.45 rather than a border because a run of bleed days has to
     read as a block at arm's length, and because the date on top of it then
     takes `onAccent(fill)` — which is a solved pair in every theme, unlike a
     neutral guessed against a tint. `cat('red')` and never a hex: the design
     gate greps for one, and more to the point the five themes do not agree
     on what red is. */
  const periodFill = over(cat('red'), ground, 0.45)

  return (
    <div>
      {/* The weekday header is what makes the grid a calendar rather than a
          7-wide reflow of a list — without it the columns are just columns.
          `aria-hidden` because every cell names its own full date; seven
          stray letters before the grid would be read as seven words. */}
      <div aria-hidden className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAY.map((d, i) => (
          <span key={i} className="text-center text-micro uppercase text-fg-2">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* The lead-in blanks. A month that starts on a Wednesday and is drawn
            from column one is a grid of the right size telling you the wrong
            weekday for all 31 days. */}
        {Array.from({ length: fromISODay(days[0]).getDay() }, (_, i) => (
          <div key={`lead-${i}`} aria-hidden />
        ))}

        {days.map((d) => {
          const c = entries.find((x) => x.date === d)
          const future = d > today
          const isToday = d === today
          const isSel = d === selected
          const period = (c?.flags ?? []).includes('period')
          const fill = period ? periodFill : undefined
          // The date's colour is solved against whatever it actually sits on,
          // which is the only version that survives five themes: on the wash
          // it is `onAccent(fill)`, off it the palette's own neutral, and a
          // future day the quiet one. `cat('text')`, NOT `cat('fg-1')` — the
          // palette spells its neutrals `text`/`subtext0` and `cat()` returns
          // mauve for a name it does not know, which is the trap that once
          // tinted a whole calendar.
          const ink = fill ? onAccent(fill) : future ? cat('subtext0') : cat('text')
          const marks = FLAGS.filter((f) => f !== 'period' && (c?.flags ?? []).includes(f))
          const glyph = `${c?.mucus ? MUCUS_GLYPH[c.mucus] : ''}${c?.lh ? LH_GLYPH[c.lh] : ''}`

          const inner = (
            <>
              <span className="num text-label font-medium leading-none" style={{ color: ink }}>
                {Number(d.slice(8))}
              </span>
              {/* One strip for every mark, at `micro` — this is data chrome in
                  a 44px cell, which is the one thing that step exists for.
                  Fixed height so a cell with marks and a cell without are the
                  same size and the grid does not jitter down a column. */}
              <span aria-hidden className="mt-0.5 flex h-2.5 items-center justify-center gap-0.5">
                {glyph && <span className="num text-micro leading-none" style={{ color: ink }}>{glyph}</span>}
                {marks.map((f) => (
                  <span
                    key={f}
                    className="inline-block size-1.5 rounded-[1px]"
                    style={{ background: cat(FLAG_COLOR[f]) }}
                  />
                ))}
              </span>
              {/* A reading was taken. A rule and not a dot: the dots above are
                  flags and a sixth one would read as a sixth flag — the same
                  argument the list made for using glyphs rather than a hue.

                  A THIRD of the cell's width, not the whole of it. At
                  `inset-x-2` it ran nearly edge to edge and became the
                  heaviest mark in the grid — on a journal where a temperature
                  is taken most mornings it fires on nearly every cell, so it
                  is simultaneously the least informative mark and the one
                  that drew the eye, and under a number it reads as an
                  underline rather than as a tick. Measured on the demo
                  month: **18 of 18 past cells**. It earns its place by
                  showing the mornings you MISSED, which only works while it
                  is quiet enough to scan past. */}
              {c?.temp != null && (
                <span
                  aria-hidden
                  className="absolute bottom-1 h-px w-4"
                  style={{ background: ink, opacity: 0.4 }}
                />
              )}
              <span className="sr-only">{cellName(d, c, future)}</span>
            </>
          )

          /* A `div` for the future, not a disabled button. A disabled control
             is a control you are told you cannot use; a day that has not
             happened is not a control at all, and this way there is no path
             from the calendar to a write on a future date. */
          if (future) {
            return (
              <div
                key={d}
                className="relative flex h-11 flex-col items-center justify-center rounded-control border border-dashed border-line"
              >
                {inner}
              </div>
            )
          }

          return (
            <button
              key={d}
              type="button"
              onClick={() => onSelect(d)}
              aria-pressed={isSel}
              aria-current={isToday ? 'date' : undefined}
              /* NO `aria-label`. The cell's `sr-only` sentence IS its name and
                 it contains the painted date, which is what WCAG 2.5.3 asks —
                 a tidier label that said less than the cell draws is the
                 `label-content-name-mismatch` this repo has been caught by
                 twice.
                 Selection is a BORDER and today is a border: a lighter fill
                 under a date is a second ground to solve the number against,
                 and a state ramp belongs in the border, which is a graphic at
                 3:1 rather than text at 4.5. */
              className={`relative flex h-11 flex-col items-center justify-center rounded-control border transition-colors active:scale-95 ${
                isSel
                  ? 'border-mauve'
                  : isToday
                    ? 'border-line-strong'
                    : 'border-transparent hover:border-line'
              }`}
              style={fill ? { background: fill } : undefined}
            >
              {inner}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const WEEKDAY = ['s', 'm', 't', 'w', 't', 'f', 's']

/**
 * The cell's whole sentence, which is also its accessible name.
 *
 * Everything the cell draws plus the one thing it cannot — the temperature's
 * value. Absent fields say nothing at all rather than "no": a day with no
 * mucus recorded is not a dry day, which `types.ts` is emphatic about and
 * which a calendar is more tempting to get wrong than a list, because an
 * empty cell looks like an answer.
 */
function cellName(date: string, c: CyclePoint | undefined, future: boolean): string {
  if (future) return `${prettyDay(date)}, not yet`
  const parts: string[] = [prettyDay(date)]
  if (c?.temp != null) parts.push(`${c.temp}°${c.tempDisturbed ? ', reading flagged' : ''}`)
  if (c?.flags.length) parts.push(c.flags.join(', '))
  if (c?.mucus) parts.push(`mucus ${c.mucus.replace('-', ' ')}`)
  if (c?.lh && c.lh !== 'not-taken') parts.push(`LH ${c.lh}`)
  return parts.length === 1 ? `${parts[0]}, nothing logged` : parts.join(' · ')
}
