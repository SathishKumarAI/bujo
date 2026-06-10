import { lazy, Suspense, useState } from 'react'
import { useJournal } from './store'
import { Today } from './views/Today'
import { Monthly } from './views/Monthly'
import { Fitness } from './views/Fitness'
import { Collections } from './views/Collections'
import { Plan } from './views/Plan'
import { Insights } from './views/Insights'
import { NoFap } from './views/NoFap'
import { Help } from './views/Help'
import { Settings } from './views/Settings'
import { ReminderBanner } from './components/ReminderBanner'
import {
  Sun, CalendarDays, BarChart3, Dumbbell, Repeat, BookMarked,
  Sparkles, Flower2, ShieldCheck, HelpCircle, SlidersHorizontal, Menu,
  type LucideIcon,
} from 'lucide-react'

// Chart-heavy views (recharts) are code-split to keep the initial bundle small.
const Trackers = lazy(() => import('./views/Trackers').then((m) => ({ default: m.Trackers })))
const Cycle = lazy(() => import('./views/Cycle').then((m) => ({ default: m.Cycle })))

type ViewId =
  | 'today' | 'monthly' | 'trackers' | 'fitness' | 'plan' | 'collections'
  | 'insights' | 'cycle' | 'nofap' | 'help' | 'settings'

interface NavItem {
  id: ViewId
  label: string
  icon: LucideIcon
  show?: (gated: { cycle: boolean; nofap: boolean }) => boolean
}

const NAV: NavItem[] = [
  { id: 'today', label: 'Today', icon: Sun },
  { id: 'monthly', label: 'Monthly', icon: CalendarDays },
  { id: 'trackers', label: 'Trackers', icon: BarChart3 },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell },
  { id: 'plan', label: 'Plan', icon: Repeat },
  { id: 'collections', label: 'Collections', icon: BookMarked },
  { id: 'insights', label: 'Insights', icon: Sparkles },
  { id: 'cycle', label: 'Cycle', icon: Flower2, show: (g) => g.cycle },
  { id: 'nofap', label: 'Streak', icon: ShieldCheck, show: (g) => g.nofap },
  { id: 'help', label: 'Help', icon: HelpCircle },
  { id: 'settings', label: 'Settings', icon: SlidersHorizontal },
]

const VIEWS: Record<ViewId, React.ComponentType> = {
  today: Today, monthly: Monthly, trackers: Trackers, fitness: Fitness,
  plan: Plan, collections: Collections, insights: Insights, cycle: Cycle,
  nofap: NoFap, help: Help, settings: Settings,
}

export default function App() {
  const { data } = useJournal()
  const [view, setView] = useState<ViewId>('today')
  const [navOpen, setNavOpen] = useState(false)
  const gated = { cycle: data.settings.cycleTrackerEnabled, nofap: data.settings.nofapEnabled }
  const items = NAV.filter((n) => !n.show || n.show(gated))
  const Current = VIEWS[view]

  return (
    <div className="flex min-h-screen flex-col">
      <ReminderBanner />
      <div className="flex flex-1 flex-col md:flex-row">
      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-surface0 bg-mantle px-4 py-3 md:hidden">
        <Brand />
        <button onClick={() => setNavOpen((o) => !o)} aria-label="Toggle menu" className="text-text">
          <Menu size={22} />
        </button>
      </header>

      {/* Sidebar */}
      <nav
        className={`${navOpen ? 'block' : 'hidden'} border-b border-surface0 bg-mantle md:block md:w-60 md:shrink-0 md:border-r md:border-b-0`}
      >
        <div className="hidden px-5 pt-6 pb-4 md:block"><Brand /></div>
        <ul className="flex flex-row flex-wrap gap-0.5 p-2 md:flex-col md:px-3 md:pb-3">
          {items.map((n) => {
            const Icon = n.icon
            const active = view === n.id
            return (
              <li key={n.id}>
                <button
                  onClick={() => { setView(n.id); setNavOpen(false) }}
                  aria-current={active ? 'page' : undefined}
                  className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    active ? 'bg-surface0/70 font-medium text-text' : 'text-subtext0 hover:bg-surface0/40 hover:text-subtext1'
                  }`}
                >
                  {active && (
                    <span className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-mauve" aria-hidden />
                  )}
                  <Icon size={17} className={active ? 'text-mauve' : 'text-overlay1 group-hover:text-subtext0'} aria-hidden />
                  <span>{n.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Main */}
      <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
        <div className="mx-auto max-w-5xl">
          <Suspense fallback={<p className="py-10 text-center text-overlay0">Loading…</p>}>
            <div key={view} className="page-in">
              <Current />
            </div>
          </Suspense>
        </div>
      </main>
      </div>
    </div>
  )
}

function Brand() {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-display text-2xl font-semibold tracking-tight text-text">bujo</span>
      <span className="text-mauve">✦</span>
    </div>
  )
}
