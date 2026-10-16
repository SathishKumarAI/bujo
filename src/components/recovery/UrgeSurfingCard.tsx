import { HandFist } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState, useRef } from 'react'
import { useJournal } from '../../store'
import { Card, Input } from '../ui'
import { Button } from '../ui/button'
import { cat, onRaised } from '../../lib/colors'
import { URGE_PRESETS, HALT_STATES, type HaltState } from '../../lib/streak'
import { LONELY_KINDS } from '../../lib/recoveryFeedback'
import { matchPlanForTrigger } from '../../lib/urge'
import { discreetly } from '../../lib/discreet'
import { ChipPick } from '../ui/quickpick'
import { notify } from '../../lib/notify'

const TECHNIQUES: { id: 'surf' | 'delay' | 'halt' | 'reach-out'; label: string }[] = [
  { id: 'surf', label: 'Surf it' },
  { id: 'delay', label: 'Delay 10 min' },
  { id: 'halt', label: 'HALT check' },
  { id: 'reach-out', label: 'Reach out' },
]
/** Intensity 1–5 on the app's severity ramp. Index is `intensity - 1`. */
const INTENSITY_HUE = ['green', 'teal', 'yellow', 'peach', 'red'] as const
/**
 * The word beside the number, because "3" alone is a number on a scale nobody
 * was told the ends of. One idea each, so a string is right.
 */
