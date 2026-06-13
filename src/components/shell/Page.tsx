import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * Page layout. `aside` (optional) sits in a right rail at xl and wraps under
 * `main` at narrower widths — no dead void. Width is capped for readable lines.
 */
export function Page({
  children,
  aside,
  asideFirst = false,
  className = '',
}: {
  children: ReactNode
  aside?: ReactNode
  /** On phones/tablets (< xl), render the aside ABOVE main — keeps data-entry
   *  forms (which live in the rail) above charts on mobile. Desktop unchanged. */
  asideFirst?: boolean
  className?: string
}) {
  if (!aside) {
    return <div className={cn('page-enter mx-auto flex w-full max-w-[1400px] flex-col gap-5', className)}>{children}</div>
  }
  return (
    <div
      className={cn(
        'mx-auto grid w-full max-w-[1400px] items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]',
        className,
      )}
    >
      <div className={cn('page-enter flex min-w-0 flex-col gap-5', asideFirst && 'order-last xl:order-none')}>{children}</div>
      <aside className={cn('flex flex-col gap-5', asideFirst && 'order-first xl:order-none')}>{aside}</aside>
    </div>
  )
}

// Re-export so views can grab the cursor from one shell entrypoint.
export { useCursor } from './cursor'
