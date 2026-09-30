import { useState } from 'react'
import { cat } from '../../lib/colors'
import { ChipPick } from '../ui/quickpick'
import { quartileBuckets, type Align, type PatternGrid as Grid, type PatternRow } from '../../lib/cyclePatterns'

/**
 * THE PATTERN GRID · every signal you log, against the day it landed on.
 *
 * ## The problem this version solves
 *
 * The first one was a correct heatmap that nobody could read. A wall of 30 × 12
 * coloured squares is a chart for someone who already knows what a heatmap is;
 * for everyone else it is wallpaper, and the finding inside it — *"your cravings
 * start on day 22"* — was invisible unless you counted columns.
 *
 * Four changes, each aimed at understanding it in one look:
 *
 * 1. **Every row states its own answer in words.** A `Usually` column ends each
 *    row with `day 24 · 5d before your period`, so the row reads without
 *    decoding a single cell. Colour became supporting evidence rather than the
 *    only channel — which is also the accessibility argument.
 * 2. **Hover or tap any square for a plain readout**, as a strip under the grid
 *    rather than a floating tooltip: it cannot be clipped by the scroll
 *    container, does not sit under the finger, and works identically on touch,
 *    where hover does not exist at all.
 * 3. **A legend in the same words as the readout** — never / now and then /
 *    most cycles / every cycle. "Darker means more often" describes the
 *    encoding; these describe the fact.
 * 4. **The align toggle explains what each choice answers**, because "line up
 *    by ovulation" means nothing until you are told it is the view where luteal
 *    symptoms stop smearing across a week.
 *
 * ## What stayed
 *
 * A semantic `<table>` with both header scopes and an `sr-only` sentence per
 * cell. Intensity still comes from the shared `quartileBuckets`. The scroll
 * region stays focusable — a 30-column table in an 8-column viewport is
 * unreachable by keyboard otherwise, which is the `scrollable-region-focusable`
 * defect the per-group probe caught.
 */
