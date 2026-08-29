import { CaretDown, CaretRight } from '@/components/icons'
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
  /**
   * Open unless told otherwise. This said "Deep-analytics groups default to
   * collapsed", which is the *intent* for those groups and not what the
   * default does — Trackers' "Deep analytics" passed nothing and opened five
   * cards on every visit for that reason. A group that wants to start folded
   * has to say `defaultOpen={false}` (and usually a `stickyKey` with it).
   */
  defaultOpen?: boolean
  /** Persist the open/closed choice under `section.<key>` (F6). */
  stickyKey?: string
  /**
   * Controlled mode. Pass both to drive the section from outside — Collections
   * needs it because "jump to tag" has to expand Auto-pages before it scrolls
   * there. Omit both and the section keeps its own state (sticky when
   * `stickyKey` is given), which is what nearly every call site wants.
   */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
}

export function CollapsibleSection({
  title,
  subtitle,
  icon,
  color = 'overlay1',
  variant = 'card',
  defaultOpen = true,
  stickyKey,
  open: openProp,
  onOpenChange,
  children,
}: Props) {
  // Both sides of the merge are kept: main's sticky persistence (F6) is the
  // uncontrolled behaviour, and a controlled `open` overrides it so a caller
  // driving the section from outside is never fighting storage.
  const [openFlag, setOpenFlag] = useStickyState<'1' | '0'>(
    stickyKey ? `section.${stickyKey}` : null,
    defaultOpen ? '1' : '0',
    OPEN_STATES,
  )
  const open = openProp ?? openFlag === '1'
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOpenFlag(next ? '1' : '0')
    onOpenChange?.(next)
  }

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
        {/* Heading wraps button — the WAI-ARIA accordion pattern. The title is
            styled as a section heading in both variants, so it has to *be* one:
            without this the whole group is invisible to a screen reader's
            heading list, and Reading (all three of its sections are collapsible)
            rendered zero headings inside <main>. The h2 is layout-neutral —
            preflight zeroes its margin and size, the button keeps w-full. */}
        <h2>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="press-3d flex w-full items-center gap-2 rounded-control px-1 py-1 text-left hover:text-fg-1"
        >
          <span className="caret-turn caret-turn-quarter inline-flex text-fg-2" data-open={open}>
            <AppIcon as={CaretRight} size="md" />
          </span>
          {iconNode}
          <span className="font-display text-heading font-medium text-fg-1">{title}</span>
          {subtitle && <span className="text-label text-fg-2">{subtitle}</span>}
          {!open && (
            <span className="ml-auto text-micro uppercase tracking-wide text-fg-2">show</span>
          )}
        </button>
        </h2>
        {open && <div className="collapse-in space-y-5">{children}</div>}
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-5">
      <h2>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="press-3d group/sec flex w-full items-center gap-3 rounded-card border border-line bg-card/60 px-4 py-3 text-left transition-colors hover:bg-card"
      >
        {iconNode}
        <span className="min-w-0">
          <span className="block font-display text-heading font-medium text-fg-1">{title}</span>
          {subtitle && <span className="block text-label text-fg-2">{subtitle}</span>}
        </span>
        <span className="caret-turn ml-auto inline-flex text-fg-2 transition-colors group-hover/sec:text-fg-1" data-open={open}>
          <AppIcon as={CaretDown} size="md" />
        </span>
      </button>
      </h2>
      {open && <div className="collapse-in flex flex-col gap-5">{children}</div>}
    </section>
  )
}

/** The chrome-less variant, as its own name so call sites read clearly. */
export function QuietSection(props: Omit<Props, 'variant'>) {
  return <CollapsibleSection {...props} variant="quiet" />
}
