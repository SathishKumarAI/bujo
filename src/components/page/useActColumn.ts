import { useState } from 'react'
import { useStickyState } from '../../lib/useStickyState'

/**
 * THE ACT COLUMN'S OPEN/SHUT STATE, INCLUDING THE ONE RULE NOBODY GUESSES.
 *
 * Wide, the act is a column beside the review and open is the right default.
 * **Stacked, it is the whole width of the page, and open is the wrong
 * default** — one column cannot have a 683px form above the record AND the
 * record near the top. Measured on Pickleball at a 1152px window:
 *
 * | order | what it cost |
 * |---|---|
 * | form first (the shared default) | the rail sat at **y1057**, a screen down |
 * | record first (`actLast`) | the form drifted to **y880**, and to **y1321** just by switching to a bigger panel |
 * | **shut by default** | strip **41px**, rail **y415**, form one tap away |
 *
 * Reported twice, from both sides — "when I click Matchups it tries to get
 * downwards" and then "it's still moving down" — because the two orders trade
 * the problem rather than fix it. Shut is the fix: when you tap it open you
 * are logging, so the form being at the top is the point, and the record
 * moving below it is what you asked for in that moment.
 *
 * **`stacked` has to come from the shell.** The split is a container query on
 * the 900px shell, so no viewport test can answer it: a 1152px window with the
 * rail open is a "desktop" by `useDevice()` and stacks anyway. `PageLayout`
 * measures it and tells the page through `onSplitChange`.
 *
 * **`touched` keeps it a DEFAULT, not a rule.** Once the reader has opened or
 * shut the column themselves, their choice holds while the page is open, and
 * the sticky value keeps governing the desktop — where it is a real
 * preference rather than a reaction to a layout they can see.
 *
 * ```tsx
 * const col = useActColumn('pickleball')
 * <PageLayout
 *   onSplitChange={col.onSplitChange}
 *   actShut={col.shut}
 *   zone2={col.shut ? <ActStrip label="Log a session" onOpen={col.open} /> : <Form onShut={col.close} />}
 * />
 * ```
 */
export function useActColumn(key: string) {
  const [act, setAct] = useStickyState<'open' | 'shut'>(`${key}.act`, 'open', ['open', 'shut'])
  const [stacked, setStacked] = useState(false)
  const [touched, setTouched] = useState(false)

  return {
    /** True when zone 2 should render its `ActStrip` instead of its content. */
    shut: act === 'shut' || (stacked && !touched),
    open: () => { setTouched(true); setAct('open') },
    close: () => { setTouched(true); setAct('shut') },
    /** Hand straight to `PageLayout`'s `onSplitChange`. */
    onSplitChange: (split: boolean) => setStacked(!split),
  }
}
