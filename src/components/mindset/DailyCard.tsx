import { Band, BandCell, BandRow, Eyebrow } from '../mod'
import type { DailyCard as Card } from '../../lib/mindsetDaily'

/**
 * Today's card: one quotation and one thing to do before the day is out.
 *
 * Owns the band only; which card a date gets is `lib/mindsetDaily`. The
 * quotation sits left at a reading measure and the practice right, the same
 * two-cell shape as `LeadingPrinciple`, so it folds to one column on a phone
 * with no breakpoint. The practice is the point — a quotation you only read
 * is decoration — so it gets the label a reader scans for: "Try today".
 */
export function DailyCard({ card, n, total }: { card: Card; n: number; total: number }) {
  return (
    <Band>
      <BandRow>
        <BandCell className="basis-[26rem] pt-4">
          <Eyebrow>Card {n} of {total}</Eyebrow>
          <figure className="mt-3">
            <blockquote className="max-w-[52ch] text-heading text-pretty text-fg-1">{card.quote}</blockquote>
            {card.by && <figcaption className="mt-2 text-label text-fg-2">{card.by}</figcaption>}
          </figure>
        </BandCell>
        <BandCell className="basis-[20rem] pt-4">
          <Eyebrow>Try today</Eyebrow>
          <p className="mt-3 max-w-[46ch] text-body text-pretty text-fg-1">{card.practice}</p>
        </BandCell>
      </BandRow>
    </Band>
  )
}
