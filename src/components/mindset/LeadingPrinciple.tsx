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
 * product has no imagery — so the width goes to the statement and its meta row
 * instead of to a placeholder.
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
        <BandCell className="pt-4">
          <Eyebrow>Leading principle</Eyebrow>
          {principle ? (
            <>
              <Statement as="h2" className="mt-3">{principle.title}</Statement>
              {/* `text-balance`, not `text-pretty`: at a 46ch measure this ran
                  65 characters on line one and left "and move on." — twelve
                  characters — alone on line two, directly under the page's
                  loudest line. `text-pretty` did not move it (Chrome only
                  rescues a last line that is a single short word); balance
                  splits the two lines evenly, which is what a two-line
                  paragraph wants. Measured, not assumed. */}
              <p className="mt-3.5 max-w-[46ch] text-body text-balance text-fg-2">{principle.why}</p>
              <div className="mt-5 flex flex-wrap gap-x-7 gap-y-1 border-t border-line pt-3.5 text-label text-fg-2">
                <span>{principle.category}</span>
                {/* "Active 0 days" is a real answer, not a gap: it says the
                    principle is chosen but not yet practised, which is exactly
                    the state the practice grid below exists to change. */}
                <span className="whitespace-nowrap">
                  Practised {daysPracticed} {daysPracticed === 1 ? 'day' : 'days'}
                </span>
              </div>
            </>
          ) : (
            <>
              <Statement as="h2" className="mt-3 text-fg-3">Nothing in focus yet</Statement>
              <p className="mt-3.5 max-w-[46ch] text-body text-balance text-fg-2">
                Pick a principle from the library below. The first one you add leads here.
              </p>
            </>
          )}
        </BandCell>
      </BandRow>
    </Band>
  )
}
