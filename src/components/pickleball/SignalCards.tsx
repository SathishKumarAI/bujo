import { CalendarBlank, CalendarCheck, Clock, Hash, Target } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card, StatTile } from '../ui'
import { BarList } from '../page'
import { cat, onRaised } from '../../lib/colors'
import type { PointDiff, PickleHours, ScoringStat, PlayConsistency } from '../../lib/pickleball'

type Weekday = { day: string; games: number; gamesWon: number; winPct: number }

/**
 * Win % by day of week, as a row of BARS rather than seven tiny tiles.
 *
 * It shipped as a 7-column grid of `rounded-control` cells, 44px wide inside a
 * 353px card, each holding a weekday, a percentage and a games count. Three
 * problems, all measured:
 *
 * - **"100%" needs 38px** and the cell gave it 44 minus padding, so the figure
 *   was the whole cell and the card read as a wall of numbers.
 * - **Colour said nothing.** Every day that had any play used the same
 *   `blue14` wash, so 100% and 60% were identical, and the thing the card is
 *   about — which days go well — was carried only by the digits.
 * - Four-up on a phone wrapped the week into 4+3, which loses the one shape a
 *   week has.
 *
 * A bar per day reads at any width: the label and the figures are text on the
 * card ground, and the bar is the comparison. **The colour is a ramp on the
 * BAR, never behind the text** — a tinted ground under a percentage is the
 * accent-on-wash trap this repo has measured at 3.64:1, and a bar is a graphic
 * at 3:1 rather than text at 4.5.
 *
 * Three steps, not a gradient: a continuous ramp invites reading a colour as a
 * value, and nobody can. Under 40% red, under 60% peach, else green — the same
 * three-step scale Plan and Trackers already use.
 */
function winTone(pct: number): string {
  return pct < 40 ? 'red' : pct < 60 ? 'peach' : 'green'
}

export function WeekdayPerformanceCard({ weekdays, onPick }: {
  weekdays: Weekday[]
  /** Open this weekday's sessions. Omit and the rows are not interactive. */
  onPick?: (day: string) => void
}) {
  const played = weekdays.filter((w) => w.games > 0)
  const best = played.length ? played.reduce((a, b) => (b.winPct > a.winPct ? b : a)) : null
  return (
    <Card
      band
      title={<span className="inline-flex items-center gap-2"><Icon as={CalendarBlank} size="md" className="text-blue" /> Performance by weekday</span>}
      subtitle={best ? `Best on ${best.day} · ${best.winPct}% of ${best.games} games` : 'Win % and games played by day of week'}
      collapsible
    >
      {/*
        `BarList`, not forty lines of its markup retyped.

        This card WAS the hand-rolled copy — same flex row, same track, same
        two right-aligned columns, written before the primitive was lifted out
        and never migrated, while `PAGE-ROLLOUT.md` already described it as
        "what `BarList` looks like wrapped in a `Card`". It cost exactly what
        a duplicate costs: `npm run a11y:panels` found five
        `label-content-name-mismatch` violations here that the same fix in
        `BarList` had already cleared everywhere else, because the copy does
        not get the fix.

        The reason it was invisible is the COD-237 blind spot — these rows live
        on the `Results` rail row, which the main a11y gate never opens.
      */}
      <BarList
        labelWidth="w-9"
        rows={weekdays.map((w) => {
          const has = w.games > 0
          return {
            label: w.day,
            pct: w.winPct,
            value: has ? `${w.winPct}%` : null,
            note: has ? `${w.gamesWon}/${w.games}` : '',
            tone: winTone(w.winPct),
            onPick: onPick && has ? () => onPick(w.day) : undefined,
            announce: has
              ? `${w.day}: ${w.gamesWon} of ${w.games} games won, ${w.winPct}% — show these sessions`
              : `${w.day}: no games`,
          }
        })}
      />
    </Card>
  )
}

