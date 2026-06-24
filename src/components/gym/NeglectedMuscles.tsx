import { AlertTriangle } from 'lucide-react'
import { Card } from '../ui'
import { cat } from '../../lib/colors'
import { muscleNames } from '../MuscleMap'
import type { NeglectedMuscle } from '../../lib/fitness'

/**
 * Neglected-muscle alert: groups with zero working sets in the last 10 days, so
 * the user can rebalance. Shows days since each was last trained. Read-only.
 */
export function NeglectedMuscles({ muscles, setFocusEx }: { muscles: NeglectedMuscle[]; setFocusEx: (e: string | null) => void }) {
  const named = muscles
    .map((m) => ({ ...m, name: muscleNames([m.muscle])[0] }))
    .filter((m) => m.name)
  if (named.length === 0) return null // every muscle trained recently → nothing to nudge
  return (
    <Card title="Needs attention" subtitle="No hard sets in the last 10 days · tap to focus the map" defer>
      <div className="flex flex-wrap gap-1.5">
        {named.map((m) => (
          <button
            key={m.muscle}
            onClick={() => setFocusEx(m.name)}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs"
            style={{ background: cat('peach') + '22', color: cat('peach') }}
            title={m.daysSince == null ? `${m.name}: never trained` : `${m.name}: last trained ${m.daysSince} days ago`}
          >
            <AlertTriangle size={12} /> {m.name}
            <span className="text-[10px] text-overlay0">{m.daysSince == null ? 'never' : `${m.daysSince}d`}</span>
          </button>
        ))}
      </div>
    </Card>
  )
}
