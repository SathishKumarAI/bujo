import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cat } from '../../lib/colors'

/**
 * A lightweight labelled section that toggles its body open/closed. Used to
 * group the secondary analytics/insight cards under the always-visible primary
 * tracker UI, keeping the page scannable (deep-analytics groups default closed).
 *
 * Keyboard-accessible: a real <button> with aria-expanded.
 */
export function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string
  subtitle?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="space-y-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left hover:text-text"
      >
        <span className="text-overlay0">{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
        <span className="font-display text-base font-medium text-subtext1">{title}</span>
        {subtitle && <span className="text-xs text-overlay0">· {subtitle}</span>}
        {!open && (
          <span className="ml-auto text-[10px] tracking-wide text-overlay0 uppercase" style={{ color: cat('overlay0') }}>
            show
          </span>
        )}
      </button>
      {open && children}
    </section>
  )
}
