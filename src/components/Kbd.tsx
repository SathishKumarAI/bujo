import type { ReactNode } from 'react'

/** A key cap. Used by the cheatsheet and as an inline hint next to the buttons a key triggers. */
export function Kbd({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={`inline-grid h-[18px] min-w-[18px] place-items-center rounded border border-surface1 bg-surface0 px-1 font-mono text-[10px] leading-none text-subtext1 ${className}`}
    >
      {children}
    </kbd>
  )
}
