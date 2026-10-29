import type { ReactNode } from 'react'
import { useDevice } from './shell/device'

/**
 * A paragraph on a desktop, the same words as short points on a phone.
 *
 * OWNS: the switch and the list's look. DOES NOT OWN: the copy — each caller
 * keeps its desktop paragraph exactly as it shipped (owner: "do not disturb
 * the desktop"), and passes the points beside it.
 *
 * Why: CLAUDE.md "Points, not paragraphs" — Settings › Account opened with two
 * 230-character paragraphs at 390px (COD-484), the one place on a phone that
 * read as a wall of text.
 */
export function PhonePoints({ prose, points, className = 'text-body text-fg-2' }: {
  prose: ReactNode
  points: ReactNode[]
  className?: string
}) {
  if (useDevice() !== 'mobile') return <>{prose}</>
  return (
    <ul className={`list-disc space-y-1 pl-5 ${className}`}>
      {points.map((p, i) => <li key={i}>{p}</li>)}
    </ul>
  )
}
