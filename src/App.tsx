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
import { CommandPalette } from './components/CommandPalette'
import {
  Sun, CalendarDays, BarChart3, Dumbbell, Activity, Repeat, BookMarked,
  Sparkles, Flower2, ShieldCheck, HelpCircle, SlidersHorizontal, Menu,
  PieChart, ZoomIn, ZoomOut, type LucideIcon,
} from 'lucide-react'

// Chart-heavy views (recharts) are code-split to keep the initial bundle small.
const Trackers = lazy(() => import('./views/Trackers').then((m) => ({ default: m.Trackers })))
const Cycle = lazy(() => import('./views/Cycle').then((m) => ({ default: m.Cycle })))
const Stats = lazy(() => import('./views/Stats').then((m) => ({ default: m.Stats })))
const Gym = lazy(() => import('./views/Gym').then((m) => ({ default: m.Gym })))

type ViewId =
  | 'today' | 'monthly' | 'trackers' | 'fitness' | 'gym' | 'plan' | 'collections'
  | 'insights' | 'stats' | 'cycle' | 'nofap' | 'help' | 'settings'

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
  { id: 'fitness', label: 'Fitness', icon: Activity },
  { id: 'gym', label: 'Gym', icon: Dumbbell },
  { id: 'plan', label: 'Plan', icon: Repeat },
  { id: 'collections', label: 'Collections', icon: BookMarked },
  { id: 'insights', label: 'Insights', icon: Sparkles },
  { id: 'stats', label: 'Stats', icon: PieChart },
  { id: 'cycle', label: 'Cycle', icon: Flower2, show: (g) => g.cycle },
  { id: 'nofap', label: 'Streak', icon: ShieldCheck, show: (g) => g.nofap },
  { id: 'help', label: 'Help', icon: HelpCircle },
  { id: 'settings', label: 'Settings', icon: SlidersHorizontal },
]

const VIEWS: Record<ViewId, React.ComponentType> = {
  today: Today, monthly: Monthly, trackers: Trackers, fitness: Fitness,
  gym: Gym, plan: Plan, collections: Collections, insights: Insights,
  stats: Stats, cycle: Cycle, nofap: NoFap, help: Help, settings: Settings,
}

export default function App() {
  const { data, setSettings } = useJournal()
  const urlView = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('view') : null
  const [view, setView] = useState<ViewId>((urlView && urlView in VIEWS ? urlView : 'today') as ViewId)
  const [navOpen, setNavOpen] = useState(false)
  const gated = { cycle: data.settings.cycleTrackerEnabled, nofap: data.settings.nofapEnabled }
  const items = NAV.filter((n) => !n.show || n.show(gated))
  const Current = VIEWS[view]
  const book = data.settings.bookMode
  const zoom = data.settings.zoom ?? 1

  return (
    <div className="flex min-h-screen flex-col">
      <CommandPalette onNavigate={(id) => setView(id as ViewId)} navItems={items.map((n) => ({ id: n.id, label: n.label }))} />
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
        className={`${navOpen ? 'block' : 'hidden'} border-b border-surface0 bg-mantle md:sticky md:top-0 md:block md:h-screen md:w-60 md:shrink-0 md:self-start md:overflow-y-auto md:border-r md:border-b-0`}
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
      <main className="relative flex-1 overflow-x-hidden p-4 sm:p-6">
        <ZoomControl zoom={zoom} onChange={(z) => setSettings({ zoom: z })} />
        <div className="mx-auto max-w-5xl" style={{ zoom }}>
          <Suspense fallback={<p className="py-10 text-center text-overlay0">Loading…</p>}>
            {book ? (
              <div className="book">
                <div key={view} className="book-inner page-in">
                  <Current />
                </div>
              </div>
            ) : (
              <div key={view} className="page-in">
                <Current />
              </div>
            )}
          </Suspense>
        </div>
      </main>
      </div>
    </div>
  )
}

function ZoomControl({ zoom, onChange }: { zoom: number; onChange: (z: number) => void }) {
  const clamp = (z: number) => Math.min(1.5, Math.max(0.7, Math.round(z * 100) / 100))
  return (
    <div className="fixed right-4 bottom-4 z-40 flex items-center gap-1 rounded-full border border-surface1 bg-mantle/90 px-1.5 py-1 shadow-lg backdrop-blur">
      <button onClick={() => onChange(clamp(zoom - 0.1))} aria-label="Zoom out" className="grid h-7 w-7 place-items-center rounded-full text-subtext1 hover:bg-surface0">
        <ZoomOut size={15} />
      </button>
      <button onClick={() => onChange(1)} aria-label="Reset zoom" className="w-11 text-center text-xs text-subtext0 hover:text-text">
        {Math.round(zoom * 100)}%
      </button>
      <button onClick={() => onChange(clamp(zoom + 0.1))} aria-label="Zoom in" className="grid h-7 w-7 place-items-center rounded-full text-subtext1 hover:bg-surface0">
        <ZoomIn size={15} />
      </button>
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
