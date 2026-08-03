import { lazy, Suspense, useMemo } from 'react'
import { Activity, Dumbbell, Timer, ArrowRight } from 'lucide-react'
import { Fitness } from './Fitness'
import { useJournal } from '../store'
import { cat } from '../lib/colors'
import { weeklyActiveMinutes, nextSplit, splitMeta } from '../lib/fitness'
import { useStickyState } from '../lib/useStickyState'

// Gym is recharts-heavy · load it only when the Strength tab is opened.
const Gym = lazy(() => import('./Gym').then((m) => ({ default: m.Gym })))

/**
 * One home for training. Cardio (general sessions, totals, history, nutrition)
 * and Strength (structured lifting, programs, anatomy, body, photos) live as
 * tabs over a shared workout store · no more "which view do I open?" and one
 * fewer nav item. Pull-ups keeps its own dedicated view.
 */
const FITNESS_TABS = ['cardio', 'strength'] as const

export function FitnessHub({ initialTab = 'cardio' }: { initialTab?: 'cardio' | 'strength' }) {
  // Sticky: the two tabs are different tools, and people live in one of them.
  // Landing on Cardio every single time is a tax on whoever mostly lifts.
  const [tab, setTab] = useStickyState<'cardio' | 'strength'>('fitness.tab', initialTab, FITNESS_TABS)
  const { data } = useJournal()

  // Read-only weekly active-minutes goal ring (workouts + pickleball).
  const goal = data.settings.fitnessGoalMin ?? 150
  const minutes = useMemo(() => weeklyActiveMinutes(data), [data])
  // Smart next-split recommendation for the strength side.
  const split = useMemo(() => splitMeta(nextSplit(data)), [data])

  return (
    <div className="mx-auto max-w-read space-y-4">
      {/* 1) Primary navigation between the two fitness sub-views. */}
      <div className="flex w-full gap-1 rounded-xl bg-secondary p-1">
        {([['strength', 'Strength', Dumbbell], ['cardio', 'Cardio', Activity]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-body font-medium transition-colors ${
              tab === id ? 'bg-brand-wash font-medium text-brand' : 'text-fg-2 hover:text-fg-1'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* 2) Unified this-week status: weekly active-minutes ring + next-split banner. */}
      <div className="grid items-stretch gap-3 sm:grid-cols-[auto_1fr]">
        <ActiveMinutesRing minutes={minutes} goal={goal} />
        <button
          onClick={() => setTab('strength')}
          className="flex items-center gap-3 rounded-xl border border-line bg-ink-0 px-4 py-3 text-left transition-colors hover:border-line-strong"
          title="Open the Strength tab on this split"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-heading" style={{ background: cat(split.color) + '22' }}>
            {split.icon}
          </span>
          <span className="min-w-0">
            <span className="block text-caption uppercase tracking-wide text-fg-2">Next up</span>
            <span className="block truncate font-medium text-fg-1">
              {split.label} day
            </span>
          </span>
          <ArrowRight size={18} className="ml-auto shrink-0" style={{ color: cat(split.color) }} />
        </button>
      </div>
      {tab === 'cardio' ? (
        <Fitness />
      ) : (
        <Suspense fallback={<p className="py-10 text-center text-body text-fg-2">Loading strength tools…</p>}>
          <Gym />
        </Suspense>
      )}
    </div>
  )
}

/**
 * Compact SVG progress ring: this week's active minutes vs the goal. Turns green
 * once the goal is met. Pure presentation — no store access of its own.
 */
function ActiveMinutesRing({ minutes, goal }: { minutes: number; goal: number }) {
  const pct = goal > 0 ? Math.min(1, minutes / goal) : 0
  const met = minutes >= goal && goal > 0
  const size = 72
  const stroke = 7
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const color = met ? cat('green') : cat('peach')
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-ink-0 px-4 py-3">
      <div className="relative shrink-0" role="img" aria-label={`This week: ${minutes} of ${goal} active minutes`}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={cat('surface0')} strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-body font-medium" style={{ color }}>
          {Math.round(pct * 100)}%
        </span>
      </div>
      <div className="min-w-0">
        <span className="flex items-center gap-1 text-caption uppercase tracking-wide text-fg-2">
          <Timer size={12} /> This week
        </span>
        <span className="block font-medium text-fg-1">
          {minutes}<span className="text-fg-2"> / {goal} min</span>
        </span>
        <span className="block text-label" style={{ color }}>
          {met ? 'Goal met 🎉' : `${Math.max(0, goal - minutes)} min to go`}
        </span>
      </div>
    </div>
  )
}
