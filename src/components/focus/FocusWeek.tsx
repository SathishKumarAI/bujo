import { Band, BandCell, BandRow, Eyebrow, Statement } from '../mod'
import { formatMinutes } from '../../lib/focus'
import { prettyDay } from '../../lib/date'
import type { DevSession } from '../../lib/types'

/**
 * The orient band: how much deep work this week, and the three numbers that
 * qualify it.
 *
 * Owns the opening statement and the facts row. Everything here is read-only —
 * the view computes, this states.
 *
 * The old page opened with four stat tiles and up to three emoji notice boxes
 * stacked under them ("📈 at this pace…", "🏆 longest session…", "💡 insight").
 * Three boxes competing at the same weight is no hierarchy at all; they are one
 * quiet list now, under the number they qualify.
 */
export function FocusWeek({
  weekMin,
  projectedMin,
  streak,
  avgFocus,
  avgStress,
  longest,
  insight,
}: {
  weekMin: number
  /** Where this pace lands by week's end; `null` with nothing to project from. */
  projectedMin: number | null
  streak: number
  avgFocus: number
  avgStress: number
  longest: DevSession | null
  insight: string | null
}) {
  return (
    <Band>
      <BandRow>
        <BandCell className="basis-[22rem] pt-4">
          <Eyebrow>This week</Eyebrow>
          <Statement as="h2" className="mt-3">{formatMinutes(weekMin)} of deep work</Statement>
          {projectedMin != null && projectedMin > weekMin && (
            <p className="mt-3 text-body text-fg-2">
              At this pace, on track for {formatMinutes(projectedMin)} by the end of the week.
            </p>
          )}
          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 border-t border-line pt-4 text-label">
            <div>
              <dt className="text-fg-2">Day streak</dt>
              <dd className="num text-fg-1">{streak}</dd>
            </div>
            <div>
              <dt className="text-fg-2">Avg focus</dt>
              <dd className="num text-fg-1">{avgFocus}/10</dd>
            </div>
            <div>
              <dt className="text-fg-2">Avg stress</dt>
              <dd className="num text-fg-1">{avgStress}/10</dd>
            </div>
          </dl>
        </BandCell>

        <BandCell className="basis-[18rem] pt-4">
          <Eyebrow>Worth knowing</Eyebrow>
          <ul className="mt-3 space-y-2 text-label text-fg-2">
            {longest && (
              <li className="border-t border-line pt-2 first:border-t-0 first:pt-0">
                Longest session · {formatMinutes(longest.durationMin)}
                {longest.project ? ` on ${longest.project}` : ''} · {prettyDay(longest.date)}
              </li>
            )}
            {insight && <li className="border-t border-line pt-2 first:border-t-0 first:pt-0">{insight}</li>}
            {!longest && !insight && (
              <li>Log a couple of sessions and this fills with your longest block and what your focus tracks with.</li>
            )}
          </ul>
        </BandCell>
      </BandRow>
    </Band>
  )
}
