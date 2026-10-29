import type { ReactNode } from 'react'
import { CaretRight, type Icon as IconGlyph } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { cat, onAccent } from '../../lib/colors'

/**
 * An inset grouped list — iOS Settings' rows — for a phone.
 *
 * OWNS: the row anatomy (tinted icon tile · title over subtitle · trailing
 * value · chevron) and that a row with `onPress` is a real button. The look is
 * `styles/phone.css` (`.cells`, `.cell`).
 * DOES NOT OWN: what a row opens. Phone-only (COD-454).
 */
export function Cells({ title, aside, children }: { title?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-1.5">
      {title && (
        <div className="flex items-baseline justify-between px-1">
          <h2 className="text-heading font-semibold text-fg-1">{title}</h2>
          {aside && <span className="text-label text-fg-2">{aside}</span>}
        </div>
      )}
      <div className="cells">{children}</div>
    </section>
  )
}

export function Cell({ icon, tone = 'mauve', lead, title, subtitle, trail, onPress, chevron = true, label }: {
  icon?: IconGlyph
  /** Palette name for the icon tile. */
  tone?: string
  /** Replaces the icon tile — a score badge, a check. */
  lead?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  trail?: ReactNode
  onPress?: () => void
  chevron?: boolean
  /**
   * Words said BEFORE the row's visible text ("Edit session"), never instead
   * of it: an `aria-label` replacing the text fails WCAG 2.5.3
   * (`label-content-name-mismatch`, the trap in CLAUDE.md) — measured on the
   * first draft of the Recent rows, at all five themes.
   */
  label?: string
}) {
  const body = (
    <>
      {label && <span className="sr-only">{label} </span>}
      {lead ?? (icon && (
        /* A SOLID tile with a light-or-dark glyph picked against it
           (`onAccent`), as iOS Settings draws them — the 13% wash with an
           accent glyph read as washed out at arm's length. */
        <span className="cell-tile" style={{ background: cat(tone), color: onAccent(cat(tone)) }}>
          <Icon as={icon} size="sm" />
        </span>
      ))}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body font-medium text-fg-1">{title}</span>
        {subtitle && <span className="block truncate text-label text-fg-2">{subtitle}</span>}
      </span>
      {trail && <span className="shrink-0 text-body text-fg-2">{trail}</span>}
      {onPress && chevron && <Icon as={CaretRight} size="sm" className="shrink-0 text-fg-2" />}
    </>
  )
  return onPress
    ? <button type="button" className="cell" onClick={onPress}>{body}</button>
    : <div className="cell">{body}</div>
}

/**
 * A text-field row: the label on the left, the field filling the right — iOS's
 * inline form row. `suggestions` are one-tap names under the field (the last
 * few you used), so a phone rarely needs its keyboard at all.
 */
export function FieldCell({ label, value, onChange, placeholder, type = 'text', inputMode, suggestions, list }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: 'text' | 'number'
  inputMode?: 'text' | 'numeric' | 'decimal'
  suggestions?: string[]
  /** A `<datalist>` id: every value ever used, in the field's own dropdown. */
  list?: string
}) {
  const picks = (suggestions ?? []).filter((s) => s && s !== value).slice(0, 4)
  return (
    <div className="cell cell-stack gap-1.5">
      <label className="flex min-h-[2.25rem] items-center gap-3">
        <span className="w-[6.5rem] shrink-0 text-body text-fg-1">{label}</span>
        <input
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          list={list}
          className="cell-input"
        />
      </label>
      {picks.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pl-[7.25rem]" role="group" aria-label={`Recent ${label.toLowerCase()}`}>
          {picks.map((s) => (
            <button key={s} type="button" className="suggest" onClick={() => onChange(s)}>{s}</button>
          ))}
        </div>
      )}
    </div>
  )
}

/** A row holding a control under its label — a segmented choice, a set of toggles. */
export function ControlCell({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="cell cell-stack gap-2 py-3">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-body text-fg-1">{label}</span>
        {hint && <span className="text-label text-fg-2">{hint}</span>}
      </span>
      {children}
    </div>
  )
}
