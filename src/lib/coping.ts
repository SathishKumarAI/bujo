import { STREAK_MILESTONES } from './streak'

/**
 * WHAT TO ACTUALLY DO WITH AN URGE, and what the evidence says about it.
 *
 * WHAT THIS FILE OWNS: the techniques, the words, and the sources behind them.
 * WHAT IT DOES NOT OWN: how any of it is drawn, or when it is shown.
 *
 * Asked for as *"exercises, meditation, breathing … is it okay to break the
 * cycle and continue again … what is the consequence of going back … not only
 * for visualization, it's also for content to read, and that can help him"*.
 *
 * ── Two rules this file is built on ───────────────────────────────────────
 *
 * **Points, not paragraphs** (CLAUDE.md). Every `steps` and `why` is a
 * `string[]`, because a person reads this at the worst ninety seconds of their
 * day and a three-sentence block cannot be scanned, skipped or returned to.
 * `coping.test.ts` asserts the point count and a per-point length floor, the
 * same way `pickleballAcademy.test.ts` does.
 *
 * **Every claim carries its source, and the source is reachable.** This is
 * health content in an app that otherwise only reports your own numbers, so
 * the line between "the research says" and "we think" has to be on the page.
 * Each technique names who developed it and links the study or the body that
 * published it — this repo's rule that a credited source must be reachable.
 *
 * What is deliberately NOT here: any claim that a technique cures anything,
 * any promise about timescales, and any medical advice. These are coping
 * skills with trial evidence behind them, described as that.
 */

export interface Technique {
  id: string
  /** The name people will search for. */
  title: string
  /** One line: what it is. A single idea, so a string is right. */
  summary: string
  /** How to do it, in order. */
  steps: string[]
  /** Why it works / what was measured. */
  why: string[]
  /** Minutes it takes, for the reader deciding whether they have time. */
  minutes: string
  source: { label: string; url: string }
}

export const TECHNIQUES: Technique[] = [
  {
    id: 'surf',
    title: 'Surf the urge',
    summary: 'Watch the craving rise and fall instead of fighting it or obeying it.',
    steps: [
      'Stop and name it: “this is a craving”.',
      'Find where you feel it — chest, throat, stomach, hands.',
      'Breathe normally and watch that spot, the way you would watch a wave.',
      'Notice it peak. Keep watching. It falls on its own.',
      'Let the next one come without bracing for it.',
    ],
    why: [
      'Urges behave like waves: they crest and subside rather than building forever, if you do not act on them.',
      'Developed by G. Alan Marlatt in the 1980s as part of Relapse Prevention, and formalised into Mindfulness-Based Relapse Prevention.',
      'In a 12-month trial, MBRP cut substance-use days against both standard relapse prevention and treatment as usual.',
      'College smokers who practised it cut how much they smoked by about a quarter — while their cravings stayed just as strong. The skill changes what you do, not how much you want it.',
    ],
    minutes: '2–15 min',
    source: {
      label: 'Marlatt’s Relapse Prevention model (NIH/PMC)',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6760427/',
    },
  },
  {
    id: 'breathe',
    title: 'Cyclic sighing',
    summary: 'Two breaths in through the nose, one long breath out through the mouth.',
    steps: [
      'Inhale through the nose until your lungs feel full.',
      'Take a second, shorter sniff on top of it.',
      'Let it out slowly through the mouth, longer than both inhales together.',
      'Repeat for five minutes — or until the urge has moved.',
    ],
    why: [
      'A Stanford trial compared it against two other breathing patterns and against mindfulness meditation, five minutes a day for a month.',
      'Cyclic sighing produced the biggest improvement in mood and the largest drop in resting breathing rate, and beat meditation on both.',
      'The effect was measurable after a single five-minute session, and grew with daily practice.',
      'The long exhale is the part that does the work: it is what shifts you out of an aroused state.',
    ],
    minutes: '1–5 min',
    source: {
      label: 'Stanford Medicine · cyclic sighing study',
      url: 'https://med.stanford.edu/news/insights/2023/02/cyclic-sighing-can-help-breathe-away-anxiety.html',
    },
  },
  {
    id: 'move',
    title: 'Move, right now',
    summary: 'Change what your body is doing before you try to change what your mind is doing.',
    steps: [
      'Stand up and leave the room you are in.',
      'Ten minutes of anything with a pulse behind it — stairs, a walk outside, press-ups, the washing-up.',
      'Keep your phone in another room while you do it.',
      'Come back and check the urge. It is usually a different size.',
    ],
    why: [
      'It removes the cue, not just the thought: most urges are tied to a place, a screen and a time of day.',
      'It uses the same ten minutes the Delay technique does, but gives them a shape, which makes them far easier to actually spend.',
      'It is the one technique here that also pays you back on every other page of this app.',
    ],
    minutes: '10 min',
    source: {
      label: 'HALT & coping skills · relapse prevention overview (NIH/PMC)',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6760427/',
    },
  },
  {
    id: 'halt',
    title: 'HALT check',
    summary: 'Ask whether the urge is actually hunger, anger, loneliness or tiredness wearing a costume.',
    steps: [
      'Hungry? Eat something before you decide anything.',
      'Angry? Say what happened out loud, to someone or to a notes app.',
      'Lonely? Message one person. Not a feed — a person.',
      'Tired? The urge is often just the end of the day. Go to bed.',
    ],
    why: [
      'A craving is frequently a different unmet need that has found a familiar exit.',
      'This page logs your HALT answers, so after a few weeks it can tell you which of the four is actually driving yours.',
      'Naming the need is often enough to make the urge stop being the obvious answer.',
    ],
    minutes: '1 min',
    source: {
      label: 'Relapse Prevention: an overview of Marlatt’s model (NIH/PMC)',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6760427/',
    },
  },
]

