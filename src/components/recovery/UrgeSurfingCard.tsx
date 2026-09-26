import { HandFist } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState, useRef } from 'react'
import { useJournal } from '../../store'
import { Card, Input, Pill } from '../ui'
import { Button } from '../ui/button'
import { cat, onRaised } from '../../lib/colors'
import { prettyDay } from '../../lib/date'
import { URGE_PRESETS, HALT_STATES, haltTally, type HaltState } from '../../lib/streak'
import { techniqueRanking, matchPlanForTrigger } from '../../lib/urge'
import { ChipPick } from '../ui/quickpick'
import { notify } from '../../lib/notify'

const TECHNIQUES: { id: 'surf' | 'delay' | 'halt' | 'reach-out'; label: string }[] = [
  { id: 'surf', label: 'Surf it' },
  { id: 'delay', label: 'Delay 10 min' },
  { id: 'halt', label: 'HALT check' },
  { id: 'reach-out', label: 'Reach out' },
]
const TECH_LABEL: Record<'surf' | 'delay' | 'halt' | 'reach-out', string> = {
  surf: 'Surf it', delay: 'Delay 10 min', halt: 'HALT check', 'reach-out': 'Reach out',
}

/**
 * Urge surfing · pick what it was, log the win with date + time.
 *
 * Zone 2's primary "cope & log" action, promoted above the analytics. Owns its
 * own form state and its own write, so the page wires nothing: the four fields,
 * the double-tap guard and the read-back tallies are one concern and no other
 * surface reads any of them.
 *
 * **"I resisted it" stays a ONE-TAP action, deliberately.**
 *
 * The audit flagged it as the last unguarded save in the app, and the obvious
 * fix — require a trigger, or a technique — is the wrong one here. Every other
 * form in this app records something that already happened at your leisure.
 * This one is pressed *during* an urge, which is the worst possible moment to be
 * asked a question, and a required field would push people to not log at all. An
 * urge resisted with no context is still an urge resisted; the context fields
 * are a bonus, not the record.
 *
 * What was actually wrong was the other end: the × that removes a row was
 * `opacity-0 group-hover:opacity-100`, and Tailwind wraps `hover:` in
 * `@media (hover: hover)` — so on a phone the undo for a mis-tap **did not
 * render at all**. That is fixed globally by `.reveal` in `index.css`
 * (25 controls, 18 files, every Edit and Remove in the app).
 *
 * The one thing guarded here is the double-tap: two rows in the same few seconds
 * is a fat finger, not two urges, and this button sits under a thumb. It
 * inflates `stats.urges`, the conversion rate and the page's signature chart,
 * none of which are worth a phantom win.
 */
