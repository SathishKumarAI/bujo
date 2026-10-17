import { cat } from '../../lib/colors'
import type { CyclePoint } from '../../lib/types'
import { FLAGS, FLAG_COLOR } from './flags'
import { LH_GLYPH, MUCUS_GLYPH } from './dayFields'

/**
 * The month as a readable list — and now as a heatmap of where the period
 * fell, which is the one question a cycle calendar exists to answer from
 * across the room.
 *
 * Split into two columns at 1–15 / 16–end on purpose: one 31-row column makes
 * the reader scroll to compare the start of the month with the end of it, and
 * a whole cycle's shape (bleeding early, PMS late) is exactly that comparison.
 *
 * Each row also carries its **cycle day**, which the month view could not show
 * before. "The 14th" is a calendar fact; "day 9" is the one that means
 * something here, and the two drift apart every month by construction.
 */
export function MonthList({ days, entries, selected, today, cycleDayOf, onSelect }: {
  days: string[]
  entries: CyclePoint[]
  selected: string
  today: string
  /** 1-based cycle day for an ISO date, or null before the first period. */
  cycleDayOf: (date: string) => number | null
  onSelect: (date: string) => void
}) {
  const row = (d: string) => {
    const c = entries.find((x) => x.date === d)
    const isToday = d === today
    const isSel = d === selected
    const isPeriod = (c?.flags ?? []).includes('period')
    const cd = cycleDayOf(d)
    return (
      <li key={d}>
        <button
          onClick={() => onSelect(d)}
          aria-current={isToday ? 'date' : undefined}
          className="flex w-full items-center gap-3 border-b border-line px-2 py-1.5 text-left text-label hover:bg-ink-2"
          style={isSel ? { background: cat('mauve') + '22' } : isPeriod ? { background: cat('red') + '22' } : undefined}
        >
          {/* `w-7`, not `w-6`. The header above says "Date", which needs 27px
              and had 24 — `npm run clipped` caught it on the run that added
              the header, in both sub-columns. The cell holds at most two
              digits either way, so the 4px buys the label and costs the rows
              nothing. */}
          <span className={`w-7 num ${isToday ? 'font-medium text-fg-1' : 'text-fg-2'}`}>{Number(d.slice(8))}</span>
          {/* `fg-2`, not `fg-3`. This row takes a 13% wash of mauve when it is
              selected and of red on a period day, and the wash lifts the ground
              toward the text: `fg-3` measured **4.16:1** on the period tint and
              **4.01** on the selected one. The quietest neutral is the one that
              cannot survive a tinted ground — the width columns and the `d`
              prefix carry the hierarchy here, not a third step of fade. */}
          <span className="num w-10 text-fg-2" title={cd != null ? `Cycle day ${cd}` : undefined}>
            {cd != null ? `d${cd}` : ''}
          </span>
          <span className="num w-14 text-fg-1">{c?.temp != null ? `${c.temp}°` : ''}</span>
          {/* ONE extra column, not five. The row already carries date, cycle
              day, temperature and up to five coloured dots; a column per new
              field would make the densest thing on the page unreadable. Mucus
              and LH share it because they are the two a chart reader actually
              cross-references against the temperature.

              Glyphs rather than colour: five hues sit to the right already, and
              a sixth would read as a sixth flag. */}
          {/* `fg-2`, not `fg-3`, for the reason the cycle-day column above
              carries: this row takes a 13% wash when selected or on a period
              day, and `fg-3` measured 4.01–4.16:1 on those grounds. The glyph
              column was left at `fg-3` when that was fixed for the others —
              and it is the column a reader has to decode, so it is the worst
              one to leave faint. */}
          <span className="num w-8 shrink-0 text-center text-fg-2" aria-hidden>
            {c?.mucus ? MUCUS_GLYPH[c.mucus] : ''}{c?.lh ? LH_GLYPH[c.lh] : ''}
          </span>
          {(c?.mucus || (c?.lh && c.lh !== 'not-taken')) && (
            <span className="sr-only">
              {c?.mucus ? `mucus ${c.mucus}` : ''}{c?.mucus && c?.lh ? ', ' : ''}{c?.lh && c.lh !== 'not-taken' ? `LH ${c.lh}` : ''}
            </span>
          )}
          <span className="flex items-center gap-1">
            {FLAGS.filter((f) => (c?.flags ?? []).includes(f)).map((f) => (
              <span key={f}>
                <span aria-hidden className="inline-block h-2 w-2 rounded-[2px]" style={{ background: cat(FLAG_COLOR[f]) }} />
                <span className="sr-only">{f}</span>
              </span>
            ))}
          </span>
        </button>
      </li>
    )
  }

  /**
   * THE COLUMNS, NAMED WHERE THEY ARE DRAWN.
   *
   * A row reads `1 d5 97.39° ∴− ■`: two numbers, a temperature, two glyphs
   * and some squares, and the only thing that said which number was which was
   * a `title` on the cycle-day cell — a tooltip, which a phone cannot show
   * and which this repo has a rule against relying on. Pasted back as the
   * report, the ambiguity is the first thing in it.
   *
   * The header widths are the row's widths, so the labels sit over their own
   * cells. `aria-hidden`: each row's button already names its own parts
   * through the `sr-only` spans, and a header row that is not a table header
   * would otherwise be read as six stray words before the list.
   */
  const header = (
    <div aria-hidden className="flex w-full items-center gap-3 px-2 pb-1 text-micro uppercase tracking-wide text-fg-2">
      {/* THREE LABELS, not five. Measured: five needs **211px in a 180px
          column** and the cells are flex items, so they compress and the
          words clip — `npm run clipped` caught "Date" at 24px of the 27 it
          needs, and could not see the last label at all, because that one
          overflows its PARENT rather than itself. (The repo has a trap about
          exactly that blind spot.)

          The three that stay are the ambiguous ones: two bare numbers and a
          temperature. The two that go have their own keys eight lines above —
          "Marks in the day list" decodes the glyph column and the flag
          legend decodes the dots — so labelling them here was the third
          naming of the same thing. 7 + 10 + 14 units and two gaps is 148px in
          180. */}
      <span className="w-7">Date</span>
      <span className="w-10">Cycle</span>
      <span className="w-14">Temp</span>
    </div>
  )

  /* "Days 1–15" named the DATES and reads as cycle days on a page whose every
     other number is a cycle day — and the row beneath it prints both. The
     month's own name settles it in three characters. */
  const mon = days[0] ? new Date(`${days[0]}T00:00:00`).toLocaleString(undefined, { month: 'short' }) : ''

  return (
    <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
      <div>
        <p className="mb-1 border-b border-line pb-1 text-micro text-fg-2">{mon} 1–15</p>
        {header}
        <ul>{days.slice(0, 15).map(row)}</ul>
      </div>
      <div>
        <p className="mb-1 border-b border-line pb-1 text-micro text-fg-2">{mon} 16–{days.length}</p>
        {header}
        <ul>{days.slice(15).map(row)}</ul>
      </div>
    </div>
  )
}
