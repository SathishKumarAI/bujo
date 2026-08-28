import { useEffect, useRef, useState } from 'react'
import { cat } from '../../lib/colors'
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
                <VideoLink name={e.name} label="" size="sm" className="text-fg-2 hover:text-red" />
              </span>
              <span className="num shrink-0 text-label text-fg-2">{e.qty}</span>
              <span className="num w-7 shrink-0 text-right text-label text-fg-2">×{e.sets}</span>
              <ActualField
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

/**
 * The "what I actually did" field. Local while you type, committed on blur.
 *
 * It used to write straight through to the journal on every keystroke, and the
 * store persists on every change: typing `3x10 @ 40kg` serialised the entire
 * journal to `localStorage` fourteen times, synchronously, on the main thread.
 * Undo was already safe (same-label edits coalesce in a 900ms window) — the
 * cost was the writes, not the history.
 *
 * Committing on blur alone would lose a value typed and then abandoned by
 * closing the tab, so the cleanup flushes too: switching day unmounts the row,
 * and an unmount that silently drops what you typed is exactly the data loss
 * this was meant to avoid. `key={exerciseKey}` at the call site is what makes
 * that safe — a different row is a different component, never a re-seeded one.
 */
function ActualField({ value, onCommit, label }: { value: string; onCommit: (v: string) => void; label: string }) {
  const [v, setV] = useState(value)
  // What the journal holds, as far as this field knows. Compared against rather
  // than the `value` prop so the unmount flush does not re-write a value it
  // already committed on blur — a no-op `setSettings` still allocates a new
  // journal and triggers another full save.
  const saved = useRef(value)
  // Both refs are written from event handlers and effects only — never during
  // render, which `react-hooks/refs` rejects and React would be right to.
  const latest = useRef(value)
  const cb = useRef(onCommit)
  useEffect(() => {
    cb.current = onCommit
  })

  const commit = (next: string) => {
    if (next === saved.current) return
    saved.current = next
    cb.current(next)
  }

  // Flush on unmount — see the note above.
  useEffect(
    () => () => {
      if (latest.current !== saved.current) {
        saved.current = latest.current
        cb.current(latest.current)
      }
    },
    [],
  )

  return (
    <input
      value={v}
      onChange={(e) => {
        setV(e.target.value)
        latest.current = e.target.value
      }}
      onBlur={() => commit(v)}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      aria-label={label}
      placeholder="actual"
      className="w-24 shrink-0 rounded border border-line-strong bg-ink-0 px-2 py-0.5 text-label text-fg-1 placeholder:text-fg-2 focus:border-mauve focus:outline-none"
    />
  )
}
