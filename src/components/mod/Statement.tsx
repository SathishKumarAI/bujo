import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * Statement — the one large line a Modernist band leads with.
 *
 * Owns: the display-size, tight-tracked, short-measure treatment of a page's
 * single loudest piece of text. Does not own: what that text is, or the eyebrow
 * above it (`Eyebrow`).
 *
 * `max-width: 20ch` and `text-wrap: balance` are the whole trick. At full column
 * width a 32px line runs to 60+ characters and stops reading as a statement; at
 * 20ch it breaks into two or three deliberate lines. Balance keeps the last line
 * from being one orphaned word.
 *
 * One per band, and at most one per screen — a second statement is not a
 * statement.
 */
export function Statement({
  children,
  className,
  as: Tag = 'p',
}: {
  children: ReactNode
  className?: string
  /** Use `h2` where the statement is the section's name; `p` where it is content. */
  as?: 'p' | 'h1' | 'h2'
}) {
  return (
    <Tag className={cn('max-w-[20ch] font-display text-display font-medium tracking-[-0.02em] text-balance text-fg-1', className)}>
      {children}
    </Tag>
  )
}
