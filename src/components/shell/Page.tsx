import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * Page layout. `aside` (optional) sits in a right rail at xl and wraps under
 * `main` at narrower widths — no dead void. Width is capped for readable lines.
 */
export function Page({
  children,
  aside,
  className = '',
}: {
  children: ReactNode
  aside?: ReactNode
  className?: string
}) {
  if (!aside) {
    return <div className={cn('page-enter mx-auto w-full max-w-[1400px] space-y-5', className)}>{children}</div>
  }
  return (
    <div
      className={cn(
        'mx-auto grid w-full max-w-[1400px] items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]',
        className,
      )}
    >
      <div className="page-enter min-w-0 space-y-5">{children}</div>
      <aside className="space-y-5">{aside}</aside>
    </div>
  )
}

// Re-export so views can grab the cursor from one shell entrypoint.
export { useCursor } from './cursor'
