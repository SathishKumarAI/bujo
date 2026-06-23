import type { PickleballFormat } from './types'

/**
 * Static pickleball domain content — competitive formats and a 75-day 3.5→4.0
 * improvement plan. Compiled from USA Pickleball, DUPR, and reputable coaching
 * sources (see docs/features/pickleball-competitive.md). Pure data, no state.
 */

export interface FormatInfo {
  id: PickleballFormat
  label: string
  how: string
  size: string
}

/** Common league / tournament formats. */
export const PICKLE_FORMATS: FormatInfo[] = [
  { id: 'round-robin', label: 'Round Robin', how: 'Everyone plays everyone once; ranked by W–L then tiebreakers. No elimination — most play, fairest seeding.', size: '4–9 teams / pool' },
  { id: 'pool-play', label: 'Pool Play → Bracket', how: 'Pools each play a round robin; top finishers advance to a medal elimination bracket. The workhorse competitive format.', size: '10+ teams' },
  { id: 'single-elim', label: 'Single Elimination', how: 'One loss and you’re out; each round halves the field. Fast and simple (often with a consolation bracket).', size: 'any field' },
  { id: 'double-elim', label: 'Double Elimination', how: 'Winners’ + losers’ brackets; first loss drops you to losers’, second loss is out. One bad game won’t end your day.', size: 'club / mid-size' },
  { id: 'swiss', label: 'Swiss', how: 'Fixed rounds; each round pairs similar records, no rematches, no eliminations. Best record wins.', size: 'medium–large' },
  { id: 'ladder', label: 'Ladder League', how: 'Ongoing; winners move up a court, losers drop, partners re-pair. Rankings update weekly.', size: 'season-long' },
  { id: 'box', label: 'Box League', how: 'Players grouped into skill “boxes” of 4–5; box round robin per cycle; top promoted, bottom relegated.', size: 'boxes of 4–5' },
  { id: 'king-of-court', label: 'King of the Court', how: 'Fast rotation; winners move toward the top court, losers drop, partners split. High-energy.', size: '8–20 players' },
]

export const FORMAT_LABEL: Record<PickleballFormat, string> =
  Object.fromEntries(PICKLE_FORMATS.map((f) => [f.id, f.label])) as Record<PickleballFormat, string>

/** Skills that separate a 3.5 from a 4.0 (consistency + decisions, not new shots). */
export const SKILLS_35_TO_40: string[] = [
  'Third-shot drop you can land softly in the kitchen repeatedly',
  'Resets from the transition zone with soft hands (absorb pace, no pop-ups)',
  'Patient, staged net approach instead of rushing the line',
  'Attack-vs-reset decisions in the transition zone',
  'Disciplined dinks kept low and unattackable, with placement variety',
  'Deep, controlled serves and returns with pace/spin/placement',
  'Block / reset volleys that die in the NVZ',
  'Defend-then-counter: absorb an attack, regain the net, capitalise',
  'Unforced-error reduction sustained across a full match',
  'Tactical shot selection — knowing when to go soft vs. power',
  'Seamless stacking, switching and poaching with your partner',
]

export interface PlanPhase {
  phase: number
  days: string
  title: string
  focus: string
  drills: { name: string; how: string }[]
  goal: string
}

/** A 75-day, 5-phase plan to hit 4.0-level benchmarks (≈8–12 hrs/wk, ~65% drilling). */
export const PICKLE_PLAN: PlanPhase[] = [
  {
    phase: 1, days: 'Days 1–18', title: 'Soft game & resets',
    focus: 'Win dink battles; absorb pace with soft hands — the skill that takes you past 3.5.',
    drills: [
      { name: 'Cross-court dink targets', how: 'Dink diagonally at your partner’s outside then inside foot. Low over the middle of the net.' },
      { name: 'Figure-8 dinks', how: 'One player always down-the-line, the other always cross-court — pulls you both laterally.' },
      { name: 'Static reset', how: 'Stand fixed in the transition zone; partner speeds balls at your feet, block each softly into the NVZ.' },
      { name: 'Dink–dink–bang–reset', how: 'Three cooperative dinks, 4th is a speed-up, 5th is a reset, then resume.' },
    ],
    goal: '50 consecutive cross-court dinks; reset 50 speed-ups per side into the kitchen.',
  },
  {
    phase: 2, days: 'Days 19–36', title: 'Third-shot drop',
    focus: 'Treat the drop as neutralisation, not attack (the #1 3.5 mistake). Aim higher over the net.',
    drills: [
      { name: 'Baseline drop reps', how: 'Soft upward arc into the kitchen. Success metric: “could it have been attacked?”' },
      { name: 'Nine-point drill', how: '9 tape markers from NVZ to baseline; hit a drop from each, restart on a miss. Footwork first.' },
      { name: 'Slinky', how: 'Dink at the line, take two steps back and drop, repeat to the baseline; two in a row to retreat.' },
      { name: '0-to-60', how: 'Race to 60 cumulative successful drops landing in the kitchen.' },
    ],
    goal: '8/10 target-accuracy drops; reach ~90% drop success (the 4.0 benchmark).',
  },
  {
    phase: 3, days: 'Days 37–54', title: 'Transition zone, serve & return depth',
    focus: 'Move through “no-man’s land” intentionally; reset while advancing; pin opponents deep.',
    drills: [
      { name: 'Moving-forward reset', how: 'From the baseline, partner volleys at you; reset and advance step-by-step to the NVZ line.' },
      { name: 'Drive–drop–reset', how: 'Hit a drive, then a drop, then a reset, shuffling back each sequence. Builds shot selection.' },
      { name: '3-target serve', how: 'Cones at middle, the “T”, and out-wide; serve to each in rotation — depth is the priority.' },
      { name: 'Return-and-freeze', how: 'Return deep; server catches the ball after the bounce while you freeze — exposes if you actually advance.' },
    ],
    goal: '~83% of transition attempts reaching the NVZ line; 75%+ of returns landing deep.',
  },
  {
    phase: 4, days: 'Days 55–72', title: 'Net battles, selective offense & strategy',
    focus: 'Read opponents; time speed-ups by positioning; layer in stacking and communication.',
    drills: [
      { name: 'Feed-and-battle', how: 'Feed a dead dink, partner speeds up, play out the hands battle. Wide split-step base first.' },
      { name: 'Skinny singles', how: 'Full points on one diagonal half — third shots, resets, deep returns, patient dinking, game-like.' },
      { name: 'Two-on-one pressure', how: 'Two players dink/speed-up at one defender resetting from mid-court. Defense + conditioning.' },
      { name: 'Stacking reps', how: 'Practice stack, switch and poach with clear calls in live points.' },
    ],
    goal: 'Win net hands-battles you start; play skinny singles to 11; stack without positioning errors.',
  },
  {
    phase: 5, days: 'Days 73–75', title: 'Assessment & integration',
    focus: 'Re-test every benchmark against varied partners; play rated / competitive matches.',
    drills: [
      { name: 'Dink test', how: 'Count consecutive dinks — target 50+.' },
      { name: 'Drop & transition test', how: '30 drops (~90% success) and 30 transition attempts reaching the line (~83%).' },
      { name: 'Return-depth test', how: '30 returns past a deep marker — track the %.' },
      { name: 'Match metrics', how: 'Track per-game unforced errors and average rally length as trend metrics.' },
    ],
    goal: 'Match or beat 4.0 reference numbers and turn “moderate” into “limited” unforced errors in live play.',
  },
]

export const PLAN_TOTAL_DAYS = 75
