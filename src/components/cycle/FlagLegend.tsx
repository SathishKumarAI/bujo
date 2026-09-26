import { cat } from '../../lib/colors'
import { glossaryTerm } from '../../lib/glossary'
import { Abbr } from '../Abbr'
import { FLAGS, FLAG_COLOR, FLAG_MEANS } from './flags'

/**
 * THE LEGEND · which colour is which flag, and what the flag marks.
 *
 * The page assigned five flags five hues and then used that hue as the flag's
 * identity in four places — the editor chips, the day-list dots, the
 * symptom-pattern rows and the temperature chart's period shading — and decoded
 * it in none of them. Reported exactly that way: "those are there, but unable to
 * see which colour represents what."
 *
 * It sits directly under the chips it explains, in zone 2, because that is where
 * the question gets asked: you are looking at five words in five colours and
 * pressing one. On a desktop it costs nothing — the act column is the short one
 * — and it is not behind a fold, which would reproduce the complaint.
 *
 * **Built from `FLAGS` + `FLAG_COLOR`, never a second list.** A hand-written
 * legend is a copy of the hue map that drifts from it, and a legend that has
 * drifted is worse than none: it is confidently wrong. Adding a flag to
 * `flags.ts` adds a row here with no edit.
 *
 * **Definitions come from the glossary.** `pms` gets an `<Abbr>` marker, so the
 * expansion, the plain-language paragraph and the ACOG credit are the same ones
 * Help and the chip's own `aria-label` use. `FLAG_MEANS` says what the *mark*
 * records — a different question from what the term means — and for `pms` it is
 * careful not to define the term twice.
 */
export function FlagLegend() {
  return (
    <ul className="mt-3 space-y-1.5">
      {FLAGS.map((f) => {
        const known = glossaryTerm(f)
        return (
          <li key={f} className="flex items-baseline gap-2 text-label">
            <span
              aria-hidden
              className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]"
              style={{ background: cat(FLAG_COLOR[f]) }}
            />
            <span className="min-w-0">
              <span className="font-medium text-fg-1">
                {known ? <Abbr term={f}>{f}</Abbr> : f}
              </span>
              <span className="text-fg-2"> — {FLAG_MEANS[f]}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
