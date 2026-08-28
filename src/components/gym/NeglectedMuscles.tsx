import { Warning } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card } from '../ui'
import { washStyle } from '../../lib/colors'
import { muscleNames } from '../../lib/muscles'
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
    <Card band title="Needs attention" subtitle="No hard sets in the last 10 days, tap to focus the map" defer>
      <div className="flex flex-wrap gap-1.5">
        {named.map((m) => (
          <button
            key={m.muscle}
            onClick={() => setFocusEx(m.name)}
            className="inline-flex items-center gap-1.5 rounded-none px-2.5 py-1 text-label"
            style={washStyle('peach')}
            title={m.daysSince == null ? `${m.name}: never trained` : `${m.name}: last trained ${m.daysSince} days ago`}
          >
            <Icon as={Warning} size="sm" /> {m.name}
            <span className="text-micro text-fg-2">{m.daysSince == null ? 'never' : `${m.daysSince}d`}</span>
          </button>
        ))}
      </div>
    </Card>
  )
}
