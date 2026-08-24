import { Card, StatTile } from '../ui'
import { habitStreak } from '../../lib/stats'
import { trackerSummary } from '../../lib/habitStats'
import type { JournalData } from '../../lib/types'

/**
 * One-glance roll-up across the whole grid: counts, mean consistency, top
 * current streak, and today's completion share. Pure data → a header tile.
 */
export function TrackerSummaryCard({ data, today }: { data: JournalData; today: string }) {
  if (data.habits.filter((h) => !h.archived).length === 0) return null
  const sum = trackerSummary(data, (id, t) => habitStreak(data, id, t), today)
  return (
    <Card band title="At a glance" subtitle="Your whole tracker, summarised">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="today done" value={`${sum.todayPct}%`} />
        <StatTile label="avg consistency" value={sum.avgConsistency} />
        <StatTile
          label={sum.topStreakHabit ? `${sum.topStreakHabit}` : 'top streak'}
          value={`${sum.topStreak}d`}
          hint={sum.topStreakHabit ? 'top streak' : undefined}
        />
        {/* The avoid count was concatenated into the value as `10 +1🚫`, which
            put three quantities on a line where every sibling tile carries one
            — so the row could not be read at a glance, which is the only thing
            a stat row is for. It is a separate fact about the same set, so it
            reads as a caption. */}
        <StatTile
          label="habits tracked"
          value={sum.buildHabits}
          hint={sum.avoidHabits ? `+${sum.avoidHabits} to avoid` : undefined}
        />
      </div>
    </Card>
  )
}
