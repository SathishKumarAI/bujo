import { cn } from '../../lib/cn'

/**
 * An iOS segmented control: one track, one raised thumb on the chosen option.
 *
 * OWNS: the control's semantics (a radiogroup, arrow keys move the choice) and
 * its markup. The look is `styles/phone.css` (`.seg`).
 * DOES NOT OWN: what the options mean. Phone-only for now (COD-454); the
 * desktop keeps `ChipPick`.
 *
 * `allowNone` lets a second tap on the chosen option clear it — for an
 * optional answer that STARTS EMPTY, where "not answered" must stay reachable
 * after a mis-tap. Never for a value that arrives pre-selected: people tap the
 * highlighted option to confirm it, and that tap would erase it (measured on
 * Pickleball's Time, which logged a session with no duration).
 */
export function Seg<T extends string | number>({ label, value, onChange, options, allowNone = false, className }: {
  /** Accessible name of the group; not drawn. */
  label: string
  value: T | null
  onChange: (v: T | null) => void
  options: readonly { value: T; label: string; name?: string }[]
  allowNone?: boolean
  className?: string
}) {
  const i = options.findIndex((o) => o.value === value)
  function key(e: React.KeyboardEvent) {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const next = options[(Math.max(i, 0) + d + options.length) % options.length]
    onChange(next.value)
  }
  return (
    <div role="radiogroup" aria-label={label} className={cn('seg', className)} onKeyDown={key}>
      {options.map((o, k) => {
        const on = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.name}
            tabIndex={on || (i < 0 && k === 0) ? 0 : -1}
            onClick={() => onChange(on && allowNone ? null : o.value)}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
