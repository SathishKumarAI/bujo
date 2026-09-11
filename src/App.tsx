import { lazy, Suspense, useState, useEffect, useRef, useCallback } from 'react'
import { migrate } from './lib/storage'
import { resolveIncoming, CONFLICT_PROMPT } from './lib/conflict'
import { findLegacyAccount } from './lib/legacyAccount'
import { notify } from './lib/notify'
import { useConfirm } from './components/ConfirmDialog'
import { pushCloud, pullCloud } from './lib/bujocloud'
import { useJournal } from './store'
import { Today } from './views/Today'
import { Account } from './views/Account'
import { ReminderBanner } from './components/ReminderBanner'
import { SyncIndicator } from './components/SyncIndicator'
import { ExploreBanner } from './components/ExploreBanner'
import { SkeletonView } from './components/Skeleton'
import { OfflineBanner } from './components/OfflineBanner'
import { StorageBanner } from './components/StorageBanner'
import { CommandPalette } from './components/CommandPalette'
import { Onboarding, onboarded } from './components/Onboarding'
import { Welcome } from './views/Welcome'
import { hasFolder, restoreFolder, saveToFolder, loadFromFolder } from './lib/fscloud'
import { AppShell } from './components/shell/AppShell'
import { CursorProvider, DeepLinkSync } from './components/shell/cursor'
import { readDeepLink, onRouteChange } from './lib/deepLink'
import { SECTIONS, tabsOf, type SectionGates } from './components/shell/sections'
import { setPrimaryScope } from './lib/onePrimary'
import { DeviceProvider } from './components/shell/device'
import { NavProvider } from './components/shell/nav'
import type { ViewId } from './components/shell/viewChrome'
// All non-landing views are code-split so the initial bundle only ships Today +
// Account (the gate). Each view (and its recharts/feature-card weight) loads on
// first navigation behind the <Suspense> fallback below.
const Trackers = lazy(() => import('./views/Trackers').then((m) => ({ default: m.Trackers })))
const Cycle = lazy(() => import('./views/Cycle').then((m) => ({ default: m.Cycle })))
const Stats = lazy(() => import('./views/Stats').then((m) => ({ default: m.Stats })))
const Pullups = lazy(() => import('./views/Pullups').then((m) => ({ default: m.Pullups })))
const Pickleball = lazy(() => import('./views/Pickleball').then((m) => ({ default: m.Pickleball })))
const Monthly = lazy(() => import('./views/Monthly').then((m) => ({ default: m.Monthly })))
const Fitness = lazy(() => import('./views/Fitness').then((m) => ({ default: m.Fitness })))
const Gym = lazy(() => import('./views/Gym').then((m) => ({ default: m.Gym })))
const Program = lazy(() => import('./views/Program').then((m) => ({ default: m.Program })))
const Nutrition = lazy(() => import('./views/Nutrition').then((m) => ({ default: m.Nutrition })))
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
const KitchenSink = lazy(() => import('./views/KitchenSink').then((m) => ({ default: m.KitchenSink })))
const Settings = lazy(() => import('./views/Settings').then((m) => ({ default: m.Settings })))

const VIEWS: Record<ViewId, React.ComponentType> = {
  today: Today, monthly: Monthly, trackers: Trackers,
  fitness: Fitness, nutrition: Nutrition, gym: Gym, program: Program, pullups: Pullups, pickleball: Pickleball, homeworkout: HomeWorkout, challenges: Challenges, focus: Focus, plan: Plan, collections: Collections, reading: Reading, goals: Goals,
  insights: Insights, stats: Stats, cycle: Cycle, nofap: NoFap, coaching: Coaching, mindset: Mindset, account: Account, help: Help,
  'kitchen-sink': KitchenSink,
  settings: Settings,
}

