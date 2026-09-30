import { cat, onRaised } from '../../lib/colors'
import { quartileBuckets, type Align, type PatternGrid as Grid } from '../../lib/cyclePatterns'

/**
 * THE PATTERN GRID · every signal you log, against the day it landed on.
 *
 * A semantic `<table>`, not a div grid: this is tabular data with row and column
 * headers, and a screen reader that can announce "bloating, day 24, 3 of 3
 * cycles" is reading the actual finding. A div grid would announce a wall of
 * empty cells.
 *
 * **Intensity comes from `quartileBuckets`, imported.** The brief asked to reuse
 * "the existing quartile-bucket helper" — there wasn't one, so it now lives in
 * `lib/cyclePatterns.ts` and both this and any future heatmap read it rather
 * than each rolling a ramp. Five steps, because more than that is not
 * distinguishable at this cell size and fewer cannot separate rare from common.
 *
 * **The scale rows are inverted on purpose.** For a symptom, darker means "more
 * often". For mood and energy, darker means *lower* — a dark band across the
 * luteal phase should read as "this is where it dips", which is the question
 * being asked. The caption says so, because a colour that means two things
 * without explanation is a colour that means nothing.
 */
export function PatternGrid({ grid, onAlign }: { grid: Grid; onAlign: (a: Align) => void }) {
  if (grid.rows.length === 0) {
    return (
      <div>
        <AlignToggle align={grid.align} onAlign={onAlign} />
        <p className="mt-3 text-body text-fg-2">
          {grid.align === 'ovulation'
            ? 'Three cycles with a detected ovulation show the luteal pattern. Keep taking your temperature — that is what finds it.'
            : 'Log a few more cycles to see your patterns. Three is where a shape stops being a coincidence.'}
        </p>
      </div>
    )
  }

  // One scale across the whole grid, so a dark cell means the same thing on
  // every row. Bucketing per row would make a signal that happened twice look
  // as strong as one that happened in every cycle.
  const shares = grid.rows.flatMap((r) =>
    r.cells.map((c) => (c.observed > 0 ? c.count / c.observed : 0)),
  )
  const bucket = quartileBuckets(shares)
  const OPACITY = [0, 0.22, 0.45, 0.7, 1] as const

  return (
    <div>
      <AlignToggle align={grid.align} onAlign={onAlign} />

      {/* FOCUSABLE, because it scrolls. A keyboard user cannot reach a
          horizontally scrolling region that is not in the tab order — the grid
          is 30+ columns and a phone shows about eight, so without this the
          other twenty-two are unreachable without a mouse. axe calls it
          `scrollable-region-focusable`; the real a11y gate could not see it
          because a SectionRail hides every group but the one the page opens on
          (COD-237), so it was found by driving the groups with a probe. */}
      <div
        className="mt-3 overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label={`Pattern grid, ${grid.rows.length} signals across ${grid.offsets.length} days`}
      >
        <table className="w-full border-collapse" style={{ minWidth: 120 + grid.offsets.length * 14 }}>
          <caption className="sr-only">
            How often each signal fell on each {grid.align === 'ovulation' ? 'day relative to ovulation' : 'cycle day'},
            across {grid.cycles} cycles. Darker means more often; for mood and energy, darker means lower.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="w-28 text-left text-micro font-normal text-fg-2">
                {grid.align === 'ovulation' ? 'From ovulation' : 'Cycle day'}
              </th>
              {grid.offsets.map((o) => (
                <th key={o} scope="col" className="num text-micro font-normal text-fg-2">
                  {/* Every fifth label: thirty numbers in a narrow strip is a
                      grey blur, and the cells are readable by position. */}
                  {o % 5 === 0 ? o : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.rows.map((row) => (
              <tr key={row.key}>
                <th scope="row" className="truncate pr-2 text-left text-label font-normal text-fg-1" title={row.label}>
                  {row.label}
                </th>
                {row.cells.map((c) => {
                  const isScale = row.kind === 'scale'
                  // Scales: invert so a LOW mood is dark. 1..5 → 1 is darkest.
                  const value = isScale
                    ? (c.mean != null ? (5 - c.mean) / 4 : 0)
                    : (c.observed > 0 ? c.count / c.observed : 0)
                  const level = isScale
                    ? (c.mean == null ? 0 : Math.max(1, Math.round(value * 4)) as 1 | 2 | 3 | 4)
                    : bucket(value)
                  const hue = isScale ? 'blue' : row.kind === 'flag' ? 'peach' : 'teal'
                  return (
                    <td
                      key={c.offset}
                      className="h-4 rounded-[2px] p-0"
                      style={{
                        background: level > 0 ? cat(hue) : cat('surface0'),
                        opacity: level > 0 ? OPACITY[level] : 1,
                      }}
                    >
                      {/* The accessible value, which is the whole reason this is
                          a table. Visually hidden; announced on every cell. */}
                      <span className="sr-only">
                        {row.label}, {grid.align === 'ovulation' ? `${c.offset >= 0 ? '+' : ''}${c.offset} from ovulation` : `day ${c.offset}`},{' '}
                        {isScale
                          ? (c.mean != null ? `average ${c.mean.toFixed(1)} of 5` : 'not rated')
                          : `${c.count} of ${c.observed} cycles`}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-label text-fg-2">
        {grid.cycles} cycles. Darker means it happened more often on that day.{' '}
        <span style={{ color: onRaised('blue') }}>Mood and energy</span> are inverted — darker is a
        lower score, so a dark band is where they dip.
      </p>
    </div>
  )
}

function AlignToggle({ align, onAlign }: { align: Align; onAlign: (a: Align) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-label text-fg-2">Line cycles up by</span>
      {([['period', 'period start'], ['ovulation', 'ovulation']] as const).map(([v, label]) => (
        <button
          key={v}
          type="button"
          aria-pressed={align === v}
          onClick={() => onAlign(v)}
          className="min-h-11 rounded-control px-2.5 py-1 text-label"
          style={{
            background: align === v ? cat('surface2') : cat('surface0'),
            color: align === v ? cat('text') : cat('subtext0'),
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
