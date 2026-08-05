import { ArrowsOut, CaretDown, Info, X } from '@/components/icons'
import type { Icon as IconGlyph } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import { isValidElement, useState, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cat, onAccent, over, readableOn } from '../lib/colors'
import { cn } from '../lib/cn'
import { useFocusTrap } from '../lib/useFocusTrap'
import { Button as SButton } from './ui/button'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover'
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group'

// ── Small Tailwind-styled primitives (Catppuccin tokens) ─────────────────────

/**
 * CARD · the single source of truth for card chrome across the whole app.
 * Every <Card> (and <ChartCard>) reads its classes from here, so changing a
 * card's look or the enlarge-modal sizing in ONE place restyles every card
 * everywhere. Tweak these tokens instead of editing individual views.
 */
// eslint-disable-next-line react-refresh/only-export-components -- shared design tokens co-located with Card by design
export const CARD = {
  /** The card container (border, radius, background, padding, 3-D press, hover group). */
  container: 'card-3d group/card min-w-0 rounded-card border border-line bg-card p-4 sm:rounded-card sm:p-5 lg:p-6',
  /** Enlarge-modal backdrop + panel (with entrance motion). */
  modalBackdrop: 'modal-backdrop-in fixed inset-0 z-50 grid place-items-center bg-crust/70 p-4 backdrop-blur-sm',
  modalPanel: 'modal-panel-in relative max-h-[92vh] w-full max-w-6xl overflow-auto rounded-card border border-line bg-card p-6 shadow-2xl',
  /** Force chart plot areas (role="img") tall in the enlarge modal. */
  modalChartHeight: '[&_[role=img]]:!h-[64vh]',
  /**
   * The ⓘ / ⛶ / chevron in a card header. All three were bare icons — 14, 15
   * and 18px — so their hit targets were the glyphs themselves, under the
   * WCAG 2.5.8 24px floor. The icon size is unchanged; the box around it does
   * the work, and `-m-1` keeps the header height exactly where it was.
   */
  headerButton: 'grid size-6 shrink-0 -m-1 place-items-center rounded-control text-fg-2 hover:bg-ink-2 hover:text-fg-1',
} as const

/**
 * The readable text inside a ReactNode, for naming a control after it.
 *
 * Card titles are `ReactNode` because many carry an icon beside the words
 * (an icon element beside the words, e.g. a flame before "75 Hard"). A plain `typeof === 'string'` check
 * missed all of those, which left twenty ⓘ buttons — seven of them on Coaching
 * alone — still called "What is this?". Walks children, keeps strings and
 * numbers, ignores the rest.
 */
function nodeText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(nodeText).join(' ')
  if (isValidElement<{ children?: ReactNode }>(node)) return nodeText(node.props.children)
  return ''
}

