import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, type LucideIcon } from 'lucide-react'
import { cat } from '../../lib/colors'

/**
 * Card-density UX helper: a labelled header button that toggles a group of
 * secondary analytics cards. Keeps the primary daily-use UI uncluttered by
 * tucking deep-analytics cards behind a single keyboard-accessible control
 * (real <button> + aria-expanded). Deep-analytics groups pass
 * defaultOpen={false} so they start collapsed.
 *
 * Purely presentational chrome — renders its children (a column of <Card>s)
 * unchanged when open, so wrapping a group changes nothing about what each
 * card renders.
 */
export function CollapsibleSection({
  title,
  subtitle,
  icon: Icon,
  color = 'overlay1',
  defaultOpen = false,
  children,
}: {
  title: string
  subtitle?: string
  icon?: LucideIcon
  color?: string
  /** Deep-analytics groups default to collapsed (false). */
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="flex flex-col gap-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="group/sec flex w-full items-center gap-3 rounded-2xl border border-border bg-card/60 px-4 py-3 text-left transition-colors hover:bg-card"
      >
        {Icon && <Icon size={18} style={{ color: cat(color) }} />}
        <span className="min-w-0">
          <span className="block font-display text-base font-medium text-text">{title}</span>
          {subtitle && <span className="block text-xs text-subtext0">{subtitle}</span>}
        </span>
        <span className="ml-auto text-overlay0 transition-colors group-hover/sec:text-text">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>
      {open && children}
    </section>
  )
}
