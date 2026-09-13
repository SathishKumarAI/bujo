import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * Eyebrow — the small quiet label above a statement or beside a heading.
 *
 * Owns one type treatment and one only, so the app's two dozen labels cannot
 * drift into two dozen slightly different sizes — the exact failure the type
 * scale was built to end (`styles/tokens.css`).
 *
 * **It was `text-micro` at `0.14em` tracking, in caps.** Ten-pixel letter-spaced
 * uppercase is the house style of a 2015 analytics dashboard, and at that size
 * the tracking is not a refinement — it is the only thing making the letters
 * legible, which is the tell that the size was wrong to begin with. Sentence
 * case at the caption step reads faster, sets the same hierarchy, and stops the
 * page shouting section names at a reader who can already see them.
 *
 * Caps are still reachable per call site for the handful of genuine
 * abbreviations (RPE, HALT), which is what caps are actually for.
 *
 * Not a heading, and never marked up as one: it labels the thing below it but
 * carries no document structure. Where it names a section, the `<h2>` beside it
 * does the naming.
 */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('block text-caption font-medium text-fg-3', className)}>
      {children}
    </span>
  )
}