export function Card({
  title,
  subtitle,
  right,
  children,
  className = '',
  onClick,
  collapsible = false,
  defaultCollapsed = false,
  open: openProp,
  onOpenChange,
  defer = false,
  enlargeable = false,
  help,
  hideInfo = false,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  right?: ReactNode
  children: ReactNode
  className?: string
  onClick?: () => void
  /** Add a header chevron that collapses the body (reusable compacting pattern). */
  collapsible?: boolean
  defaultCollapsed?: boolean
  /** Drive the fold from the parent — for cards whose header content depends on
   *  whether they are open (PenaltyCard swaps its subtitle). Pair with
   *  `onOpenChange`; omit both to let the card own the state. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** On phones, sink this card to the bottom of its column (charts below content). */
  defer?: boolean
  /** Show a ⛶ button that opens the card content in a large modal. */
  enlargeable?: boolean
  /** Explainer shown in the header ⓘ popover. Falls back to `subtitle`. */
  help?: ReactNode
  /** Suppress the ⓘ popover. Required by the page contract. */
  hideInfo?: boolean
}) {
  const [openState, setOpenState] = useState(!defaultCollapsed)
  const open = openProp ?? openState
  const toggle = () => {
    if (openProp === undefined) setOpenState((o) => !o)
    onOpenChange?.(!open)
  }
  const [large, setLarge] = useState(false)
  // The enlarge modal is hand-rolled (not Radix), so it owns its own focus
  // containment: trap Tab inside it, hand focus back to the ⛶ button on close.
  const modalTrap = useFocusTrap<HTMLDivElement>(large)
  // Enlarge affordance: any titled, non-clickable card (charts, calendars…).
  const showEnlarge = enlargeable && !!title && !onClick
  // Every titled card gets an always-visible ⓘ that explains what it is
  // (self-documenting UI). Uses `help` if given, else the subtitle text.
  //
  // `hideInfo` opts out. The page contract bans help icons outright — a label
  // that needs a "?" gets rewritten instead — and on desktop the popover is
  // redundant anyway, because it repeats the subtitle rendered right below it.
  // Scoped to an opt-out rather than removed globally: 42 cards outside the
  // Body cluster still rely on this, and retiring it app-wide is a decision
  // about the whole app, not about one cluster.
  const info = hideInfo ? null : (help ?? subtitle)
  // The whole header folds the card, not just the caret. The caret stays a real
  // <button> — it is the accessible control and carries aria-expanded — and the
  // header row is a pointer convenience layered on top, so anything interactive
  // sitting in `right` has to keep its clicks out of it. Skipped when the card
  // already owns a click (`onClick`), where two meanings for one click is worse
  // than a small target.
  const headerToggles = collapsible && !onClick
  const stopBubble = headerToggles ? (e: MouseEvent) => e.stopPropagation() : undefined
  // Name the header controls after their card. All of these used to be called
  // "What is this?" / "Collapse" / "Enlarge", so Today alone handed a screen
  // reader 34 identically-named buttons and its control list was useless for
  // navigating. Titles are ReactNode (often icon + words), hence `nodeText`.
  const titleText = nodeText(title).replace(/\s+/g, ' ').trim()
  const infoLabel = titleText ? `What is ${titleText}?` : 'What is this?'
  return (
    <section
      onClick={onClick}
      className={`${CARD.container} ${defer ? 'order-last xl:order-none' : ''} ${className}`}
    >
      {(title || right || collapsible) && (
        <header
          onClick={headerToggles ? toggle : undefined}
          className={cn(
            // `flex-wrap` + a real basis on the title column, because the right
            // cluster is `shrink-0`: with a nowrap header the title column is
            // the only thing that can give, so a wide cluster (Mood views ships
            // six controls) squeezed it to nothing and `truncate` rendered the
            // card title as the single character "M…". Below ~12rem the cluster
            // drops to its own line instead, and the title keeps its width.
            'flex flex-wrap items-start justify-between gap-x-3 gap-y-2',
            collapsible && !open ? '' : 'mb-3 sm:mb-4',
            headerToggles && 'cursor-pointer select-none',
          )}
        >
          <div className="min-w-0 grow basis-48">
            <div className="flex items-center gap-1.5">
              {/* Wraps, never truncates. A title clipped to "Workout mi…" costs
                  more than a second line does — and these are 2–4 words. */}
              {title && <h2 className="min-w-0 font-display text-heading leading-tight font-medium text-balance text-fg-1 sm:text-title">{title}</h2>}
              {title && info && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" onClick={(e) => e.stopPropagation()} aria-label={infoLabel} title={infoLabel} className={CARD.headerButton}>
                      <AppIcon as={Info} size="sm" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="max-w-xs text-body leading-snug text-fg-1" onClick={(e) => e.stopPropagation()}>{info}</PopoverContent>
                </Popover>
              )}
            </div>
            {subtitle && <p className="mt-1 hidden text-body leading-snug text-fg-2 sm:block">{subtitle}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {right && <span className="contents" onClick={stopBubble}>{right}</span>}
            {showEnlarge && (
              <button onClick={(e) => { e.stopPropagation(); setLarge(true) }}
                aria-label={titleText ? `Enlarge ${titleText}` : 'Enlarge'}
                title="Enlarge"
                className={`${CARD.headerButton} opacity-70 transition-all duration-200 hover:scale-110 hover:text-mauve group-hover/card:opacity-100`}>
                <AppIcon as={ArrowsOut} size="sm" />
              </button>
            )}
            {collapsible && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggle() }}
                aria-expanded={open}
                aria-label={titleText ? (open ? `Collapse ${titleText}` : `Expand ${titleText}`) : (open ? 'Collapse' : 'Expand')}
                className={CARD.headerButton}
              >
                <span className="caret-turn inline-flex" data-open={open}><AppIcon as={CaretDown} size="md" /></span>
              </button>
            )}
          </div>
        </header>
      )}
      {collapsible
        ? open && <div className="collapse-in">{children}</div>
        : children}
      {/* Portal to <body>: cards live inside transformed ancestors (book mode,
          zoom, page-in animation) which would otherwise make `position:fixed`
          relative to the card, not the screen · so the modal must escape them
          to truly centre on the viewport. */}
      {large && createPortal(
        <div className={CARD.modalBackdrop} onClick={() => setLarge(false)} role="dialog" aria-modal="true">
          <div ref={modalTrap} className={CARD.modalPanel} onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                {title && <h2 className="truncate font-display text-title font-medium text-fg-1">{title}</h2>}
                {subtitle && <p className="mt-0.5 text-body text-fg-2">{subtitle}</p>}
              </div>
              <button onClick={() => setLarge(false)} aria-label="Close" className="shrink-0 text-fg-2 hover:text-fg-1"><AppIcon as={X} size="lg" /></button>
            </div>
            {/* Charts mark their plot area with role="img"; CARD.modalChartHeight
                forces it tall so the chart genuinely enlarges, not just widens. */}
            <div className={`text-heading ${CARD.modalChartHeight}`}>{children}</div>
          </div>
        </div>,
        document.body,
      )}
    </section>
  )
}

