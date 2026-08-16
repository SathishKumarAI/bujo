import { Heartbeat } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card, Empty } from '../ui'
import { cat } from '../../lib/colors'
import { muscleNames } from '../../lib/muscles'
import type { MuscleRecovery } from '../../lib/fitness'

/**
 * Muscle-recovery readiness map: how long since each muscle was last trained,
 * coloured by readiness (fatigued today/yesterday → green when rested). Tap a
 * muscle to focus the anatomy map. Read-only — derived via muscleRecovery.
 */
export function RecoveryMap({ recovery, setFocusEx }: { recovery: MuscleRecovery[]; setFocusEx: (e: string | null) => void }) {
  const named = recovery
    .map((r) => ({ ...r, name: muscleNames([r.muscle])[0] }))
    .filter((r) => r.name)
  const stateColor: Record<string, string> = { fresh: 'green', recovering: 'yellow', fatigued: 'red' }
  const stateLabel: Record<string, string> = { fresh: 'ready', recovering: 'recovering', fatigued: 'fatigued' }
  return (
    <Card band title="Recovery readiness" subtitle="Time since each muscle was last trained, green = ready" defer right={<Icon as={Heartbeat} size="md" style={{ color: cat('green') }} />}>
      {named.length === 0 ? (
        <Empty>Log some working sets to see what's recovered and ready.</Empty>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {named.map((r) => {
            const color = stateColor[r.state]
            return (
              <button
                key={r.muscle}
                onClick={() => setFocusEx(r.name)}
                className="inline-flex items-center gap-1.5 rounded-none px-2.5 py-1 text-label"
                style={{ background: cat(color) + '22', color: cat(color) }}
                title={`${r.name}: ${r.daysSince == null ? 'never trained' : `last trained ${r.daysSince}d ago`} · ${stateLabel[r.state]}`}
              >
                {r.name}
                <span className="text-micro text-fg-2">{r.daysSince == null ? 'fresh' : `${r.daysSince}d`}</span>
              </button>
            )
          })}
        </div>
      )}
    </Card>
  )
}
