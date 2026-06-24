import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

/**
 * A labelled, keyboard-accessible section header that toggles the visibility of
 * its grouped cards. Used to keep the daily-use UI on top while the many
 * secondary analytics cards fold away. Real <button> + aria-expanded; deep
 * groups default collapsed.
 */
export function CollapsibleSection({
  title,
  subtitle,
  icon,
  defaultOpen = false,
  children,
}: {
  title: ReactNode
  subtitle?: ReactNode
  icon?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-3 text-left transition-colors hover:border-surface2"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-display text-lg font-medium text-text">{icon}{title}</div>
          {subtitle && <p className="mt-0.5 text-sm leading-snug text-subtext0">{subtitle}</p>}
        </div>
        <span className="shrink-0 text-overlay0">{open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</span>
      </button>
      {open && <div className="mt-4 space-y-4">{children}</div>}
    </section>
  )
}
