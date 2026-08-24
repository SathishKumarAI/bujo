import { useJournal } from '../../store'
import { Card, Empty } from '../ui'
import { cat } from '../../lib/colors'
import { habitConsistencyScore, habitMonthlyDeltas, moodImpactRanking, streakLeaderboard } from '../../lib/correlations'

/**
 * The three habit read-backs that used to be Insights' "Habit analytics"
 * drawer, moved to Stats under BUJO-281 — a completion history is the record,
 * not a prompt about what to do next. They render inside Stats' existing
 * "Habit timing" fold rather than a new one.
 *
 * The deep-dives are anchored to the hottest build habit (top of the streak
 * leaderboard) so consistency and month-over-month always have a subject
 * without a picker. That was true on Insights and is carried over unchanged;
 * the habit's name is printed in each subtitle so it never reads as an app-wide
 * figure.
 */
export function HabitAnalytics() {
  const { data } = useJournal()
  const moodImpact = moodImpactRanking(data)
  const leaders = streakLeaderboard(data)
  const focusId = leaders[0]?.habitId
  const focusName = focusId ? `${leaders[0].emoji ? leaders[0].emoji + ' ' : ''}${leaders[0].name}` : ''
  const focusScore = focusId ? habitConsistencyScore(data, focusId) : null
  const monthly = focusId ? habitMonthlyDeltas(data, focusId) : []
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.done))

  if (moodImpact.length === 0 && !focusId) return null

  return (
    <>
      {moodImpact.length > 0 && (
        <Card band title="Habit mood impact" subtitle="How much each habit lifts your mood">
          <ul className="space-y-2">
            {moodImpact.map((h) => (
              <li key={h.habitId} className="flex items-center gap-2 text-body">
                <span
                  className="w-14 shrink-0 rounded px-1.5 py-0.5 text-center text-label font-medium"
                  style={{ background: cat('surface0'), color: h.lift >= 0 ? cat('green') : cat('red') }}
                >
                  {h.lift >= 0 ? '+' : ''}{h.lift}
                </span>
                <span className="text-fg-1">{h.emoji ? h.emoji + ' ' : ''}{h.name}</span>
                <span className="text-fg-2">
                  {h.doneMood} vs {h.skipMood} mood · {h.doneDays}d
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {focusId && (
        <Card band title="Consistency score" subtitle={`${focusName}, recency-weighted, last 30 days`}>
          {focusScore == null ? (
            <Empty>Not enough scheduled days yet.</Empty>
          ) : (
            <>
              <p className="text-display font-medium" style={{ color: cat(focusScore >= 70 ? 'green' : focusScore >= 40 ? 'yellow' : 'peach') }}>{focusScore}<span className="text-heading text-fg-2">/100</span></p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-none bg-ink-2">
                <div className="h-full rounded-none" style={{ width: `${focusScore}%`, background: cat(focusScore >= 70 ? 'green' : focusScore >= 40 ? 'yellow' : 'peach') }} />
              </div>
              <p className="mt-2 text-label text-fg-2">Recent days count more, so this tracks your momentum — not just a flat average.</p>
            </>
          )}
        </Card>
      )}

      {focusId && monthly.some((m) => m.done > 0) && (
        <Card band title="Month over month" subtitle={`${focusName}, completions per month`}>
          {/* `items-stretch` — see the note on the weekday chart in MoodAnalytics. */}
          <div className="flex items-stretch justify-between gap-2" style={{ height: 130 }} role="img" aria-label={`Monthly completions of ${focusName} with month-over-month change`}>
            {monthly.map((m) => (
              <div key={m.ym} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-micro tabular-nums" style={{ color: m.delta > 0 ? cat('green') : m.delta < 0 ? cat('red') : cat('overlay0') }}>
                  {m.delta > 0 ? `+${m.delta}` : m.delta < 0 ? m.delta : '–'}
                </span>
                <span className="text-caption font-medium tabular-nums text-fg-1">{m.done}</span>
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t" style={{ height: `${Math.max(2, (m.done / maxMonthly) * 100)}%`, background: cat('mauve') }} title={`${m.label}: ${m.done} done`} />
                </div>
                <span className="text-micro text-fg-2">{m.label.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  )
}
