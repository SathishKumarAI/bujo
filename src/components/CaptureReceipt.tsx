import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ArrowCounterClockwise, CheckCircle, X } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useNav } from './shell/nav'
import { useJournal } from '../store'
import { Button } from './ui/button'
import { landingForCapture, landingForRecord, type Landing } from '../lib/captureLanding'
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
 * The navigation lives here rather than at the call sites. There are two of
 * them today (the Talk dialog, the quick-add bar) and a third is obvious, and
 * "saved but did not move" is a bug that does not show up in a diff.
 */

/** Long enough to read the page it landed on, short enough not to become chrome. */
const LIFETIME_MS = 30_000

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

const Ctx = createContext<{ api: CaptureApi; receipt: Receipt | null; dismiss: () => void } | null>(null)

export function CaptureReceiptProvider({ children }: { children: ReactNode }) {
  const nav = useNav()
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const seq = useRef(0)
  const dismiss = useCallback(() => setReceipt(null), [])

  const api = useMemo<CaptureApi>(() => {
    const land = (landings: Landing[]) => {
      seq.current += 1
      setReceipt({ id: seq.current, landing: landings[0], lines: landings.map((l) => l.what).filter(Boolean) })
      nav(landings[0].view)
    }
    return {
      fromRecords: (records) => { if (records.length > 0) land(records.map(landingForRecord)) },
      fromCapture: (result) => land([landingForCapture(result)]),
    }
  }, [nav])

  const value = useMemo(() => ({ api, receipt, dismiss }), [api, receipt, dismiss])
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
