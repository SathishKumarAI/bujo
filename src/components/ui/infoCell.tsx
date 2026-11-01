import { useState, type ReactNode } from 'react'
import { Info, type Icon as IconGlyph } from '@/components/icons'
import { Cell } from './cells'
import { Sheet } from './sheet'

/**
 * A row that opens the long half of a card — the explanation a desktop card
 * prints under its controls — in a bottom `Sheet`, as points.
 *
 * OWNS: the row and its sheet. Phone-only, like `cells.tsx`.
 * DOES NOT OWN: what the points say; the caller passes them, one idea each
 * (CLAUDE.md "Points, not paragraphs").
 */
export function InfoCell({ title, subtitle, icon = Info, tone = 'overlay1', points, children }: {
  title: string
  subtitle?: string
  icon?: IconGlyph
  tone?: string
  points?: readonly string[]
  /** Anything richer than points (grouped rows); drawn after them. */
  children?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Cell icon={icon} tone={tone} title={title} subtitle={subtitle} onPress={() => setOpen(true)} />
      <Sheet open={open} onOpenChange={setOpen} title={title} description={subtitle}>
        <div className="flex flex-col gap-4">
          {points && (
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-body text-fg-1">
              {points.map((p) => <li key={p}>{p}</li>)}
            </ul>
          )}
          {children}
        </div>
      </Sheet>
    </>
  )
}