/**
 * A bordered metric tile: a big colored number/value over a small label.
 * Replaces the ad-hoc `Stat` blocks scattered across Fitness/Focus/Trackers.
 * Becomes a button (with press affordance) when `onClick` is given.
 */
export function StatTile({
  label,
  value,
  color = 'text',
  icon,
  onClick,
  title,
  compact = false,
  className = '',
}: {
  label: ReactNode
  value: ReactNode
  color?: string
  icon?: ReactNode
  onClick?: () => void
  title?: string
  compact?: boolean
  className?: string
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      title={title}
      className={cn(
        'rounded-card border border-line bg-ink-0 text-center',
        compact ? 'py-1.5' : 'py-3',
        onClick && 'press-3d cursor-pointer transition-colors hover:border-line-strong',
        className,
      )}
    >
      {/* `.num` — the value is always a figure, so it gets mono tabular digits
          and stops jittering as it changes. Family only, never a size, so the
          type scale still owns how big it is. */}
      <div
        className={cn('num flex items-center justify-center gap-1 font-medium', compact ? 'text-heading' : 'text-title sm:text-title')}
        style={{ color: cat(color) }}
      >
        {icon}
        {value}
      </div>
      <div className={cn('text-fg-2', compact ? 'text-micro' : 'mt-0.5 text-label')}>{label}</div>
    </Tag>
  )
}

/**
 * A `Card` whose body is a fixed-height, screen-reader-labelled chart figure.
 * `label` is the text alternative (role="img"); pass the chart as children
 * (usually a recharts `ResponsiveContainer`).
 */
export function ChartCard({
  title,
  subtitle,
  right,
  label,
  height = 'h-56',
  className = '',
  children,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  right?: ReactNode
  label: string
  height?: string
  className?: string
  children: ReactNode
}) {
  // Enlargeable by definition: every ChartCard gets the ⛶ → large-modal
  // behaviour from one place. CARD.modalChartHeight grows the role="img" plot
  // area in the modal so the chart truly enlarges.
  return (
    <Card title={title} subtitle={subtitle} right={right} className={className} enlargeable>
      <div className={`${height} w-full fig-fixed`} role="img" aria-label={label}>
        {children}
      </div>
    </Card>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-control border border-input bg-background px-3 py-2 text-body text-fg-1 placeholder:text-fg-2 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none ${props.className ?? ''}`}
    />
  )
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-control border border-input bg-background px-3 py-2 text-body text-fg-1 placeholder:text-fg-2 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none ${props.className ?? ''}`}
    />
  )
}

