import { lazy, Suspense, useState, useEffect, useRef } from 'react'
import { migrate } from './lib/storage'
import { resolveIncoming } from './lib/conflict'
import { pushCloud, pullCloud } from './lib/bujocloud'
import { supabaseEnabled, currentUser, pullJournal, pushJournal, subscribeJournal } from './lib/supabase'
import { useJournal } from './store'
import { Today } from './views/Today'
import { Monthly } from './views/Monthly'
import { FitnessHub } from './views/FitnessHub'
import { Challenges } from './views/Challenges'
import { Focus } from './views/Focus'
import { Collections } from './views/Collections'
import { Plan } from './views/Plan'
import { Goals } from './views/Goals'
import { Insights } from './views/Insights'
import { NoFap } from './views/NoFap'
import { Help } from './views/Help'
import { Settings } from './views/Settings'
import { ReminderBanner } from './components/ReminderBanner'
import { SyncIndicator } from './components/SyncIndicator'
import { CommandPalette } from './components/CommandPalette'
import { Welcome } from './views/Welcome'
import { hasFolder, restoreFolder, saveToFolder } from './lib/fscloud'
import { AppShell } from './components/shell/AppShell'
import { CursorProvider } from './components/shell/cursor'
import { NavProvider } from './components/shell/nav'
import type { NavItem } from './components/shell/Sidebar'
import type { ViewId } from './components/shell/viewChrome'
import {
  Sun, CalendarDays, BarChart3, Activity, Repeat, BookMarked,
  Sparkles, Flower2, ShieldCheck, HelpCircle, SlidersHorizontal, PieChart, Target, Code2,
  ArrowUpToLine, Trophy,
} from 'lucide-react'

// Chart-heavy views (recharts) are code-split to keep the initial bundle small.
const Trackers = lazy(() => import('./views/Trackers').then((m) => ({ default: m.Trackers })))
const Cycle = lazy(() => import('./views/Cycle').then((m) => ({ default: m.Cycle })))
const Stats = lazy(() => import('./views/Stats').then((m) => ({ default: m.Stats })))
const Pullups = lazy(() => import('./views/Pullups').then((m) => ({ default: m.Pullups })))
const Pickleball = lazy(() => import('./views/Pickleball').then((m) => ({ default: m.Pickleball })))

// Daily pipeline: capture & organise → track health → review.
// "System" (Help, Settings) is intentionally NOT here — those live in the top
// bar (gear + overflow menu) so the sidebar stays focused on daily views.
const GROUP_ORDER = ['Journal', 'Health', 'Review']

const NAV: (NavItem & { show?: (g: { cycle: boolean; nofap: boolean }) => boolean })[] = [
  { id: 'today', label: 'Today', icon: Sun, group: 'Journal' },
  { id: 'monthly', label: 'Monthly', icon: CalendarDays, group: 'Journal' },
  { id: 'plan', label: 'Plan', icon: Repeat, group: 'Journal' },
  { id: 'collections', label: 'Collections', icon: BookMarked, group: 'Journal' },
  { id: 'trackers', label: 'Trackers', icon: BarChart3, group: 'Health' },
  { id: 'fitness', label: 'Fitness', icon: Activity, group: 'Health' },
  { id: 'pullups', label: 'Pull-ups', icon: ArrowUpToLine, group: 'Health' },
  { id: 'pickleball', label: 'Pickleball', icon: Trophy, group: 'Health' },
  { id: 'challenges', label: 'Challenges', icon: Target, group: 'Health' },
  { id: 'focus', label: 'Focus', icon: Code2, group: 'Health' },
  { id: 'cycle', label: 'Cycle', icon: Flower2, group: 'Health', show: (g) => g.cycle },
  { id: 'nofap', label: 'Streak', icon: ShieldCheck, group: 'Health', show: (g) => g.nofap },
  { id: 'goals', label: 'Goals', icon: Target, group: 'Review' },
  { id: 'insights', label: 'Insights', icon: Sparkles, group: 'Review' },
  { id: 'stats', label: 'Stats', icon: PieChart, group: 'Review' },
  { id: 'help', label: 'Help', icon: HelpCircle, group: 'System' },
  { id: 'settings', label: 'Settings', icon: SlidersHorizontal, group: 'System' },
]

