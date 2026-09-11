import { Band, BandCell, BandRow, Eyebrow, Statement } from '../mod'
import type { MindsetPrinciple } from '../../lib/mindset'

/**
 * The page's opening band: the one principle you are leading with, said loudly.
 *
 * Owns the top band only. What "leading" means (the first focus row) is decided
 * by the view, not here.
 *
 * The handoff pairs this statement with a full-bleed grayscale photograph in a
 * second cell. There is no training photo anywhere in this product and no slot
 * to put one, and the handoff explicitly allows dropping the cell when the
 * product has no imagery.
 *
 * **Dropping it left the width nowhere.** This comment used to end "so the
 * width goes to the statement and its meta row instead of to a placeholder",
 * which was not what the code did: `Statement` caps at `20ch` by design and the
 * paragraph at `46ch`, so one full-bleed cell holding both meant the text used
 * **34% of the band at 1600px and 39% at 1440** — measured — and the remaining
 * two thirds was empty. The statement was not bigger for having the room; it
 * was the same 199px with a lot of nothing beside it.
 *
 * So the second cell is back, holding the copy rather than a photograph: the
 * title on the left at its deliberate short measure, the reasoning and the meta
 * row on the right. `BandRow` wraps by default and each cell carries its own
 * basis, so this collapses to one column on a phone with no breakpoint — where
 * the single cell was already using 100% of the width and needed no fixing.
 */
export function LeadingPrinciple({
  principle,
  daysPracticed,
}: {
  principle: MindsetPrinciple | undefined
  /** Distinct days this principle has been marked practised. */
  daysPracticed: number
}) {
  return (
    <Band>
      <BandRow>
        <BandCell className="basis-[20rem] pt-4">
          <Eyebrow>Leading principle</Eyebrow>
          <Statement as="h2" className={principle ? 'mt-3' : 'mt-3 text-fg-3'}>
            {principle ? principle.title : 'Nothing in focus yet'}
          </Statement>
        </BandCell>
        <BandCell className="basis-[26rem] pt-4">
          {principle ? (
            <>
              {/* `text-balance`, not `text-pretty`: at a 46ch measure this ran
                  65 characters on line one and left "and move on." — twelve
                  characters — alone on line two, directly under the page's
                  loudest line. `text-pretty` did not move it (Chrome only
                  rescues a last line that is a single short word); balance
                  splits the two lines evenly, which is what a two-line
                  paragraph wants. Measured, not assumed. */}
              <p className="mt-3 max-w-[46ch] text-body text-balance text-fg-2">{principle.why}</p>
              <div className="mt-5 flex flex-wrap gap-x-7 gap-y-1 border-t border-line pt-3.5 text-label text-fg-2">
                <span>{principle.category}</span>
                {/* "Practised 0 days" is a real answer, not a gap: it says the
                    principle is chosen but not yet practised, which is exactly
                    the state the practice grid below exists to change. */}
                <span className="whitespace-nowrap">
                  Practised {daysPracticed} {daysPracticed === 1 ? 'day' : 'days'}
                </span>
              </div>
            </>
          ) : (
            <p className="mt-3 max-w-[46ch] text-body text-pretty text-fg-2">
              Pick a principle from the library below. The first one you add leads here.
            </p>
          )}
        </BandCell>
      </BandRow>
    </Band>
  )
}
