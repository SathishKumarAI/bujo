import { lazy, Suspense, useState, useEffect, useRef } from 'react'
import { migrate, emptyJournal } from './lib/storage'
import { resolveIncoming } from './lib/conflict'
import { pushCloud, pullCloud } from './lib/bujocloud'
import { supabaseEnabled, currentUser, pullJournal, pushJournal, subscribeJournal, onAuthChange } from './lib/supabase'
import { useJournal } from './store'
import { Today } from './views/Today'
import { Account } from './views/Account'
import { ReminderBanner } from './components/ReminderBanner'
import { SyncIndicator } from './components/SyncIndicator'
import { ExploreBanner } from './components/ExploreBanner'
import { CommandPalette } from './components/CommandPalette'
import { Onboarding, onboarded } from './components/Onboarding'
import { Welcome } from './views/Welcome'
import { hasFolder, restoreFolder, saveToFolder, loadFromFolder } from './lib/fscloud'
import { AppShell } from './components/shell/AppShell'
import { CursorProvider } from './components/shell/cursor'
import { DeviceProvider } from './components/shell/device'
import { NavProvider } from './components/shell/nav'
import type { NavItem } from './components/shell/Sidebar'
import type { ViewId } from './components/shell/viewChrome'
import {
  Sun, CalendarDays, BarChart3, Activity, Repeat, BookMarked,
  Sparkles, Flower2, ShieldCheck, HelpCircle, SlidersHorizontal, PieChart, Target, Code2,
  ArrowUpToLine, Trophy, Dumbbell, Flag, BookOpen, GraduationCap, Brain,
} from 'lucide-react'

// All non-landing views are code-split so the initial bundle only ships Today +
// Account (the gate). Each view (and its recharts/feature-card weight) loads on
// first navigation behind the <Suspense> fallback below.
const Trackers = lazy(() => import('./views/Trackers').then((m) => ({ default: m.Trackers })))
const Cycle = lazy(() => import('./views/Cycle').then((m) => ({ default: m.Cycle })))
const Stats = lazy(() => import('./views/Stats').then((m) => ({ default: m.Stats })))
const Pullups = lazy(() => import('./views/Pullups').then((m) => ({ default: m.Pullups })))
const Pickleball = lazy(() => import('./views/Pickleball').then((m) => ({ default: m.Pickleball })))
const Monthly = lazy(() => import('./views/Monthly').then((m) => ({ default: m.Monthly })))
const FitnessHub = lazy(() => import('./views/FitnessHub').then((m) => ({ default: m.FitnessHub })))
const HomeWorkout = lazy(() => import('./views/HomeWorkout').then((m) => ({ default: m.HomeWorkout })))
const Challenges = lazy(() => import('./views/Challenges').then((m) => ({ default: m.Challenges })))
const Focus = lazy(() => import('./views/Focus').then((m) => ({ default: m.Focus })))
const Collections = lazy(() => import('./views/Collections').then((m) => ({ default: m.Collections })))
const Reading = lazy(() => import('./views/Reading').then((m) => ({ default: m.Reading })))
const Coaching = lazy(() => import('./views/Coaching').then((m) => ({ default: m.Coaching })))
const Mindset = lazy(() => import('./views/Mindset').then((m) => ({ default: m.Mindset })))
const Plan = lazy(() => import('./views/Plan').then((m) => ({ default: m.Plan })))
const Goals = lazy(() => import('./views/Goals').then((m) => ({ default: m.Goals })))
const Insights = lazy(() => import('./views/Insights').then((m) => ({ default: m.Insights })))
const NoFap = lazy(() => import('./views/NoFap').then((m) => ({ default: m.NoFap })))
const Help = lazy(() => import('./views/Help').then((m) => ({ default: m.Help })))
const Settings = lazy(() => import('./views/Settings').then((m) => ({ default: m.Settings })))

// Daily pipeline: capture & organise → track health → review.
// "System" (Help, Settings) is intentionally NOT here — those live in the top
// bar (gear + overflow menu) so the sidebar stays focused on daily views.
// Smaller, job-to-be-done groups so no single section gets unwieldy (Health used
// to hold 10 items). Order flows: capture → body → skill → discipline → mind →
// reference → analysis. System (Help/Settings) lives in the top bar, not the rail.
const GROUP_ORDER = ['Journal', 'Fitness', 'Sports', 'Habits', 'Wellbeing', 'Library', 'Review']

