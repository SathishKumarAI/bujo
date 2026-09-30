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
/** Intensity 1–5 on the app's severity ramp. Index is `intensity - 1`. */
const INTENSITY_HUE = ['green', 'teal', 'yellow', 'peach', 'red'] as const

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
 * **…and the layout said the opposite of that paragraph.** The submit sat at
 * the FOOT of the card, under ten trigger chips, an intensity slider, four
 * technique chips and four HALT chips. Measured at 1440 on `?demo=1`: the act
 * column is its own 760px scrollport and "Log this urge" sat **1130px** inside
 * it — 370px past the panel's bottom edge, behind a nested scroll most people
 * never find. On a 390px phone it was at **y 1613 in an 844px viewport**, 1.9
 * screens down. The one act this page most wants to be frequent was the one
 * act you had to go looking for.
 *
 * So the button moves to the top and the optional fields follow it. This is
 * not a form with a misplaced submit — it is a button with optional
 * annotations, which is what the paragraph above always said it was. Nothing
 * is hidden and no field changed; the read-back (tallies, history) stays
 * below, where reference content belongs.
 *
 * It is also this page's **one primary**. Recovery had none — `DayTallyCard`
 * reasoned that no act outranked another, and on a page whose product ranking
 * puts capture first, one does.
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
  const { data, resistUrge, removeUrge, logLapseDay } = useJournal()
  const [urge, setUrge] = useState('')
  const [intensity, setIntensity] = useState(3)
  const [technique, setTechnique] = useState<'surf' | 'delay' | 'halt' | 'reach-out' | undefined>(undefined)
  const [halt, setHalt] = useState<HaltState[]>([])
  const [addictionId, setAddictionId] = useState('')
  const addictions = data.nofap.addictions ?? []
  /** Guards the fat-finger double-tap; see the docstring above. */
  const lastUrgeAt = useRef(0)

  const plans = data.nofap.plans ?? []
  const matchedPlan = matchPlanForTrigger(plans, urge)
  const techRank = techniqueRanking(data.nofap.urgeLog ?? [])
  const haltRank = haltTally(data)
  const urgeLog = [...(data.nofap.urgeLog ?? [])].sort((a, b) => (a.at ?? a.date) < (b.at ?? b.date) ? 1 : -1)
  const fmtTime = (iso?: string) => { try { return iso ? new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '' } catch { return '' } }

  /**
   * ONE FORM, TWO ENDINGS.
   *
   * An urge has two possible outcomes and the app only recorded one of them
   * richly: resisting wrote the intensity, the HALT states, the technique and
   * the trigger, while giving in wrote a date and a word through a different
   * control on a different card. So the context was discarded at exactly the
   * moment it was most worth having — the times you gave in are the ones you
   * want fewer of.
   *
   * Both buttons write the same `UrgeWin` with the same fields and differ in
   * one: `outcome`. `followed` additionally calls `logLapseDay`, because the
   * STREAK and the occurrence count still come from `Relapse` — one number, one
   * source, no double counting.
   */
  function logUrge(outcome: 'resisted' | 'followed') {
    const now = Date.now()
    if (now - lastUrgeAt.current < 3000) return
    lastUrgeAt.current = now
    // Falls back to the only addiction when there is exactly one: asking
    // "which?" of someone tracking a single thing is a question with one
    // answer, and a required field with one option is friction.
    const forId = addictionId || (addictions.length === 1 ? addictions[0].id : undefined)
    resistUrge({
      trigger: urge.trim() || undefined,
      intensity: intensity as 1 | 2 | 3 | 4 | 5,
      technique,
      halt: halt.length ? halt : undefined,
      addictionId: forId,
      outcome,
    })
    if (outcome === 'followed') logLapseDay(forId ?? null)
    setUrge(''); setIntensity(3); setTechnique(undefined); setHalt([]); setAddictionId('')
    if (outcome === 'resisted') {
      notify.success('Urge logged', 'Remove it from the list below if it was a mis-tap.')
    } else {
      // Not "failure", not a red toast. The whole design bet on this page is
      // that someone who feels punished for the honest entry stops making it,
      // and an app that only hears about good days knows nothing.
      notify.success('Logged', 'That is data, not a verdict — it is what makes the patterns below real.')
    }
  }

  return (
    <Card hideInfo title="Urge surfing" subtitle="Feeling an urge? Name it and log it — it crests and passes in minutes.">
      {/* THE ACT, FIRST · see the docstring. Full width and `lg` (44px) because
          this is the control a thumb aims at mid-urge, and `primary` because
          it is the page's one loud thing to do. */}
      {/* TWO BUTTONS, ONE FORM. The fields above apply to whichever you press,
          so the same moment is captured either way and the only difference is
          how it ended.

          `primary` stays on "I held" alone — the page's one loud control, and
          the outcome worth aiming at. "I gave in" is `secondary`: reachable,
          equally sized (44px, same row), and deliberately not styled as a
          failure. A destructive-looking button here would be the app telling
          someone they are bad for being honest. */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant="primary" size="lg" onClick={() => logUrge('resisted')} className="flex-1 gap-2">
          <Icon as={HandFist} size="md" /> I felt it and held
        </Button>
        <Button variant="secondary" size="lg" onClick={() => logUrge('followed')} className="flex-1 gap-2">
          I gave in
        </Button>
      </div>
      <p className="-mt-2 mb-4 text-label text-fg-2">
        Both count. Logging the ones you gave in is what lets the page show you what was different
        about them.
      </p>
      {/* Was a hand-rolled chip row with inline border/background/colour
          ternaries — and so were the technique and HALT rows below it,
          three copies of the same markup differing only in accent. They
          are one component now (`ChipPick`), which also gives them the
          44px targets and the press feedback the copies never had. */}
      {/* WHICH ONE. Without this the ledger cannot tell a resisted cigarette
          from a resisted scroll, and every per-addiction reading on the page is
          a name join that matches nothing (COD-251). Sourced from the user's
          OWN addictions, so the two vocabularies cannot drift again; the preset
          chips below stay for anyone who has not added any yet. */}
      {addictions.length > 0 && (
        <ChipPick
          label="Which one?"
          className="mb-3"
          value={addictionId}
          onChange={(v) => setAddictionId(addictionId === v ? '' : String(v))}
          options={addictions.map((a) => ({ value: a.id, label: a.name }))}
          hint="So the win lands on the right streak."
        />
      )}
      <ChipPick
        label="What is it?"
        value={urge || null}
        onChange={(u) => setUrge(String(u))}
        options={URGE_PRESETS.map((u) => ({ value: u, label: u }))}
        /* `after`, not a row of its own beneath the chips. `ChipPick` documents
           this slot as "a typed escape hatch … on the end of the row", and the
           input was instead a full-width field stranded under a wrapped chip
           row — the reader met ten chips, then a lone box, then Intensity, with
           nothing saying the box belonged to the chips. Inline it is the
           eleventh option, which is what it is. */
        after={
          <>
            <Input value={urge} onChange={(e) => setUrge(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && logUrge('resisted')} placeholder="…or type your own" list="urge-presets" className="w-[11rem]" />
            {/* `TriggerPlansCard` in zone 3 lists against this same id. An `id`
                reference across two zones is the kind of link a file split
                breaks silently, so it is written down at both ends. */}
            <datalist id="urge-presets">{URGE_PRESETS.map((u) => <option key={u} value={u} />)}</datalist>
          </>
        }
      />

      {/* Trigger-plan match · surfaced as the user types/picks a trigger (U9) */}
      {matchedPlan && (
        <div className="mt-2 rounded-card p-2 text-label" style={{ background: cat('teal') + '14', border: `1px solid ${cat('teal')}44` }}>
          <span className="font-medium" style={{ color: onRaised('teal') }}>Your plan for “{matchedPlan.trigger}”:</span>{' '}
          <span className="text-fg-2">{matchedPlan.coping || 'name it and let it pass.'}</span>
        </div>
      )}
      {/* Intensity 1–5 (U8)
          The slider climbs through the same green→red ramp the rest of the app
          uses for severity, so the control itself says how bad this is instead
          of leaving it to a "3/5" the eye skips. `accentColor` drives the
          filled track, the thumb and the readout from ONE value — no second
          copy of the scale to fall out of step, and `onRaised` keeps the
          readout legible on a card in all five themes rather than painting the
          raw hue as text.
          `h-11`: a bare range input is ~20px tall, which is a COD-96 hit — the
          box around it does the work, the thumb still centres. */}
      {/* `control-max` on the WRAPPER, not just the slider.

          Measured at 1440 before this: the range ended at x=1272 (the 380px
          `.zone-act` control cap catches `input[type=range]` like any other
          input) while this header was a plain flex row spanning the whole card
          and right-aligning "3/5" at x=1286 — **14px past the slider it
          labels**. A readout that does not end where its control ends reads as
          a mistake, and it was invisible at 390 where the column is narrower
          than the cap and everything lines up by accident.

          `.control-max` is the existing opt-in for "cap me like a control"
          (`styles/layout.css`), so one class puts the header and the slider on
          one width instead of hard-coding 380 twice. */}
      <div className="control-max mt-3">
        <div className="flex items-center justify-between text-label text-fg-1">
          <label htmlFor="urge-intensity">Intensity</label>
          <span className="num font-medium" style={{ color: onRaised(INTENSITY_HUE[intensity - 1]) }}>{intensity}/5</span>
        </div>
        <input id="urge-intensity" type="range" min={1} max={5} step={1} value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
          className="h-11 w-full" style={{ accentColor: cat(INTENSITY_HUE[intensity - 1]) }} aria-label="Urge intensity, 1 to 5" />
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
