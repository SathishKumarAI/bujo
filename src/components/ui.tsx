import type { ReactNode } from 'react'
import { cat } from '../lib/colors'
import { cn } from '../lib/cn'
import { Button as SButton } from './ui/button'

// ── Small Tailwind-styled primitives (Catppuccin tokens) ─────────────────────

export function Card({
  title,
  subtitle,
  right,
  children,
  className = '',
  onClick,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  right?: ReactNode
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <section
      onClick={onClick}
      className={`card-3d rounded-2xl border border-border bg-card p-5 sm:p-6 ${className}`}
    >
      {(title || right) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="font-display text-lg leading-tight font-medium text-text sm:text-xl">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm leading-snug text-subtext0">{subtitle}</p>}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </header>
      )}
      {children}
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
  return (
    <Card title={title} subtitle={subtitle} right={right} className={className}>
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
