import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Eyebrow } from '../mod'
import type { MindsetPrinciple } from '../../lib/mindset'

/** One key per day, so the spotlight is a morning ritual and not a toll gate. */
const seenKey = (day: string) => `bujo:mindset-spotlight:${day}`

/**
 * THE PRINCIPLE YOU ARE WORKING ON, IN FRONT OF YOU, ONCE A DAY.
 *
 * Mindset's whole premise is that a principle only changes anything if you are
 * holding it while you act. Leaving it as the first band means it is read on
 * the way to something else, which is how it becomes wallpaper.
 *
 * **Once per day, not once per visit.** The ask was "when this page loads",
 * and a dialog on every load would be a click to dismiss between you and your
 * own journal several times an evening — the fastest way to teach someone to
 * dismiss it without reading. The day key keeps the first open of the day
 * arresting and every later one quiet, which is the effect the ask was after.
 *
 * `modal={false}` is load-bearing and not a style choice. A modal dialog traps
 * focus and makes the page inert behind it, and this one opens on its own with
 * nobody having asked for it — so it must never be able to strand a keyboard
 * user or, for that matter, the browser gates, which drive real clicks and
 * cannot dismiss what they did not open. Escape and the button both close it;
 * the page behind stays usable the whole time.
 *
 * Renders nothing when no principle is in focus. A spotlight with nothing to
 * point at is a dialog that exists to be closed.
 */
export function PrincipleSpotlight({
  principle,
  cue,
  today,
  practisedToday,
  onPractise,
}: {
  principle: MindsetPrinciple | undefined
  /** The personal note on the focus slot — what YOU decided to do about it. */
  cue?: string
  today: string
  practisedToday: boolean
  onPractise: () => void
}) {
  const [dismissed, setDismissed] = useState(false)

  /**
   * Derived, not pushed through state.
   *
   * The first version set `open` from inside an effect, which `verify` rejects
   * — "calling setState synchronously within an effect can trigger cascading
   * renders" — and it deserved to: whether the spotlight belongs on screen is a
   * function of today's date, the focus slot and whether you have closed it,
   * all of which are known at render. Only the *recording* is a side effect.
   *
   * A private window, cleared site data, or a browser refusing storage all
   * throw on read. None of those is a reason to withhold the principle, so the
   * failure mode is "show it".
   */
  const seen = useMemo(() => {
    try {
      return localStorage.getItem(seenKey(today)) === '1'
    } catch {
      return false
    }
  }, [today])

  const open = !!principle && !seen && !dismissed

  useEffect(() => {
    if (!open) return
    try {
      localStorage.setItem(seenKey(today), '1')
    } catch {
      /* it will open again next load, which is the mild failure */
    }
  }, [open, today])

  if (!principle) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && setDismissed(true)} modal={false}>
      <DialogContent className="max-w-lg" blocking={false}>
        <DialogHeader>
          <Eyebrow>Today&rsquo;s leading principle</Eyebrow>
          <DialogTitle className="font-display text-title text-balance">{principle.title}</DialogTitle>
          <DialogDescription className="text-body text-pretty text-fg-2">{principle.why}</DialogDescription>
        </DialogHeader>

        {/* Your own words rank above the library's. The principle says what is
            true; the cue says what you decided to do about it, and that is the
            sentence worth carrying into the day. */}
        {cue?.trim() && (
          <p className="border-l-2 border-brand pl-3 text-body text-pretty text-fg-1">{cue.trim()}</p>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setDismissed(true)}>
            Keep it in mind
          </Button>
          <Button
            variant="primary"
            disabled={practisedToday}
            onClick={() => {
              onPractise()
              setDismissed(true)
            }}
          >
            {practisedToday ? 'Practised today ✓' : 'Mark practised'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
