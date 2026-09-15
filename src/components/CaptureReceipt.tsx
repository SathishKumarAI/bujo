import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ArrowCounterClockwise, CheckCircle, X } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useNav } from './shell/nav'
import { useJournal } from '../store'
import { Button } from './ui/button'
import { landingForCapture, landingForRecord, type Landing } from '../lib/captureLanding'
import { changedKeys, fingerprint, type RecordFingerprints } from '../lib/recordKeys'
import type { ImportRecord } from '../lib/ingest/envelope'
import type { CaptureResult } from '../lib/capture'

/**
 * WHAT JUST HAPPENED, ON THE PAGE IT HAPPENED TO.
 *
 * A capture used to end in a four-second toast in the corner and leave you
 * exactly where you were standing. That is right for "deleted" — which is about
 * the thing you were already looking at — and wrong for "saved": say "I played
 * two games and scored 68" from Today and the sentence writes a pickleball
 * session onto a page you are not on. The toast said `Saved.`, the screen did
 * not change, and the only way to believe it was to go and look.
 *
 * So a capture now **moves the app to the page holding the record** and leaves
 * a receipt under the header naming what was written, with Undo. The record is
 * on screen behind it; the receipt is the line that says which of the things on
 * screen is the new one.
 *
 * Deliberately not a toast: a toast is dismissed by time, and the point of this
 * one is to still be there after the page has been read. It goes when it is
 * dismissed, when the next capture replaces it, or after `LIFETIME_MS`.
 *
 * Deliberately not a dialog: "change it" means editing the record on its own
 * page, and a modal over that page is the one thing that prevents it.
 *
 * The bar names the record; `useJustCaptured` POINTS at it. A list that opts in
 * marks its row `data-just-captured`, which scrolls the row into view once and
 * rings it for a few seconds. The set is computed by fingerprinting the journal
 * before the write and diffing after, so it costs the call sites nothing and
 * cannot drift from what was actually written — see `lib/recordKeys.ts`.
 *
 * The navigation lives here rather than at the call sites. There are two of
 * them today (the Talk dialog, the quick-add bar) and a third is obvious, and
 * "saved but did not move" is a bug that does not show up in a diff.
 */

/** Long enough to read the page it landed on, short enough not to become chrome. */
const LIFETIME_MS = 30_000

/**
 * The ring is a *pointer*, not a state. It has to outlast the eye finding the
 * row after a page change and then stop — a permanent "new" marker on a journal
 * is indistinguishable from a rendering bug a week later.
 */
const RING_MS = 6_000

/**
 * The destination view is code-split, so the row does not exist in the DOM on
 * the frame the capture lands. Three tries rather than an observer: a
 * MutationObserver here would fire on every keystroke in the app for the sake
 * of one scroll.
 */
const FIND_ROW_MS = [120, 400, 1000]

type Receipt = {
  /** Fresh per capture, so an identical second capture still re-announces. */
  id: number
  /** Where the app was sent. */
  landing: Landing
  /** Every line written, the destination's own included. */
  lines: string[]
}

type CaptureApi = {
  /** A Talk-dialog save: navigate to the first record's page, receipt the lot. */
  fromRecords: (records: readonly ImportRecord[]) => void
  /** A quick-add save: one parse, one destination. */
  fromCapture: (result: CaptureResult) => void
}

const Ctx = createContext<{ api: CaptureApi; receipt: Receipt | null; dismiss: () => void; justCaptured: ReadonlySet<string> } | null>(null)

const NONE: ReadonlySet<string> = new Set()