export default function App() {
  const { data, setSettings, replaceAll } = useJournal()
  // Live mirror of `data` so once-on-mount sync handlers compare against the
  // current journal (not the stale mount snapshot) for conflict resolution.
  const dataRef = useRef(data)
  useEffect(() => { dataRef.current = data }, [data])
  // Sync conflicts prompt through the app's own dialog, not window.confirm.
  // Held in a ref because the sync effects below run once on mount and would
  // otherwise capture the first render's callback forever.
  const confirm = useConfirm()
  const askConflict = useCallback(
    () => confirm({ ...CONFLICT_PROMPT, destructive: true }),
    [confirm],
  )
  const askConflictRef = useRef(askConflict)
  useEffect(() => { askConflictRef.current = askConflict }, [askConflict])
  const syncReady = useRef(false)
  // Cloud auto-sync (opt-in): pull once on load, push (debounced) on change.
  useEffect(() => {
    const pass = localStorage.getItem('bujo:sync')
    if (!pass) { syncReady.current = true; return }
    pullCloud(pass)
      .then(async (remote) => { if (remote) { const next = await resolveIncoming(dataRef.current, migrate(remote), askConflictRef.current); if (next) replaceAll(next) } })
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
            // UNION, don't clobber. A raw `replaceAll(rm)` here dropped every
            // local-only item this device had never synced (offline edits made
            // before the remote's newer write). `resolveIncoming` cannot prompt
            // on this branch — we already know the remote is strictly newer —
            // so it merges silently, matching the Supabase path below.
            const merged = await resolveIncoming(dataRef.current, rm, askConflictRef.current)
            if (merged) { cloudLastSync.current = JSON.stringify(merged); replaceAll(merged) }
            else cloudLastSync.current = JSON.stringify(rm)
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
  // One-time rescue for a journal stranded in the retired Supabase account
  // (docs/AUTH.md). Runs at most once per journal, asks before taking anything,
  // and does NOT mark itself done if the pull fails — see lib/legacyAccount.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const found = await findLegacyAccount(!!dataRef.current.settings.legacyAccountChecked)
      if (!found || cancelled) return
      const take = await confirm({
        title: `Bring your old account journal to this device?`,
        description: `bujo no longer has accounts. ${found.email} still has a journal stored server-side; this is the last chance to pull it across. Items on this device are kept either way.`,
        confirmLabel: 'Bring it across',
        cancelLabel: 'No, discard it',
      })
      if (cancelled) return
      try {
        if (take) {
          const merged = await found.adopt(dataRef.current)
          if (merged) replaceAll(merged)
          notify.success('Journal brought across', 'Your old account has been signed out.')
        } else {
          await found.dismiss()
        }
        setSettings({ legacyAccountChecked: true })
      } catch (e) {
        // Loud, and the flag stays unset so the next launch tries again.
        notify.error('Could not reach your old account', `${(e as Error).message}. We will ask again next time you open bujo.`)
      }
    })()
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const urlView = readDeepLink().view
  const [view, setView] = useState<ViewId>((urlView && urlView in VIEWS ? urlView : 'today') as ViewId)
  // Back / Forward. `writeDeepLink` pushes entries now, so this is what makes
  // them mean something; without it the button would move the URL and not the
  // app, which is why the URL used to be written with `replaceState`.
  useEffect(
    () =>
      onRouteChange((link) => {
        setView((link.view && link.view in VIEWS ? link.view : 'today') as ViewId)
      }),
    [],
  )
  const [paletteOpen, setPaletteOpen] = useState(false)
  // First-run tour: show once after a storage mode is chosen (skips when exploring demo).
  const [showTour, setShowTour] = useState(() => !onboarded())
  // Names the current screen in the dev-only one-primary-per-screen warning.
  setPrimaryScope(view)
  const gated: SectionGates = { cycle: data.settings.cycleTrackerEnabled, nofap: data.settings.nofapEnabled }
  // Every tab of every section, not the five section landings. The palette is
  // the one surface with room for all of them, and when the rail went it became
  // the only way to reach Nutrition or Goals without going via their section.
  const destinations = SECTIONS.flatMap((s) => tabsOf(s.id, gated).map((t) => ({ id: t.view as string, label: t.label })))
  const Current = VIEWS[view]
  const book = data.settings.bookMode
  const zoom = data.settings.zoom ?? 1
  const mode = data.settings.storageMode

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
            // UNION, don't clobber — same fix as the blob path above. Adopting
            // the folder copy raw discarded unsynced local items with no prompt.
            const merged = await resolveIncoming(dataRef.current, rm, askConflictRef.current)
            if (merged) { folderLastSync.current = JSON.stringify(merged); replaceAll(merged) }
            else folderLastSync.current = JSON.stringify(rm)
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


  return (
    <DeviceProvider>
    <CursorProvider>
      <NavProvider navigate={setView}>
      <DeepLinkSync view={view} />
      <CommandPalette
        onNavigate={(id) => setView(id as ViewId)}
        navItems={destinations}
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
      />
      {showTour && !data.settings.explore && <Onboarding onClose={() => setShowTour(false)} />}
      <StorageBanner />
      <OfflineBanner />
      <ExploreBanner />
      <ReminderBanner />
      <SyncIndicator />
      <AppShell
        gates={gated}
        view={view}
        onNavigate={setView}
        onCommand={() => setPaletteOpen(true)}
      >
        <div className="mx-auto max-w-[1600px]" style={{ zoom }}>
          <Suspense fallback={<SkeletonView />}>
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
