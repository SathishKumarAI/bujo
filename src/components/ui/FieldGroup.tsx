import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { useDevice } from '../shell/device'

/**
 * One section of a form — an iOS inset group on a phone, the form's own
 * desktop wrapper otherwise.
 *
 * OWNS: which of the two a section renders as. The phone geometry itself is
 * `styles/phone.css`.
 * DOES NOT OWN: the fields, their order, or the submit button.
 *
 * Built so a phone form can be regrouped WITHOUT touching the desktop DOM: on
 * a desktop this renders `<div className={desktop}>` — or no element at all
 * when `desktop` is omitted — exactly as the call site did before it was
 * wrapped. Pickleball's log is the first adopter; the rest of Body is next.
 */
export function FieldGroup({ title, desktop, cols, children }: {
  /** The phone's section header. Also the section's accessible name. */
  title: string
  /** The wrapper's class on a desktop; omit for no wrapper at all. */
  desktop?: string
  /** Columns inside the phone group — `2` for a pair like won/lost. */
  cols?: 1 | 2
  children: ReactNode
}) {
  if (useDevice() !== 'mobile') return desktop ? <div className={desktop}>{children}</div> : <>{children}</>
  return (
    <section aria-label={title}>
      <h3 className="ios-group-title">{title}</h3>
      <div className={cn('ios-group', cols === 2 && 'grid-cols-2')}>{children}</div>
    </section>
  )
}
