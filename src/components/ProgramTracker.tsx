import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useJournal } from '../store'
import { cat } from '../lib/colors'
import { PROGRAMS } from '../lib/programs'
import { Button, Card, Segmented } from './ui'

/**
 * Follow a built-in multi-week training program (encoded in `lib/programs.ts`):
 * pick a week/block + day, check off exercises (partial OK), log actuals, and
 * load the day's lifts into a session. Progress persists in `settings.programDone`
 * / `programActuals`, so the tracker can appear in more than one view.
 *
 * `only` restricts it to a single program id (hides the program picker) — used to
 * keep the pull-up program in the Pull-ups view and hypertrophy in the Gym.
 */
export function ProgramTracker({ onLoad, only }: { onLoad?: (exercises: string[]) => void; only?: string }) {
  const { data, setSettings } = useJournal()
  const programs = only ? PROGRAMS.filter((p) => p.id === only) : PROGRAMS
  const [pid, setPid] = useState(programs[0].id)
  const p = programs.find((x) => x.id === pid) ?? programs[0]
  const [week, setWeek] = useState(p.weeks[0].week)
  const [day, setDay] = useState(p.weeks[0].days[0].day)
  const done = data.settings.programDone ?? []
  const actuals = data.settings.programActuals ?? {}
  const exKey = (w: number, dy: number, i: number) => `${p.id}-w${w}d${dy}-e${i}`
  function setActual(i: number, val: string) {
    const k = exKey(week, day, i)
    const next = { ...actuals }
    if (val.trim()) next[k] = val; else delete next[k]
    setSettings({ programActuals: next })
  }
  const curWeek = p.weeks.find((w) => w.week === week) ?? p.weeks[0]
  const dayNums = curWeek.days.map((x) => x.day)
  const cur = curWeek.days.find((x) => x.day === day) ?? curWeek.days[0]
  const totalDays = p.weeks.reduce((acc, w) => acc + w.days.length, 0)
  const dayComplete = (w: number, dy: number) => {
    const exs = p.weeks.find((x) => x.week === w)?.days.find((x) => x.day === dy)?.exercises ?? []
    return exs.length > 0 && exs.every((_, i) => done.includes(exKey(w, dy, i)))
  }
  const doneCount = p.weeks.reduce((acc, w) => acc + w.days.filter((x) => dayComplete(w.week, x.day)).length, 0)
  const curDoneCount = cur ? cur.exercises.filter((_, i) => done.includes(exKey(week, cur.day, i))).length : 0

  function pickProgram(id: string) {
    setPid(id)
    const first = (programs.find((x) => x.id === id) ?? programs[0]).weeks[0]
    setWeek(first.week)
    setDay(first.days[0].day)
  }
  function toggleEx(i: number) {
    const k = exKey(week, cur!.day, i)
    setSettings({ programDone: done.includes(k) ? done.filter((x) => x !== k) : [...done, k] })
  }
  function toggleAll() {
    if (!cur) return
    const keys = cur.exercises.map((_, i) => exKey(week, cur.day, i))
    const allDone = keys.every((k) => done.includes(k))
    setSettings({ programDone: allDone ? done.filter((k) => !keys.includes(k)) : [...new Set([...done, ...keys])] })
  }

  return (
    <Card
      title={p.name}
      subtitle={p.source}
      right={<span className="text-xs text-overlay0">{doneCount}/{totalDays} days done</span>}
    >
      {programs.length > 1 && (
        <div className="mb-3">
          <Segmented value={pid} onChange={pickProgram} options={programs.map((x) => ({ value: x.id, label: x.id === 'pullup-zero' ? 'Pull-up' : 'Hypertrophy' }))} />
        </div>
      )}
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-overlay0">{curWeek.label ? 'Block' : 'Week'}</span>
        {p.weeks.map((w) => (
          <button key={w.week} onClick={() => { setWeek(w.week); setDay(w.days[0].day) }} title={w.label} className="grid h-7 min-w-7 place-items-center rounded px-2 text-xs" style={{ background: week === w.week ? cat('mauve') : cat('surface0'), color: week === w.week ? cat('crust') : cat('subtext1') }}>{w.week}</button>
        ))}
        {curWeek.label && <span className="text-xs text-subtext0">{curWeek.label}</span>}
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-overlay0">Day</span>
        {dayNums.map((dn) => (
          <button key={dn} onClick={() => setDay(dn)} className="inline-flex h-7 items-center gap-1 rounded px-2 text-xs" style={{ background: day === dn ? cat('blue') : cat('surface0'), color: day === dn ? cat('crust') : cat('subtext1') }}>
            {dayComplete(week, dn) && '✓'} {dn}
          </button>
        ))}
      </div>
      {p.note && <p className="mb-3 rounded-lg border border-surface0 bg-base px-3 py-2 text-xs text-overlay1">{p.note}</p>}

      {cur && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs tracking-wide text-overlay0 uppercase">{cur.focus}</p>
            <span className="text-xs text-overlay0">{curDoneCount}/{cur.exercises.length} done</span>
          </div>
          <ul className="space-y-0.5">
            {cur.exercises.map((e, i) => {
              const checked = done.includes(exKey(week, day, i))
              const actual = actuals[exKey(week, day, i)] ?? ''
              return (
                <li key={i} className="border-t border-surface0 py-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={checked} onChange={() => toggleEx(i)} className="accent-mauve" aria-label={`Did ${e.name}`} />
                    <span className={`flex-1 ${checked ? 'text-overlay1 line-through' : 'text-subtext1'}`}>{e.name}</span>
                    <span className="text-overlay1">{e.qty}</span>
                    <span className="w-8 text-right text-overlay1">×{e.sets}</span>
                  </div>
                  <input
                    value={actual}
                    onChange={(ev) => setActual(i, ev.target.value)}
                    placeholder={`actual (target: ${e.qty} ×${e.sets})`}
                    className="mt-1 ml-6 w-[calc(100%-1.5rem)] rounded border border-surface1 bg-base px-2 py-1 text-xs text-text placeholder:text-overlay0 focus:border-mauve focus:outline-none"
                  />
                </li>
              )
            })}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            {onLoad && <Button variant="primary" onClick={() => onLoad(cur.exercises.map((e) => e.name))} className="inline-flex items-center gap-1.5"><Plus size={14} /> Load into session</Button>}
            <Button onClick={toggleAll}>{cur.exercises.every((_, i) => done.includes(exKey(week, day, i))) ? 'Uncheck all' : 'Mark all done'}</Button>
          </div>
        </>
      )}
    </Card>
  )
}
