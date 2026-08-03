import { ArrowRight, ChartBar, Command, Compass, ShieldCheck, Sun, X } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import { useState } from 'react'
import { useNav } from './shell/nav'
import type { ViewId } from './shell/viewChrome'
import { Button } from './ui/button'
import { useFocusTrap } from '../lib/useFocusTrap'

const KEY = 'bujo:onboarded'

/** True once the user has seen (and dismissed) the first-run tour. */
// eslint-disable-next-line react-refresh/only-export-components -- tiny helper co-located with its component
export function onboarded(): boolean {
  try { return localStorage.getItem(KEY) === '1' } catch { return true }
}

const STEPS: { icon: typeof Sun; title: string; body: string; to?: ViewId }[] = [
  { icon: Sun, title: 'Capture in Today', body: 'Type one line per thought · t task · e event · n note · #tag. The smart bar also understands plain sentences like “ran 5k” and files them for you.', to: 'today' },
  { icon: ChartBar, title: 'Track your day', body: 'Tick habits, drag the mood/sleep sliders, log a workout. Try the Trackers “routine” lens (⏰) to run your day by time of day.', to: 'trackers' },
  { icon: Compass, title: 'Let the coach guide you', body: 'Today shows a few “do this next” prompts from your own data · what’s behind pace, what to drill, what to celebrate.', to: 'today' },
  { icon: Command, title: 'Jump anywhere', body: 'Press ⌘K / Ctrl+K for the command palette, or tap the ? on any page for help. Charts have a ⛶ to enlarge.' },
]

/**
 * First-run tour: a short, dismissable guide shown once after the user picks a
 * storage mode. Saves the missing onboarding lever without nagging · it never
 * shows again once dismissed.
 */
export function Onboarding({ onClose }: { onClose: () => void }) {
  const nav = useNav()
  // First-run overlay — the first thing a keyboard user ever meets, so Tab has
  // to stay inside the tour rather than wander into the app behind it.
  const trap = useFocusTrap<HTMLDivElement>()
  const [i, setI] = useState(0)
  const step = STEPS[i]
  const last = i === STEPS.length - 1
  const Icon = step.icon

  function done() {
    try { localStorage.setItem(KEY, '1') } catch { /* private mode */ }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-crust/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div ref={trap} className="relative w-full max-w-md rounded-card border border-line bg-card p-6 shadow-2xl">
        <button onClick={done} aria-label="Skip tour" className="absolute right-4 top-4 text-fg-2 hover:text-fg-1"><AppIcon as={X} size="md" /></button>
        <div className="mb-3 flex items-baseline gap-2">
          <span className="font-display text-title font-medium tracking-tight text-foreground">bujo</span>
          <span className="text-primary">✦</span>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-pill bg-secondary"><AppIcon as={Icon} size="lg" className="text-primary" /></div>
        <h2 className="mt-3 font-display text-title text-foreground">{step.title}</h2>
        <p className="mt-1.5 text-body text-fg-2">{step.body}</p>

        <div className="mt-5 flex items-center gap-1.5">
          {STEPS.map((_, n) => (
            <span key={n} className="h-1.5 rounded-pill transition-all" style={{ width: n === i ? 18 : 6, background: n === i ? 'var(--color-mauve)' : 'var(--color-surface1)' }} />
          ))}
          <div className="ml-auto flex gap-2">
            {step.to && <Button variant="ghost" size="sm" onClick={() => { nav(step.to as ViewId); done() }} className="h-auto p-0 text-label text-fg-2 hover:text-fg-1">Show me</Button>}
            {last ? (
              <Button onClick={done} className="press-3d gap-1.5">Start journaling</Button>
            ) : (
              <Button onClick={() => setI(i + 1)} className="press-3d gap-1.5">Next <AppIcon as={ArrowRight} size="sm" /></Button>
            )}
          </div>
        </div>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-caption text-fg-2"><AppIcon as={ShieldCheck} size="sm" /> Private & local-first. Your data is yours.</p>
      </div>
    </div>
  )
}
