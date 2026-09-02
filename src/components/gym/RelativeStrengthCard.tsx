import { Scales, Trophy } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card, Empty, Pill } from '../ui'
import { cat } from '../../lib/colors'
import type { BigThreeTotal, RelativeStrength } from '../../lib/fitness'

/**
 * STRENGTH STANDARDS · the big-three total, then each PR as a multiple of the
 * latest logged bodyweight with its standard band.
 *
 * This absorbed `BigThreeCard` (COD-89). That card printed squat, bench and
 * deadlift with their weights and dates — which `Personal records`, four folds
 * up, already lists in full — plus one number nothing else showed: the total.
 * Three quarters of a card repeating another card is how "Deadlift 100kg"
 * came to appear on this page four times. The total moved here and the tiles
 * went; the archive is `Personal records`, and this card is the standard.
 *
 * The total is *not* a zone-1 fact, tempting as that was. `StatBar` caps at
 * four and says a fact earns its place by changing what you do in the next
 * thirty seconds — an all-time powerlifting total is exactly the "sessions
 * all-time" case it names as belonging to zone 3.
 *
 * The total renders whether or not a bodyweight is logged; the ratios cannot,
 * so they carry their own empty state underneath it.
 */
export function RelativeStrengthCard({
  rows, total, unit, setFocusEx,
}: { rows: RelativeStrength[]; total: BigThreeTotal; unit: string; setFocusEx: (e: string | null) => void }) {
  const bandColor: Record<string, string> = { Elite: 'mauve', Advanced: 'blue', Intermediate: 'green', Novice: 'yellow', Beginner: 'overlay0' }
  return (
    <Card band title="Strength standards" subtitle="Big-three total, and each lift ÷ bodyweight" defer>
      <div className="mb-3 flex items-baseline justify-between border-b border-line pb-3">
        <span className="inline-flex items-center gap-1.5 text-body text-fg-1">
          <Icon as={Trophy} size="sm" style={{ color: cat('yellow') }} /> Big three
        </span>
        {/* "—", not "0". Nobody has logged a squat is not the same as a squat
            of nothing — the rule `SummaryStrip` spells out. */}
        <span className="text-title font-medium" style={{ color: total.total > 0 ? cat('yellow') : cat('subtext0') }}>
          {total.total > 0 ? `${total.total}${unit}` : '—'}
        </span>
      </div>
      {total.total > 0 && !total.complete && (
        <p className="-mt-2 mb-3 text-caption text-fg-2">Squat, bench and deadlift — log all three for your true total.</p>
      )}
      {rows.length === 0 ? (
        <Empty>Log your bodyweight and some PRs to see strength-to-weight ratios.</Empty>
      ) : (
        <ul className="space-y-1.5 text-body">
          {rows.slice(0, 8).map((r) => (
            <li key={r.exercise}>
              <button
                onClick={() => setFocusEx(r.exercise)}
                className="flex w-full items-center justify-between gap-2 rounded px-1.5 py-1 text-left hover:bg-ink-2/50"
                title={`${r.exercise}: ${r.weight}${unit} = ${r.ratio}× bodyweight`}
              >
                <span className="inline-flex min-w-0 items-center gap-1.5 text-fg-1">
                  <Icon as={Scales} size="sm" style={{ color: cat('teal') }} /> <span className="truncate">{r.exercise}</span>
                </span>
                <span className="shrink-0 text-fg-2">
                  <span className="font-medium" style={{ color: cat('text') }}>{r.ratio}×</span>
                  <Pill color={bandColor[r.band] ?? 'overlay0'} size="micro" className="ml-1.5">{r.band}</Pill>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
