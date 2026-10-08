import { Minus, Plus } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card } from '../ui'
import { Button } from '../ui/button'
import { onRaised } from '../../lib/colors'
import { formatAmount, quickLabel, unitOf } from '../../lib/addictionUnits'

/** One tracked thing and how many times it happened today. */
export interface DayTallyRow {
  /** `null` is the primary streak; otherwise an `AddictionStreak` id. */
  id: string | null
  name: string
  /** Amount today in `unit` — 0 is a clean day. */
  count: number
  /** What the amount is measured in. Absent means `times`. */
  unit?: string
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
 * **One tap, and no confirm.** The first tap of the
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
 *
 * Every button here is `secondary`, and now for a second reason: the page's one
 * `primary` is "Log this urge" one card up. It was none at all before, on the
 * reasoning that no act here outranked another — but `PRODUCT.md` ranks capture
 * first and riding out an urge is the capture that happens many times a day,
 * while a lapse tally is rare. A record is not a goal, and these stay quiet.
 *
 * Colour goes in `style`, size in `className`: a custom `text-<size>` and a
 * custom `text-<colour>` land in the same tailwind-merge group and the later one
 * silently wins, which is what had been eating `text-label` on the Reset button
 * one card over.
 */
export function DayTallyCard({ rows, onStep }: {
  rows: DayTallyRow[]
  onStep: (id: string | null, step: number) => void
}) {
  const anyLogged = rows.some((r) => r.count > 0)
  return (
    <Card hideInfo
      title="Did it happen today?"
      subtitle="One tap logs the day · tap again for each time it happened."
    >
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id ?? 'primary'} className="rounded-card bg-ink-2 px-3 py-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {/* `min-w-40`, not `min-w-0`. The row is `flex-wrap`, but a
                  `flex-1 min-w-0` column shrinks to nothing rather than forcing
                  the wrap, so the quick-amount cluster kept its full width and
                  crushed this column instead of moving to a second line. It
                  only became visible when `SideRail` took 208px off `<main>`:
                  `npm run clipped` found "4 cigarettes today" at **38px shown
                  of 60px needed** on desktop Recovery. A floor here is what
                  makes `flex-wrap` able to act. */}
              <div className="min-w-40 flex-1">
                {/* Wraps rather than truncates: the name is user text, and the
                    clip gate is right that a hidden half-word is worse than a
                    second line. `break-words` covers a long single word. */}
                <div className="text-body font-medium break-words text-fg-1">{r.name}</div>
                {/* Said in the row's own unit: "45 minutes today" rather than
                    "3× today", which for scrolling measures nothing. */}
                <div className="text-label" style={{ color: onRaised(r.count > 0 ? 'red' : 'green') }}>
                  {r.count > 0 ? `${formatAmount(r.count, r.unit)} today` : 'Clean today'}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {r.count > 0 && (
                  <Button variant="ghost" size="icon-lg" onClick={() => onStep(r.id, -unitOf(r.unit).step)}
                    aria-label={`Less ${r.name} today`}>
                    <Icon as={Minus} size="md" />
                  </Button>
                )}
                {/* ONE TAP PER REAL ANSWER, not one tap per unit.
                    A single `+` meant twelve presses to log three hours of
                    scrolling, and a control that tedious gets abandoned or
                    guessed at — which makes the data worse than not collecting
                    it. These are the amounts people actually report. */}
                {unitOf(r.unit).quick.map((q) => (
                  <Button
                    key={q}
                    variant="secondary"
                    size="lg"
                    onClick={() => onStep(r.id, q)}
                    aria-label={`Add ${formatAmount(q, r.unit)} to ${r.name} today`}
                    className="min-w-11 px-2.5"
                  >
                    {r.count === 0 && q === unitOf(r.unit).quick[0]
                      ? <><Icon as={Plus} size="sm" />{quickLabel(q, r.unit)}</>
                      : quickLabel(q, r.unit)}
                  </Button>
                ))}
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
