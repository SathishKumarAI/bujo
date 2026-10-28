import { useState } from 'react'
import { useJournal } from '../../../store'
import { useConfirm } from '../../ConfirmDialog'
import { Cells } from '../../ui/cells'
import { Sheet } from '../../ui/sheet'
import { addDays, prettyDay, todayISO } from '../../../lib/date'
import type { PickleballSession } from '../../../lib/types'
import { SessionFields } from '../SessionFields'
import { draftFrom, sessionPatch, type SessionDraft } from '../sessionDraft'

/**
 * Edit or delete one logged session, on a phone — the whole session, in a
 * sheet. Replaces the history row's 24px "Edit" and 7px "×" links.
 *
 * OWNS: the edit draft and the two outcomes (save, delete).
 * DOES NOT OWN: the fields — the ONE `SessionFields`, every section, so an
 * edit rewrites every stored shape (`docs/USER-CONTROL.md`). Delete asks
 * first and names the session it removes, per the same document.
 */
export function SessionSheet({ session, onClose, partnerNames, venueNames }: {
  session: PickleballSession
  onClose: () => void
  partnerNames: string[]
  venueNames: string[]
}) {
  const { updatePickleball, removePickleball } = useJournal()
  const confirm = useConfirm()
  const [d, setD] = useState<SessionDraft>(() => draftFrom(session))
  const set = (p: Partial<SessionDraft>) => setD((c) => ({ ...c, ...p }))
  const what = `${prettyDay(session.date)} · ${session.format} · ${session.gamesWon}–${session.gamesLost}`

  async function remove() {
    if (await confirm({ title: 'Delete this session?', description: `${what}. This cannot be undone.`, confirmLabel: 'Delete session', destructive: true })) {
      removePickleball(session.id)
      onClose()
    }
  }

  return (
    <Sheet open onOpenChange={(o) => { if (!o) { updatePickleball(session.id, sessionPatch(d)); onClose() } }} title="Edit session" description={what}>
      <div className="flex flex-col gap-4">
        <SessionFields
          f={d}
          set={set}
          recentPartners={partnerNames.slice(0, 1)}
          allPartners={partnerNames}
          recentVenues={venueNames.slice(0, 1)}
          allVenues={venueNames}
          yesterday={addDays(todayISO(), -1)}
        />
        <Cells title="Notes">
          <div className="cell"><textarea value={d.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="How did it go?" rows={3} aria-label="Notes" className="cell-textarea" /></div>
        </Cells>
        <button type="button" onClick={remove} className="h-12 rounded-[0.875rem] bg-danger-wash text-body font-semibold text-danger-text">
          Delete session
        </button>
      </div>
    </Sheet>
  )
}
