import { useState, isValidElement, type ReactNode } from 'react'
import { ChevronDown, ChevronRight, ChevronUp, type LucideIcon } from 'lucide-react'
import { cat } from '../lib/colors'

/**
 * A labelled section header that folds a group of cards away. Keeps the daily-use
 * UI on top while deep-analytics groups stay collapsed until asked for. Real
 * <button> + aria-expanded, so it works from the keyboard.
 *
 * Two looks, because the app genuinely needs both:
 * - `card`  — the header is its own card surface. For heavyweight groups that
 *             sit between other cards (Gym, Recovery, Fitness).
 * - `quiet` — a bare chevron + label, no chrome. For inline grouping inside a
 *             page that is already a stack of cards (Trackers, Focus, Stats).
 *
 * `icon` takes either a Lucide component (`icon={Layers}`) or a rendered node
 * (`icon={<Heart size={18} />}`) — the three implementations this replaces had
 * settled on different conventions and both call styles are still in use.
 */
type Props = {
  title: ReactNode
  subtitle?: ReactNode
  icon?: LucideIcon | ReactNode
  color?: string
  variant?: 'card' | 'quiet'
  /** Deep-analytics groups default to collapsed. */
  defaultOpen?: boolean
  children: ReactNode
}

export function CollapsibleSection({
  title,
  subtitle,
  icon,
  color = 'overlay1',
  variant = 'card',
  defaultOpen = false,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)

  // A Lucide icon arrives as a component; a pre-rendered node arrives as an element.
  let iconNode: ReactNode = null
  if (icon) {
    if (isValidElement(icon)) iconNode = icon
    else {
      const Icon = icon as LucideIcon
      iconNode = <Icon size={18} style={{ color: cat(color) }} />
    }
  }

  if (variant === 'quiet') {
    return (
      <section className="space-y-5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="press-3d flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left hover:text-text"
        >
          <span className="text-overlay0">
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
          {iconNode}
          <span className="font-display text-base font-medium text-subtext1">{title}</span>
          {subtitle && <span className="text-xs text-overlay0">· {subtitle}</span>}
          {!open && (
            <span className="ml-auto text-[10px] uppercase tracking-wide text-overlay0">show</span>
          )}
        </button>
        {open && children}
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="press-3d group/sec flex w-full items-center gap-3 rounded-2xl border border-border bg-card/60 px-4 py-3 text-left transition-colors hover:bg-card"
      >
        {iconNode}
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

/** The chrome-less variant, as its own name so call sites read clearly. */
export function QuietSection(props: Omit<Props, 'variant'>) {
  return <CollapsibleSection {...props} variant="quiet" />
}
