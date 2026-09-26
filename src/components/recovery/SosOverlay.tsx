import { Lifebuoy, Shield, X } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState, useEffect, useRef } from 'react'
import { Input } from '../ui'
import { Button } from '../ui/button'
import { cat, onRaised } from '../../lib/colors'
import { matchPlanForTrigger } from '../../lib/urge'
import type { TriggerPlan } from '../../lib/types'
import { useFocusTrap } from '../../lib/useFocusTrap'

const SOS_SECONDS = 10 * 60 // 10-minute "ride it out" timer
// 4-7-8 style breathing pacer: inhale 4s · hold 7s · exhale 8s (one 19s cycle).
const BREATH_PHASES = [
  { label: 'Breathe in', secs: 4, scale: 1.35, color: 'teal' as const },
  { label: 'Hold', secs: 7, scale: 1.35, color: 'mauve' as const },
  { label: 'Breathe out', secs: 8, scale: 0.8, color: 'sky' as const },
]
const BREATH_CYCLE = BREATH_PHASES.reduce((n, p) => n + p.secs, 0)

/** Phase of the breathing pacer at `elapsed` seconds into the SOS session. */
function breathPhase(elapsed: number) {
  let t = elapsed % BREATH_CYCLE
  for (const p of BREATH_PHASES) {
    if (t < p.secs) return p
    t -= p.secs
  }
  return BREATH_PHASES[0]
}

/**
 * Panic / SOS overlay — a full-screen "ride it out" companion: a 10-minute
 * countdown (urges peak and pass in ~15 min), a 4-7-8 breathing pacer, and the
 * user's own coping line for the matching trigger plan. All local state.
 *
 * **This is why folding the coping list in zone 3 is allowed.** The in-urge
 * version of those techniques is here, behind a fixed floating button that is
 * reachable from any scroll position and sits outside the three zones for
 * exactly that reason.
 */
export function SosOverlay({ plans, onClose }: { plans: TriggerPlan[]; onClose: () => void }) {
  // Full-screen overlay: without a trap, Tab walks into the page underneath it,
  // which is exactly the moment a user should not be able to wander off.
  const trap = useFocusTrap<HTMLDivElement>()
  const [elapsed, setElapsed] = useState(0)
  const [trigger, setTrigger] = useState('')
  const startRef = useRef<number | null>(null)
  const matched = matchPlanForTrigger(plans, trigger)

  useEffect(() => {
    startRef.current = Date.now()
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - (startRef.current ?? Date.now())) / 1000))
    }, 250)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { clearInterval(id); window.removeEventListener('keydown', onKey) }
  }, [onClose])

  const remaining = Math.max(0, SOS_SECONDS - elapsed)
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  const done = remaining === 0
  const phase = breathPhase(elapsed)

  return (
    <div ref={trap} role="dialog" aria-modal="true" aria-label="Urge SOS"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-6"
      style={{ background: cat('crust') + 'f2', backdropFilter: 'blur(6px)' }}>
      <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close SOS" className="absolute right-4 top-4 text-fg-2 hover:text-fg-1" style={{ background: cat('surface0') }}><Icon as={X} size="lg" /></Button>

      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-body" style={{ color: onRaised('peach') }}><Icon as={Lifebuoy} size="md" /> Ride it out · this is a wave, not a command</div>
        <div className="mt-1 font-mono text-display font-medium tabular-nums" style={{ color: done ? cat('green') : cat('text') }}>{mm}:{ss}</div>
        <p className="mt-1 text-label text-fg-2">{done ? 'The peak has passed. You made it.' : 'Stay until the timer ends · the urge will crest and fall.'}</p>
      </div>

      {/* Breathing pacer */}
      <div className="grid h-44 w-44 place-items-center">
        <div className="grid h-32 w-32 place-items-center rounded-control text-center text-body font-medium"
          aria-live="polite"
          style={{
            background: cat(phase.color) + '22',
            border: `2px solid ${cat(phase.color)}`,
            color: onRaised(phase.color),
            transform: `scale(${phase.scale})`,
            transition: `transform ${phase.secs}s ease-in-out`,
          }}>
          {phase.label}
        </div>
      </div>

      {/* Coping line from the matching trigger plan */}
      <div className="w-full max-w-md">
        <Input value={trigger} onChange={(e) => setTrigger(e.target.value)} placeholder="What's triggering it? (finds your plan)" aria-label="Current trigger" />
        {matched ? (
          <div className="mt-2 rounded-card p-3 text-body" style={{ background: cat('teal') + '14', border: `1px solid ${cat('teal')}44` }}>
            <span className="font-medium" style={{ color: onRaised('teal') }}>Your plan for “{matched.trigger}”:</span>{' '}
            <span className="text-fg-2">{matched.coping || 'name it and let it pass.'}</span>
          </div>
        ) : (
          <p className="mt-2 text-center text-label text-fg-2">No matching plan yet, try “Surf it”: name the urge and watch it pass without acting.</p>
        )}
      </div>

      <Button variant="secondary" onClick={onClose} className="inline-flex items-center gap-1.5"><Icon as={Shield} size="sm" /> I'm okay now</Button>
    </div>
  )
}
