import type { Icon as IconGlyph } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { cat, onAccent } from '../../lib/colors'

/**
 * Three-ish numbers with an icon each — a phone page's "this week" (COD-456).
 *
 * OWNS: the tile anatomy (solid icon tile, value in the app's sans with
 * tabular digits, a caption) and that it is a LIST, not a `<dl>` — a
 * definition list's items may hold only term/value pairs, and the icon tile
 * made one invalid (axe `definition-list`, every theme). Reads "0/12 Games".
 * The look is `styles/phone.css` (`.stat-tile`). Phone-only.
 */
export function StatTiles({ label, tiles }: {
  label: string
  tiles: { k: string; v: string; icon: IconGlyph; tone: string }[]
}) {
  return (
    <section aria-label={label} className="flex flex-col gap-1.5">
      <h2 className="px-1 text-heading font-semibold text-fg-1">{label}</h2>
      <ul className="grid grid-cols-3 gap-2">
        {tiles.map((s) => (
          <li key={s.k} className="stat-tile">
            <span aria-hidden className="stat-icon" style={{ background: cat(s.tone), color: onAccent(cat(s.tone)) }}><Icon as={s.icon} size="sm" /></span>
            <span className="stat-value truncate">{s.v}</span>
            <span className="truncate text-label text-fg-2">{s.k}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
