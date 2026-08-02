import type { ReactNode } from 'react'

/** A key cap. Used by the cheatsheet and as an inline hint next to the buttons a key triggers. */
export function Kbd({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={`inline-grid h-[18px] min-w-[18px] place-items-center rounded border border-line-strong bg-ink-2 px-1 font-mono text-micro leading-none text-fg-1 ${className}`}
    >
      {children}
    </kbd>
  )
}
