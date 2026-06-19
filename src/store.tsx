import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  Birthday,
  Book,
  Challenge,
  CyclePoint,
  DevSession,
  DailyMetric,
  Entry,
  BodyMetric,
  Habit,
  JournalData,
  MonthlyMeta,
  Recurrence,
  Relapse,
  Routine,
  Settings,
  Weather,
  Workout,
} from './lib/types'
import { load, save, uid, emptyJournal, migrate, hasEncrypted, readEncryptedRaw, writeEncrypted, clearEncrypted } from './lib/storage'
import { encryptString, decryptString } from './lib/crypto'
import { LockScreen } from './components/LockScreen'
import { parseQuickCapture, parseTags } from './lib/bullets'
import { dayDiff, todayISO } from './lib/date'
import { generateRecurring } from './lib/recurrence'
import { generateDemoData } from './lib/demo'

// ── Reducer with undo/redo history ──────────────────────────────────────────

const HISTORY_CAP = 80
const COALESCE_MS = 900 // merge same-label edits (e.g. typing) into one undo step

interface HState {
  past: JournalData[]
  present: JournalData
  future: JournalData[]
  lastLabel?: string
  lastAt?: number
}

type Action =
  | { type: 'set'; data: JournalData } // undoable replace
  | { type: 'patch'; fn: (d: JournalData) => JournalData; label?: string; at?: number } // undoable mutate
  | { type: 'silent'; fn: (d: JournalData) => JournalData } // no history (mount-time)
  | { type: 'undo' }
  | { type: 'redo' }

function commit(state: HState, next: JournalData, label?: string, at = 0): HState {
  if (next === state.present) return state
  // Coalesce consecutive same-label edits within the window (one undo step).
  if (label && state.lastLabel === label && state.lastAt && at - state.lastAt < COALESCE_MS) {
    return { ...state, present: next, future: [], lastAt: at }
  }
  return { past: [...state.past, state.present].slice(-HISTORY_CAP), present: next, future: [], lastLabel: label, lastAt: at }
}

function reducer(state: HState, action: Action): HState {
  switch (action.type) {
    case 'set':
      return commit(state, action.data)
    case 'patch': {
      const next = action.fn(state.present)
      if (next === state.present) return state // no-op fn → don't bump updatedAt
      // Stamp genuine user edits only. 'set' (remote-apply/import) keeps the
      // incoming stamp byte-stable so the realtime echo-guard isn't tripped.
      const stamped = { ...next, updatedAt: new Date(action.at ?? Date.now()).toISOString() }
      return commit(state, stamped, action.label, action.at)
    }
    case 'silent':
      return { ...state, present: action.fn(state.present) }
    case 'undo': {
      if (!state.past.length) return state
      const prev = state.past[state.past.length - 1]
      return { past: state.past.slice(0, -1), present: prev, future: [state.present, ...state.future].slice(0, HISTORY_CAP) }
    }
    case 'redo': {
      if (!state.future.length) return state
      const next = state.future[0]
      return { past: [...state.past, state.present].slice(-HISTORY_CAP), present: next, future: state.future.slice(1) }
    }
  }
}

// ── Context shape ─────────────────────────────────────────────────────────────

