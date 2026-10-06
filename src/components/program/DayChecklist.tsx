import { cat } from '../../lib/colors'
import { CommitField } from '../CommitField'
import { VideoLink } from '../VideoLink'
import type { ProgramState } from './useProgram'

/**
 * The selected day's exercises: tick them off, and record what you actually
 * did beside the target.
 *
 * **One line per exercise, not two.** The actual-result field used to be a
 * full-width box on its own row under every exercise, so a seven-lift push day
 * was fourteen rows and half of them were empty inputs — the page's dominant
 * visual was a stack of things nobody had filled in. It is now a short field on
 * the same line, wrapping under only when the column is too narrow to hold it.
 *
 * `onCheck` fires only when a box goes ON, and only with the exercise — what to
 * do about it is the view's business. The Program page starts the prescribed
 * rest; Pull-ups passes nothing, because its program prescribes no rest and a
 * timer counting down a number nobody wrote is worse than no timer.
 *
 * The actual-result field itself is `components/CommitField.tsx` now — it was
 * `ActualField` here, and moved out when the cycle day log and the coaching
 * roadmap needed the same blur-commit promise. Its reasoning (why not per
 * keystroke, why the unmount flush, why `key=` is load-bearing) lives there.
 */
export function DayChecklist({ s, onCheck }: { s: ProgramState; onCheck?: (name: string, qty: string) => void }) {
  return (
    <ul className="space-y-0.5">
      {s.cur.exercises.map((e, i) => {
        const checked = s.curDone[i]
        const k = s.key(i)
        return (
          <li
            key={k}
            className={`border-t border-line py-1.5 transition-colors ${checked ? '-ml-2 rounded-r bg-green/5 pl-2' : ''}`}
            style={checked ? { boxShadow: `inset 2px 0 0 ${cat('green')}` } : undefined}
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body">
              {/*
                `basis-full` below `sm`, auto above. Left to plain wrapping the
                name is just another flex item competing with three fixed-width
                ones, and in a 324px phone column it lost — "Pec deck / decline
                cable flys" rendered four words deep in a 60px gutter and the
                seven-lift list came to 620px. Its own line on a phone, the same
                line from `sm` up.
              */}
              <span className="flex min-w-0 basis-full items-center gap-2 sm:min-w-[14rem] sm:flex-1 sm:basis-auto">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    s.toggleEx(i)
                    if (!checked) onCheck?.(e.name, e.qty)
                  }}
                  className="accent-green"
                  aria-label={`Did ${e.name}`}
                />
                <span className={`min-w-0 flex-1 ${checked ? 'text-fg-2 line-through' : 'text-fg-1'}`}>{e.name}</span>
                <VideoLink name={e.name} label="" size="sm" quiet />
              </span>
              <span className="num shrink-0 text-label text-fg-2">{e.qty}</span>
              <span className="num w-7 shrink-0 text-right text-label text-fg-2">×{e.sets}</span>
              <CommitField
                key={k}
                value={s.actuals[k] ?? ''}
                onCommit={(v) => s.setActual(i, v)}
                label={`Actual for ${e.name} (target: ${e.qty} ×${e.sets})`}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
