import { ArrowsClockwise, CalendarCheck } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card } from '../ui'
import { cat } from '../../lib/colors'
import type { ExerciseFreq, TrainRestRatio } from '../../lib/fitness'

/**
 * Exercise frequency (most-trained movements in the last 4 weeks) alongside a
 * train-vs-rest consistency readout. Tap an exercise to focus the muscle map.
 * Read-only — derived via exerciseFrequency + trainRestRatio.
 */
export function ExerciseFrequencyCard({ rows, ratio, setFocusEx }: { rows: ExerciseFreq[]; ratio: TrainRestRatio; setFocusEx: (e: string | null) => void }) {
  if (rows.length === 0) return null
  const maxDays = Math.max(...rows.map((r) => r.days), 1)
  return (
    <Card title="Exercise frequency" subtitle={`Most-trained movements, last ${ratio.window} days`} defer>
      <div className="mb-3 flex items-center gap-3 rounded-xl border border-line bg-ink-0 px-3 py-2 text-body">
        <Icon as={CalendarCheck} size="md" style={{ color: cat('teal') }} />
        <span className="text-fg-1">
          <span className="font-medium text-fg-1">{ratio.trainDays}</span> train ·{' '}
          <span className="font-medium text-fg-1">{ratio.restDays}</span> rest
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-fg-2" title="Share of days trained in the window">
          <Icon as={ArrowsClockwise} size="sm" /> {Math.round(ratio.ratio * 100)}% active
        </span>
      </div>
      <ul className="space-y-2 text-body">
        {rows.slice(0, 8).map((r) => (
          <li key={r.exercise} className="flex items-center gap-2">
            <button
              onClick={() => setFocusEx(r.exercise)}
              className="w-28 shrink-0 truncate text-left text-fg-1 hover:text-fg-1"
              title={`Focus the muscle map on ${r.exercise}`}
            >
              {r.exercise}
            </button>
            <div className="relative h-3.5 flex-1 overflow-hidden rounded-full bg-ink-2">
              <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(r.days / maxDays) * 100}%`, background: cat('blue') }} />
            </div>
            <span className="w-16 shrink-0 text-right text-label text-fg-2">
              {r.days}d · {r.sets} set{r.sets === 1 ? '' : 's'}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
