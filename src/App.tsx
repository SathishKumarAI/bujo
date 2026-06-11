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
import { Welcome } from './views/Welcome'
import { hasFolder, restoreFolder, saveToFolder } from './lib/fscloud'
import { useEffect } from 'react'
import {
  Sun, CalendarDays, BarChart3, Dumbbell, Activity, Repeat, BookMarked,
  Sparkles, Flower2, ShieldCheck, HelpCircle, SlidersHorizontal, Menu,
  PieChart, ZoomIn, ZoomOut, Undo2, Redo2, PanelLeftClose, PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react'

// Chart-heavy views (recharts) are code-split to keep the initial bundle small.
const Trackers = lazy(() => import('./views/Trackers').then((m) => ({ default: m.Trackers })))
const Cycle = lazy(() => import('./views/Cycle').then((m) => ({ default: m.Cycle })))
const Stats = lazy(() => import('./views/Stats').then((m) => ({ default: m.Stats })))
const Gym = lazy(() => import('./views/Gym').then((m) => ({ default: m.Gym })))

type ViewId =
  | 'today' | 'monthly' | 'trackers' | 'fitness' | 'gym' | 'plan' | 'collections'
  | 'insights' | 'stats' | 'cycle' | 'nofap' | 'help' | 'settings'

type NavGroup = 'Journal' | 'Health' | 'Review' | 'System'

interface NavItem {
  id: ViewId
  label: string
  icon: LucideIcon
  group: NavGroup
  show?: (gated: { cycle: boolean; nofap: boolean }) => boolean
}

// Ordered as a daily pipeline: capture & organise → track health → review → system.
const GROUP_ORDER: NavGroup[] = ['Journal', 'Health', 'Review', 'System']

const NAV: NavItem[] = [
  { id: 'today', label: 'Today', icon: Sun, group: 'Journal' },
  { id: 'monthly', label: 'Monthly', icon: CalendarDays, group: 'Journal' },
  { id: 'plan', label: 'Plan', icon: Repeat, group: 'Journal' },
  { id: 'collections', label: 'Collections', icon: BookMarked, group: 'Journal' },
  { id: 'trackers', label: 'Trackers', icon: BarChart3, group: 'Health' },
  { id: 'fitness', label: 'Fitness', icon: Activity, group: 'Health' },
  { id: 'gym', label: 'Gym', icon: Dumbbell, group: 'Health' },
  { id: 'cycle', label: 'Cycle', icon: Flower2, group: 'Health', show: (g) => g.cycle },
  { id: 'nofap', label: 'Streak', icon: ShieldCheck, group: 'Health', show: (g) => g.nofap },
  { id: 'insights', label: 'Insights', icon: Sparkles, group: 'Review' },
  { id: 'stats', label: 'Stats', icon: PieChart, group: 'Review' },
  { id: 'help', label: 'Help', icon: HelpCircle, group: 'System' },
  { id: 'settings', label: 'Settings', icon: SlidersHorizontal, group: 'System' },
]

const VIEWS: Record<ViewId, React.ComponentType> = {
  today: Today, monthly: Monthly, trackers: Trackers, fitness: Fitness,
  gym: Gym, plan: Plan, collections: Collections, insights: Insights,
  stats: Stats, cycle: Cycle, nofap: NoFap, help: Help, settings: Settings,
}

export default function App() {
  const { data, setSettings, undo, redo, canUndo, canRedo } = useJournal()
  const urlView = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('view') : null
  const [view, setView] = useState<ViewId>((urlView && urlView in VIEWS ? urlView : 'today') as ViewId)
  const [navOpen, setNavOpen] = useState(false)
  const gated = { cycle: data.settings.cycleTrackerEnabled, nofap: data.settings.nofapEnabled }
  const items = NAV.filter((n) => !n.show || n.show(gated))
  const Current = VIEWS[view]
  const book = data.settings.bookMode
  const zoom = data.settings.zoom ?? 1
  const mode = data.settings.storageMode
  const collapsed = data.settings.sidebarCollapsed

  // Restore the picked folder handle on mount (silent — no permission prompt).
  useEffect(() => {
    if (mode === 'folder') restoreFolder(false)
  }, [mode])

  // Auto-save to the cloud folder (debounced) whenever data changes.
  useEffect(() => {
    if (mode !== 'folder' || !hasFolder()) return
    const id = setTimeout(() => { saveToFolder(data).catch(() => {}) }, 1500)
    return () => clearTimeout(id)
  }, [data, mode])

  // First run → show the login/welcome gate.
  if (!mode) return <Welcome />

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

      {/* Sidebar — desktop collapses to an icon rail that expands on hover */}
      <nav
        className={`${navOpen ? 'block' : 'hidden'} group/sb relative border-b border-surface0 bg-mantle md:sticky md:top-0 md:block md:h-screen md:shrink-0 md:self-start md:overflow-visible md:border-b-0 ${collapsed ? 'md:w-14' : 'md:w-60'}`}
      >
        <div
          className={`bg-mantle transition-[width] duration-200 ease-out md:h-screen md:overflow-x-hidden md:overflow-y-auto md:border-r md:border-surface0 ${
            collapsed
              ? 'md:w-14 md:group-hover/sb:absolute md:group-hover/sb:top-0 md:group-hover/sb:left-0 md:group-hover/sb:z-50 md:group-hover/sb:w-60 md:group-hover/sb:shadow-2xl'
              : 'md:w-60'
          }`}
        >
          <div className="hidden items-center justify-between px-4 pt-5 pb-3 md:flex">
            <span className={collapsed ? 'md:hidden md:group-hover/sb:block' : ''}><Brand /></span>
            <button
              onClick={() => setSettings({ sidebarCollapsed: !collapsed })}
              aria-label={collapsed ? 'Pin sidebar open' : 'Collapse sidebar'}
              title={collapsed ? 'Pin open' : 'Collapse'}
              className="text-overlay1 hover:text-text"
            >
              {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            </button>
          </div>
          <div className="flex flex-row flex-wrap gap-0.5 p-2 md:flex-col md:px-2.5 md:pb-3">
            {GROUP_ORDER.map((group) => {
              const groupItems = items.filter((n) => n.group === group)
              if (groupItems.length === 0) return null
              return (
                <div key={group} className="contents md:block">
                  <p className={`hidden px-3 pt-4 pb-1 text-[10px] font-medium tracking-wider text-overlay0 uppercase md:block ${collapsed ? 'md:hidden md:group-hover/sb:block' : ''}`}>
                    {group}
                  </p>
                  <ul className="contents md:block">
                    {groupItems.map((n) => {
                      const Icon = n.icon
                      const active = view === n.id
                      return (
                        <li key={n.id}>
                          <button
                            onClick={() => { setView(n.id); setNavOpen(false) }}
                            aria-current={active ? 'page' : undefined}
                            title={n.label}
                            className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                              active ? 'bg-surface0/70 font-medium text-text' : 'text-subtext0 hover:bg-surface0/40 hover:text-subtext1'
                            }`}
                          >
                            {active && <span className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-mauve" aria-hidden />}
                            <Icon size={17} className={`shrink-0 ${active ? 'text-mauve' : 'text-overlay1 group-hover:text-subtext0'}`} aria-hidden />
                            <span className={`whitespace-nowrap ${collapsed ? 'md:hidden md:group-hover/sb:inline' : ''}`}>{n.label}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="relative flex-1 overflow-x-hidden p-4 sm:p-6">
        <ZoomControl zoom={zoom} onChange={(z) => setSettings({ zoom: z })} />
        <div className="fixed bottom-4 left-4 z-40 flex gap-1 rounded-full border border-surface1 bg-mantle/90 px-1.5 py-1 shadow-lg backdrop-blur md:left-[15.5rem]">
          <button onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo (Ctrl+Z)" className="grid h-7 w-7 place-items-center rounded-full text-subtext1 hover:bg-surface0 disabled:opacity-30">
            <Undo2 size={15} />
          </button>
          <button onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo (Ctrl+Shift+Z)" className="grid h-7 w-7 place-items-center rounded-full text-subtext1 hover:bg-surface0 disabled:opacity-30">
            <Redo2 size={15} />
          </button>
        </div>
        <div className="mx-auto max-w-[1600px]" style={{ zoom }}>
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
