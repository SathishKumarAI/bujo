import type { ReactNode } from 'react'

/**
 * One line of copy beneath a zone-3 visual that has no data yet.
 *
 * Not `Empty`. `Empty` centres a paragraph inside a bordered box, which is the
 * pattern the contract replaces: it hides the structure of the thing that is
 * missing, so an empty page looks broken rather than new. Here the visual
 * always renders its own frame — the grid, the zeroed tiles, the axis — and
 * this is only the sentence underneath naming the action.
 */
export function EmptyFrame({ children }: { children: ReactNode }) {
  return <p className="text-label text-fg-2">{children}</p>
}
