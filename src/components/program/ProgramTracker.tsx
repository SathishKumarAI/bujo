import { Card, Segmented } from '../ui'
import { Button } from '../ui/button'
import { DayChecklist } from './DayChecklist'
import { ProgramMap } from './ProgramMap'
import { useProgram } from './useProgram'

/**
 * A whole program in one card: pick the day off the map, tick the exercises,
 * record what you actually did. Progress lives in `settings.programDone` /
 * `programActuals`, so the same card can appear on more than one view.
 *
 * `only` pins it to a single program id and hides the picker — Pull-ups keeps
 * "Starting From Zero" this way.
 *
 * The Program view does **not** use this component. A twelve-week block is that
 * page's entire reason to exist, so it spreads the same `useProgram` state
 * across the three-zone contract instead of stacking it into one card. Both
 * read the same hook and the same two children, which is what keeps them from
 * drifting into two implementations of the same program.
 */
export function ProgramTracker({ only }: { only?: string }) {
  const s = useProgram(only)

  return (
    <Card
      title={s.p.name}
      subtitle={s.p.source}
      // "Mark all done" was the last thing after the exercise rows, so the fast
      // path was the one you found last. In the header it sits beside the count
      // it changes.
      right={
        <Button variant="ghost" onClick={s.toggleAll} className="h-auto p-0 text-label">
          {s.allCurDone ? 'Uncheck all' : 'Mark all done'}
        </Button>
      }
    >
      {s.programs.length > 1 && (
        <div className="mb-3">
          <Segmented value={s.pid} onChange={s.pickProgram} options={s.programs.map((x) => ({ value: x.id, label: x.short }))} />
        </div>
      )}

      <ProgramMap s={s} />

      {/*
        The way back. Browsing a program is normal — you check what week 4 holds
        — but before this there was no route from "looking at week 4" to "the
        day I am actually on" except remembering it.
      */}
      {s.browsing && (
        <div className="mt-3">
          <Button variant="ghost" onClick={() => s.goTo(s.resume.week, s.resume.day)} className="h-auto p-0 text-label">
            {s.doneCount === s.totalDays
              ? `Program complete · back to ${s.unit.toLowerCase()} ${s.resume.week}, day ${s.resume.day}`
              : `Continue ${s.unit.toLowerCase()} ${s.resume.week}, day ${s.resume.day}`}
          </Button>
        </div>
      )}

      {s.p.note && <p className="mt-3 rounded-card border border-line bg-ink-0 px-3 py-2 text-label text-fg-2">{s.p.note}</p>}

      <div className="mt-4 mb-2 flex items-center justify-between border-t border-line pt-3">
        <p className="text-label tracking-wide text-fg-2 uppercase">
          {s.unit} {s.week} · day {s.day} · {s.cur.focus}
        </p>
        <span className="num text-label text-fg-2">{s.curDoneCount}/{s.cur.exercises.length} done</span>
      </div>
      <DayChecklist s={s} />
    </Card>
  )
}
