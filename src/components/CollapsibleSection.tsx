import { CaretDown, CaretRight, CaretUp } from '@/components/icons'
import type { Icon as IconGlyph } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import { isValidElement, type ReactNode } from 'react'
import { cat } from '../lib/colors'
import { useStickyState } from '../lib/useStickyState'

const OPEN_STATES = ['1', '0'] as const

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
 * (`icon={<AppIcon as={Heart} size="md" />}`) — the three implementations this replaces had
 * settled on different conventions and both call styles are still in use.
 */
type Props = {
  title: ReactNode
  subtitle?: ReactNode
  icon?: IconGlyph | ReactNode
  color?: string
  variant?: 'card' | 'quiet'
  /** Deep-analytics groups default to collapsed. */
  defaultOpen?: boolean
  /** Remember open/closed across reloads under this key. Opt-in: a section
   *  that is deliberately closed every visit (a rarely-read appendix) should
   *  not silently start staying open. */
  stickyKey?: string
  children: ReactNode
}

export function CollapsibleSection({
  title,
  subtitle,
  icon,
  color = 'overlay1',
  variant = 'card',
  defaultOpen = false,
  stickyKey,
  children,
}: Props) {
  const [openFlag, setOpenFlag] = useStickyState<'1' | '0'>(
    stickyKey ? `section.${stickyKey}` : null,
    defaultOpen ? '1' : '0',
    OPEN_STATES,
  )
  const open = openFlag === '1'
  const setOpen = (next: boolean) => setOpenFlag(next ? '1' : '0')

  // A Lucide icon arrives as a component; a pre-rendered node arrives as an element.
  let iconNode: ReactNode = null
  if (icon) {
    if (isValidElement(icon)) iconNode = icon
    else {
      const Icon = icon as IconGlyph
      iconNode = <AppIcon as={Icon} size="md" style={{ color: cat(color) }} />
    }
  }

  if (variant === 'quiet') {
    return (
      <section className="space-y-5">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="press-3d flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left hover:text-fg-1"
        >
          <span className="text-fg-2">
            {open ? <AppIcon as={CaretDown} size="md" /> : <AppIcon as={CaretRight} size="md" />}
          </span>
          {iconNode}
          <span className="font-display text-heading font-medium text-fg-1">{title}</span>
          {subtitle && <span className="text-label text-fg-2">{subtitle}</span>}
          {!open && (
            <span className="ml-auto text-micro uppercase tracking-wide text-fg-2">show</span>
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
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="press-3d group/sec flex w-full items-center gap-3 rounded-2xl border border-line bg-card/60 px-4 py-3 text-left transition-colors hover:bg-card"
      >
        {iconNode}
        <span className="min-w-0">
          <span className="block font-display text-heading font-medium text-fg-1">{title}</span>
          {subtitle && <span className="block text-label text-fg-2">{subtitle}</span>}
        </span>
        <span className="ml-auto text-fg-2 transition-colors group-hover/sec:text-fg-1">
          {open ? <AppIcon as={CaretUp} size="md" /> : <AppIcon as={CaretDown} size="md" />}
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