/**
 * A LAPSE IS NOT A RELAPSE — the answer to "is it okay to break the cycle and
 * continue again".
 *
 * This is the single most load-bearing piece of writing on the page, and it is
 * not reassurance: it is a named, measured mechanism. Marlatt called it the
 * **Abstinence Violation Effect** — the guilt and loss of control after
 * breaking a self-imposed rule — and the finding is that what turns one slip
 * into a return to the old pattern is **the response to the slip**, not the
 * slip. Two things do it: blaming yourself rather than the situation ("this
 * proves what I am"), and the shame and hopelessness that follow.
 *
 * Which is why this app logs a reset with a *reason* and keeps your total
 * clean days: both are attributions pointing at the situation instead of at
 * the person.
 */
export const LAPSE_TRUTH = {
  title: 'You can start again. That is the whole skill.',
  points: [
    'A slip is one episode. A relapse is going back to the old pattern. They are different things, and one does not have to become the other.',
    'What turns a slip into a relapse is usually the reaction to it — self-blame, then giving up. Researchers call it the abstinence violation effect.',
    'The two thoughts that do the damage are “this proves I cannot do it” and “the streak is gone, so the day is gone”. Both are predictions, not facts.',
    'Your total clean days do not reset. Neither does what you learned about your own triggers.',
    'Log the reset with what led to it. A reason points at the situation; silence points at you.',
  ],
  source: {
    label: 'Abstinence violation effect · Marlatt & Gordon, Relapse Prevention',
    url: 'https://www.guilford.com/excerpts/marlatt.pdf',
  },
} as const

/* ── What a reset would cost, from the reader's own numbers ───────────────── */

export interface ResetCost {
  /** Days the current run would give up. */
  days: number
  /** The milestone being worked toward, and how far it moves. */
  milestone: { label: string; daysAway: number } | null
  /** Days from the personal best, when the run is chasing it. */
  fromBest: number | null
  /** Clean days that are kept no matter what — the half nobody counts. */
  kept: number
}

/**
 * What going back costs TODAY, in this person's own numbers.
 *
 * Asked for as "what is the consequence of going back again — show them that
 * in an intuitive way". The honest version is arithmetic, not a warning: the
 * run you give up, the milestone that moves away, and — stated just as
 * plainly — the clean days you keep regardless.
 *
 * **Both halves, always.** A card that shows only the loss is the abstinence
 * violation effect with a chart on it: it makes a slip feel total, which is
 * the thing that turns a slip into a relapse. `kept` is not a consolation, it
 * is the correction.
 */
export function resetCost(current: number, best: number, totalClean: number): ResetCost {
  const safeCurrent = Math.max(0, Number.isFinite(current) ? current : 0)
  const safeBest = Math.max(0, Number.isFinite(best) ? best : 0)
  const next = STREAK_MILESTONES.find((m) => m.day > safeCurrent)
  return {
    days: safeCurrent,
    milestone: next ? { label: next.label, daysAway: next.day - safeCurrent } : null,
    // Only when the run is actually chasing the record — "0 days from your
    // best" on a brand-new streak is a sentence about nothing.
    fromBest: safeBest > safeCurrent ? safeBest - safeCurrent : null,
    /* CLAMPED AT THE RESULT, not just at the input. `totalClean - current`
       goes negative whenever the stored total is behind the live run — a
       restored journal, or a streak that outlived its own history — and the
       card would then print "−50 clean days kept", which is the one number on
       it that must never read as a loss. */
    kept: Math.max(0, (Number.isFinite(totalClean) ? totalClean : 0) - safeCurrent),
  }
}
