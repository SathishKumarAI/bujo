import { useEffect, useRef, useState } from 'react'
import { Textarea } from './ui'
import { cn } from '../lib/cn'

/**
 * A TEXT FIELD THAT WRITES TO THE JOURNAL ON BLUR, NOT PER KEYSTROKE.
 *
 * Owns: local draft state, committing it once, and not losing it when the row
 * unmounts. Does not own what the value means — the caller's `onCommit` does.
 *
 * This was `ActualField` inside `program/DayChecklist.tsx`, where it was built
 * for the "what I actually did" box beside a prescribed exercise. It moved here
 * the moment a second thing needed the same promise (a cycle day's note, a
 * coaching week's note), because the reason it exists is not about exercises:
 *
 * The store persists on every change, so writing straight through means typing
 * `3x10 @ 40kg` serialises the entire journal to `localStorage` fourteen times,
 * synchronously, on the main thread. Undo was already safe (same-label edits
 * coalesce in a 900ms window) — the cost was the writes, not the history. A
 * `note` on a cycle day is a sentence, so the same field written per keystroke
 * is worse there, not better.
 *
 * Committing on blur ALONE would lose a value typed and then abandoned by
 * closing the tab or collapsing the fold, so the cleanup flushes too: an
 * unmount that silently drops what you typed is exactly the data loss this was
 * meant to avoid. **`key=` at the call site is what makes that safe** — a
 * different row must be a different component, never a re-seeded one, or the
 * flush writes the previous row's text into this one.
 *
 * `rows` picks the element: absent is a one-line `<input>` (the exercise table's
 * narrow cell), present is the shared `Textarea` (a note worth a sentence).
 */
export function CommitField({
  value,
  onCommit,
  label,
  placeholder = 'actual',
  className,
  rows,
}: {
  value: string
  onCommit: (v: string) => void
  /** Accessible name. These fields sit in rows whose own label is elsewhere. */
  label: string
  placeholder?: string
  className?: string
  /** Given, renders a `Textarea` of this many rows instead of an `<input>`. */
  rows?: number
}) {
  const [v, setV] = useState(value)
  // What the journal holds, as far as this field knows. Compared against rather
  // than the `value` prop so the unmount flush does not re-write a value it
  // already committed on blur — a no-op write still allocates a new journal and
  // triggers another full save.
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

  const shared = {
    value: v,
    onChange: (e: { target: { value: string } }) => {
      setV(e.target.value)
      latest.current = e.target.value
    },
    onBlur: () => commit(v),
    'aria-label': label,
    placeholder,
  }

  // Enter commits a one-line field and must NOT commit a multi-line one, where
  // it is how you write a second sentence.
  return rows == null ? (
    <input
      {...shared}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className={cn(
        'w-24 shrink-0 rounded border border-line-strong bg-ink-0 px-2 py-0.5 text-label text-fg-1 placeholder:text-fg-2 focus:border-mauve focus:outline-none',
        className,
      )}
    />
  ) : (
    <Textarea {...shared} rows={rows} className={cn('text-label', className)} />
  )
}
