import { Barbell, CheckCircle, Footprints, Timer } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useEffect, useState } from 'react'
import { useJournal } from '../../store'
import { Pill } from '../ui'
import { DEFAULT_FAST_TARGET, elapsedHours, fmtDuration } from '../../lib/fasting'
import { dayCompletion } from '../../lib/stats'

/**
 * A one-line "where the day stands" under the log: fast elapsed, habits done,
 * workout state.
 *
 * Read-only on purpose. The Day surface exists so the log is the only thing
 * asking for input; three more controls under it would put the screen straight
 * back where it started. Each item is a statement, and the place to act on it
 * is the surface that owns it.
 */
export function StatusStrip({ date }: { date: string }) {
  const { data } = useJournal()
  const target = data.settings.fastTargetHours ?? DEFAULT_FAST_TARGET
  const active = data.settings.fastActiveStart

  // Only tick while a fast is actually running — an interval on a day with no
  // fast is a re-render every 30s for a number that cannot change.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [active])

  const elapsed = active ? elapsedHours(active, now) : 0
  const hit = elapsed + 1e-9 >= target
  const cov = dayCompletion(data, date)
  const worked = data.workouts.some((w) => w.date === date) || (data.pickleball ?? []).some((p) => p.date === date)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {active ? (
        <Pill color={hit ? 'green' : 'mauve'} title={`Target ${target}h`}>
          <Icon as={Timer} size="sm" /> Fasting {fmtDuration(elapsed)}
        </Pill>
      ) : (
        <Pill title="No fast running">
          <Icon as={Timer} size="sm" /> Not fasting
        </Pill>
      )}

      {cov.total > 0 && (
        <Pill color={cov.done === cov.total ? 'green' : undefined} tone={cov.done === cov.total ? 'wash' : 'muted'}>
          <Icon as={CheckCircle} size="sm" /> Habits {cov.done}/{cov.total}
        </Pill>
      )}

      {worked ? (
        <Pill color="teal"><Icon as={Barbell} size="sm" /> Trained today</Pill>
      ) : (
        <Pill><Icon as={Footprints} size="sm" /> No workout yet</Pill>
      )}
    </div>
  )
}
