import { CalendarBlank, CalendarCheck, Clock, Hash, Target } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card, StatTile } from '../ui'
import { cat } from '../../lib/colors'
import type { PointDiff, PickleHours, ScoringStat, PlayConsistency } from '../../lib/pickleball'

type Weekday = { day: string; games: number; gamesWon: number; winPct: number }

/** Win % & games played by day of week. */
export function WeekdayPerformanceCard({ weekdays }: { weekdays: Weekday[] }) {
  return (
    <Card band title={<span className="inline-flex items-center gap-2"><Icon as={CalendarBlank} size="md" className="text-blue" /> Performance by weekday</span>} subtitle="Win % &amp; games played by day of week" collapsible>
      {/* Seven columns is a week, but a week does not fit on a phone: 358px
          across seven cells leaves 24px of content each, and "100%" needs 38.
          The gate caught three of these showing a fraction of their own value.
          Four-up wraps to 4+3, which costs the week its shape and buys back
          every figure — and an unreadable week has no shape either. */}
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
        {weekdays.map((w) => {
          const has = w.games > 0
          return (
            <div key={w.day} className="rounded-none p-1.5 text-center" style={{ background: has ? cat('blue') + '14' : cat('surface0') }} title={has ? `${w.day}: ${w.gamesWon}/${w.games} games won · ${w.winPct}%` : `${w.day}: no games`}>
              <div className="text-micro font-medium text-fg-2">{w.day}</div>
              <div className="mt-0.5 text-body font-medium" style={{ color: has ? cat('blue') : cat('overlay0') }}>{has ? `${w.winPct}%` : '—'}</div>
              <div className="text-micro text-fg-2">{has ? `${w.games}g` : ''}</div>
            </div>
          )
        })}
      </div>
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
      <p className="mt-3 text-label text-fg-2">Average margin <span style={{ color: cat(points.avgMargin >= 0 ? 'green' : 'red') }}>{points.avgMargin > 0 ? `+${points.avgMargin}` : points.avgMargin}</span> per session. Log Pts for / against to surface close-game trends beyond win %.</p>
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
              <span className="text-fg-2">{sc.games} games · <span style={{ color: cat('green') }}>{sc.winPct}%</span></span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-none bg-ink-2" role="img" aria-label={`${sc.label} win rate ${sc.winPct}% over ${sc.games} games`}>
              <div className="h-full rounded-none" style={{ width: `${sc.winPct}%`, background: cat('peach') }} />
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