export function UrgeSurfingCard() {
  const { data, resistUrge, removeUrge } = useJournal()
  const [urge, setUrge] = useState('')
  const [intensity, setIntensity] = useState(3)
  const [technique, setTechnique] = useState<'surf' | 'delay' | 'halt' | 'reach-out' | undefined>(undefined)
  const [halt, setHalt] = useState<HaltState[]>([])
  /** Guards the fat-finger double-tap; see the docstring above. */
  const lastUrgeAt = useRef(0)

  const plans = data.nofap.plans ?? []
  const matchedPlan = matchPlanForTrigger(plans, urge)
  const techRank = techniqueRanking(data.nofap.urgeLog ?? [])
  const haltRank = haltTally(data)
  const urgeLog = [...(data.nofap.urgeLog ?? [])].sort((a, b) => (a.at ?? a.date) < (b.at ?? b.date) ? 1 : -1)
  const fmtTime = (iso?: string) => { try { return iso ? new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '' } catch { return '' } }

  function logUrge() {
    const now = Date.now()
    if (now - lastUrgeAt.current < 3000) return
    lastUrgeAt.current = now
    resistUrge({ trigger: urge.trim() || undefined, intensity: intensity as 1 | 2 | 3 | 4 | 5, technique, halt: halt.length ? halt : undefined })
    setUrge(''); setIntensity(3); setTechnique(undefined); setHalt([])
    notify.success('Urge logged', 'Remove it from the list below if it was a mis-tap.')
  }

  return (
    <Card band hideInfo title="Urge surfing" subtitle="Feeling an urge? Name it and log it — it crests and passes in minutes.">
      {/* Was a hand-rolled chip row with inline border/background/colour
          ternaries — and so were the technique and HALT rows below it,
          three copies of the same markup differing only in accent. They
          are one component now (`ChipPick`), which also gives them the
          44px targets and the press feedback the copies never had. */}
      <ChipPick
        label="What is it?"
        value={urge || null}
        onChange={(u) => setUrge(String(u))}
        options={URGE_PRESETS.map((u) => ({ value: u, label: u }))}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Input value={urge} onChange={(e) => setUrge(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && logUrge()} placeholder="…or type your own" list="urge-presets" className="min-w-[10rem] flex-1" />
        {/* `TriggerPlansCard` in zone 3 lists against this same id. An `id`
            reference across two zones is the kind of link a file split breaks
            silently, so it is written down at both ends. */}
        <datalist id="urge-presets">{URGE_PRESETS.map((u) => <option key={u} value={u} />)}</datalist>
      </div>
      {/* Trigger-plan match · surfaced as the user types/picks a trigger (U9) */}
      {matchedPlan && (
        <div className="mt-2 rounded-card p-2 text-label" style={{ background: cat('teal') + '14', border: `1px solid ${cat('teal')}44` }}>
          <span className="font-medium" style={{ color: onRaised('teal') }}>Your plan for “{matchedPlan.trigger}”:</span>{' '}
          <span className="text-fg-2">{matchedPlan.coping || 'name it and let it pass.'}</span>
        </div>
      )}
      {/* Intensity 1–5 (U8) */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-label text-fg-1">
          <label htmlFor="urge-intensity">Intensity</label>
          <span className="font-medium" style={{ color: onRaised('peach') }}>{intensity}/5</span>
        </div>
        <input id="urge-intensity" type="range" min={1} max={5} step={1} value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
          className="mt-1 w-full accent-mauve" style={{ accentColor: cat('mauve') }} aria-label="Urge intensity, 1 to 5" />
      </div>
      {/* Technique chips (U8) */}
      <div className="mt-3">
        <ChipPick
          label="What helped?"
          tone="teal"
          value={technique ?? null}
          onChange={(t) => setTechnique(technique === t ? undefined : (t as typeof technique))}
          options={TECHNIQUES.map((t) => ({ value: t.id, label: t.label }))}
        />
      </div>
      {/* HALT quick-check · which unmet need is driving the urge? */}
      <div className="mt-3">
        <ChipPick
          label="HALT check"
          tone="peach"
          multi
          hint="Tap any that fit — several can be true at once."
          value={halt}
          onChange={(id) => setHalt((cur) => cur.includes(id as typeof cur[number]) ? cur.filter((x) => x !== id) : [...cur, id as typeof cur[number]])}
          options={HALT_STATES.map((h) => ({ value: h.id, label: h.label }))}
        />
      </div>
      <div className="mt-3 flex justify-end">
        <Button variant="secondary" onClick={logUrge} className="inline-flex items-center gap-1.5"><Icon as={HandFist} size="sm" /> Log this urge</Button>
      </div>

      {/* Most-effective technique tally (U8) */}
      {techRank.length > 0 && (
        <div className="mt-2 rounded-card bg-ink-2 p-2.5 text-label">
          <div className="mb-1 text-fg-1">Most-used technique: <span className="font-medium" style={{ color: onRaised('teal') }}>{TECH_LABEL[techRank[0].technique]}</span> · {techRank[0].count}×</div>
          <div className="flex flex-wrap gap-1.5">
            {techRank.map((t) => (
              <Pill key={t.technique} tone="muted">{TECH_LABEL[t.technique]} {t.count}</Pill>
            ))}
          </div>
        </div>
      )}
      {/* HALT pattern tally · which unmet need accompanies urges most */}
      {haltRank.length > 0 && (
        <div className="mt-2 rounded-card bg-ink-2 p-2.5 text-label">
          <div className="mb-1 text-fg-1">HALT pattern: <span className="font-medium" style={{ color: onRaised('peach') }}>{haltRank[0].label}</span> most often · {haltRank[0].count}×</div>
          <div className="flex flex-wrap gap-1.5">
            {haltRank.map((h) => (
              <Pill key={h.state} tone="muted">{h.label} {h.count}</Pill>
            ))}
          </div>
        </div>
      )}
      {urgeLog.length > 0 && (
        <ul className="mt-2 max-h-56 space-y-1.5 overflow-auto">
          {urgeLog.map((u) => (
            <li key={u.id} className="group flex items-center gap-2 rounded-card bg-ink-2 px-2.5 py-1.5 text-body">
              <Icon as={HandFist} size="sm" style={{ color: onRaised('green') }} className="shrink-0" />
              <span className="text-fg-1">{u.trigger || 'Urge'}</span>
              <span className="ml-auto text-label text-fg-2">{prettyDay(u.date)}{fmtTime(u.at) ? ` · ${fmtTime(u.at)}` : ''}</span>
              <Button variant="ghost" size="icon-sm" onClick={() => removeUrge(u.id)} aria-label="Remove" className="text-fg-2 reveal hover:text-red">×</Button>
            </li>
          ))}
        </ul>
      )}
      {(data.nofap.urgesResisted ?? 0) > 0 && <p className="mt-2 text-label text-fg-2">+ {data.nofap.urgesResisted} logged before dated entries existed.</p>}
    </Card>
  )
}
