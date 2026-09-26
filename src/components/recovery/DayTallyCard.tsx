import { Minus, Plus } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card } from '../ui'
import { Button } from '../ui/button'
import { onRaised } from '../../lib/colors'

/** One tracked thing and how many times it happened today. */
export interface DayTallyRow {
  /** `null` is the primary streak; otherwise an `AddictionStreak` id. */
  id: string | null
  name: string
  /** Occurrences today — 0 is a clean day. */
  count: number
}

/**
 * The one-tap day log: for each tracked thing, "it happened today" and how
 * many times.
 *
 * Zone 2, under the ring, because this is the act — Recovery already had a
 * quantity-blind version of it three screens down (the per-addiction `Reset`
 * button, in zone 3 behind the signature chart), and something you press on a
 * bad day cannot live below a fold.
 *
 * **One primary-shaped control per row, and no confirm.** The first tap of the
 * day resets that streak, which is normally worth a dialog, but a counter you
 * have to confirm ten times is a counter nobody uses — and the consequence is
 * already on screen twice, in the row's own readout and in the orient bar's
 * days-clean. ⌘Z walks back a mis-tap, one tap per step.
 *
 * `flex-wrap` on the row, not inside `Card`: a card cannot wrap a cluster whose
 * markup it does not own, so an over-wide row would just leave by a different
 * edge and pass both the clip and the a11y gate while being unpressable. The
 * minus is rendered only when there is something to subtract rather than
 * disabled, so there is no dead target on a clean day.
 */
export function DayTallyCard({ rows, onStep }: {
  rows: DayTallyRow[]
  onStep: (id: string | null, step: number) => void
}) {
  const anyLogged = rows.some((r) => r.count > 0)
  return (
    <Card band hideInfo
      title="Did it happen today?"
      subtitle="One tap logs the day · tap again for each time it happened."
    >
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id ?? 'primary'} className="rounded-card bg-ink-2 px-3 py-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <div className="min-w-0 flex-1">
                {/* Wraps rather than truncates: the name is user text, and the
                    clip gate is right that a hidden half-word is worse than a
                    second line. `break-words` covers a long single word. */}
                <div className="text-body font-medium break-words text-fg-1">{r.name}</div>
                <div className="text-label" style={{ color: onRaised(r.count > 0 ? 'red' : 'green') }}>
                  {r.count > 0 ? `${r.count}× today` : 'Clean today'}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {r.count > 0 && (
                  <Button variant="ghost" size="icon-lg" onClick={() => onStep(r.id, -1)}
                    aria-label={`One fewer ${r.name} today`}>
                    <Icon as={Minus} size="md" />
                  </Button>
                )}
                <Button variant="secondary" size="lg" onClick={() => onStep(r.id, 1)}
                  aria-label={r.count > 0 ? `Log one more ${r.name} today` : `Log ${r.name} today`}
                  className="gap-1">
                  <Icon as={Plus} size="sm" />{r.count > 0 ? '1 more' : 'Log today'}
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {/* One line, and only when there is something to say. The page is
          already a fold-wall; prose explaining a counter is not worth the
          0.1 screens it costs on a phone. */}
      {anyLogged && (
        <p className="mt-2 text-label text-fg-2">
          The first tap of a day restarts that counter · ⌘Z undoes a mis-tap.
        </p>
      )}
    </Card>
  )
}
