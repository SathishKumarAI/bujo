import { lazy, Suspense, useState } from 'react'
import { Activity, Dumbbell } from 'lucide-react'
import { Fitness } from './Fitness'

// Gym is recharts-heavy — load it only when the Strength tab is opened.
const Gym = lazy(() => import('./Gym').then((m) => ({ default: m.Gym })))

/**
 * One home for training. Cardio (general sessions, totals, history, nutrition)
 * and Strength (structured lifting, programs, anatomy, body, photos) live as
 * tabs over a shared workout store — no more "which view do I open?" and one
 * fewer nav item. Pull-ups keeps its own dedicated view.
 */
export function FitnessHub() {
  const [tab, setTab] = useState<'cardio' | 'strength'>('cardio')
  return (
    <div className="space-y-4">
      <div className="mx-auto flex w-full max-w-[1400px] gap-1 rounded-xl bg-secondary p-1">
        {([['cardio', 'Cardio', Activity], ['strength', 'Strength', Dumbbell]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === id ? 'bg-primary text-primary-foreground' : 'text-subtext1 hover:text-text'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>
      {tab === 'cardio' ? (
        <Fitness />
      ) : (
        <Suspense fallback={<p className="py-10 text-center text-sm text-overlay0">Loading strength tools…</p>}>
          <Gym />
        </Suspense>
      )}
    </div>
  )
}
