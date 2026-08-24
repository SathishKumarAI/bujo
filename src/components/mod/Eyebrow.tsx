import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * Eyebrow — the small uppercase label above a statement or beside a heading.
 *
 * Owns one type treatment and one only: micro size, wide tracking, the third
 * foreground tier. It exists so the redesign's dozen labels cannot drift into a
 * dozen slightly different sizes — the exact failure the type scale was built
 * to end (`styles/tokens.css`).
 *
 * Not a heading, and never marked up as one: it labels the thing below it but
 * carries no document structure. Where it names a section, the `<h2>` beside it
 * does the naming.
 */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('block text-micro tracking-[0.14em] text-fg-3 uppercase', className)}>
      {children}
    </span>
  )
}