const NAV: (NavItem & { show?: (g: { cycle: boolean; nofap: boolean }) => boolean })[] = [
  { id: 'today', label: 'Today', icon: Sun, group: 'Journal' },
  { id: 'plan', label: 'Plan', icon: Repeat, group: 'Journal' },
  { id: 'fitness', label: 'Fitness', icon: Activity, group: 'Fitness' },
  { id: 'pullups', label: 'Pull-ups', icon: ArrowUpToLine, group: 'Fitness' },
  { id: 'homeworkout', label: 'Home Workout', icon: Dumbbell, group: 'Fitness' },
  { id: 'pickleball', label: 'Pickleball', icon: Trophy, group: 'Sports' },
  { id: 'coaching', label: 'Coaching', icon: GraduationCap, group: 'Sports' },
  { id: 'trackers', label: 'Trackers', icon: BarChart3, group: 'Habits' },
  { id: 'challenges', label: 'Challenges', icon: Target, group: 'Habits' },
  { id: 'focus', label: 'Focus', icon: Code2, group: 'Habits' },
  { id: 'mindset', label: 'Mindset', icon: Brain, group: 'Wellbeing' },
  { id: 'cycle', label: 'Cycle', icon: Flower2, group: 'Wellbeing', show: (g) => g.cycle },
  { id: 'nofap', label: 'Recovery', icon: ShieldCheck, group: 'Wellbeing', show: (g) => g.nofap },
  { id: 'collections', label: 'Collections', icon: BookMarked, group: 'Library' },
  { id: 'reading', label: 'Reading', icon: BookOpen, group: 'Library' },
  { id: 'monthly', label: 'Monthly', icon: CalendarDays, group: 'Library' },
  { id: 'goals', label: 'Goals', icon: Flag, group: 'Library' },
  { id: 'insights', label: 'Insights', icon: Sparkles, group: 'Review' },
  { id: 'stats', label: 'Stats', icon: PieChart, group: 'Review' },
  { id: 'help', label: 'Help', icon: HelpCircle, group: 'System' },
  { id: 'settings', label: 'Settings', icon: SlidersHorizontal, group: 'System' },
]

const VIEWS: Record<ViewId, React.ComponentType> = {
  today: Today, monthly: Monthly, trackers: Trackers,
  fitness: FitnessHub, gym: () => <FitnessHub initialTab="strength" />, pullups: Pullups, pickleball: Pickleball, homeworkout: HomeWorkout, challenges: Challenges, focus: Focus, plan: Plan, collections: Collections, reading: Reading, goals: Goals,
  insights: Insights, stats: Stats, cycle: Cycle, nofap: NoFap, coaching: Coaching, mindset: Mindset, account: Account, help: Help,
  settings: Settings,
}

