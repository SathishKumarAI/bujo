import { useState } from 'react'
import { CaretLeft, CaretRight } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Band, BandCell, BandRow, Eyebrow } from '../mod'
import { Sheet } from '../ui/sheet'
import { DAILY_CARDS } from '../../lib/mindsetDaily'

/**
 * Today's card: one quotation and one thing to do before the day is out —
 * and the other 364 one tap away.
 *
 * Owns the band and the browsing; which card a date gets is `lib/mindsetDaily`.
 * The quotation sits left at a reading measure and the practice right, the
 * same two-cell shape as `LeadingPrinciple`, so it folds to one column on a
 * phone with no breakpoint. The practice is the point — a quotation you only
 * read is decoration — so it gets the label a reader scans for: "Try today".
 *
 * BROWSING (owner, 2026-11-15: "Mindset does not have all the 365 cards"):
 * they were all in the data and only today's was reachable. Previous / Next
 * step one card and wrap at the ends; "All 365" opens every card in a sheet,
 * and picking one shows it here. "Today's card" brings the day's back.
 */
export function DailyCard({ n: today }: { n: number }) {
  const total = DAILY_CARDS.length
  const [n, setN] = useState(today)
  const [all, setAll] = useState(false)
  const card = DAILY_CARDS[n - 1]
  const step = (d: number) => setN(((n - 1 + d + total) % total) + 1)

  return (
    <Band>
      <BandRow>
        <BandCell className="basis-[26rem] pt-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Eyebrow>{n === today ? "Today's card" : 'Card'} {n} of {total}</Eyebrow>
            <span className="ml-auto flex items-center gap-1">
              <button type="button" className="round-btn" aria-label="Previous card" onClick={() => step(-1)}><Icon as={CaretLeft} size="sm" /></button>
              <button type="button" className="round-btn" aria-label="Next card" onClick={() => step(1)}><Icon as={CaretRight} size="sm" /></button>
              <button type="button" className="min-h-11 rounded-pill px-3 text-label text-brand-text hover:underline" aria-haspopup="dialog" onClick={() => setAll(true)}>All {total}</button>
              {n !== today && (
                <button type="button" className="min-h-11 rounded-pill px-3 text-label text-brand-text hover:underline" onClick={() => setN(today)}>Today's card</button>
              )}
            </span>
          </div>
          <figure className="mt-3">
            <blockquote className="max-w-[52ch] text-heading text-pretty text-fg-1">{card.quote}</blockquote>
            {card.by && <figcaption className="mt-2 text-label text-fg-2">{card.by}</figcaption>}
          </figure>
        </BandCell>
        <BandCell className="basis-[20rem] pt-4">
          <Eyebrow>{n === today ? 'Try today' : 'Try it'}</Eyebrow>
          <p className="mt-3 max-w-[46ch] text-body text-pretty text-fg-1">{card.practice}</p>
        </BandCell>
      </BandRow>

      <Sheet open={all} onOpenChange={setAll} title={`All ${total} cards`} description="One a day for the year. Pick one to read it.">
        <ol className="overflow-y-auto px-4 pb-6">
          {DAILY_CARDS.map((c, i) => (
            <li key={c.id} className="border-b border-line last:border-b-0">
              <button
                type="button"
                className="flex w-full gap-3 py-3 text-left"
                aria-current={i + 1 === n || undefined}
                onClick={() => { setN(i + 1); setAll(false) }}
              >
                <span className="w-9 shrink-0 text-label tabular-nums text-fg-2">{i + 1}</span>
                <span className="min-w-0">
                  <span className="block text-body text-fg-1">{c.quote}</span>
                  {c.by && <span className="block text-label text-fg-2">{c.by}</span>}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </Sheet>
    </Band>
  )
}
