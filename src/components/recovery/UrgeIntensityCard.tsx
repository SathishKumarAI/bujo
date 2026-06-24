import { Activity, TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from '../ui'
import { cat } from '../../lib/colors'
import type { intensityStats } from '../../lib/urge'

type Intensity = ReturnType<typeof intensityStats>

const INTENSITY_LABELS = ['Faint', 'Mild', 'Moderate', 'Strong', 'Intense']

/** Urge-intensity distribution (#74) · how strong, and whether it's weakening. */
export function UrgeIntensityCard({ intensity9 }: { intensity9: Intensity }) {
  return (
    <Card title={<span className="inline-flex items-center gap-2"><Activity size={16} className="text-peach" /> Urge intensity</span>} subtitle={`Averaging ${intensity9.avg}/5${intensity9.mode ? ` · mostly ${INTENSITY_LABELS[intensity9.mode - 1].toLowerCase()}` : ''}`} help="Your self-rated urge strengths (1 faint … 5 intense). A falling trend means the urges themselves are getting weaker over time, not just less frequent — the strongest signal that recovery is working.">
      <div className="space-y-1.5">
        {intensity9.buckets.map((c, i) => {
          const pct = intensity9.rated > 0 ? Math.round((c / intensity9.rated) * 100) : 0
          const isMode = intensity9.mode === i + 1
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-16 shrink-0 text-overlay0">{i + 1} · {INTENSITY_LABELS[i]}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: cat('surface0') }}>
                <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: isMode ? cat('peach') : cat('surface1') }} />
              </div>
              <span className="w-8 shrink-0 text-right text-overlay1">{c}</span>
            </div>
          )
        })}
      </div>
      {intensity9.rated >= 2 && intensity9.trend !== 0 && (
        <p className="mt-2.5 inline-flex items-center gap-1.5 text-xs" style={{ color: intensity9.trend < 0 ? cat('green') : cat('peach') }}>
          {intensity9.trend < 0 ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
          {intensity9.trend < 0
            ? <span>Urges are getting <strong>weaker</strong> · recent ones average {Math.abs(intensity9.trend)} lower.</span>
            : <span>Urges have intensified by {intensity9.trend} lately · extra care this stretch.</span>}
        </p>
      )}
    </Card>
  )
}
