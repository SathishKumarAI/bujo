import { useState } from 'react'
import { Check } from 'lucide-react'
import { useJournal } from '../store'
import { Button, Card, Empty, Input, Textarea } from '../components/ui'
import { cat } from '../lib/colors'
import { dayDiff, prettyDay, todayISO } from '../lib/date'

/**
 * Abstinence / NoFap streak journal — counter, personal best, relapse log
 * with trigger + reflection. Private, local-only, judgement-free framing.
 */
export function NoFap() {
  const { data, logRelapse } = useJournal()
  const [trigger, setTrigger] = useState('')
  const [note, setNote] = useState('')
  const s = data.nofap
  const today = todayISO()
  const current = Math.max(0, dayDiff(s.startedOn, today))
  const best = Math.max(s.best, current)

  function relapse() {
    logRelapse({ date: today, trigger: trigger.trim(), note: note.trim() })
    setTrigger(''); setNote('')
  }

  // Milestone ladder for motivation.
  const milestones = [1, 3, 7, 14, 30, 60, 90, 180, 365]
  const nextMilestone = milestones.find((m) => m > current)

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card className="text-center glow-mauve">
          <div className="text-sm text-subtext0">Current streak</div>
          <div className="text-6xl font-extrabold" style={{ color: cat('mauve') }}>{current}</div>
          <div className="text-sm text-subtext0">days clean · started {prettyDay(s.startedOn)}</div>
          {nextMilestone && (
            <div className="mt-3 text-xs text-overlay0">
              Next milestone: <span style={{ color: cat('teal') }}>{nextMilestone} days</span> ({nextMilestone - current} to go)
            </div>
          )}
          <div className="mt-2 text-xs text-overlay0">Personal best: <span style={{ color: cat('peach') }}>{best} days</span></div>
        </Card>

        <Card title="Milestones">
          <div className="flex flex-wrap gap-2">
            {milestones.map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm"
                style={{
                  background: current >= m ? cat('green') : cat('surface0'),
                  color: current >= m ? cat('surface0') : cat('overlay0'),
                }}
              >
                {current >= m && <Check size={13} />}{m}d
              </span>
            ))}
          </div>
        </Card>

        <Card title="Relapse history" subtitle="No shame — patterns are data">
          {s.relapses.length === 0 ? (
            <Empty>No relapses logged. Keep going.</Empty>
          ) : (
            <ul className="space-y-2 text-sm">
              {[...s.relapses].reverse().map((r) => (
                <li key={r.id} className="rounded-lg border border-surface0 bg-base p-2">
                  <div className="text-overlay0">{prettyDay(r.date)}</div>
                  {r.trigger && <div className="text-subtext1">Trigger: {r.trigger}</div>}
                  {r.note && <div className="text-overlay1 italic">{r.note}</div>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div>
        <Card title="Log a reset" subtitle="Reflect, learn, restart the counter">
          <div className="space-y-3">
            <label className="block text-sm text-subtext1">
              Trigger
              <Input value={trigger} onChange={(e) => setTrigger(e.target.value)} placeholder="What led to it?" className="mt-1" />
            </label>
            <label className="block text-sm text-subtext1">
              Reflection
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What will you do differently?" rows={4} className="mt-1" />
            </label>
            <Button variant="danger" onClick={relapse} className="w-full">Reset counter</Button>
            <p className="text-xs text-overlay0">This sets today as a new start date and records the reflection.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
