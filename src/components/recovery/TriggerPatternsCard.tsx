import { Card } from '../ui'
import { cat } from '../../lib/colors'

/** Trigger patterns · most common reset reasons, ranked, plus the average gap. */
export function TriggerPatternsCard({
  topTriggers,
  relapseCount,
  avgGap,
}: {
  topTriggers: { trigger: string; count: number }[]
  relapseCount: number
  avgGap: number
}) {
  return (
    <Card title="Trigger patterns" subtitle="Your most common reasons · name them to beat them" help="Aggregated from your reset reasons. The biggest bars are where to build a plan: an if-then for your top trigger removes most relapses.">
      <ul className="space-y-2">
        {topTriggers.map((t) => {
          const pct = Math.round((t.count / relapseCount) * 100)
          return (
            <li key={t.trigger}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="capitalize text-subtext1">{t.trigger}</span>
                <span className="text-overlay1">{t.count}× · {pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface0"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: cat('peach') }} /></div>
            </li>
          )
        })}
      </ul>
      {avgGap > 0 && <p className="mt-3 text-xs text-overlay0">Average <span style={{ color: cat('teal') }}>{avgGap} days</span> between resets · aim to stretch it.</p>}
    </Card>
  )
}
