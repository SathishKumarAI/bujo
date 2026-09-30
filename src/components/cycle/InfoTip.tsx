import { Info } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { cycleHelp } from '../../lib/cycleHelp'

/**
 * INFO TIP · the ⓘ beside a number on this page.
 *
 * **Built on the same Radix `Popover` as `Abbr`, on purpose.** The brief asked
 * for an `InfoTip` and the audit found `Abbr` already doing exactly this job —
 * Phosphor `Info`, focusable button, opens on click and on focus, Escape to
 * close, reachable on touch where a `title` tooltip is not. Two components that
 * behave *almost* the same is how an app ends up with one that traps focus and
 * one that does not.
 *
 * They stay separate because they answer different questions: `Abbr` expands a
 * **term** from the shared glossary (what PMS means), and this explains a
 * **reading on this page** (what "confirmed" is claiming about your chart). Same
 * mechanics, different content file, no duplicated copy.
 *
 * The 44px hit area is copied from `Abbr` for the same reason it exists there: a
 * 12px glyph is not pressable with a thumb, and `after:` grows the target
 * without growing the glyph or disturbing the line it sits on.
 *
 * An unknown key renders nothing at all — deliberately silent, because a missing
 * tip is a gap in the content file, not a reason to crash a page someone is
 * using to read their own chart.
 */
export function InfoTip({ tip, onMore }: {
  /** Key into `lib/cycleHelp.ts`. */
  tip: string
  /** Scroll to the matching Guide section, when the page can. */
  onMore?: (section: string) => void
}) {
  const entry = cycleHelp(tip)
  if (!entry) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          aria-label={`What this means: ${tip.replace(/-/g, ' ')}`}
          className="relative ml-1 inline-flex align-super text-fg-2 transition-colors hover:text-fg-1 after:absolute after:left-1/2 after:top-1/2 after:h-11 after:w-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']"
        >
          <Icon as={Info} size="sm" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-w-xs" onClick={(e) => e.stopPropagation()}>
        <p className="text-label text-fg-1">{entry.text}</p>
        {entry.more && onMore && (
          <button
            type="button"
            onClick={() => onMore(entry.more!)}
            className="mt-2 text-label text-mauve underline underline-offset-2"
          >
            Learn more
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
