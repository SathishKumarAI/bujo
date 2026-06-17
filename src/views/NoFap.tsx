import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { useJournal } from '../store'
import { Button, Card, Empty, Input, Textarea } from '../components/ui'
import { cat } from '../lib/colors'
import { dayDiff, prettyDay, todayISO } from '../lib/date'

/**
 * Abstinence / NoFap streak journal — counter, personal best, relapse log
 * with trigger + reflection. Private, local-only, judgement-free framing.
 */
export function NoFap() {
  const { data, logRelapse, resistUrge } = useJournal()
  const [trigger, setTrigger] = useState('')
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  const s = data.nofap
  const today = todayISO()
  const current = Math.max(0, dayDiff(s.startedOn, today))
  const best = Math.max(s.best, current)
  const relapsedToday = s.relapses.some((r) => r.date === today)

  function relapse() {
    // Ask for the reason — that's the whole point of logging it.
    if (!trigger.trim()) { setErr('Add the reason behind it first.'); return }
    logRelapse({ date: today, trigger: trigger.trim(), note: note.trim() })
    setTrigger(''); setNote(''); setErr('')
  }

  // Milestone ladder for motivation.
  const milestones = [1, 3, 7, 14, 30, 60, 90, 180, 365]
  const nextMilestone = milestones.find((m) => m > current)

  return (
    <div className="mx-auto grid max-w-[1400px] items-start gap-5 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card className="text-center glow-mauve">
          <div className="text-sm text-subtext0">Days resisted</div>
          <div className="text-6xl font-extrabold" style={{ color: relapsedToday ? cat('red') : cat('mauve') }}>{current}</div>
          <div className="text-sm text-subtext0">days resisted · started {prettyDay(s.startedOn)}</div>
          {relapsedToday && <div className="mt-1 inline-flex items-center gap-1 text-sm font-medium" style={{ color: cat('red') }}><X size={14} /> Relapsed today — counter reset</div>}
          {nextMilestone && (
            <div className="mt-3 text-xs text-overlay0">
              Next milestone: <span style={{ color: cat('teal') }}>{nextMilestone} days</span> ({nextMilestone - current} to go)
            </div>
          )}
          <div className="mt-2 text-xs text-overlay0">Personal best: <span style={{ color: cat('peach') }}>{best} days</span></div>
        </Card>

        <Card title="Urge surfing" subtitle="Resisted an urge? Mark the win — it passes in minutes.">
          <div className="flex items-center justify-between">
            <span className="text-sm text-subtext1">
              Urges resisted: <span className="font-semibold" style={{ color: cat('green') }}>{s.urgesResisted ?? 0}</span>
            </span>
            <Button variant="primary" onClick={resistUrge}>I resisted an urge</Button>
          </div>
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

        <Card title="Relapse history" subtitle={s.relapses.length ? `${s.relapses.length} relapse${s.relapses.length === 1 ? '' : 's'} — no shame, patterns are data` : 'No shame — patterns are data'}>
          {s.relapses.length === 0 ? (
            <Empty>No relapses logged. Keep going.</Empty>
          ) : (
            <ul className="space-y-2 text-sm">
              {[...s.relapses].reverse().map((r) => (
                <li key={r.id} className="rounded-lg border p-2" style={{ borderColor: cat('red') + '55', background: cat('red') + '12' }}>
                  <div className="flex items-center gap-1.5 font-medium" style={{ color: cat('red') }}><X size={13} /> Relapse · {prettyDay(r.date)}</div>
                  {r.trigger && <div className="mt-0.5 text-subtext1"><span className="text-overlay0">Reason:</span> {r.trigger}</div>}
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
              Reason <span style={{ color: cat('red') }}>*</span>
              <Input value={trigger} onChange={(e) => { setTrigger(e.target.value); if (err) setErr('') }} placeholder="What led to it? (required)" className="mt-1" />
            </label>
            <label className="block text-sm text-subtext1">
              Reflection
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What will you do differently?" rows={4} className="mt-1" />
            </label>
            {err && <p className="text-xs" style={{ color: cat('red') }}>{err}</p>}
            <Button variant="danger" onClick={relapse} className="w-full">Log relapse &amp; reset</Button>
            <p className="text-xs text-overlay0">Records the reason today, then restarts the days-resisted counter.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