/** A 0–10 slider with a colored value chip. */
/*
 * `Slider` lived here. It is gone, replaced everywhere by
 * `components/fields/SegmentScale` — a range input cannot represent "not
 * answered", and every rating field in this app is unanswered most of the
 * time. The mitigation (park unset at the midpoint, dim the track) traded a
 * wrong reading for a confusing one; eleven dots and a `—` do not have the
 * problem at all.
 */

/**
 * PILL · the small rounded label that says "this thing has a state".
 *
 * There were ~30 hand-rolled copies of this across the views, each re-deciding
 * its padding, its text size and — worse — its own wash opacity (`22` here,
 * `33` there, for the same visual intent). This is the one implementation.
 *
 * `tone` is the axis that actually varies in the app:
 *
 * - `wash`  — accent text on a 13% wash of the same accent. The dominant idiom:
 *             a state that belongs to a colour (streak, band, readiness, tag).
 * - `muted` — neutral surface, secondary text. Counts and metadata that should
 *             not compete with content ("HALT 3", "chest").
 * - `solid` — accent fill, crust text. Rare on purpose: a filled pill reads as
 *             the loudest thing on the screen, which a label almost never is.
 *
 * A pill is not a button. If it is clickable, use `Button` — the two look
 * similar and have nothing else in common.
 *
 * Note: `wash` puts accent colour on a tinted background, which is exactly the
 * pairing measured as failing AA in latte (see TASKS.md §I1). Now that every
 * pill reads its colour from here, that is a one-file fix when I1 is decided,
 * instead of thirty.
 */
export function Pill({
  children,
  color,
  tone = 'wash',
  size = 'label',
  title,
  className = '',
}: {
  children: ReactNode
  /** Catppuccin token name (`mauve`, `green`, …). Omit for the neutral pill. */
  color?: string
  tone?: 'wash' | 'muted' | 'solid'
  /** Named for the type step it sits on, so the size is never a guess. */
  size?: 'micro' | 'caption' | 'label'
  title?: string
  className?: string
}) {
  const sizes = {
    micro: 'gap-0.5 px-1.5 py-0.5 text-micro',
    caption: 'gap-1 px-2 py-0.5 text-caption',
    label: 'gap-1 px-2 py-0.5 text-label',
  } as const
  const accent = color ? cat(color) : null
  // I1, decided. The wash tone paints `accent` at 13% over the card and then
  // sets the text to the same accent — which pulls the background toward the
  // text and cost this pairing AA in every light theme. Both tones now derive
  // their text colour from the background they actually land on, rather than
  // assuming. See `readableOn` / `onAccent` in lib/colors.
  const washBg = accent ? over(accent, cat('base'), 0x22 / 255) : null
  const style =
    tone === 'solid' && accent
      ? { background: accent, color: onAccent(accent) }
      : tone === 'muted' || !accent
        ? { background: cat('surface1'), color: readableOn(cat('subtext0'), cat('surface1')) }
        : { background: accent + '22', color: readableOn(accent, washBg!, 4.6) }
  return (
    <span
      title={title}
      className={cn('inline-flex shrink-0 items-center rounded-pill', sizes[size], className)}
      style={style}
    >
      {children}
    </span>
  )
}

/**
 * EMPTY STATE · what a view says when it has nothing to show.
 *
 * A bare "nothing here" line tells the user they are stuck; an empty state with
 * a reason and a way forward tells them what to do next. `children` alone still
 * renders the old one-line form, so existing call sites are unchanged — pass
 * `icon` / `hint` / `action` to get the fuller treatment.
 */
export function Empty({
  children,
  icon: Icon,
  hint,
  action,
}: {
  children: ReactNode
  icon?: IconGlyph
  hint?: string
  action?: { label: string; onClick: () => void }
}) {
  if (!Icon && !hint && !action) {
    return <p className="py-6 text-center text-body text-fg-2">{children}</p>
  }
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      {Icon && (
        <span className="grid size-10 place-items-center rounded-pill bg-ink-2 text-fg-2">
          <AppIcon as={Icon} size="md" />
        </span>
      )}
      <p className="text-body font-medium text-fg-1">{children}</p>
      {hint && <p className="max-w-xs text-label text-fg-2">{hint}</p>}
      {action && (
        <SButton variant="secondary" size="sm" className="mt-1" onClick={action.onClick}>
          {action.label}
        </SButton>
      )}
    </div>
  )
}