const VIEWS: Record<ViewId, React.ComponentType> = {
  today: Today, monthly: Monthly, trackers: Trackers,
  fitness: FitnessHub, gym: () => <FitnessHub initialTab="strength" />, pullups: Pullups, pickleball: Pickleball, challenges: Challenges, focus: Focus, plan: Plan, collections: Collections, goals: Goals,
  insights: Insights, stats: Stats, cycle: Cycle, nofap: NoFap, help: Help,
  settings: Settings,
}

export default function App() {
  const { data, setSettings, replaceAll } = useJournal()
  // Live mirror of `data` so once-on-mount sync handlers compare against the
  // current journal (not the stale mount snapshot) for conflict resolution.
  const dataRef = useRef(data)
  dataRef.current = data
  const syncReady = useRef(false)
  // Cloud auto-sync (opt-in): pull once on load, push (debounced) on change.
  useEffect(() => {
    const pass = localStorage.getItem('bujo:sync')
    if (!pass) { syncReady.current = true; return }
    pullCloud(pass)
      .then((remote) => { if (remote) { const next = resolveIncoming(dataRef.current, migrate(remote)); if (next) replaceAll(next) } })
      .catch(() => {})
      .finally(() => { syncReady.current = true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const pass = localStorage.getItem('bujo:sync')
    if (!pass || !syncReady.current) return
    const id = setTimeout(() => { pushCloud(pass, data).catch(() => {}) }, 4000)
    return () => clearTimeout(id)
  }, [data])
  // Supabase account sync (when configured + signed in): pull on load, push on change.
  const sbReady = useRef(false)
  const sbAuthed = useRef(false)
  useEffect(() => {
    if (!supabaseEnabled()) { sbReady.current = true; return }
    currentUser().then((u) => {
      sbAuthed.current = !!u
      if (u) return pullJournal().then((r) => { if (r) { const next = resolveIncoming(dataRef.current, migrate(r)); if (next) replaceAll(next) } }).catch(() => {})
    }).finally(() => { sbReady.current = true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const lastSync = useRef('')
  useEffect(() => {
    if (!supabaseEnabled() || !sbReady.current || !sbAuthed.current) return
    const snapshot = JSON.stringify(data)
    if (snapshot === lastSync.current) return // nothing new (e.g. just applied a remote change)
    const id = setTimeout(() => { lastSync.current = snapshot; pushJournal(data).catch(() => {}) }, 4000)
    return () => clearTimeout(id)
  }, [data])
  // Realtime: apply changes pushed from another device/session (live multi-device).
  useEffect(() => {
    if (!supabaseEnabled() || !sbAuthed.current) return
    let off = () => {}
    subscribeJournal((remote) => {
      const snap = JSON.stringify(remote)
      if (snap === lastSync.current) return // our own write echoing back
      lastSync.current = snap
      const next = resolveIncoming(dataRef.current, migrate(remote))
      if (next) replaceAll(next) // null = keep local; it re-pushes on next change
    }).then((fn) => { off = fn })
    return () => off()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps
  const urlView = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('view') : null
  const [view, setView] = useState<ViewId>((urlView && urlView in VIEWS ? urlView : 'today') as ViewId)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const gated = { cycle: data.settings.cycleTrackerEnabled, nofap: data.settings.nofapEnabled }
  const items = NAV.filter((n) => !n.show || n.show(gated))
  const Current = VIEWS[view]
  const book = data.settings.bookMode
  const zoom = data.settings.zoom ?? 1
  const mode = data.settings.storageMode
  const collapsed = !!data.settings.sidebarCollapsed

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
    <CursorProvider>
      <NavProvider navigate={setView}>
      <CommandPalette
        onNavigate={(id) => setView(id as ViewId)}
        navItems={items.map((n) => ({ id: n.id, label: n.label }))}
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
      />
      <ReminderBanner />
      <SyncIndicator />
      <AppShell
        items={items}
        groupOrder={GROUP_ORDER}
        view={view}
        collapsed={collapsed}
        autoHide={!!data.settings.sidebarAutoHide}
        onNavigate={setView}
        onToggleCollapse={() => setSettings({ sidebarCollapsed: !collapsed })}
        onCommand={() => setPaletteOpen(true)}
      >
        <div className="mx-auto max-w-[1600px]" style={{ zoom }}>
          <Suspense fallback={<p className="py-10 text-center text-muted-foreground">Loading…</p>}>
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
      </AppShell>
      </NavProvider>
    </CursorProvider>
  )
}
