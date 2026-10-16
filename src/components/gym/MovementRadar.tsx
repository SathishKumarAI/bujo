import { Icon } from '@/components/Icon'
import { Scales } from '@/components/icons'
import { Card, Empty } from '../ui'
import { BarList, type BarRow } from '../page'
import type { CategoryVolume } from '../../lib/fitness'

/**
 * Push / pull / legs / core volume — as four bars, not a radar.
 *
 * **It WAS a radar**, and the measurement is why it is not any more. Four axes
 * make a quadrilateral, so the "lopsided shape" the docstring promised is a
 * shape with no baseline to be lopsided against: you cannot tell 2,563 from
 * 7,703 by looking at a corner. And the moment one category is zero — Core is
 * zero in the demo journal, and is zero for most people in most weeks — the
 * polygon collapses to a triangle pinned against an empty axis, which reads as
 * a rendering fault. Measured on the rendered page at 1440: **a 224px-tall
 * plot holding a small purple triangle**, with the four real numbers printed as
 * a caption underneath it, because the chart could not carry them.
 *
 * Four bars say the same thing in a quarter of the height, carry the figure and
 * the share on the row, and read at 348px with no breakpoint. That is
 * `docs/REUSABLE-PATTERNS.md` §21 arriving from the other direction: not "seven
 * cells are too small", but "four corners are not a comparison".
 *
 * Reported as part of *"some of the charts are looking like just a generic
 * slop"* — a library's default shape dropped into a card, which is what a radar
 * with four axes always is.
 *
 * **The share is the point, so the share is what the bar encodes**: an 80/20
 * pull-to-push split is a balance problem at any volume, and the raw kilograms
 * are the detail beside it. The name stays `MovementRadar` for now only because
 * renaming the module is a separate diff; the file says what it draws.
 */
export function MovementRadar({ data, unit }: { data: CategoryVolume[]; unit: string }) {
  const total = data.reduce((s, c) => s + c.volume, 0)
  const top = [...data].sort((a, b) => b.volume - a.volume)[0]
  const empty = data.filter((c) => c.volume === 0).map((c) => c.category)

  const rows: BarRow[] = data.map((c) => {
    const share = total > 0 ? Math.round((c.volume / total) * 100) : 0
    return {
      label: c.category,
      pct: share,
      value: c.volume > 0 ? `${share}%` : null,
      note: c.volume > 0 ? `${Math.round(c.volume / 100) / 10}k` : '',
      /* One tone. A three-step ramp would need a target share per category and
         there is no agreed one — 25/25/25/25 is not a training programme. The
         bar carries the comparison; inventing a verdict colour would be a scale
         the reader tries to read off and cannot. */
      tone: 'mauve',
      announce: `${c.category}: ${c.volume.toLocaleString()} ${unit}, ${share}% of this week's volume`,
    }
  })

  return (
    <Card
      band
      collapsible
      title={<span className="inline-flex items-center gap-2"><Icon as={Scales} size="md" className="text-mauve" /> Movement balance</span>}
      /* The finding, not the title again. */
      subtitle={
        total === 0 ? 'Weekly volume by push / pull / legs / core'
          : `Mostly ${top.category.toLowerCase()} this week${empty.length ? ` · nothing for ${empty.join(' or ').toLowerCase()}` : ''}`
      }
    >
      {total === 0 ? (
        <Empty>Log some working sets this week to see your movement balance.</Empty>
      ) : (
        <>
          <BarList rows={rows} labelWidth="w-14" />
          <p className="mt-2 text-micro text-fg-2">
            Share of this week’s working-set volume ({unit}), by movement pattern.
          </p>
        </>
      )}
    </Card>
  )
}