/**
 * SEGMENTED · mutually-exclusive choice (theme, units, range).
 *
 * Built on Radix `ToggleGroup` rather than hand-rolled buttons, so roving
 * focus, arrow-key navigation and the radio-group semantics come from the
 * primitive instead of being approximated. The API is unchanged — ~30 call
 * sites pass `value` / `onChange` / `options` and did not move.
 *
 * Two details the primitive does not decide:
 *
 * - **Radix speaks strings.** Callers pass numbers as often as strings (week
 *   counts, font scales), so values round-trip through their string form and
 *   are mapped back to the original option on the way out. Comparing the
 *   stringified value also means `26` and `'26'` cannot silently disagree.
 * - **Deselect is refused.** A single-select ToggleGroup emits `''` when you
 *   click the active item again, which for a *choice* means "no theme" or "no
 *   range" — states this app has no representation for. That event is dropped.
 *
 * Selected takes the accent **wash**, never the fill: a filled segment reads as
 * the primary action on the screen, and it is a choice you already made. The
 * label uses `brand-text`, which is the accent tuned to stay legible on that
 * wash in all five themes.
 */
export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  tone = 'accent',
  size = 'default',
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode }[]
  /**
   * `touch` raises each segment to a 44px target (WCAG 2.5.5). Opt-in rather
   * than the default because ~30 call sites are desktop-dense surfaces where a
   * 44px row would be the tallest thing in a stat header — but any segmented
   * control that is a *primary* control on a phone should ask for it. The Today
   * surface switcher is the first.
   */
  size?: 'default' | 'touch'
  /**
   * `accent` — the wash-filled active segment, everywhere outside the Body
   * cluster. `neutral` — a plain raised fill, for the page-contract StatBar,
   * where a page is allowed one accent-filled control and spends it on the
   * primary button. A mode toggle that also fills with accent makes two.
   */
  tone?: 'accent' | 'neutral'
}) {
  const neutral = tone === 'neutral'
  return (
    <ToggleGroup
      type="single"
      // Roving focus off, deliberately. With it on, Radix gives the group a
      // single tab stop — and measured on the rendered page every item came out
      // `tabIndex: -1`, so the control could not be tabbed into at all. That is
      // a regression against the plain buttons this replaced. Each segment is
      // its own tab stop now, which is exactly how it behaved before; the cost
      // is arrow-key traversal, which nothing in the app relied on.
      rovingFocus={false}
      value={String(value)}
      onValueChange={(next) => {
        if (!next) return // clicking the active segment must not clear the choice
        const match = options.find((o) => String(o.value) === next)
        if (match) onChange(match.value)
      }}
      className="inline-flex rounded-control border border-line p-0.5"
    >
      {options.map((o) => {
        const selected = String(o.value) === String(value)
        return (
          <ToggleGroupItem
            key={String(o.value)}
            value={String(o.value)}
            // Selected colour set inline, and bound to `--brand-text` rather
            // than the `@theme` alias `--color-brand-text`.
            //
            // Two reasons, both found by measuring rather than reasoning. The
            // vendored `toggleVariants` already ships
            // `data-[state=on]:text-accent-foreground`, so a competing
            // `data-[state=on]:text-*` class of equal specificity is resolved
            // by stylesheet order, not by us. And the `@theme` alias did not
            // track the theme on this element — the raw per-theme variable
            // does, in all five.
            // The neutral tone keeps the raw-variable lesson above: it just
            // has no colour to set, so it inherits `--color-fg-1` from the
            // class list instead of overriding with the brand text colour.
            style={selected && !neutral ? { color: 'var(--brand-text)' } : undefined}
            className={cn(
              'h-auto rounded-control px-2.5 py-1 text-body text-fg-2 hover:bg-transparent hover:text-fg-1 data-[state=on]:font-medium',
              size === 'touch' && 'min-h-11 px-4',
              neutral ? 'data-[state=on]:bg-ink-3 data-[state=on]:text-fg-1' : 'data-[state=on]:bg-brand-wash',
            )}
          >
            {o.label}
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
