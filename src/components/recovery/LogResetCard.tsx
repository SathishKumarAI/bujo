import { useState } from 'react'
import { useJournal } from '../../store'
import { Card, Input, Textarea } from '../ui'
import { Button } from '../ui/button'
import { onRaised } from '../../lib/colors'
import { todayISO } from '../../lib/date'

/**
 * Log a reset · the second of zone 2's two acts.
 *
 * The reason IS required here, unlike the urge logger one card up, and the
 * asymmetry is the point: an urge is logged mid-craving when a question is the
 * last thing you need, a reset is logged afterwards and the reason is the only
 * part of it that is any use later.
 */
export function LogResetCard({ best, totalClean }: { best: number; totalClean: number }) {
  const { logRelapse } = useJournal()
  const [trigger, setTrigger] = useState('')
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')

  function relapse() {
    if (!trigger.trim()) { setErr('Add the reason behind it first, patterns are data.'); return }
    logRelapse({ date: todayISO(), trigger: trigger.trim(), note: note.trim() })
    setTrigger(''); setNote(''); setErr('')
  }

  return (
    <Card band hideInfo title="Log a reset" subtitle="Reflect, learn, restart the counter">
      <div className="space-y-3">
        <label className="block text-body text-fg-1">
          Reason <span style={{ color: onRaised('red') }}>*</span>
          <Input value={trigger} onChange={(e) => { setTrigger(e.target.value); if (err) setErr('') }} placeholder="What led to it? (required)" className="mt-1" />
        </label>
        <label className="block text-body text-fg-1">
          Reflection
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What will you do differently next time?" rows={4} className="mt-1" />
        </label>
        {err && <p className="text-label" style={{ color: onRaised('red') }}>{err}</p>}
        <Button variant="danger" size="lg" onClick={relapse} className="w-full">Log reset &amp; restart</Button>
        <p className="text-label text-fg-2">Records the reason today, then restarts the days-clean counter. Your best ({best}d) and total ({totalClean}d) are kept.</p>
      </div>
    </Card>
  )
}
