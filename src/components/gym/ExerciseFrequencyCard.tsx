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
  // Scaled against TRAINING DAYS, not against the tallest row.
  //
  // Normalising to the max means the top row is always full width and, when
  // every value is equal — which is the common case here, since most people do
  // most movements on most training days — *every* row is full width. Eight
  // identical bars is not a chart; it is a chart that has lost its encoding, the
  // same failure the Today week strip had.
  //
  // "3 of your 13 training days" is an absolute scale: comparable between
  // exercises, comparable between windows, and it still draws equal bars when
  // the answer genuinely is equal — the difference being that the bar is then
  // short and says so.
  const denom = Math.max(ratio.trainDays, ...rows.map((r) => r.days), 1)
  return (
    <Card title="Exercise frequency" subtitle={`Most-trained movements, last ${ratio.window} days`} defer>
      <div className="mb-3 flex items-center gap-3 rounded-card border border-line bg-ink-0 px-3 py-2 text-body">
        <Icon as={CalendarCheck} size="md" style={{ color: cat('teal') }} />
        <span className="text-fg-1">
          <span className="font-medium text-fg-1">{ratio.trainDays}</span> train ·{' '}
          <span className="font-medium text-fg-1">{ratio.restDays}</span> rest
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-fg-2" title="Share of days trained in the window">
          <Icon as={ArrowsClockwise} size="sm" /> {Math.round(ratio.ratio * 100)}% active
        </span>
      </div>
      {/*
        Subgrid, not a fixed label width: the name column sizes to the longest
        name and the bars still line up. `w-28` cut "Romanian Deadlift" to
        "Romanian Deadlif…" — 112px of the 128px it needed — and the same fixed
        width is what clips every other bar list in the app.

        `max-w-48` on the label is the ceiling, so one pathological name cannot
        squeeze the bars to nothing; `truncate` only bites past that.
      */}
      <ul className="grid grid-cols-[auto_1fr_auto] gap-y-2 text-body">
        {rows.slice(0, 8).map((r) => (
          <li key={r.exercise} className="col-span-3 grid grid-cols-subgrid items-center gap-x-2">
            <button
              onClick={() => setFocusEx(r.exercise)}
              className="max-w-48 truncate text-left text-fg-1 hover:text-fg-1"
              title={`Focus the muscle map on ${r.exercise}`}
            >
              {r.exercise}
            </button>
            <div
              className="relative h-3.5 flex-1 overflow-hidden rounded-pill bg-ink-2"
              role="img"
              aria-label={`${r.exercise}: trained on ${r.days} of ${denom} training days, ${r.sets} set${r.sets === 1 ? '' : 's'}`}
            >
              <div className="absolute inset-y-0 left-0 rounded-pill" style={{ width: `${(r.days / denom) * 100}%`, background: cat('blue') }} />
            </div>
            <span className="text-right text-label whitespace-nowrap text-fg-2">
              {r.days}/{denom}d · {r.sets} set{r.sets === 1 ? '' : 's'}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