export default function App() {
  const { data, setSettings, replaceAll } = useJournal()
  // Live mirror of `data` so once-on-mount sync handlers compare against the
  // current journal (not the stale mount snapshot) for conflict resolution.
  const dataRef = useRef(data)
  useEffect(() => { dataRef.current = data }, [data])
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
  const cloudLastSync = useRef('')
  useEffect(() => {
    const pass = localStorage.getItem('bujo:sync')
    if (!pass || !syncReady.current) return
    const snapshot = JSON.stringify(data)
    if (snapshot === cloudLastSync.current) return // echo-guard: we just applied a remote change
    const id = setTimeout(async () => {
      try {
        // Guard against clobbering a newer remote (two devices, same passphrase):
        // pull first; if the remote copy is newer, ADOPT it instead of overwriting.
        const remote = await pullCloud(pass)
        if (remote) {
          const rm = migrate(remote)
          if (rm.updatedAt && (!dataRef.current.updatedAt || rm.updatedAt > dataRef.current.updatedAt)) {
            cloudLastSync.current = JSON.stringify(rm)
            replaceAll(rm)
            return // adopted remote; do NOT push over it
          }
        }
        // Local is newer (or nothing remote) → safe to push.
        cloudLastSync.current = JSON.stringify(dataRef.current)
        await pushCloud(pass, dataRef.current)
      } catch { /* offline — try again on the next change */ }
    }, 4000)
    return () => clearTimeout(id)
  }, [data])
  // Supabase account sync (when configured + signed in): pull on load, push on change.
  const sbReady = useRef(false)
  const sbAuthed = useRef(false)
  // Mirror auth in state so the realtime effect re-subscribes once auth resolves.
  // The ref alone is false at mount, so a []-dep effect never activated until reload.
  const [sbAuthedState, setSbAuthedState] = useState(false)
  useEffect(() => {
    if (!supabaseEnabled()) { sbReady.current = true; return }
    currentUser().then((u) => {
      sbAuthed.current = !!u
      setSbAuthedState(!!u)
      if (!u) return
      // Leaving explore: a real (non-anonymous) account just took over the
      // sample-data session → adopt their cloud journal (or start clean) and
      // drop the demo, rather than merging sample data into the new account.
      const leavingExplore = !u.is_anonymous && dataRef.current.settings.explore
      return pullJournal().then((r) => {
        if (r) {
          const next = leavingExplore ? migrate(r) : resolveIncoming(dataRef.current, migrate(r))
          if (next) replaceAll(next)
        } else if (leavingExplore) {
          replaceAll(emptyJournal())
        }
        if (leavingExplore) setSettings({ explore: false })
      }).catch(() => {})
    }).finally(() => { sbReady.current = true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const lastSync = useRef('')
  useEffect(() => {
    if (!supabaseEnabled() || !sbReady.current || !sbAuthed.current) return
    const snapshot = JSON.stringify(data)
    if (snapshot === lastSync.current) return // nothing new (e.g. just applied a remote change)
    const id = setTimeout(async () => {
      try {
        // Pull-first guard (two devices, one account): adopt+merge a newer remote
        // instead of clobbering it, mirroring the blob/folder paths.
        const remote = await pullJournal()
        if (remote) {
          const rm = migrate(remote)
          if (rm.updatedAt && (!dataRef.current.updatedAt || rm.updatedAt > dataRef.current.updatedAt)) {
            const merged = resolveIncoming(dataRef.current, rm)
            if (merged) { lastSync.current = JSON.stringify(merged); replaceAll(merged) }
            else lastSync.current = JSON.stringify(rm)
            return // adopted remote; do NOT push over it
          }
        }
        lastSync.current = JSON.stringify(dataRef.current)
        await pushJournal(dataRef.current)
      } catch { /* offline — retry on the next change */ }
    }, 4000)
    return () => clearTimeout(id)
  }, [data])
  // Realtime: apply changes pushed from another device/session (live multi-device).
  // Keyed on sbAuthedState so it (re)subscribes once auth resolves, not just at mount.
  useEffect(() => {
    if (!supabaseEnabled() || !sbAuthedState) return
    let off = () => {}
    subscribeJournal((remote) => {
      const snap = JSON.stringify(remote)
      if (snap === lastSync.current) return // our own write echoing back
      lastSync.current = snap
      const next = resolveIncoming(dataRef.current, migrate(remote))
      if (next) replaceAll(next) // null = keep local; it re-pushes on next change
    }).then((fn) => { off = fn })
    return () => off()
  }, [sbAuthedState])  // eslint-disable-line react-hooks/exhaustive-deps
  const urlView = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('view') : null
  const [view, setView] = useState<ViewId>((urlView && urlView in VIEWS ? urlView : 'today') as ViewId)
  const [paletteOpen, setPaletteOpen] = useState(false)
  // First-run tour: show once after a storage mode is chosen (skips when exploring demo).
  const [showTour, setShowTour] = useState(() => !onboarded())
  // Session presence (real account OR guest) — drives the full-screen auth gate
  // so the signed-out sign in / sign up page can't reach the rest of the app.
  const [hasSession, setHasSession] = useState(false)
  useEffect(() => onAuthChange(setHasSession), [])
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

  // Auto-save to the cloud folder (debounced) whenever data changes. Same
  // adopt-newer-remote guard as the cloud paths, so a second device syncing the
  // same folder can't be silently overwritten with an older copy.
  const folderLastSync = useRef('')
  useEffect(() => {
    if (mode !== 'folder' || !hasFolder()) return
    const snapshot = JSON.stringify(data)
    if (snapshot === folderLastSync.current) return
    const id = setTimeout(async () => {
      try {
        const remote = await loadFromFolder()
        if (remote) {
          const rm = migrate(remote)
          if (rm.updatedAt && (!dataRef.current.updatedAt || rm.updatedAt > dataRef.current.updatedAt)) {
            folderLastSync.current = JSON.stringify(rm)
            replaceAll(rm)
            return // folder copy is newer → adopt, don't overwrite
          }
        }
        folderLastSync.current = JSON.stringify(dataRef.current)
        await saveToFolder(dataRef.current)
      } catch { /* permission revoked / offline */ }
    }, 1500)
    return () => clearTimeout(id)
  }, [data, mode]) // eslint-disable-line react-hooks/exhaustive-deps

  // First run → show the login/welcome gate.
  if (!mode) return <Welcome />

  // Auth gate: on the Account page while signed out (and a backend exists), take
  // over the whole screen — no sidebar/top bar — so sign in / sign up can't
  // navigate into the rest of the app until the user is signed in.
  if (view === 'account' && supabaseEnabled() && !hasSession) {
    return (
      <DeviceProvider>
      <CursorProvider>
        <NavProvider navigate={setView}>
          <Account />
        </NavProvider>
      </CursorProvider>
      </DeviceProvider>
    )
  }

  return (
    <DeviceProvider>
    <CursorProvider>
      <NavProvider navigate={setView}>
      <CommandPalette
        onNavigate={(id) => setView(id as ViewId)}
        navItems={items.map((n) => ({ id: n.id, label: n.label }))}
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
      />
      {showTour && !data.settings.explore && <Onboarding onClose={() => setShowTour(false)} />}
      <ExploreBanner />
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
    </DeviceProvider>
  )
}
