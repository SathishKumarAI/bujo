import { Info } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { glossaryTerm } from '../lib/glossary'

/**
 * ABBR · an abbreviation with its meaning one press away.
 *
 * Renders the word as written plus a superscript ⓘ. Pressing it opens the
 * expansion, the plain-language explanation, and — where the definition came
 * from a published health body — a credited link out. Everything comes from
 * `src/data/glossary.json`, so this and the Help page's glossary cannot drift
 * apart. See `lib/glossary.ts` for why that is a JSON file.
 *
 * **Why a button and not `title=`.** `title` does not exist on a touch device:
 * there is no hover, so the tooltip is unreachable on the phone, which is where
 * this app is mostly read. It is also invisible to a keyboard. A real
 * `<button>` inside a Radix `Popover` is focusable, named, dismissable with
 * Escape, and announced — and `npm run a11y` will fail an unnamed one, which is
 * the reason to reach for the primitive that is already here rather than roll a
 * hover card.
 *
 * **Why the marker is a separate element from the word.** The abbreviation stays
 * plain text so it can sit inside a chip, a heading or a sentence without
 * inheriting button styling, and so a screen reader reads the word first and the
 * affordance second. `<abbr title>` alone would repeat the
 * touch-device problem above, so the semantic element carries the expansion for
 * assistive tech *and* the button carries it for everyone else.
 *
 * An unknown term renders the word and no marker — deliberately silent rather
 * than throwing, because an abbreviation with no entry yet is still readable
 * text, and a crashing page is worse than an unexplained word. `glossary.test.ts`
 * is what keeps the entries present; this component is not the place to notice.
 */
export function Abbr({ term, children, className = '' }: {
  /** The key into the glossary. Matched case-insensitively. */
  term: string
  /** What to print, when it differs from the term (e.g. a lowercase chip label). */
  children?: React.ReactNode
  className?: string
}) {
  const entry = glossaryTerm(term)
  const shown = children ?? term
  if (!entry) return <span className={className}>{shown}</span>

  return (
    <span className={`inline-flex items-baseline gap-0.5 ${className}`}>
      <abbr title={entry.expansion} className="no-underline">{shown}</abbr>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            aria-label={`What ${entry.term} means`}
            // A 2px inset hit area on a 12px glyph is not pressable with a
            // thumb. `after:` grows the target to 44px without growing the
            // glyph or disturbing the line it sits on — COD-96 is open about 24
            // controls already under that floor and this must not add a 25th.
            className="relative align-super text-fg-2 transition-colors hover:text-fg-1 after:absolute after:left-1/2 after:top-1/2 after:h-11 after:w-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']"
          >
            <Icon as={Info} size="sm" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="max-w-xs" onClick={(e) => e.stopPropagation()}>
          <p className="text-body font-medium text-fg-1">{entry.expansion}</p>
          <p className="mt-1.5 text-label text-fg-2">{entry.long}</p>
          {entry.source && (
            <p className="mt-2 border-t border-line pt-2 text-caption text-fg-2">
              Source:{' '}
              <a href={entry.source.url} target="_blank" rel="noreferrer" className="underline hover:text-fg-1">
                {entry.source.label}
              </a>
            </p>
          )}
        </PopoverContent>
      </Popover>
    </span>
  )
}