export function CaptureReceiptProvider({ children }: { children: ReactNode }) {
  const nav = useNav()
  const { data } = useJournal()
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [justCaptured, setJustCaptured] = useState<ReadonlySet<string>>(NONE)
  const seq = useRef(0)

  // The snapshot has to be of the journal as it was BEFORE the write, and both
  // capture paths write and then call us inside the same handler — so the last
  // committed `data` is the "before" we want, and a ref is how the handler
  // reaches it without `land` being rebuilt on every keystroke in the app.
  //
  // Assigned in an effect rather than during render: a ref written during
  // render is a lint error and, worse, a lie under Strict Mode's double render.
  // An effect with no dependency array runs after every commit and long before
  // any click, so the handler always reads the committed journal.
  const dataRef = useRef(data)
  useEffect(() => { dataRef.current = data })
  const before = useRef<RecordFingerprints | null>(null)

  const dismiss = useCallback(() => { setReceipt(null); setJustCaptured(NONE) }, [])

  const api = useMemo<CaptureApi>(() => {
    const land = (landings: Landing[]) => {
      before.current = fingerprint(dataRef.current)
      seq.current += 1
      setReceipt({ id: seq.current, landing: landings[0], lines: landings.map((l) => l.what).filter(Boolean) })
      nav(landings[0].view)
    }
    return {
      fromRecords: (records) => { if (records.length > 0) land(records.map(landingForRecord)) },
      fromCapture: (result) => land([landingForCapture(result)]),
    }
  }, [nav])

  // The write has landed by the time this runs, so the diff is what the capture
  // actually did — not what it was asked to do. A sentence the planner folded
  // into an existing row still changes that row's fingerprint, which is why
  // this is a fingerprint diff and not a set difference: "mood 7" on a day that
  // already had a sleep figure is an update, and it is the commonest capture in
  // the app.
  useEffect(() => {
    if (!before.current) return
    const changed = changedKeys(before.current, fingerprint(data))
    before.current = null
    if (changed.size > 0) setJustCaptured(changed)
  }, [data])

  // Scroll the first marked row into view, once it exists.
  useEffect(() => {
    if (justCaptured.size === 0) return
    const timers = FIND_ROW_MS.map((ms) =>
      setTimeout(() => {
        const row = document.querySelector('#main [data-just-captured]')
        if (!row) return
        for (const t of timers) clearTimeout(t)
        row.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }, ms),
    )
    const stop = setTimeout(() => setJustCaptured(NONE), RING_MS)
    return () => { for (const t of timers) clearTimeout(t); clearTimeout(stop) }
  }, [justCaptured])

  const value = useMemo(() => ({ api, receipt, dismiss, justCaptured }), [api, receipt, dismiss, justCaptured])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

function useCtx() {
  const c = useContext(Ctx)
  if (!c) throw new Error('CaptureReceipt must be used within CaptureReceiptProvider')
  return c
}

/** What a capture path calls after it has written. */
// eslint-disable-next-line react-refresh/only-export-components -- context hook co-located with its provider, matching shell/nav.tsx
export function useCaptureReceipt() {
  return useCtx().api
}

/**
 * The records this capture wrote, as `lib/recordKeys.ts` keys.
 *
 * A list calls this once and asks it per row — `just.has(ENTRY_KEY(e.id))` —
 * then spreads `justCapturedProps(...)` onto the row element. Empty at every
 * other moment in the app's life, so a view that opts in pays one `Set.has`
 * per row and nothing else.
 */
// eslint-disable-next-line react-refresh/only-export-components -- context hook co-located with its provider, matching shell/nav.tsx
export function useJustCaptured(): ReadonlySet<string> {
  // Tolerant of a missing provider, unlike `useCaptureReceipt`, and the
  // asymmetry is deliberate. Writing is the half that must be loud: "saved but
  // did not move" is invisible, so `useCaptureReceipt` throws. Reading is a
  // decoration — no provider means no capture has happened, which is exactly
  // what an empty set says. It also keeps a view mountable on its own, which is
  // how `views/Fitness.test.tsx` and friends render them.
  return useContext(Ctx)?.justCaptured ?? NONE
}

/**
 * What a row spreads to be found and rung: the attribute only.
 *
 * It deliberately does NOT carry a `className` — spreading one onto a row that
 * already has its own silently replaces it, and every row here has its own. The
 * class is `just-captured`, applied by the call site; the attribute is what the
 * scroll-into-view query looks for, and the two live in different files, which
 * is why the attribute at least has one home.
 */
// eslint-disable-next-line react-refresh/only-export-components -- helper co-located with the hook that feeds it
export const justCapturedProps = (isNew: boolean) => (isNew ? { 'data-just-captured': true } : {})

/** The bar itself. Mounted once by the shell, under the header and above `main`. */
export function CaptureReceipt() {
  const { receipt, dismiss } = useCtx()
  const { undo } = useJournal()

  // Keyed on the receipt id, so a second capture restarts the clock rather than
  // inheriting what was left of the first one's.
  const id = receipt?.id
  useEffect(() => {
    if (id == null) return
    const t = setTimeout(dismiss, LIFETIME_MS)
    return () => clearTimeout(t)
  }, [id, dismiss])

  if (!receipt) return null

  return (
    // `role="status"` rather than focus: a screen reader hears what was saved
    // without the caret being taken away from whatever is being read.
    <div
      role="status"
      className="mx-4 mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-card border border-line bg-ink-1 px-4 py-3 shadow-raise sm:mx-6"
    >
      <Icon as={CheckCircle} size="md" className="shrink-0 text-green" />

      <div className="min-w-0 flex-1">
        <p className="text-body font-medium text-fg-1">Saved to {receipt.landing.where}</p>
        {receipt.lines.length > 0 && <p className="truncate text-label text-fg-2">{receipt.lines.join(' · ')}</p>}
      </div>

      {/* `flex-wrap` on the row AND on this cluster: a container cannot wrap a
          cluster whose markup it does not own, and at 390px this row is a
          two-line label plus two controls. */}
      <div className="flex flex-none flex-wrap items-center gap-1.5">
        <Button variant="secondary" size="sm" onClick={() => { undo(); dismiss() }} className="gap-1.5">
          <Icon as={ArrowCounterClockwise} size="sm" /> Undo
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={dismiss} aria-label="Dismiss">
          <Icon as={X} size="sm" />
        </Button>
      </div>
    </div>
  )
}
