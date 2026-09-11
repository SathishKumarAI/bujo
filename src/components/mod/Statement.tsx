import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { bindDashes } from '../../lib/typography'

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
 *
 * **A dash never starts a line.** At 20ch almost every real title wraps, and
 * "Short memory — flush errors" broke after "memory", putting the em dash at
 * the head of line two — where it reads as a list marker rather than as the
 * continuation of a phrase. Binding the dash to the word before it moves the
 * break to the only other place it can go. Done here rather than in the data
 * because `Statement` also renders book titles the user typed, so the next
 * title with a dash in it is not one anybody can edit ahead of time.
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
      {bindDashes(children)}
    </Tag>
  )
}
