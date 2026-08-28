import { useState } from 'react'
import { useJournal } from '../../store'
import {
  PROGRAMS, allDays, dayComplete as isDayComplete, dayStats, daysComplete, exerciseKey, resumeAt,
  type Program,
} from '../../lib/programs'

/**
 * One program, one cursor, one set of actions — everything a view needs to
 * render a program without re-deriving where you are.
 *
 * This was the top half of `ProgramTracker`, and it moved because the Program
 * view now spreads the same program across three zones (a map, a day list, a
 * session panel) instead of one card. Three siblings cannot share `useState`
 * held inside a fourth, and copying the derivations into the view is how the
 * pull-up data module went dead (see CLAUDE.md).
 */
export function useProgram(only?: string) {
  const { data, setSettings } = useJournal()
  const programs = only ? PROGRAMS.filter((p) => p.id === only) : PROGRAMS
  const [pid, setPid] = useState(programs[0].id)
  const p: Program = programs.find((x) => x.id === pid) ?? programs[0]
  const done = data.settings.programDone ?? []
  const actuals = data.settings.programActuals ?? {}

  // Open where you left off, not at week 1 day 1. Lazy initialisers, so this
  // reads stored progress once on mount and never fights you afterwards: it is
  // a starting point, not a controller. Re-deriving it on every render would
  // yank the grid out from under you the moment you ticked the last exercise of
  // the day you were looking at.
  const [week, setWeek] = useState(() => resumeAt(p, done).week)
  const [day, setDay] = useState(() => resumeAt(p, done).day)

  const curWeek = p.weeks.find((w) => w.week === week) ?? p.weeks[0]
  const cur = curWeek.days.find((x) => x.day === day) ?? curWeek.days[0]
  const key = (i: number) => exerciseKey(p.id, week, cur.day, i)

  const dayComplete = (w: number, dy: number) => isDayComplete(p, w, dy, done)
  const weekComplete = (w: number) =>
    (p.weeks.find((x) => x.week === w)?.days ?? []).every((d) => dayComplete(w, d.day))

  const days = allDays(p)
  const totalDays = days.length
  const doneCount = daysComplete(p, done)
  const stats = dayStats(p, week, cur.day)

  // Where the program itself says you are, as opposed to what you are looking
  // at. The two are the same on arrival and diverge the moment you browse.
  const resume = resumeAt(p, done)
  const browsing = resume.week !== week || resume.day !== day

  const curDone = cur.exercises.map((_, i) => done.includes(key(i)))
  const curDoneCount = curDone.filter(Boolean).length
  const allCurDone = cur.exercises.length > 0 && curDoneCount === cur.exercises.length

  /** A program's weeks are blocks when it labels them, plain weeks when it does not. */
  const unit = curWeek.label ? 'Block' : 'Week'

  function goTo(w: number, d: number) {
    setWeek(w)
    setDay(d)
  }

  function pickProgram(id: string) {
    setPid(id)
    // Same rule as mount: switching programs lands on that program's next day,
    // not on its first. Each program keeps its own place in the same store.
    const at = resumeAt(programs.find((x) => x.id === id) ?? programs[0], done)
    goTo(at.week, at.day)
  }

  function toggleEx(i: number) {
    const k = key(i)
    setSettings({ programDone: done.includes(k) ? done.filter((x) => x !== k) : [...done, k] })
  }

  function toggleAll() {
    const keys = cur.exercises.map((_, i) => key(i))
    const all = keys.every((k) => done.includes(k))
    setSettings({ programDone: all ? done.filter((k) => !keys.includes(k)) : [...new Set([...done, ...keys])] })
  }

  function setActual(i: number, val: string) {
    const next = { ...actuals }
    if (val.trim()) next[key(i)] = val
    else delete next[key(i)]
    setSettings({ programActuals: next })
  }

  return {
    p, programs, pid, pickProgram,
    week, day, curWeek, cur, unit, goTo,
    days, totalDays, doneCount, stats,
    resume, browsing,
    done, actuals, curDone, curDoneCount, allCurDone,
    dayComplete, weekComplete,
    key, toggleEx, toggleAll, setActual,
  }
}

export type ProgramState = ReturnType<typeof useProgram>