export function PatternGrid({ grid, onAlign, avgLength }: {
  grid: Grid
  onAlign: (a: Align) => void
  /** Average cycle length, for phrasing "N days before your period". */
  avgLength: number | null
}) {
  const [readout, setReadout] = useState<string | null>(null)

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
  const shares = grid.rows.flatMap((r) => r.cells.map((c) => (c.observed > 0 ? c.count / c.observed : 0)))
  const bucket = quartileBuckets(shares)

  return (
    <div>
      <AlignToggle align={grid.align} onAlign={onAlign} />

      <div
        className="mt-3 overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label={`Pattern grid, ${grid.rows.length} signals across ${grid.offsets.length} days`}
      >
        <table className="w-full border-collapse" style={{ minWidth: 320 + grid.offsets.length * 13 }}>
          <caption className="sr-only">
            How often each signal fell on each {grid.align === 'ovulation' ? 'day relative to ovulation' : 'cycle day'},
            across {grid.cycles} cycles. Darker means more often.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="w-24 pb-1 text-left text-label font-normal text-fg-2">
                {grid.align === 'ovulation' ? 'From ovulation' : 'Cycle day'}
              </th>
              {grid.offsets.map((o) => (
                <th key={o} scope="col" className="num pb-1 text-micro font-normal text-fg-2">
                  {o % 5 === 0 ? o : ''}
                </th>
              ))}
              <th scope="col" className="w-44 pb-1 pl-3 text-left text-label font-normal text-fg-2">
                Usually
              </th>
            </tr>
          </thead>
          <tbody>
            {grid.rows.map((row) => {
              const peak = peakOf(row)
              const hue = row.kind === 'scale' ? 'blue' : row.kind === 'flag' ? 'peach' : 'teal'
              return (
                <tr key={row.key}>
                  <th scope="row" className="truncate pr-2 text-left text-label font-normal text-fg-1" title={row.label}>
                    {row.label}
                  </th>
                  {row.cells.map((c) => {
                    const share = c.observed > 0 ? c.count / c.observed : 0
                    const level = bucket(share)
                    const words = cellWords(row, c.offset, c.count, c.observed, grid.align, avgLength)
                    return (
                      <td
                        key={c.offset}
                        className="h-4 cursor-default p-0"
                        onMouseEnter={() => setReadout(words)}
                        onMouseLeave={() => setReadout(null)}
                        onClick={() => setReadout(words)}
                        style={{
                          background: level > 0 ? cat(hue) : cat('surface0'),
                          opacity: level > 0 ? OPACITY[level] : 1,
                        }}
                      >
                        <span className="sr-only">{words}</span>
                      </td>
                    )
                  })}
                  <td className="whitespace-nowrap pl-3 text-label text-fg-2">
                    {peak
                      ? peakWords(peak.offset, grid.align, avgLength)
                      : <span className="text-fg-3">no clear day</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-2 min-h-[1.5rem] text-label" aria-live="polite">
        {readout
          ? <span className="text-fg-1">{readout}</span>
          : <span className="text-fg-2">Hover or tap any square to read it in words.</span>}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-2 text-label text-fg-2">
        {([[0, 'never'], [1, 'now and then'], [3, 'most cycles'], [4, 'every cycle']] as const).map(([lvl, label]) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block size-3 rounded-[2px]"
              style={{ background: lvl > 0 ? cat('teal') : cat('surface0'), opacity: lvl > 0 ? OPACITY[lvl] : 1 }}
            />
            {label}
          </span>
        ))}
        <span>· {grid.cycles} cycles logged</span>
      </div>
    </div>
  )
}

const OPACITY = [0, 0.25, 0.5, 0.75, 1] as const

/**
 * The column a row peaks on, when it has a clear one.
 *
 * Two thirds, because "usually" is a word with a meaning. A row whose best day
 * fired in one cycle of three is not a pattern, and printing "usually day 12"
 * beside it would be the page inventing the finding the grid exists to reveal.
 */
function peakOf(row: PatternRow): { offset: number; share: number } | null {
  let best: { offset: number; share: number } | null = null
  for (const c of row.cells) {
    if (c.observed === 0) continue
    const share = c.count / c.observed
    if (share > 0 && (!best || share > best.share)) best = { offset: c.offset, share }
  }
  return best && best.share >= 0.66 ? best : null
}

function peakWords(offset: number, align: Align, avgLength: number | null): string {
  if (align === 'ovulation') {
    if (offset === 0) return 'on the day you ovulate'
    return `${Math.abs(offset)}d ${offset > 0 ? 'after' : 'before'} ovulation`
  }
  const before = avgLength != null ? avgLength - offset : null
  return before != null && before >= 0 && before <= 14
    ? `day ${offset} · ${before}d before your period`
    : `around day ${offset}`
}

/** One plain sentence for a single cell. No jargon, no percentages. */
function cellWords(
  row: PatternRow,
  offset: number,
  count: number,
  observed: number,
  align: Align,
  avgLength: number | null,
): string {
  const where = align === 'ovulation'
    ? (offset === 0
        ? 'on ovulation day'
        : `${Math.abs(offset)} day${Math.abs(offset) === 1 ? '' : 's'} ${offset > 0 ? 'after' : 'before'} ovulation`)
    : `on day ${offset}`
  const before = avgLength != null && align === 'period' ? avgLength - offset : null
  const when = before != null && before >= 0 && before <= 14
    ? ` (${before} day${before === 1 ? '' : 's'} before your period)`
    : ''
  if (observed === 0) return `${row.label} — ${where}: no cycle reached that day`
  if (count === 0) return `${row.label} — ${where}${when}: never, across ${observed} cycle${observed === 1 ? '' : 's'}`
  return `${row.label} — ${where}${when}: ${count} of ${observed} cycle${observed === 1 ? '' : 's'}`
}

function AlignToggle({ align, onAlign }: { align: Align; onAlign: (a: Align) => void }) {
  return (
    <ChipPick
      label="Line cycles up by"
      value={align}
      onChange={(v) => onAlign(v as Align)}
      options={[
        { value: 'period', label: 'period start', hint: 'Where in my cycle does this land' },
        { value: 'ovulation', label: 'ovulation', hint: 'How long before my period does this land' },
      ]}
      hint={align === 'ovulation'
        ? 'Lined up by ovulation — the view where luteal symptoms stack into one column instead of smearing across a week.'
        : 'Lined up by the first day of bleeding, which is how a cycle is normally counted.'}
    />
  )
}
