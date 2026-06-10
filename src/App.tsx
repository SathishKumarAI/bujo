import { lazy, Suspense, useState } from 'react'
import { useJournal } from './store'
import { Today } from './views/Today'
import { Monthly } from './views/Monthly'
import { Fitness } from './views/Fitness'
import { Collections } from './views/Collections'
import { Insights } from './views/Insights'
import { NoFap } from './views/NoFap'
import { Help } from './views/Help'
import { Settings } from './views/Settings'

// Chart-heavy views (recharts) are code-split to keep the initial bundle small.
const Trackers = lazy(() => import('./views/Trackers').then((m) => ({ default: m.Trackers })))
const Cycle = lazy(() => import('./views/Cycle').then((m) => ({ default: m.Cycle })))

type ViewId =
  | 'today' | 'monthly' | 'trackers' | 'fitness' | 'collections'
  | 'insights' | 'cycle' | 'nofap' | 'help' | 'settings'

interface NavItem {
  id: ViewId
  label: string
  icon: string
  show?: (gated: { cycle: boolean; nofap: boolean }) => boolean
}

const NAV: NavItem[] = [
  { id: 'today', label: 'Today', icon: '☀️' },
  { id: 'monthly', label: 'Monthly', icon: '📅' },
  { id: 'trackers', label: 'Trackers', icon: '📊' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'collections', label: 'Collections', icon: '📚' },
  { id: 'insights', label: 'Insights', icon: '✨' },
  { id: 'cycle', label: 'Cycle', icon: '🌸', show: (g) => g.cycle },
  { id: 'nofap', label: 'Streak', icon: '🛡️', show: (g) => g.nofap },
  { id: 'help', label: 'Help', icon: '❓' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

const VIEWS: Record<ViewId, React.ComponentType> = {
  today: Today, monthly: Monthly, trackers: Trackers, fitness: Fitness,
  collections: Collections, insights: Insights, cycle: Cycle, nofap: NoFap,
  help: Help, settings: Settings,
}

export default function App() {
  const { data } = useJournal()
  const [view, setView] = useState<ViewId>('today')
  const [navOpen, setNavOpen] = useState(false)
  const gated = { cycle: data.settings.cycleTrackerEnabled, nofap: data.settings.nofapEnabled }
  const items = NAV.filter((n) => !n.show || n.show(gated))
  const Current = VIEWS[view]

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-surface0 bg-mantle px-4 py-3 md:hidden">
        <Brand />
        <button onClick={() => setNavOpen((o) => !o)} aria-label="Toggle menu" className="text-2xl text-text">☰</button>
      </header>

      {/* Sidebar */}
      <nav
        className={`${navOpen ? 'block' : 'hidden'} border-b border-surface0 bg-mantle md:block md:w-56 md:shrink-0 md:border-r md:border-b-0`}
      >
        <div className="hidden p-5 md:block"><Brand /></div>
        <ul className="flex flex-row flex-wrap gap-1 p-2 md:flex-col md:p-3">
          {items.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => { setView(n.id); setNavOpen(false) }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  view === n.id ? 'bg-surface0 font-medium text-mauve' : 'text-subtext1 hover:bg-surface0'
                }`}
              >
                <span aria-hidden>{n.icon}</span>
                <span>{n.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main */}
      <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
        <div className="mx-auto max-w-5xl">
          <Suspense fallback={<p className="py-10 text-center text-overlay0">Loading…</p>}>
            <Current />
          </Suspense>
        </div>
      </main>
    </div>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-mauve text-crust glow-mauve">✦</span>
      <span className="text-lg font-bold tracking-tight text-text">bujo</span>
    </div>
  )
}
