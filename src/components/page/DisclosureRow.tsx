import { useId, useState, type ReactNode } from 'react'

/**
 * The one disclosure a page is allowed, for fields filled less than half the
 * time. It lives at the bottom of the form and never above the fold.
 *
 * One per page, deliberately. Two disclosures means the page is doing two jobs
 * and should be two pages — and a page that hides things in several places
 * teaches people that anything might be hidden anywhere, which is worse than
 * showing everything.
 *
 * Distinct from `CollapsibleSection`, which folds a whole titled *region* with
 * a subtitle and card chrome. This is a single quiet row: no card, no
 * subtitle, no heading level. Folding an optional field behind a section
 * header would give three optional inputs the same visual weight as the log
 * form itself.
 */
export function DisclosureRow({ label = 'More', children }: { label?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <div className="border-t border-line pt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="flex w-full items-center gap-1.5 py-1 text-left text-label text-fg-2 transition-colors hover:text-fg-1"
      >
        {/* The ▸ text glyph, not an icon component — deliberately, per the
            rule in `Icon`: the bullet-glyph column is a typographic mark in
            the mono face and is what makes this a bullet journal. */}
        <span className="caret-turn caret-turn-quarter inline-block text-micro" data-open={open}>▸</span>
        {label}
      </button>
      {open && (
        <div id={id} className="collapse-in space-y-3 pt-2">
          {children}
        </div>
      )}
    </div>
  )
}
