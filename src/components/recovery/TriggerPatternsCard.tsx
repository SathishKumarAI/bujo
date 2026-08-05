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
    <Card hideInfo title="Trigger patterns" subtitle="Your most common reasons, name them to beat them">
      <ul className="space-y-2">
        {topTriggers.map((t) => {
          const pct = Math.round((t.count / relapseCount) * 100)
          return (
            <li key={t.trigger}>
              <div className="mb-1 flex justify-between text-body">
                <span className="capitalize text-fg-1">{t.trigger}</span>
                <span className="text-fg-2">{t.count}× · {pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-pill bg-ink-2"><div className="h-full rounded-pill" style={{ width: `${pct}%`, background: cat('peach') }} /></div>
            </li>
          )
        })}
      </ul>
      {avgGap > 0 && <p className="mt-3 text-label text-fg-2">Average <span style={{ color: cat('teal') }}>{avgGap} days</span> between resets · aim to stretch it.</p>}
    </Card>
  )
}
