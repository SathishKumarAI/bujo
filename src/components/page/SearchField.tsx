import { MagnifyingGlass, X } from '@/components/icons'
import { Icon } from '@/components/Icon'

/**
 * A SEARCH BOX WHOSE ICONS ARE INSIDE IT.
 *
 * WHAT THIS FILE OWNS: the one box that holds a magnifier, a field and a clear
 * button, and the hover/focus state that covers all three.
 * WHAT IT DOES NOT OWN: what is being searched.
 *
 * ── Why it is a component and not three elements in a label ───────────────
 *
 * Reported as *"when I hover on the search, it's really not looking good"*, and
 * the screenshot showed why: the first version was an `Input` with an
 * absolutely-positioned icon and a ghost button laid over it, so
 *
 * - the **clear button rendered outside the field's rounded border**, floating
 *   past the focus ring rather than in the box;
 * - `Input`'s own `hover:bg-ink-3` painted the FIELD while the icon and the
 *   button kept the card's ground, so the hover was a lighter rectangle with
 *   two pieces of furniture sitting on top of it;
 * - and the focus ring was drawn on the input, which is 8px narrower than the
 *   thing that looks like the control.
 *
 * The fix is structural: **the wrapper is the control.** It carries the border,
 * the ground, the hover and `focus-within` ring; the `<input>` inside is
 * transparent and borderless. One surface, one hover, and the icons are in the
 * box by construction rather than by arithmetic.
 *
 * `focus-within`, not `focus`: the ring has to appear when the FIELD takes
 * focus, and the clear button is a sibling inside the same box — so a ring on
 * the input alone would vanish the moment you tabbed to Clear.
 */
export function SearchField({ value, onChange, placeholder, label, className = '' }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  /** The accessible name — the visible one is the placeholder. */
  label: string
  className?: string
}) {
  return (
    <div
      className={`search-field flex items-center gap-2 rounded-control border border-ctl-ring bg-ink-2 px-2.5 transition-colors hover:bg-ink-3 focus-within:border-ring focus-within:bg-ink-2 focus-within:ring-1 focus-within:ring-ring ${className}`}
    >
      <Icon as={MagnifyingGlass} size="sm" className="shrink-0 text-fg-2" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="min-w-0 flex-1 bg-transparent py-2 text-body text-fg-1 placeholder:text-fg-2 focus:outline-none"
      />
      {/* Inside the box, and gone when there is nothing to clear — a disabled
          clear teaches people the control does not work (`ShowMore`'s rule). */}
      {value.trim().length > 0 && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={`Clear ${label.toLowerCase()}`}
          title="Clear"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-control text-fg-2 transition-colors hover:bg-ink-2 hover:text-fg-1"
        >
          <Icon as={X} size="sm" />
        </button>
      )}
    </div>
  )
}