interface Store {
  data: JournalData
  // entries
  addEntry: (date: string, raw: string, collection?: string) => void
  updateEntry: (id: string, patch: Partial<Entry>) => void
  cycleStatus: (id: string) => void
  toggleImportant: (id: string) => void
  deleteEntry: (id: string) => void
  /** Rename/merge a #tag across every entry (case-insensitive). */
  renameTag: (oldTag: string, newTag: string) => void
  migrateEntry: (id: string, toDate: string) => void
  dropEntry: (id: string) => void
  bulkAddEvents: (events: { date: string; summary: string }[]) => number
  // daily metrics
  setMetric: (date: string, patch: Partial<DailyMetric>) => void
  // habits
  addHabit: (h: Omit<Habit, 'id' | 'startedOn'>) => void
  removeHabit: (id: string) => void
  renameHabit: (id: string, name: string) => void
  updateHabit: (id: string, patch: Partial<Habit>) => void
  toggleHabit: (date: string, habitId: string) => void
  setHabitValue: (date: string, habitId: string, value: number) => void
  setHabitNote: (date: string, habitId: string, text: string) => void
  toggleHabitSkip: (habitId: string, day: string) => void
  // workouts
  addWorkout: (w: Omit<Workout, 'id'>) => void
  updateWorkout: (id: string, patch: Partial<Workout>) => void
  removeWorkout: (id: string) => void
  // intermittent fasting
  startFast: () => void
  endFast: () => void
  removeFast: (id: string) => void
  // routines
  addRoutine: (r: Omit<Routine, 'id'>) => void
  removeRoutine: (id: string) => void
  // body metrics
  setBodyMetric: (date: string, patch: Partial<BodyMetric>) => void
  removeBodyMetric: (date: string) => void
  // progress photos
  addProgressPhoto: (p: Omit<import('./lib/types').ProgressPhoto, 'id'>) => void
  removeProgressPhoto: (id: string) => void
  // pickleball
  addPickleball: (p: Omit<import('./lib/types').PickleballSession, 'id'>) => void
  removePickleball: (id: string) => void
  // friends / contacts
  addFriend: (f: Omit<import('./lib/types').Friend, 'id' | 'createdAt'>) => void
  updateFriend: (id: string, patch: Partial<import('./lib/types').Friend>) => void
  removeFriend: (id: string) => void
  // reading log
  addBook: (b: Omit<Book, 'id' | 'createdAt'>) => void
  updateBook: (id: string, patch: Partial<Book>) => void
  removeBook: (id: string) => void
  /** Append a dated "what I learned" reflection to a book. */
  addBookLearning: (id: string, text: string, date: string) => void
  removeBookLearning: (id: string, index: number) => void
  // read-later links
  addReadLink: (l: Omit<import('./lib/types').ReadLink, 'id' | 'createdAt'>) => void
  updateReadLink: (id: string, patch: Partial<import('./lib/types').ReadLink>) => void
  removeReadLink: (id: string) => void
  // pickleball leagues / tournaments
  addPickleEvent: (e: Omit<import('./lib/types').PickleballEvent, 'id'>) => void
  removePickleEvent: (id: string) => void
  // gratitude / memories
  setGratitude: (date: string, text: string) => void
  setMemory: (date: string, patch: Partial<{ text: string; photo?: string }>) => void
  // birthdays
  addBirthday: (b: Omit<Birthday, 'id'>) => void
  removeBirthday: (id: string) => void
  // monthly meta
  setMonthly: (ym: string, patch: Partial<MonthlyMeta>) => void
  // cycle
  setCycle: (date: string, patch: Partial<CyclePoint>) => void
  // nofap
  logRelapse: (r: Omit<Relapse, 'id'>) => void
  resistUrge: (entry?: { trigger?: string; note?: string }) => void
  removeUrge: (id: string) => void
  addTriggerPlan: (p: Omit<import('./lib/types').TriggerPlan, 'id'>) => void
  removeTriggerPlan: (id: string) => void
  // challenges
  addChallenge: (c: Omit<Challenge, 'id'>) => void
  removeChallenge: (id: string) => void
  updateChallenge: (id: string, patch: Partial<Challenge>) => void
  toggleChallengeRule: (challengeId: string, day: string, ruleIndex: number) => void
  // dev sessions
  addDevSession: (s: Omit<DevSession, 'id'>) => void
  updateDevSession: (id: string, patch: Partial<DevSession>) => void
  removeDevSession: (id: string) => void
  // recurrences
  addRecurrence: (r: Omit<Recurrence, 'id'>) => void
  updateRecurrence: (id: string, patch: Partial<Recurrence>) => void
  removeRecurrence: (id: string) => void
  // collections
  addCollection: (name: string, icon: string) => void
  removeCollection: (id: string) => void
  // stickers
  addSticker: (date: string, emoji: string) => void
  removeSticker: (date: string, emoji: string) => void
  // weather
  setWeather: (date: string, w: Weather) => void
  // settings
  setSettings: (patch: Partial<Settings>) => void
  // bulk
  replaceAll: (data: JournalData) => void
  // passcode / encryption
  setPasscode: (passcode: string | null) => void
  encrypted: boolean
  // history
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

const Ctx = createContext<Store | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function JournalProvider({ children }: { children: ReactNode }) {
  // If the journal is encrypted, start locked with an empty journal until unlock.
  const startsEncrypted = hasEncrypted()
  const [hist, dispatch] = useReducer(reducer, undefined, () => ({ past: [], present: startsEncrypted ? emptyJournal() : load(), future: [] }))
  const data = hist.present
  const [unlocked, setUnlocked] = useState(!startsEncrypted)
  const [encrypted, setEncrypted] = useState(startsEncrypted)
  const passcodeRef = useRef<string | null>(null)

  // Persist on every change — encrypted if a passcode is active, else plaintext.
  // Never write while still locked (would clobber the encrypted blob with empty).
  useEffect(() => {
    if (!unlocked) return
    const pc = passcodeRef.current
    if (pc) {
      encryptString(JSON.stringify(data), pc).then(writeEncrypted).catch((e) => console.error('bujo: encrypt failed', e))
    } else {
      save(data)
    }
  }, [data, unlocked])

  // Keep the <html data-theme> in sync. 'system' follows the OS light/dark
  // preference live (mocha ↔ latte).
  useEffect(() => {
    const theme = data.settings.theme
    if (theme !== 'system') {
      document.documentElement.dataset.theme = theme
      return
    }
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const apply = () => { document.documentElement.dataset.theme = mq.matches ? 'latte' : 'mocha' }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [data.settings.theme])

  // Optional accent override → drives every `--primary`/`bg-primary` use.
  useEffect(() => {
    const root = document.documentElement
    if (data.settings.accent) root.style.setProperty('--primary', `var(--color-${data.settings.accent})`)
    else root.style.removeProperty('--primary')
  }, [data.settings.accent, data.settings.theme])

  // Toggle realism body classes (paper texture + handwriting font).
  useEffect(() => {
    document.body.classList.toggle('paper', data.settings.paperMode)
    document.body.classList.toggle('handwriting', data.settings.handwriting)
  }, [data.settings.paperMode, data.settings.handwriting])

  // Materialise recurring tasks/events once on mount; "?demo=1" seeds sample
  // data into an empty journal (handy for sharing a live preview).
  useEffect(() => {
    const wantsDemo = typeof window !== 'undefined' && window.location.search.includes('demo')
    dispatch({
      type: 'silent',
      fn: (d) => (wantsDemo && d.entries.length === 0 ? generateDemoData() : generateRecurring(d)),
    })
  }, [])

  const patch = useCallback(
    (fn: (d: JournalData) => JournalData, label?: string) =>
      dispatch({ type: 'patch', fn, label, at: Date.now() }),
    [],
  )

  // Global undo/redo (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z or Ctrl+Y). Skip while a text
  // field is focused so the browser's native in-field undo keeps working.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z' && e.key.toLowerCase() !== 'y') return
      const el = document.activeElement as HTMLElement | null
      const editing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
      if (editing) return
      e.preventDefault()
      if (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) dispatch({ type: 'redo' })
      else dispatch({ type: 'undo' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const store = useMemo<Store>(() => {
    return {
      data,

      addEntry: (date, raw, collection) =>
        patch((d) => {
          const p = parseQuickCapture(raw)
          if (!p.text) return d
          const entry: Entry = { id: uid('e'), date, createdAt: todayISO(), collection, ...p }
          return { ...d, entries: [...d.entries, entry] }
        }),

      updateEntry: (id, up) =>
        patch((d) => ({
          ...d,
          entries: d.entries.map((e) =>
            e.id === id ? { ...e, ...up, tags: up.text ? parseTags(up.text) : e.tags } : e,
          ),
        }), `entry:${id}`),

      renameTag: (oldTag, newTag) =>
        patch((d) => {
          const from = oldTag.replace(/^#/, '').toLowerCase()
          const to = newTag.replace(/^#/, '').trim().toLowerCase()
          if (!from || !to || from === to) return d
          const re = new RegExp(`#${from}\\b`, 'gi')
          return {
            ...d,
            entries: d.entries.map((e) => {
              if (!e.tags.includes(from)) return e
              const text = e.text.replace(re, `#${to}`)
              return { ...e, text, tags: parseTags(text) }
            }),
          }
        }),

      cycleStatus: (id) =>
        patch((d) => ({
          ...d,
          entries: d.entries.map((e) => {
            if (e.id !== id || e.type !== 'task') return e
            const order = ['open', 'done', 'migrated', 'dropped'] as const
            const next = order[(order.indexOf(e.status as (typeof order)[number]) + 1) % order.length]
            return { ...e, status: next }
          }),
        })),

      toggleImportant: (id) =>
        patch((d) => ({
          ...d,
          entries: d.entries.map((e) => (e.id === id ? { ...e, important: !e.important } : e)),
        })),

      deleteEntry: (id) =>
        patch((d) => ({ ...d, entries: d.entries.filter((e) => e.id !== id) })),

      // Real BuJo migration: mark the original ">" migrated and create a fresh
      // open copy on the target date, threaded back via originId.
      migrateEntry: (id, toDate) =>
        patch((d) => {
          const orig = d.entries.find((e) => e.id === id)
          if (!orig) return d
          const copy: Entry = {
            ...orig,
            id: uid('e'),
            date: toDate,
            status: 'open',
            originId: orig.originId ?? orig.id,
            createdAt: todayISO(),
          }
          return {
            ...d,
            entries: [
              ...d.entries.map((e) => (e.id === id ? { ...e, status: 'migrated' as const } : e)),
              copy,
            ],
          }
        }),

      dropEntry: (id) =>
        patch((d) => ({
          ...d,
          entries: d.entries.map((e) => (e.id === id ? { ...e, status: 'dropped' as const } : e)),
        })),

      bulkAddEvents: (events) => {
        const existing = new Set(data.entries.map((e) => `${e.date}|${e.text}`))
        const fresh: Entry[] = events
          .filter((ev) => !existing.has(`${ev.date}|${ev.summary}`))
          .map((ev) => ({
            id: uid('e'), date: ev.date, type: 'event' as const, text: ev.summary,
            status: 'open' as const, important: false, memory: false, tags: [], createdAt: todayISO(),
          }))
        if (fresh.length) patch((d) => ({ ...d, entries: [...d.entries, ...fresh] }))
        return fresh.length
      },

      setMetric: (date, mp) =>
        patch((d) => {
          const exists = d.metrics.some((m) => m.date === date)
          const metrics = exists
            ? d.metrics.map((m) => (m.date === date ? { ...m, ...mp } : m))
            : [...d.metrics, { date, ...mp }]
          return { ...d, metrics }
        }, `metric:${date}`),

      addHabit: (h) =>
        patch((d) => ({
          ...d,
          habits: [...d.habits, { id: uid('habit'), startedOn: todayISO(), ...h }],
        })),

      removeHabit: (id) =>
        patch((d) => ({ ...d, habits: d.habits.filter((h) => h.id !== id) })),

      renameHabit: (id, name) =>
        patch((d) => ({
          ...d,
          habits: d.habits.map((h) => (h.id === id ? { ...h, name } : h)),
        })),

      updateHabit: (id, hpatch) =>
        patch((d) => ({
          ...d,
          habits: d.habits.map((h) => (h.id === id ? { ...h, ...hpatch } : h)),
        })),

      setHabitValue: (date, habitId, value) =>
        patch((d) => {
          const day = { ...(d.habitValues?.[date] ?? {}) }
          if (value <= 0) delete day[habitId]
          else day[habitId] = value
          return { ...d, habitValues: { ...(d.habitValues ?? {}), [date]: day } }
        }),

      toggleHabit: (date, habitId) =>
        patch((d) => {
          const cur = d.habitLog[date] ?? []
          const adding = !cur.includes(habitId)
          const next = adding ? [...cur, habitId] : cur.filter((x) => x !== habitId)
          // Timestamp-based input: record WHEN the habit was checked, for the
          // time-of-day check-in analysis. Cleared when un-checked. Skip "avoid"
          // habits — logging them is a slip, not a positive check-in, so it
          // shouldn't pollute the "when you check in" chart.
          const avoid = d.habits.find((h) => h.id === habitId)?.avoid
          const dayTimes = { ...(d.habitTimes?.[date] ?? {}) }
          if (adding && !avoid) dayTimes[habitId] = new Date().toISOString()
          else delete dayTimes[habitId]
          return {
            ...d,
            habitLog: { ...d.habitLog, [date]: next },
            habitTimes: { ...(d.habitTimes ?? {}), [date]: dayTimes },
          }
        }),

      setHabitNote: (date, habitId, text) =>
        patch((d) => {
          const day = { ...(d.habitNotes?.[date] ?? {}) }
          if (text.trim()) day[habitId] = text
          else delete day[habitId]
          return { ...d, habitNotes: { ...(d.habitNotes ?? {}), [date]: day } }
        }),

      toggleHabitSkip: (habitId, day) =>
        patch((d) => {
          const cur = d.habitSkips?.[habitId] ?? []
          const next = cur.includes(day) ? cur.filter((x) => x !== day) : [...cur, day]
          const skips = { ...(d.habitSkips ?? {}) }
          if (next.length === 0) delete skips[habitId]
          else skips[habitId] = next
          return { ...d, habitSkips: skips }
        }),

      addWorkout: (w) =>
        patch((d) => ({ ...d, workouts: [...d.workouts, { id: uid('w'), ...w }] })),

      updateWorkout: (id, wpatch) =>
        patch((d) => ({ ...d, workouts: d.workouts.map((w) => (w.id === id ? { ...w, ...wpatch } : w)) })),

      removeWorkout: (id) =>
        patch((d) => ({ ...d, workouts: d.workouts.filter((w) => w.id !== id) })),

      startFast: () =>
        patch((d) => ({ ...d, settings: { ...d.settings, fastActiveStart: new Date().toISOString() } })),

      endFast: () =>
        patch((d) => {
          const start = d.settings.fastActiveStart
          if (!start) return d
          const fast = { id: uid('f'), start, end: new Date().toISOString() }
          return { ...d, fasts: [...(d.fasts ?? []), fast], settings: { ...d.settings, fastActiveStart: undefined } }
        }),

      removeFast: (id) =>
        patch((d) => ({ ...d, fasts: (d.fasts ?? []).filter((f) => f.id !== id) })),

      addRoutine: (r) =>
        patch((d) => ({ ...d, routines: [...d.routines, { id: uid('rt'), ...r }] })),

      removeRoutine: (id) =>
        patch((d) => ({ ...d, routines: d.routines.filter((r) => r.id !== id) })),

      setBodyMetric: (date, bp) =>
        patch((d) => {
          const exists = d.bodyMetrics.some((b) => b.date === date)
          const bodyMetrics = exists
            ? d.bodyMetrics.map((b) => (b.date === date ? { ...b, ...bp } : b))
            : [...d.bodyMetrics, { date, measurements: {}, ...bp }]
          return { ...d, bodyMetrics }
        }, `body:${date}`),

      removeBodyMetric: (date) =>
        patch((d) => ({ ...d, bodyMetrics: d.bodyMetrics.filter((b) => b.date !== date) })),

      addProgressPhoto: (p) =>
        patch((d) => ({ ...d, progressPhotos: [...(d.progressPhotos ?? []), { id: uid('pp'), ...p }] })),

      removeProgressPhoto: (id) =>
        patch((d) => ({ ...d, progressPhotos: (d.progressPhotos ?? []).filter((p) => p.id !== id) })),

      addPickleball: (p) =>
        patch((d) => ({ ...d, pickleball: [...(d.pickleball ?? []), { id: uid('pk'), ...p }] })),

      removePickleball: (id) =>
        patch((d) => ({ ...d, pickleball: (d.pickleball ?? []).filter((p) => p.id !== id) })),

      addFriend: (f) =>
        patch((d) => ({ ...d, friends: [...(d.friends ?? []), { id: uid('fr'), createdAt: todayISO(), ...f }] })),

      updateFriend: (id, fpatch) =>
        patch((d) => ({ ...d, friends: (d.friends ?? []).map((f) => (f.id === id ? { ...f, ...fpatch } : f)) })),

      removeFriend: (id) =>
        patch((d) => ({ ...d, friends: (d.friends ?? []).filter((f) => f.id !== id) })),

      addBook: (b) =>
        patch((d) => ({ ...d, books: [...(d.books ?? []), { id: uid('bk'), createdAt: todayISO(), ...b }] })),

      updateBook: (id, bpatch) =>
        patch((d) => ({ ...d, books: (d.books ?? []).map((b) => (b.id === id ? { ...b, ...bpatch } : b)) }), `book:${id}`),

      removeBook: (id) =>
        patch((d) => ({ ...d, books: (d.books ?? []).filter((b) => b.id !== id) })),

      addBookLearning: (id, text, date) =>
        patch((d) => ({
          ...d,
          books: (d.books ?? []).map((b) =>
            b.id === id ? { ...b, learnings: [...(b.learnings ?? []), { date, text }] } : b,
          ),
        })),

      removeBookLearning: (id, index) =>
        patch((d) => ({
          ...d,
          books: (d.books ?? []).map((b) =>
            b.id === id ? { ...b, learnings: (b.learnings ?? []).filter((_, i) => i !== index) } : b,
          ),
        })),

      addReadLink: (l) =>
        patch((d) => ({ ...d, readLinks: [...(d.readLinks ?? []), { id: uid('rl'), createdAt: todayISO(), ...l }] })),

      updateReadLink: (id, lpatch) =>
        patch((d) => ({ ...d, readLinks: (d.readLinks ?? []).map((l) => (l.id === id ? { ...l, ...lpatch } : l)) })),

      removeReadLink: (id) =>
        patch((d) => ({ ...d, readLinks: (d.readLinks ?? []).filter((l) => l.id !== id) })),

      addPickleEvent: (e) =>
        patch((d) => ({ ...d, pickleballEvents: [...(d.pickleballEvents ?? []), { id: uid('pke'), ...e }] })),

      removePickleEvent: (id) =>
        patch((d) => ({ ...d, pickleballEvents: (d.pickleballEvents ?? []).filter((e) => e.id !== id) })),

      setGratitude: (date, text) =>
        patch((d) => {
          const exists = d.gratitude.some((g) => g.date === date)
          const gratitude = exists
            ? d.gratitude.map((g) => (g.date === date ? { ...g, text } : g))
            : [...d.gratitude, { date, text }]
          return { ...d, gratitude }
        }, `grat:${date}`),

      setMemory: (date, mpatch) =>
        patch((d) => {
          const exists = d.memories.some((m) => m.date === date)
          const memories = exists
            ? d.memories.map((m) => (m.date === date ? { ...m, ...mpatch } : m))
            : [...d.memories, { date, text: '', ...mpatch }]
          return { ...d, memories }
        }, `mem:${date}`),

      addBirthday: (b) =>
        patch((d) => ({ ...d, birthdays: [...d.birthdays, { id: uid('b'), ...b }] })),

      removeBirthday: (id) =>
        patch((d) => ({ ...d, birthdays: d.birthdays.filter((b) => b.id !== id) })),

      setMonthly: (ym, mp) =>
        patch((d) => {
          const exists = d.monthly.some((m) => m.ym === ym)
          const monthly = exists
            ? d.monthly.map((m) => (m.ym === ym ? { ...m, ...mp } : m))
            : [...d.monthly, { ym, location: '', goals: '', photoCaption: '', ...mp }]
          return { ...d, monthly }
        }, `month:${ym}`),

      setCycle: (date, cp) =>
        patch((d) => {
          const exists = d.cycle.some((c) => c.date === date)
          const cycle = exists
            ? d.cycle.map((c) => (c.date === date ? { ...c, ...cp } : c))
            : [...d.cycle, { date, flags: [], ...cp }]
          return { ...d, cycle }
        }, `cyc:${date}`),

      logRelapse: (r) =>
        patch((d) => {
          const relapse: Relapse = { id: uid('r'), ...r }
          // Streak length just before reset becomes a candidate for "best".
          const len = Math.max(0, dayDiff(d.nofap.startedOn, r.date))
          return {
            ...d,
            nofap: {
              startedOn: r.date,
              best: Math.max(d.nofap.best, len),
              relapses: [...d.nofap.relapses, relapse],
            },
          }
        }),

      resistUrge: (entry) =>
        patch((d) => ({
          ...d,
          nofap: {
            ...d.nofap,
            urgeLog: [...(d.nofap.urgeLog ?? []), {
              id: uid('u'), date: todayISO(), at: new Date().toISOString(),
              trigger: entry?.trigger?.trim() || undefined, note: entry?.note?.trim() || undefined,
            }],
          },
        })),

      removeUrge: (id) =>
        patch((d) => ({ ...d, nofap: { ...d.nofap, urgeLog: (d.nofap.urgeLog ?? []).filter((u) => u.id !== id) } })),

      addTriggerPlan: (p) =>
        patch((d) => ({ ...d, nofap: { ...d.nofap, plans: [...(d.nofap.plans ?? []), { id: uid('tp'), ...p }] } })),

      removeTriggerPlan: (id) =>
        patch((d) => ({ ...d, nofap: { ...d.nofap, plans: (d.nofap.plans ?? []).filter((p) => p.id !== id) } })),

      addChallenge: (c) =>
        patch((d) => ({ ...d, challenges: [...(d.challenges ?? []), { id: uid('chal'), ...c }] })),

      removeChallenge: (id) =>
        patch((d) => {
          const log = { ...(d.challengeLog ?? {}) }
          delete log[id]
          return { ...d, challenges: (d.challenges ?? []).filter((c) => c.id !== id), challengeLog: log }
        }),

      updateChallenge: (id, cpatch) =>
        patch((d) => ({
          ...d,
          challenges: (d.challenges ?? []).map((c) => (c.id === id ? { ...c, ...cpatch } : c)),
        })),

      toggleChallengeRule: (challengeId, day, ruleIndex) =>
        patch((d) => {
          const byDay = { ...(d.challengeLog?.[challengeId] ?? {}) }
          const cur = byDay[day] ?? []
          byDay[day] = cur.includes(ruleIndex) ? cur.filter((i) => i !== ruleIndex) : [...cur, ruleIndex]
          if (byDay[day].length === 0) delete byDay[day]
          return { ...d, challengeLog: { ...(d.challengeLog ?? {}), [challengeId]: byDay } }
        }),

      addDevSession: (s) =>
        patch((d) => ({ ...d, devSessions: [...(d.devSessions ?? []), { id: uid('dev'), ...s }] })),

      updateDevSession: (id, spatch) =>
        patch((d) => ({ ...d, devSessions: (d.devSessions ?? []).map((s) => (s.id === id ? { ...s, ...spatch } : s)) })),

      removeDevSession: (id) =>
        patch((d) => ({ ...d, devSessions: (d.devSessions ?? []).filter((s) => s.id !== id) })),

      addRecurrence: (r) =>
        patch((d) => generateRecurring({ ...d, recurrences: [...d.recurrences, { id: uid('rec'), ...r }] })),

      // Edit a rule and propagate text/type/important to its FUTURE open
      // instances (single source of truth across the rule and its occurrences).
      updateRecurrence: (id, rpatch) =>
        patch((d) => {
          const t = todayISO()
          return {
            ...d,
            recurrences: d.recurrences.map((r) => (r.id === id ? { ...r, ...rpatch } : r)),
            entries: d.entries.map((e) =>
              e.recurringId === id && e.status === 'open' && e.date >= t
                ? {
                    ...e,
                    ...(rpatch.text != null ? { text: rpatch.text } : {}),
                    ...(rpatch.type != null ? { type: rpatch.type } : {}),
                    ...(rpatch.important != null ? { important: rpatch.important } : {}),
                  }
                : e,
            ),
          }
        }),

      // Removing a rule also clears its not-yet-done future instances; past and
      // completed occurrences stay as history.
      removeRecurrence: (id) =>
        patch((d) => {
          const t = todayISO()
          return {
            ...d,
            recurrences: d.recurrences.filter((r) => r.id !== id),
            entries: d.entries.filter((e) => !(e.recurringId === id && e.status === 'open' && e.date >= t)),
          }
        }),

      addCollection: (name, icon) =>
        patch((d) => ({
          ...d,
          collections: [...d.collections, { id: uid('col'), name, icon, createdAt: todayISO() }],
        })),

      removeCollection: (id) =>
        patch((d) => ({
          ...d,
          collections: d.collections.filter((c) => c.id !== id),
          entries: d.entries.filter((e) => e.collection !== id),
        })),

      addSticker: (date, emoji) =>
        patch((d) => {
          const cur = d.stickers[date] ?? []
          if (cur.includes(emoji)) return d
          return { ...d, stickers: { ...d.stickers, [date]: [...cur, emoji] } }
        }),

      removeSticker: (date, emoji) =>
        patch((d) => ({
          ...d,
          stickers: { ...d.stickers, [date]: (d.stickers[date] ?? []).filter((e) => e !== emoji) },
        })),

      setWeather: (date, w) =>
        patch((d) => {
          const exists = d.metrics.some((m) => m.date === date)
          const metrics = exists
            ? d.metrics.map((m) => (m.date === date ? { ...m, weather: w } : m))
            : [...d.metrics, { date, weather: w }]
          return { ...d, metrics }
        }),

      setSettings: (sp) =>
        patch((d) => ({ ...d, settings: { ...d.settings, ...sp } }), 'settings'),

      replaceAll: (next) => dispatch({ type: 'set', data: next }),

      // Enable (passcode string) → encrypt + drop plaintext. Disable (null) →
      // write plaintext + drop the encrypted blob. Data in memory is untouched.
      setPasscode: (pc) => {
        passcodeRef.current = pc
        if (pc) {
          encryptString(JSON.stringify(data), pc).then(writeEncrypted).catch((e) => console.error('bujo: encrypt failed', e))
        } else {
          clearEncrypted()
          save(data)
        }
        setEncrypted(pc != null)
      },
      encrypted,

      undo: () => dispatch({ type: 'undo' }),
      redo: () => dispatch({ type: 'redo' }),
      canUndo: hist.past.length > 0,
      canRedo: hist.future.length > 0,
    }
  }, [data, patch, hist.past.length, hist.future.length, encrypted])

  // Decrypt + hydrate on unlock. Throws on a wrong passcode (data never wiped).
  async function unlock(pc: string) {
    const blob = readEncryptedRaw()
    if (!blob) { setUnlocked(true); return }
    const json = await decryptString(blob, pc) // throws → LockScreen shows error
    const decrypted = migrate(JSON.parse(json))
    passcodeRef.current = pc
    setEncrypted(true)
    dispatch({ type: 'silent', fn: () => decrypted })
    setUnlocked(true)
  }

  if (!unlocked) return <LockScreen onUnlock={unlock} />

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

// Hook co-located with its provider by design; splitting would ripple imports
// across every view. Fast-refresh only affects dev HMR, not runtime.
// eslint-disable-next-line react-refresh/only-export-components
export function useJournal(): Store {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useJournal must be used inside <JournalProvider>')
  return ctx
}
