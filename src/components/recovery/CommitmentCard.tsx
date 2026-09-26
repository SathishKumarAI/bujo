import { Heart } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../../store'
import { Card, Input, Textarea } from '../ui'
import { Button } from '../ui/button'
import { cat, onRaised } from '../../lib/colors'
import { prettyDay, todayISO, dayDiff } from '../../lib/date'

/** My commitment (#316) · quit-date contract + the personal "why", read back as a quote. */
export function CommitmentCard() {
  const { data, setCommitment } = useJournal()
  const [editing, setEditing] = useState(false)
  const today = todayISO()
  const commitment = data.nofap.commitment
  const hasCommitment = !!(commitment?.quitDate || commitment?.reason)
  // Days since the quit date (clamped at 0; future quit dates read as 0 so far).
  const daysSinceQuit = commitment?.quitDate ? Math.max(0, dayDiff(commitment.quitDate, today)) : null

  return (
    <Card band hideInfo title={<span className="inline-flex items-center gap-2"><Icon as={Heart} size="md" className="text-mauve" /> My commitment</span>}
      subtitle="Your quit-date contract, the reason you’re doing this"
      right={hasCommitment && !editing ? <Button variant="secondary" size="sm" onClick={() => setEditing(true)} className="text-label">Edit</Button> : undefined}>
      {hasCommitment && !editing ? (
        <div>
          {commitment?.reason && (
            <blockquote className="border-l-2 pl-3 text-heading font-medium italic" style={{ borderColor: cat('mauve'), color: onRaised('text') }}>
              “{commitment.reason}”
            </blockquote>
          )}
          {commitment?.quitDate && (
            <p className="mt-3 text-body text-fg-2">
              Committed on <span className="font-medium text-fg-1">{prettyDay(commitment.quitDate)}</span>
              {daysSinceQuit != null && daysSinceQuit > 0 && <> · <span className="font-medium" style={{ color: onRaised('mauve') }}>{daysSinceQuit}</span> day{daysSinceQuit === 1 ? '' : 's'} ago</>}
              {daysSinceQuit === 0 && <> · <span style={{ color: onRaised('mauve') }}>today</span></>}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block text-body text-fg-1">Quit date
            <Input type="date" value={commitment?.quitDate ?? ''} max={today} onChange={(e) => setCommitment({ quitDate: e.target.value })} className="mt-1" aria-label="Quit date" />
          </label>
          <label className="block text-body text-fg-1">Why I quit
            <Textarea value={commitment?.reason ?? ''} onChange={(e) => setCommitment({ reason: e.target.value })} placeholder="The reason that matters most to you…" rows={2} className="mt-1" aria-label="Reason for quitting" />
          </label>
          {editing && <div className="flex justify-end"><Button variant="secondary" onClick={() => setEditing(false)}>Done</Button></div>}
        </div>
      )}
    </Card>
  )
}
