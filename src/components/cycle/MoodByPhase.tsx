import { cat, onRaised } from '../../lib/colors'
import type { PhaseAverage } from '../../lib/cyclePatterns'

/**
 * MOOD & ENERGY BY PHASE · the four-row answer to "does this follow my cycle".
 *
 * Two bars per phase rather than a chart: there are four phases and two
 * measures, and a recharts instance for eight numbers is more chrome than
 * content. The bars are drawn against a fixed 1–5 scale, not against the
 * observed range, because a normalised scale would make a flat 3.2/3.3/3.1/3.2
 * look like a dramatic swing — which is the most misleading thing this card
 * could do.
 *
 * A phase with nothing rated prints "not rated" rather than an empty bar. An
 * empty bar reads as zero, and zero on a 1–5 mood scale is a claim nobody made.
 */
export function MoodByPhase({ rows }: { rows: PhaseAverage[] }) {
  const rated = rows.filter((r) => r.mood != null || r.energy != null)
  if (rated.length === 0) {
    return (
      <p className="text-body text-fg-2">
        Rate a mood or an energy level on a few days and this shows whether they follow your cycle.
      </p>
    )
  }

  return (
    <div>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.phase}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-label text-fg-1">{r.phase}</span>
              <span className="text-micro text-fg-2">{r.days} day{r.days === 1 ? '' : 's'}</span>
            </div>
            <div className="mt-1 space-y-1">
              <Bar label="Mood" value={r.mood} hue="green" />
              <Bar label="Energy" value={r.energy} hue="peach" />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-label text-fg-2">
        Averages of the days you rated, on a fixed 1–5 scale — a phase you never rated says so
        rather than showing an empty bar.
      </p>
    </div>
  )
}

function Bar({ label, value, hue }: { label: string; value: number | null; hue: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-micro text-fg-2">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-pill" style={{ background: cat('surface0') }}>
        {value != null && (
          // Fixed 1–5 denominator. Scaling to the observed range would turn a
          // flat 3.1–3.3 spread into a dramatic-looking swing.
          <div className="h-full rounded-pill" style={{ width: `${(value / 5) * 100}%`, background: cat(hue) }} />
        )}
      </div>
      <span className="w-16 shrink-0 text-right text-micro tabular-nums" style={{ color: value == null ? cat('overlay1') : onRaised(hue) }}>
        {value == null ? 'not rated' : value.toFixed(1)}
      </span>
    </div>
  )
}
