import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import type {
  Birthday,
  CyclePoint,
  DailyMetric,
  Entry,
  Habit,
  JournalData,
  MonthlyMeta,
  Relapse,
  Settings,
  Workout,
} from './lib/types'
import { load, save, uid } from './lib/storage'
import { parseQuickCapture, parseTags } from './lib/bullets'
import { dayDiff, todayISO } from './lib/date'

// ── Reducer ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'set'; data: JournalData }
  | { type: 'patch'; fn: (d: JournalData) => JournalData }

function reducer(state: JournalData, action: Action): JournalData {
  switch (action.type) {
    case 'set':
      return action.data
    case 'patch':
      return action.fn(state)
  }
}

// ── Context shape ─────────────────────────────────────────────────────────────

interface Store {
  data: JournalData
  // entries
  addEntry: (date: string, raw: string) => void
  updateEntry: (id: string, patch: Partial<Entry>) => void
  cycleStatus: (id: string) => void
  toggleImportant: (id: string) => void
  deleteEntry: (id: string) => void
  migrateEntry: (id: string, toDate: string) => void
  // daily metrics
  setMetric: (date: string, patch: Partial<DailyMetric>) => void
  // habits
  addHabit: (h: Omit<Habit, 'id' | 'startedOn'>) => void
  removeHabit: (id: string) => void
  renameHabit: (id: string, name: string) => void
  toggleHabit: (date: string, habitId: string) => void
  // workouts
  addWorkout: (w: Omit<Workout, 'id'>) => void
  removeWorkout: (id: string) => void
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
  // settings
  setSettings: (patch: Partial<Settings>) => void
  // bulk
  replaceAll: (data: JournalData) => void
}

const Ctx = createContext<Store | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function JournalProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, load)

  // Persist on every change.
  useEffect(() => {
    save(data)
  }, [data])

  // Keep the <html data-theme> in sync.
  useEffect(() => {
    document.documentElement.dataset.theme = data.settings.theme === 'latte' ? 'latte' : 'mocha'
  }, [data.settings.theme])

  const patch = useCallback((fn: (d: JournalData) => JournalData) => dispatch({ type: 'patch', fn }), [])

  const store = useMemo<Store>(() => {
    return {
      data,

      addEntry: (date, raw) =>
        patch((d) => {
          const p = parseQuickCapture(raw)
          if (!p.text) return d
          const entry: Entry = { id: uid('e'), date, createdAt: todayISO(), ...p }
          return { ...d, entries: [...d.entries, entry] }
        }),

      updateEntry: (id, up) =>
        patch((d) => ({
          ...d,
          entries: d.entries.map((e) =>
            e.id === id ? { ...e, ...up, tags: up.text ? parseTags(up.text) : e.tags } : e,
          ),
        })),

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

      migrateEntry: (id, toDate) =>
        patch((d) => ({
          ...d,
          entries: d.entries.map((e) =>
            e.id === id ? { ...e, date: toDate, status: 'open' } : e,
          ),
        })),

      setMetric: (date, mp) =>
        patch((d) => {
          const exists = d.metrics.some((m) => m.date === date)
          const metrics = exists
            ? d.metrics.map((m) => (m.date === date ? { ...m, ...mp } : m))
            : [...d.metrics, { date, ...mp }]
          return { ...d, metrics }
        }),

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

      toggleHabit: (date, habitId) =>
        patch((d) => {
          const cur = d.habitLog[date] ?? []
          const next = cur.includes(habitId)
            ? cur.filter((x) => x !== habitId)
            : [...cur, habitId]
          return { ...d, habitLog: { ...d.habitLog, [date]: next } }
        }),

      addWorkout: (w) =>
        patch((d) => ({ ...d, workouts: [...d.workouts, { id: uid('w'), ...w }] })),

      removeWorkout: (id) =>
        patch((d) => ({ ...d, workouts: d.workouts.filter((w) => w.id !== id) })),

      setGratitude: (date, text) =>
        patch((d) => {
          const exists = d.gratitude.some((g) => g.date === date)
          const gratitude = exists
            ? d.gratitude.map((g) => (g.date === date ? { ...g, text } : g))
            : [...d.gratitude, { date, text }]
          return { ...d, gratitude }
        }),

      setMemory: (date, mpatch) =>
        patch((d) => {
          const exists = d.memories.some((m) => m.date === date)
          const memories = exists
            ? d.memories.map((m) => (m.date === date ? { ...m, ...mpatch } : m))
            : [...d.memories, { date, text: '', ...mpatch }]
          return { ...d, memories }
        }),

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
        }),

      setCycle: (date, cp) =>
        patch((d) => {
          const exists = d.cycle.some((c) => c.date === date)
          const cycle = exists
            ? d.cycle.map((c) => (c.date === date ? { ...c, ...cp } : c))
            : [...d.cycle, { date, flags: [], ...cp }]
          return { ...d, cycle }
        }),

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

      setSettings: (sp) =>
        patch((d) => ({ ...d, settings: { ...d.settings, ...sp } })),

      replaceAll: (next) => dispatch({ type: 'set', data: next }),
    }
  }, [data, patch])

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useJournal(): Store {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useJournal must be used inside <JournalProvider>')
  return ctx
}
