import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cat } from '../../lib/colors'

/**
 * A lightweight, keyboard-accessible collapsible grouping for the many
 * secondary analytics cards on the Pickleball view. Keeps the primary
 * daily-use UI (logging + history) uncluttered while letting users expand
 * deeper insight groups on demand.
 *
 * Renders a real <button> with aria-expanded; deep-analytics groups pass
 * `defaultOpen={false}` so they start collapsed.
 */
export function Section({
  title,
  icon,
  hint,
  defaultOpen = false,
  children,
}: {
  title: ReactNode
  icon?: ReactNode
  hint?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-xl border border-line bg-card px-4 py-3 text-left transition-colors hover:border-line-strong"
      >
        <span className="text-fg-2" style={{ color: cat('overlay0') }}>
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </span>
        {icon}
        <span className="font-display text-heading font-medium text-fg-1 sm:text-heading">{title}</span>
        {hint && <span className="ml-auto hidden text-label text-fg-2 sm:block">{hint}</span>}
      </button>
      {open && <div className="mt-3 flex flex-col gap-4">{children}</div>}
    </div>
  )
}