const INTENSITY_WORD = ['Faint', 'Mild', 'Moderate', 'Strong', 'Overwhelming'] as const

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
export function UrgeSurfingCard({ bare = false }: { bare?: boolean } = {}) {
  const { data, resistUrge, logLapseDay } = useJournal()
  const [urge, setUrge] = useState('')
  const [intensity, setIntensity] = useState(3)
  const [technique, setTechnique] = useState<'surf' | 'delay' | 'halt' | 'reach-out' | undefined>(undefined)
  const [halt, setHalt] = useState<HaltState[]>([])
  const [addictionId, setAddictionId] = useState('')
  const [lonelyKind, setLonelyKind] = useState('')
  const addictions = data.nofap.addictions ?? []
  /* DISCREET MODE · a display swap, bound once so this card cannot label half
     its chips and not the other half. The VALUE stays the real word — only
     `label` changes, so what is stored and what is matched are untouched. */
  const label = discreetly(data.settings)
  /** Guards the fat-finger double-tap; see the docstring above. */
  const lastUrgeAt = useRef(0)

  const plans = data.nofap.plans ?? []
  const matchedPlan = matchPlanForTrigger(plans, urge)

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
      lonelyKind: (lonelyKind || undefined) as 'alone' | 'unseen' | 'no-one-close' | 'disconnected' | 'bored' | undefined,
    })
    if (outcome === 'followed') logLapseDay(forId ?? null)
    setUrge(''); setIntensity(3); setTechnique(undefined); setHalt([]); setAddictionId(''); setLonelyKind('')
    if (outcome === 'resisted') {
      notify.success('Urge logged', 'Remove it from the list below if it was a mis-tap.')
    } else {
      // Not "failure", not a red toast. The whole design bet on this page is
      // that someone who feels punished for the honest entry stops making it,
      // and an app that only hears about good days knows nothing.
      notify.success('Logged', 'That is data, not a verdict — it is what makes the patterns below real.')
    }
  }

  const body = (<>
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
          <Icon as={HandFist} size="sm" /> I felt it and held
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
      {/*
        ONE PICKER, not two that overlap.

        It was two rows: "Which one?" listing the addictions you track (which
        binds the streak the win lands on — COD-251) and "What is it?" listing
        twelve generic presets. `Nicotine`, `Porn` and `Doomscrolling` appeared
        in BOTH, so the most common answers were asked for twice and the
        difference between the rows — one sets an id, one sets text — was
        invisible. Reviewed as "the most confusing part of the form", and that
        is fair.

        Now: your own tracked things first, then the presets you do not track,
        then the typed escape hatch. Picking a tracked one sets the id AND the
        text, so the streak is INFERRED from the habit rather than asked for
        separately. Picking an untracked preset sets the text alone, which is
        exactly what it meant before.
      */}
      <ChipPick
        label="What was the urge for?"
        value={urge || null}
        onChange={(v) => {
          const picked = String(v)
          const own = addictions.find((a) => a.name === picked)
          setUrge(picked)
          // The id is the binding; the name is what the log reads back.
          setAddictionId(own ? own.id : '')
        }}
        options={[
          ...addictions.map((a) => ({ value: a.name, label: label(a.name), hint: `Tracked · the win lands on your ${label(a.name)} streak` })),
          ...URGE_PRESETS
            .filter((u) => !addictions.some((a) => a.name.toLowerCase() === u.toLowerCase()))
            .map((u) => ({ value: u, label: label(u) })),
        ]}
        hint={addictions.length > 0
          ? 'The ones you track come first — picking one lands the win on that streak.'
          : undefined}
        after={
          <>
            <Input
              value={urge}
              onChange={(e) => { setUrge(e.target.value); setAddictionId('') }}
              onKeyDown={(e) => e.key === 'Enter' && logUrge('resisted')}
              placeholder="…or type your own"
              list="urge-presets"
              className="w-[11rem]"
            />
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
      {/*
        FIVE BUTTONS, NOT A SLIDER.

        Reviewed as "replace the intensity slider with five tappable buttons —
        faster on mobile and more precise", and both halves are right. A range
        input needs a drag to the right pixel on a touch screen to say "4", and
        it reports the value in a readout beside it rather than on the thing
        you pressed. Five targets need one tap and show the answer where the
        answer is.

        It also removes the `accentColor` readout the review called out as
        clashing: the ramp is now carried by the SELECTED button only, so at
        rest the row is five neutral chips and the colour appears on exactly
        one of them.

        A `radiogroup`, because that is what it is — and arrow keys move
        through it for free once the roles are right.
      */}
      <div className="control-max mt-3">
        <div className="mb-1 flex items-center justify-between text-label text-fg-1">
          <span id="urge-intensity-label">Intensity</span>
          <span className="text-label text-fg-2">{INTENSITY_WORD[intensity - 1]}</span>
        </div>
        <div role="radiogroup" aria-labelledby="urge-intensity-label" className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => {
            const on = intensity === n
            const hue = INTENSITY_HUE[n - 1]
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={`Intensity ${n} of 5 · ${INTENSITY_WORD[n - 1]}`}
                onClick={() => setIntensity(n)}
                className={`num h-11 flex-1 rounded-control border text-body transition-colors ${
                  on ? 'font-medium' : 'border-line bg-ink-2 text-fg-2 hover:border-line-strong hover:text-fg-1'
                }`}
                style={on ? { borderColor: cat(hue), background: `${cat(hue)}22`, color: onRaised(hue) } : undefined}
              >
                {n}
              </button>
            )
          })}
        </div>
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
        {/* WHICH KIND OF LONELY — only once `lonely` is ticked.
            Progressive disclosure because it is a real question and asking it
            of everyone would add a fifth chip row to a form used mid-urge. It
            earns the tap by changing the advice: "arrange company" is right for
            being alone and wrong for being unseen in a room full of people, and
            the app cannot tell those apart without asking. */}
        {halt.includes('lonely') && (
          <ChipPick
            label="What kind of lonely?"
            className="mt-3"
            value={lonelyKind}
            onChange={(v) => setLonelyKind(lonelyKind === v ? '' : String(v))}
            options={LONELY_KINDS.map((k) => ({ value: k.id, label: k.label, hint: k.why }))}
            hint="Each one points somewhere different — that is why it asks."
          />
        )}
      </div>
      {/* THE TALLIES AND THE LIST LEFT THIS CARD.

          They were two tally panels and a fifteen-row history inside a 424px
          act column, under a form with twenty chips — reported by pasting the
          whole column back with "a lot of content in here is not needed".
          They are things you READ (§29), so they live in the review now, in
          `UrgeHistoryCard`, where the list also finally got an Edit and a
          delete that asks. */}
</>)
  return bare ? body : (
    <Card hideInfo title="Urge surfing" subtitle="Feeling an urge? Name it and log it — it crests and passes in minutes.">{body}    </Card>
  )
}
