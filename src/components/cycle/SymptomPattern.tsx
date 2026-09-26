import { cat, onRaised } from '../../lib/colors'
import { FLAG_COLOR } from './flags'

/**
 * SYMPTOM PATTERN · the one question a calendar cannot answer.
 *
 * "When is my period" is a date; a calendar already has it. "Do the cramps
 * always land on day 27" is a *pattern over cycle day*, and it only exists
 * once the log is folded along the cycle boundary instead of along the month.
 * This page logged five flags a day for however long and never once showed
 * them folded — the month list drew dots, which answers "did I mark it", and
 * the chart drew temperature, which is a different subject.
 *
 * One row per flag, one cell per cycle day, opacity by how many cycles carried
 * that flag on that day. Not a colour ramp: each flag keeps the hue it has on
 * the day list and in the editor, so the rows are identifiable without a
 * legend and the page keeps one meaning per colour.
 *
 * `flagPatternByDay` returns `[]` below two completed cycles, so this renders
 * nothing rather than inviting a pattern to be read off a single month.
 */
export function SymptomPattern({ pattern }: {
  pattern: { flag: string; cycles: number; days: { day: number; count: number }[] }[]
}) {
  if (pattern.length === 0) {
    return (
      <p className="text-label text-fg-2">
        Patterns need two finished cycles to compare. Keep flagging days and this fills in —
        it is the view that answers “do the cramps always land on day 27”, which a calendar cannot.
      </p>
    )
  }
  const cycles = pattern[0].cycles
  const width = pattern[0].days.length

  return (
    <>
      {/* `tabIndex` + a name on the scroller, not decoration: a region that
          scrolls and cannot be focused is unreachable by keyboard, and
          `npm run a11y` failed this as a serious `scrollable-region-focusable`
          on both phone themes the first time it ran. The table is 30 columns
          and only fits at desktop width, so the overflow is by design and the
          keyboard affordance is the part that was missing. */}
      <div
        className="overflow-x-auto"
        tabIndex={0}
        role="group"
        aria-label="Symptom pattern by cycle day — scrolls sideways"
      >
        <table className="w-full min-w-[22rem] table-fixed border-separate border-spacing-[1px]">
          <caption className="sr-only">
            How often each flag fell on each cycle day, across {cycles} completed cycles
          </caption>
          <thead>
            <tr>
              <th scope="col" className="w-20 text-left text-micro font-normal text-fg-2">Day</th>
              {Array.from({ length: width }, (_, i) => (
                <th key={i} scope="col" className="num text-micro font-normal text-fg-2">
                  {/* Every fifth label only — 30 numbers in a 300px strip is a
                      grey blur, and the cells are readable by position. */}
                  {(i + 1) % 5 === 0 ? i + 1 : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pattern.map((row) => (
              <tr key={row.flag}>
                <th scope="row" className="text-left text-label font-normal" style={{ color: onRaised(FLAG_COLOR[row.flag] ?? 'mauve') }}>
                  {row.flag}
                </th>
                {row.days.map((d) => {
                  const share = cycles > 0 ? d.count / cycles : 0
                  return (
                    <td
                      key={d.day}
                      title={`${row.flag} · day ${d.day} · ${d.count} of ${cycles} cycles`}
                      className="h-4 rounded-[2px]"
                      style={{
                        background: share > 0 ? cat(FLAG_COLOR[row.flag] ?? 'mauve') : cat('surface0'),
                        // Floor at 0.25 so a one-in-four cycle is still visible;
                        // a linear ramp from zero makes rare events invisible,
                        // and a rare event is exactly what you are looking for.
                        opacity: share > 0 ? 0.25 + share * 0.75 : 1,
                      }}
                    >
                      <span className="sr-only">{`${row.flag} day ${d.day}: ${d.count} of ${cycles}`}</span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-label text-fg-2">
        Across {cycles} finished {cycles === 1 ? 'cycle' : 'cycles'}. A solid cell is every cycle;
        a faint one is some. Days are counted from the first day of bleeding, not from the calendar month.
      </p>
    </>
  )
}
