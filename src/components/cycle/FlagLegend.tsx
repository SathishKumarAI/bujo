import { CaretRight } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Abbr } from '../Abbr'
import { Pill } from '../ui'
import { useStickyState } from '../../lib/useStickyState'
import { FLAGS, FLAG_COLOR, FLAG_MEANS, type Flag } from './flags'

const OPEN_STATES = ['1', '0'] as const

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
 * — and the colour key itself is never behind a fold, which would reproduce the
 * complaint.
 *
 * **The hue is on the word, not beside it.** It shipped as a 10px square plus
 * `word — sentence`, five times, and read back as a flat run of prose: "this is
 * looking like a hash log". A swatch next to grey text asks the eye to make the
 * binding itself; a `Pill` in the flag's own hue *is* the binding, and it is the
 * app's existing read-only hue carrier (`washStyle`, so the foreground is solved
 * against the wash rather than assumed). `rounded-pill` and not the chip's
 * `rounded-control` on purpose — DESIGN.md's first law is that things you
 * operate are made of material and things you read are not, so the key and the
 * button it decodes share a hue and differ in shape.
 *
 * **Term and meaning are two columns once there is room for two.** Below ~24rem
 * of *container* the meaning flows inline after the pill, which is the dense
 * shape and the one a phone gets; above it the wrappers go `display: contents`
 * so every `dt`/`dd` becomes a direct grid child and the pill column aligns
 * across all five rows from one `auto` track — no magic width, and it re-solves
 * itself when the text-size setting moves the rem root. Past 48rem the same grid
 * takes four tracks and packs two pairs per row, so a wider column halves the
 * height instead of stretching five sentences to the far edge. Container
 * queries, not viewport: zone 2's width is decided by the page split, and this
 * component measured 325px at a 390px viewport and only 442px at 2560px.
 *
 * **The meanings fold; the colour key does not.** Ten lines of gloss is read
 * once and the hue→word binding is read every time a dot appears in the month
 * list, so the fold keeps the part that answers the complaint and hides the part
 * that repeats itself. Default **open**, sticky per browser: this page just
 * spent a PR turning four shipped-closed folds into rail rows (COD-230), and a
 * shipped/open gap is the thing that bought. Closing it is the reader's choice
 * and it is remembered.
 *
 * **On touch the fold is the path and hover is only a shortcut.** The toggle is
 * a real `<button>` with `aria-expanded`/`aria-controls`, so the meanings are
 * reachable by tap and by keyboard; the `title` on each collapsed pill is a
 * desktop convenience layered on top of that and is never the only way to the
 * text (COD-238 is open about 92 subtitles that *are*).
 *
 * **Built from `FLAGS` + `FLAG_COLOR`, never a second list.** A hand-written
 * legend is a copy of the hue map that drifts from it, and a legend that has
 * drifted is worse than none: it is confidently wrong. Adding a flag to
 * `flags.ts` adds a row here with no edit.
 *
 * **Definitions come from the glossary.** `Abbr` wraps the pill rather than
 * branching on whether the term is known — an unknown flag renders the pill and
 * no marker, which is what `Abbr` already does for plain text. So the expansion,
 * the plain-language paragraph and the ACOG credit behind `pms` are the same
 * ones Help and the chip's own `aria-label` use. `FLAG_MEANS` says what the
 * *mark* records — a different question from what the term means — and for `pms`
 * it is careful not to define the term twice.
 */
export function FlagLegend() {
  const [flag, setFlag] = useStickyState<'1' | '0'>('cycle.legend', '1', OPEN_STATES)
  const open = flag === '1'

  return (
    /* A `div`, not a `section`, and measured rather than argued: `space-audit`
       counts a card as a leaf `<section>` over 120×60, so a `section` here
       turned "3 cards in 1 group" into "3 cards in 2 groups" on the desktop row
       — the legend counted as a card and the day-editor card it sits in stopped
       being a leaf. An unnamed `<section>` is not exposed as a region by any
       screen reader anyway, and the `<h3>` below is what actually puts this in
       the heading list. Nothing is lost and the census stops lying.

       No rule above it either. The day editor is a filled `bg-ink-2` box, so
       its own edge already closes that section — DESIGN.md's rule is that
       elevation closes a section and a hairline is the exception, and drawing
       one 3px under a surface that has one is the exception used for nothing. */
    <div className="@container/legend mt-3">
      <h3>
        <button
          type="button"
          onClick={() => setFlag(open ? '0' : '1')}
          aria-expanded={open}
          aria-controls="cycle-flag-meanings"
          /* `min-h-11` and full width: COD-96 is open on 24 controls under the
             44px floor and this must not add a 25th. */
          className="press-3d -mx-1 flex min-h-11 w-full items-center gap-2 rounded-control px-1 text-left hover:text-fg-1"
        >
          <span className="caret-turn caret-turn-quarter inline-flex text-fg-2" data-open={open}>
            <Icon as={CaretRight} size="sm" />
          </span>
          <span className="text-caption font-medium uppercase tracking-wide text-fg-2">
            Flag colours
          </span>
          {!open && (
            <span className="ml-auto text-micro uppercase tracking-wide text-fg-2">
              what each marks
            </span>
          )}
        </button>
      </h3>

      {open ? (
        <dl
          id="cycle-flag-meanings"
          className="collapse-in mt-1 grid grid-cols-[minmax(0,1fr)] items-baseline gap-y-1.5 text-label @sm/legend:grid-cols-[auto_minmax(0,1fr)] @sm/legend:gap-x-4 @3xl/legend:grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)] @3xl/legend:gap-x-5"
        >
          {FLAGS.map((f) => (
            /* `contents` and not a nested grid: the pill column has to align
               across every row, and a per-row grid can only do that from a
               hard-coded width that the text-size setting then invalidates. */
            <div key={f} className="@sm/legend:contents">
              <dt className="inline @sm/legend:block">
                <FlagPill flag={f} />
              </dt>
              {/* The leading space is the separator in the inline shape and
                  collapses away in the block one, which is why it lives inside
                  the `dd` rather than as a node between the two: a stray text
                  node between them would become a grid item under `contents`
                  and shear the two columns by one cell. */}
              <dd className="inline text-fg-2 @sm/legend:block">{' '}{FLAG_MEANS[f]}</dd>
            </div>
          ))}
        </dl>
      ) : (
        /* Closed, the legend is still a legend: five hues and five words, one
           or two lines, which is the whole of what the report asked for. The
           `title` is the desktop shortcut into the sentence the fold holds. */
        <ul id="cycle-flag-meanings" className="mt-1 flex flex-wrap gap-1.5">
          {FLAGS.map((f) => (
            <li key={f}>
              <FlagPill flag={f} title={FLAG_MEANS[f]} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** One flag as its own hue, with the glossary marker when there is an entry. */
function FlagPill({ flag, title }: { flag: Flag; title?: string }) {
  return (
    <Abbr term={flag}>
      {/* `leading-none`: the pill is an inline box on a line of 13px prose, and
          at the label step's own 1.45 leading it inflated every line box in the
          list from 18.85px to 21px — 18px of the phone's page for nothing, the
          pill being 17px tall either way. Measured both ways. */}
      <Pill color={FLAG_COLOR[flag]} title={title} className="leading-none">{flag}</Pill>
    </Abbr>
  )
}
