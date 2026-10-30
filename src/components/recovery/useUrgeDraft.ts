import { useRef, useState } from 'react'
import { useJournal } from '../../store'
import { type HaltState } from '../../lib/streak'
import { matchPlanForTrigger } from '../../lib/urge'
import { discreetly } from '../../lib/discreet'
import { notify } from '../../lib/notify'

/**
 * THE URGE DRAFT AND ITS WRITE — one copy for both drawings.
 *
 * OWNS: the form's state (what it was for, intensity, what helped, HALT,
 * which kind of lonely), the double-tap guard and `logUrge`, which writes the
 * same `UrgeWin` for either ending. DOES NOT OWN: any drawing — the desktop's
 * `UrgeSurfingCard` and the phone's `RecoveryPhone` both render from this.
 *
 * Moved out of `UrgeSurfingCard` when the phone got its own drawing, so a
 * field added to an urge is added once (the SessionFields trap in CLAUDE.md).
 */
export const TECHNIQUES: { id: 'surf' | 'delay' | 'halt' | 'reach-out'; label: string }[] = [
  { id: 'surf', label: 'Surf it' },
  { id: 'delay', label: 'Delay 10 min' },
  { id: 'halt', label: 'HALT check' },
  { id: 'reach-out', label: 'Reach out' },
]
/** Intensity 1–5 on the app's severity ramp. Index is `intensity - 1`. */
export const INTENSITY_HUE = ['green', 'teal', 'yellow', 'peach', 'red'] as const
/**
 * The word beside the number, because "3" alone is a number on a scale nobody
 * was told the ends of. One idea each, so a string is right.
 */
export const INTENSITY_WORD = ['Faint', 'Mild', 'Moderate', 'Strong', 'Overwhelming'] as const

export function useUrgeDraft() {
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

  return {
    urge, setUrge, intensity, setIntensity, technique, setTechnique, halt, setHalt,
    addictionId, setAddictionId, lonelyKind, setLonelyKind, addictions, label, matchedPlan, logUrge,
  }
}
