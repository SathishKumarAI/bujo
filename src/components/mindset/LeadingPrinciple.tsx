import { Statement } from '../mod'
import { Card } from '../ui'
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
    /* A card, not a `mod/Band` split into two `BandCell`s.

       The cell split existed to stop the statement using 34% of a full-bleed
       band with two thirds of nothing beside it — a real measurement, and a
       real fix for a page that was one full-width column. In the act column of
       a split layout the problem does not arise: the column is ~505px, which
       is the measure this statement wanted all along. So the two cells become
       one card and the width argument retires with the band it was about. */
    <Card band title="Leading principle">
      <Statement as="p" className={principle ? '' : 'text-fg-3'}>
        {principle ? principle.title : 'Nothing in focus yet'}
      </Statement>
      {principle ? (
        <>
          {/* `text-balance`, not `text-pretty`: at this measure the paragraph
              left "and move on." alone on line two, directly under the page's
              loudest line. Balance splits two lines evenly. Measured. */}
          <p className="mt-3 max-w-[46ch] text-body text-balance text-fg-2">{principle.why}</p>
          <div className="mt-4 flex flex-wrap gap-x-7 gap-y-1 border-t border-line pt-3 text-label text-fg-2">
            <span>{principle.category}</span>
            {/* "Practised 0 days" is a real answer, not a gap: it says the
                principle is chosen but not yet practised, which is exactly the
                state the practice grid exists to change. */}
            <span className="whitespace-nowrap">
              Practised {daysPracticed} {daysPracticed === 1 ? 'day' : 'days'}
            </span>
          </div>
        </>
      ) : (
        <p className="mt-3 max-w-[46ch] text-body text-pretty text-fg-2">
          Pick a principle in the Library below. The first one you add leads here.
        </p>
      )}
    </Card>
  )
}
