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
    <Card title="At a glance" subtitle="Your whole tracker, summarised">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="today done" value={`${sum.todayPct}%`} color={sum.todayPct >= 80 ? 'green' : sum.todayPct >= 50 ? 'yellow' : 'peach'} />
        <StatTile label="avg consistency" value={sum.avgConsistency} color="mauve" />
        <StatTile
          label={sum.topStreakHabit ? `🔥 ${sum.topStreakHabit}` : 'top streak'}
          value={`${sum.topStreak}d`}
          color="peach"
        />
        <StatTile label="habits tracked" value={`${sum.buildHabits}${sum.avoidHabits ? ` +${sum.avoidHabits}🚫` : ''}`} color="sapphire" />
      </div>
    </Card>
  )
}