/** Point differential · close-game signal. */
export function PointDifferentialCard({ points }: { points: PointDiff }) {
  return (
    <Card band title={<span className="inline-flex items-center gap-2"><Icon as={Target} size="md" className="text-teal" /> Point differential</span>} subtitle={`Across ${points.sessions} ${points.sessions === 1 ? 'session' : 'sessions'} with logged points`} collapsible>
      <div className="grid grid-cols-3 gap-2">
        <StatTile compact label="Points for" value={points.pointsFor} />
        <StatTile compact label="Points against" value={points.pointsAgainst} />
        <StatTile compact label="Net" value={points.diff > 0 ? `+${points.diff}` : points.diff} />
      </div>
      <p className="mt-3 text-label text-fg-2">Average margin <span style={{ color: onRaised(points.avgMargin >= 0 ? 'green' : 'red') }}>{points.avgMargin > 0 ? `+${points.avgMargin}` : points.avgMargin}</span> per session. Log Pts for / against to surface close-game trends beyond win %.</p>
    </Card>
  )
}

/** Time on court (#149 time-allocation). */
export function TimeOnCourtCard({ hours }: { hours: PickleHours }) {
  return (
    <Card band title={<span className="inline-flex items-center gap-2"><Icon as={Clock} size="md" className="text-sky" /> Time on court</span>} subtitle={`From duration on ${hours.timedSessions} ${hours.timedSessions === 1 ? 'session' : 'sessions'}`} collapsible>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile compact label="Total hours" value={hours.hours} />
        <StatTile compact label="Last 30d" value={`${hours.recentHours}h`} />
        <StatTile compact label="Avg session" value={`${hours.avgMin}m`} />
        <StatTile compact label="Min / game" value={hours.minPerGame || '—'} />
      </div>
      <p className="mt-3 text-label text-fg-2">Add Minutes when logging a session to track time invested. Min/game is your court tempo — lower means faster games.</p>
    </Card>
  )
}

/** Performance by scoring system. */
export function ScoringPerformanceCard({ scoring }: { scoring: ScoringStat[] }) {
  return (
    <Card band title={<span className="inline-flex items-center gap-2"><Icon as={Hash} size="md" className="text-peach" /> Performance by scoring</span>} subtitle="Win % &amp; games by scoring system" collapsible>
      <ul className="space-y-3">
        {scoring.map((sc) => (
          <li key={sc.scoring}>
            <div className="mb-1 flex justify-between text-body">
              <span className="text-fg-1">{sc.label}</span>
              <span className="text-fg-2">{sc.games} games · <span style={{ color: onRaised('green') }}>{sc.winPct}%</span></span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-pill bg-ink-2" role="img" aria-label={`${sc.label} win rate ${sc.winPct}% over ${sc.games} games`}>
              <div className="h-full rounded-pill" style={{ width: `${sc.winPct}%`, background: cat('peach') }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-caption text-fg-2">Set a Scoring system when logging to see if you play better in short or long games.</p>
    </Card>
  )
}

/** Play consistency / cadence. */
export function PlayConsistencyCard({ consistency }: { consistency: PlayConsistency }) {
  return (
    <Card band title={<span className="inline-flex items-center gap-2"><Icon as={CalendarCheck} size="md" className="text-green" /> Play consistency</span>} subtitle="How regularly you get on court" collapsible>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile compact label="Days played" value={consistency.daysPlayed} />
        <StatTile compact label={`Active wks / ${consistency.weeks}`} value={consistency.activeWeeks} />
        <StatTile compact label="Avg gap" value={consistency.avgGap ? `${consistency.avgGap}d` : '—'} />
        <StatTile compact label="Longest gap" value={consistency.longestGap ? `${consistency.longestGap}d` : '—'} />
      </div>
      {consistency.daysSinceLast != null && (
        <p className="mt-3 text-label text-fg-2">
          {consistency.daysSinceLast === 0 ? 'You played today — keep the rhythm.' : `Last played ${consistency.daysSinceLast} ${consistency.daysSinceLast === 1 ? 'day' : 'days'} ago.`}
          {consistency.longestGap > 0 && ` Your average cadence is about one play day every ${consistency.avgGap} days.`}
        </p>
      )}
    </Card>
  )
}
