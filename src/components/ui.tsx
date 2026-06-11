import type { ReactNode } from 'react'
import { cat } from '../lib/colors'

// ── Small Tailwind-styled primitives (Catppuccin tokens) ─────────────────────

export function Card({
  title,
  subtitle,
  right,
  children,
  className = '',
}: {
  title?: ReactNode
  subtitle?: ReactNode
  right?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`card-3d rounded-2xl border border-surface0 bg-mantle p-5 sm:p-6 ${className}`}
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
  const styles = {
    primary: 'bg-mauve text-crust hover:bg-lavender',
    ghost: 'bg-surface0 text-text hover:bg-surface1',
    danger: 'bg-transparent text-red hover:bg-surface0',
  }[variant]
  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      className={`press-3d rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-mauve focus-visible:outline-none ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-surface1 bg-base px-3 py-2 text-sm text-text placeholder:text-overlay0 focus-visible:border-mauve focus-visible:ring-1 focus-visible:ring-mauve focus-visible:outline-none ${props.className ?? ''}`}
    />
  )
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-surface1 bg-base px-3 py-2 text-sm text-text placeholder:text-overlay0 focus-visible:border-mauve focus-visible:ring-1 focus-visible:ring-mauve focus-visible:outline-none ${props.className ?? ''}`}
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
