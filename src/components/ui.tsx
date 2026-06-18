import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, Info, Maximize2, X } from 'lucide-react'
import { cat } from '../lib/colors'
import { cn } from '../lib/cn'
import { Button as SButton } from './ui/button'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover'

// ── Small Tailwind-styled primitives (Catppuccin tokens) ─────────────────────

/**
 * CARD — the single source of truth for card chrome across the whole app.
 * Every <Card> (and <ChartCard>) reads its classes from here, so changing a
 * card's look or the enlarge-modal sizing in ONE place restyles every card
 * everywhere. Tweak these tokens instead of editing individual views.
 */
// eslint-disable-next-line react-refresh/only-export-components -- shared design tokens co-located with Card by design
export const CARD = {
  /** The card container (border, radius, background, padding, 3-D press, hover group). */
  container: 'card-3d group/card min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6',
  /** Enlarge-modal backdrop + panel (with entrance motion). */
  modalBackdrop: 'modal-backdrop-in fixed inset-0 z-50 grid place-items-center bg-crust/70 p-4 backdrop-blur-sm',
  modalPanel: 'modal-panel-in relative max-h-[92vh] w-full max-w-6xl overflow-auto rounded-2xl border border-border bg-card p-6 shadow-2xl',
  /** Force chart plot areas (role="img") tall in the enlarge modal. */
  modalChartHeight: '[&_[role=img]]:!h-[64vh]',
} as const

export function Card({
  title,
  subtitle,
  right,
  children,
  className = '',
  onClick,
  collapsible = false,
  defaultCollapsed = false,
  defer = false,
  enlargeable = false,
  help,
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
  /** On phones, sink this card to the bottom of its column (charts below content). */
  defer?: boolean
  /** Show a ⛶ button that opens the card content in a large modal. */
  enlargeable?: boolean
  /** Explainer shown in the header ⓘ popover. Falls back to `subtitle`. */
  help?: ReactNode
}) {
  const [open, setOpen] = useState(!defaultCollapsed)
  const [large, setLarge] = useState(false)
  // Enlarge affordance: any titled, non-clickable card (charts, calendars…).
  const showEnlarge = enlargeable && !!title && !onClick
  // Every titled card gets an always-visible ⓘ that explains what it is
  // (self-documenting UI). Uses `help` if given, else the subtitle text.
  const info = help ?? subtitle
  return (
    <section
      onClick={onClick}
      className={`${CARD.container} ${defer ? 'order-last xl:order-none' : ''} ${className}`}
    >
      {(title || right || collapsible) && (
        <header className={`flex items-start justify-between gap-3 ${collapsible && !open ? '' : 'mb-4'}`}>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {title && <h2 className="min-w-0 truncate font-display text-lg leading-tight font-medium text-text sm:text-xl">{title}</h2>}
              {title && info && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" onClick={(e) => e.stopPropagation()} aria-label="What is this?" title="What is this?" className="shrink-0 text-overlay0 hover:text-text">
                      <Info size={14} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="max-w-xs text-sm leading-snug text-subtext1" onClick={(e) => e.stopPropagation()}>{info}</PopoverContent>
                </Popover>
              )}
            </div>
            {subtitle && <p className="mt-1 hidden text-sm leading-snug text-subtext0 sm:block">{subtitle}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {right}
            {showEnlarge && (
              <button onClick={(e) => { e.stopPropagation(); setLarge(true) }} aria-label="Enlarge" title="Enlarge"
                className="text-overlay0 opacity-70 transition-all duration-200 hover:scale-110 hover:text-mauve group-hover/card:opacity-100">
                <Maximize2 size={15} />
              </button>
            )}
            {collapsible && (
              <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? 'Collapse' : 'Expand'} className="text-overlay0 hover:text-text">
                {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            )}
          </div>
        </header>
      )}
      {(!collapsible || open) && children}
      {large && (
        <div className={CARD.modalBackdrop} onClick={() => setLarge(false)} role="dialog" aria-modal="true">
          <div className={CARD.modalPanel} onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                {title && <h2 className="truncate font-display text-xl font-medium text-text">{title}</h2>}
                {subtitle && <p className="mt-0.5 text-sm text-subtext0">{subtitle}</p>}
              </div>
              <button onClick={() => setLarge(false)} aria-label="Close" className="shrink-0 text-overlay1 hover:text-text"><X size={20} /></button>
            </div>
            {/* Charts mark their plot area with role="img"; CARD.modalChartHeight
                forces it tall so the chart genuinely enlarges, not just widens. */}
            <div className={`text-base ${CARD.modalChartHeight}`}>{children}</div>
          </div>
        </div>
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
        'rounded-xl border border-surface0 bg-base text-center',
        compact ? 'py-1.5' : 'py-3',
        onClick && 'press-3d cursor-pointer transition-colors hover:border-surface2',
        className,
      )}
    >
      <div
        className={cn('flex items-center justify-center gap-1 font-bold', compact ? 'text-lg' : 'text-xl sm:text-2xl')}
        style={{ color: cat(color) }}
      >
        {icon}
        {value}
      </div>
      <div className={cn('text-overlay0', compact ? 'text-[10px]' : 'mt-0.5 text-xs')}>{label}</div>
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
      <div className={`${height} w-full`} role="img" aria-label={label}>
        {children}
      </div>
    </Card>
  )
}

export function Button({
  children,
  onClick,
  variant = 'ghost',
  type = 'button',
  className = '',
  title,
  'aria-label': ariaLabel,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger'
  type?: 'button' | 'submit'
  className?: string
  title?: string
  'aria-label'?: string
}) {
  const v = variant === 'primary' ? 'default' : variant === 'danger' ? 'ghost' : 'secondary'
  return (
    <SButton
      type={type}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      variant={v}
      className={cn('press-3d rounded-lg', variant === 'danger' && 'text-red hover:text-red', className)}
    >
      {children}
    </SButton>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-text placeholder:text-overlay0 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none ${props.className ?? ''}`}
    />
  )
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-text placeholder:text-overlay0 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none ${props.className ?? ''}`}
    />
  )
}

/** A 0–10 slider with a colored value chip. */
export function Slider({
  label,
  value,
  onChange,
  color = 'mauve',
  hint,
}: {
  label: string
  value: number | undefined
  onChange: (v: number) => void
  color?: string
  hint?: string
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-subtext1">{label}</span>
        <span className="rounded px-1.5 font-mono" style={{ color: cat(color) }}>
          {value ?? '–'}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: cat(color) }}
      />
      {hint && <p className="mt-0.5 text-xs text-overlay0">{hint}</p>}
    </label>
  )
}

export function Pill({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs text-subtext1"
      style={{ background: color ? cat(color) + '33' : cat('surface1') }}
    >
      {children}
    </span>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-overlay0">{children}</p>
}

/** Segmented control for mutually-exclusive choices (theme, units, …). */
export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode }[]
}) {
  return (
    <div className="inline-flex rounded-lg bg-secondary p-0.5">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition-colors ${
              active ? 'bg-primary text-primary-foreground' : 'text-subtext1 hover:text-text'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
