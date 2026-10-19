import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { DayEditor } from './DayEditor'
import { DayMore } from './DayMore'
import { prettyDay } from '../../lib/date'
import type { CyclePoint } from '../../lib/types'

/**
 * ONE DAY, IN A WINDOW, WITH EVERYTHING ON IT.
 *
 * WHAT THIS FILE OWNS: that the day's controls appear over the list instead
 * of beside it, and which day that is.
 * WHAT IT DOES NOT OWN: any of the controls. It renders `DayEditor` and
 * `DayMore` — the same two the act column renders.
 *
 * ── Why ──────────────────────────────────────────────────────────────────
 *
 * Asked for directly: *"if I'm in my logs, why do I need to scroll and do
 * that? Just show me a new window with all the information where I can edit
 * all that information."*
 *
 * Pressing a row in `Your log` used to select that day and move the month
 * cursor — and the editor it selected lives in the ACT COLUMN, which is the
 * other side of the page on a desktop and a collapsed strip at the top on a
 * phone. So the reader pressed a row in the review and the thing that
 * changed was somewhere they then had to go and find.
 *
 * ── It hosts the controls, it does not re-declare them ───────────────────
 *
 * This is the whole discipline of the file, and the reason it is twenty
 * lines rather than two hundred. A second editor would drift from the first
 * — which is exactly the fault fixed in Pickleball this week, where a
 * history editor re-declared five of a form's fourteen fields and the other
 * nine became uneditable.
 *
 * ── The dialog is the app's own ──────────────────────────────────────────
 *
 * `components/ui/dialog.tsx` is a Radix dialog with five existing callers,
 * so the focus trap, Escape, scroll lock and focus restore are not written
 * here and cannot be written here WRONG. The ticket for this work assumed
 * the app had no editing dialog and would need a new primitive; checking
 * first is what turned a new component into a reused one.
 */
export function DayWindow({ date, entry, unit, cycleDay, fertilityFirst, onClose, onTemp, onToggleFlag, onDrive, onPatch }: {
  /** The day to edit, or `null` when the window is shut. */
  date: string | null
  entry: CyclePoint | undefined
  unit: string
  /** 1-based cycle day, drawn by `DayEditor`'s header — see the title below. */
  cycleDay?: number | null
  fertilityFirst: boolean
  onClose: () => void
  onTemp: (temp: number | undefined) => void
  onToggleFlag: (flag: string) => void
  onDrive: (drive: number | undefined) => void
  onPatch: (patch: Partial<CyclePoint>) => void
}) {
  return (
    <Dialog open={date != null} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          {/* `sr-only`, because `DayEditor` draws this exact day six pixels
              below — the window read **"Fri, Oct 9 / Fri, Oct 9"**, which is
              the same sentence twice and the fault this page's own history is
              made of. Radix requires a `DialogTitle` for the dialog's
              accessible name, so it stays and stops being drawn; the editor's
              own header is the visible one, and it carries the cycle day
              besides. */}
          <DialogTitle className="sr-only">{date ? prettyDay(date) : ''}</DialogTitle>
        </DialogHeader>
        {date && (
          <div className="space-y-3">
            <DayEditor
              date={date}
              entry={entry}
              unit={unit}
              cycleDay={cycleDay}
              onTemp={onTemp}
              onToggleFlag={onToggleFlag}
              onDrive={onDrive}
            />
            <DayMore entry={entry} onPatch={onPatch} fertilityFirst={fertilityFirst} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
