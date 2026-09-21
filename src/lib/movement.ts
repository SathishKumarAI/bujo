import { M, muscleWorkFor } from './exerciseMuscles'

/**
 * THE REP, OVER TIME · what moves, when, and which muscle is doing it.
 *
 * The static view answers "which muscles does this work". This answers the
 * question underneath it — **"how are they working"** — which needs a fourth
 * axis: a rep is a *shape over time*, and a muscle's job changes inside it.
 * The triceps in a bench press are barely involved off the chest and are the
 * limiting factor at lockout; a still frame cannot say that, and a pulsing
 * highlight that ignores the phase is decoration.
 *
 * Two things per pattern:
 *
 * 1. **`pose(t)`** — joint angles at phase `t ∈ [0,1]`, one full rep. Radians,
 *    body-local. The rig in `bodyMesh.ts` consumes these directly.
 * 2. **`drive(t)`** — per-muscle effort 0–1 through the same cycle. Multiplied
 *    by the muscle's role weight, so a secondary mover peaks lower than a
 *    prime mover even at its hardest moment.
 *
 * `t = 0` is the start of the **eccentric** (lowering) and `t = 0.5` is the
 * turnaround, because that is how a rep is counted in every programme this app
 * ships. Getting that backwards would put peak effort on the way down.
 *
 * Patterns are archetypes, not exercises. A dozen lifts share "horizontal
 * press"; encoding each separately would be a table nobody maintains, and the
 * whole point of `exerciseMuscles.ts` next door is that people type variations.
 */

/** Joint angles, radians. Positive = flexion, mirrored automatically. */
export interface Pose {
  /** Shoulder rotation around X — arm swinging forward/up. */
  shoulder: number
  /** Shoulder abduction around Z — arm lifting out sideways. */
  shoulderOut: number
  elbow: number
  hip: number
  knee: number
  /** Forward fold at the waist. */
  spine: number
}

export interface Movement {
  id: string
  label: string
  /** What a rep of this actually is, in one line, for the caption. */
  cue: string
  pose: (t: number) => Pose
  drive: (t: number) => Record<number, number>
}

const REST: Pose = { shoulder: 0, shoulderOut: 0.08, elbow: 0.12, hip: 0, knee: 0.04, spine: 0 }

/** Smooth 0→1→0 over the rep: slow at the ends, quick through the middle. */
const arc = (t: number) => (1 - Math.cos(2 * Math.PI * t)) / 2

/** 0 at the start, 1 at the turnaround, 0 at the end — the rep's depth. */
const depth = arc

/** Effort that peaks late in the concentric — the sticking point of a press. */
const lockout = (t: number) => (t < 0.5 ? 0.25 + 0.35 * (t * 2) : 0.6 + 0.4 * Math.sin(Math.PI * (t - 0.5) * 2))

/** Effort that peaks at the deepest, most-stretched point. */
const bottom = (t: number) => 0.3 + 0.7 * depth(t)

/** Roughly even through the rep — a stabiliser holding position. */
const hold = () => 0.55

const PATTERNS: { match: string[]; movement: Movement }[] = [
  {
    match: ['bench', 'chest press', 'push up', 'push-up', 'pushup', 'dip', 'close grip', 'incline', 'decline'],
    movement: {
      id: 'press-h',
      label: 'Horizontal press',
      cue: 'Lower under control, drive the hands away — the triceps take over at lockout.',
      pose: (t) => ({ ...REST, shoulder: -0.5 + 0.45 * depth(t), shoulderOut: 0.75 - 0.2 * depth(t), elbow: 0.25 + 1.35 * depth(t) }),
      drive: (t) => ({ [M.chest]: bottom(t), [M.triceps]: lockout(t), [M.shoulders]: 0.4 + 0.3 * depth(t) }),
    },
  },
  {
    match: ['overhead press', 'ohp', 'shoulder press', 'military', 'push press', 'arnold'],
    movement: {
      id: 'press-v',
      label: 'Vertical press',
      cue: 'Ribs down, press in a straight line; the triceps finish it overhead.',
      pose: (t) => ({ ...REST, shoulder: -2.3 + 1.5 * depth(t), shoulderOut: 0.35, elbow: 0.2 + 1.5 * depth(t) }),
      drive: (t) => ({ [M.shoulders]: bottom(t), [M.triceps]: lockout(t), [M.traps]: 0.3 + 0.4 * (1 - depth(t)), [M.abs]: hold() }),
    },
  },
  {
    match: ['pull-up', 'pullup', 'chin-up', 'chinup', 'lat pulldown', 'pulldown', 'pull-down', 'dead hang', 'negatives'],
    movement: {
      id: 'pull-v',
      label: 'Vertical pull',
      cue: 'Start from a dead hang, pull the elbows down to the ribs.',
      pose: (t) => ({ ...REST, shoulder: -2.8 + 1.4 * depth(t), shoulderOut: 0.5 - 0.25 * depth(t), elbow: 0.15 + 1.9 * depth(t) }),
      drive: (t) => ({ [M.lats]: 0.35 + 0.65 * depth(t), [M.biceps]: 0.3 + 0.6 * depth(t), [M.brachialis]: 0.25 + 0.5 * depth(t), [M.traps]: 0.4 + 0.3 * depth(t) }),
    },
  },
  {
    match: ['row', 'face pull', 'rear delt', 'reverse fly'],
    movement: {
      id: 'pull-h',
      label: 'Horizontal pull',
      cue: 'Pull with the elbows, drive them past the ribs, squeeze the mid-back.',
      pose: (t) => ({ ...REST, spine: 0.55, hip: 0.35, shoulder: -0.9 + 0.7 * depth(t), shoulderOut: 0.3, elbow: 0.2 + 1.5 * depth(t) }),
      drive: (t) => ({ [M.lats]: 0.3 + 0.7 * depth(t), [M.traps]: 0.35 + 0.65 * depth(t), [M.biceps]: 0.25 + 0.45 * depth(t), [M.abs]: hold() }),
    },
  },
  {
    match: ['squat', 'leg press', 'lunge', 'split squat', 'step up', 'step-up', 'pistol'],
    movement: {
      id: 'squat',
      label: 'Knee-dominant',
      cue: 'Sit between the hips, knees tracking the toes, drive the floor away.',
      pose: (t) => ({ ...REST, hip: 1.5 * depth(t), knee: 1.7 * depth(t), spine: 0.25 * depth(t), shoulder: -0.25 }),
      drive: (t) => ({ [M.quads]: 0.3 + 0.7 * depth(t), [M.glutes]: 0.25 + 0.7 * depth(t), [M.hamstrings]: 0.2 + 0.4 * depth(t), [M.abs]: hold(), [M.calves]: 0.25 + 0.2 * depth(t) }),
    },
  },
  {
    match: ['deadlift', 'romanian', 'rdl', 'stiff leg', 'stiff-leg', 'good morning', 'hyperextension', 'back extension', 'hip thrust', 'glute bridge'],
    movement: {
      id: 'hinge',
      label: 'Hip hinge',
      cue: 'Push the hips back, neutral spine, stand up by squeezing the glutes.',
      pose: (t) => ({ ...REST, spine: 1.15 * depth(t), hip: 1.25 * depth(t), knee: 0.35 * depth(t), shoulder: -0.12 }),
      drive: (t) => ({ [M.hamstrings]: 0.3 + 0.7 * depth(t), [M.glutes]: lockout(t), [M.lats]: hold(), [M.traps]: 0.45, [M.abs]: hold() }),
    },
  },
  {
    match: ['curl', 'hammer', 'zottman'],
    movement: {
      id: 'curl',
      label: 'Elbow flexion',
      cue: 'Elbows pinned to your sides — only the forearm moves.',
      pose: (t) => ({ ...REST, shoulder: -0.1, shoulderOut: 0.12, elbow: 0.2 + 2.2 * depth(t) }),
      drive: (t) => ({ [M.biceps]: 0.25 + 0.75 * depth(t), [M.brachialis]: 0.2 + 0.6 * depth(t) }),
    },
  },
  {
    match: ['tricep', 'triceps', 'skull crusher', 'pushdown', 'push-down', 'french press', 'kickback', 'overhead extension'],
    movement: {
      id: 'extension',
      label: 'Elbow extension',
      cue: 'Elbows tucked and still; only the forearm moves. Squeeze at lockout.',
      pose: (t) => ({ ...REST, shoulder: -0.45, shoulderOut: 0.18, elbow: 2.3 - 2.05 * depth(t) }),
      // Inverted on purpose: the triceps work hardest at the *extended* end,
      // which is `depth = 0`, not at the bottom like every pattern above.
      drive: (t) => ({ [M.triceps]: 1 - 0.6 * depth(t), [M.shoulders]: 0.25 }),
    },
  },
  {
    match: ['lateral raise', 'side raise', 'upright row', 'shrug'],
    movement: {
      id: 'raise',
      label: 'Shoulder abduction',
      cue: 'Lead with the elbows, stop at shoulder height, lower slowly.',
      pose: (t) => ({ ...REST, shoulderOut: 0.1 + 1.45 * depth(t), elbow: 0.3 }),
      drive: (t) => ({ [M.shoulders]: 0.2 + 0.8 * depth(t), [M.traps]: 0.25 + 0.45 * depth(t) }),
    },
  },
  {
    match: ['calf', 'heel raise'],
    movement: {
      id: 'calf',
      label: 'Ankle extension',
      cue: 'Full stretch at the bottom, pause and squeeze at the top.',
      pose: (t) => ({ ...REST, knee: 0.06, hip: 0.02 * depth(t) }),
      drive: (t) => ({ [M.calves]: 0.3 + 0.7 * depth(t), [M.soleus]: 0.25 + 0.6 * depth(t) }),
    },
  },
  {
    match: ['plank', 'hollow', 'l-sit', 'dead bug', 'ab wheel'],
    movement: {
      id: 'brace',
      label: 'Isometric brace',
      cue: 'Nothing moves. That is the exercise — ribs down, pelvis tucked.',
      pose: () => ({ ...REST, spine: 0.06, hip: 0.05, shoulder: -0.9, elbow: 1.5 }),
      drive: () => ({ [M.abs]: 0.85, [M.obliques]: 0.6, [M.serratus]: 0.5, [M.glutes]: 0.4 }),
    },
  },
  {
    match: ['sit-up', 'situp', 'crunch', 'leg raise', 'russian twist', 'mountain climber', 'oblique'],
    movement: {
      id: 'flex',
      label: 'Trunk flexion',
      cue: 'Curl the ribs toward the hips; do not yank on your neck.',
      pose: (t) => ({ ...REST, spine: 0.9 * depth(t), hip: 0.5 * depth(t), shoulder: -1.4, elbow: 1.7 }),
      drive: (t) => ({ [M.abs]: 0.3 + 0.7 * depth(t), [M.obliques]: 0.25 + 0.45 * depth(t) }),
    },
  },
]

/**
 * The movement pattern for an exercise, or `null` when we have no rep shape.
 *
 * Null is a real answer: a static highlight is still useful and is what the
 * view falls back to. Animating an unknown lift with a generic wiggle would be
 * inventing form cues, which is worse than saying nothing.
 */
export function movementFor(name: string): Movement | null {
  const n = name.toLowerCase().trim()
  if (!n) return null
  for (const p of PATTERNS) if (p.match.some((m) => n.includes(m))) return p.movement
  return null
}

/**
 * Effort per muscle at phase `t`, already weighted by role.
 *
 * A pattern's `drive` describes the archetype; `musclesForExercise` knows what
 * *this* lift emphasises. Multiplying keeps the two honest: a close-grip bench
 * runs the horizontal-press motion, but its triceps are the prime mover and
 * its chest is not, and the picture should show that.
 */
export function activationAt(name: string, t: number): Record<number, number> {
  const mv = movementFor(name)
  const work = muscleWorkFor(name)
  if (!mv || !work) return {}
  const raw = mv.drive(t)
  const out: Record<number, number> = {}
  for (const [k, v] of Object.entries(raw)) {
    const id = Number(k)
    const weight = work.primary.includes(id) ? 1 : work.secondary.includes(id) ? 0.55 : 0.3
    out[id] = Math.max(0, Math.min(1, v * weight))
  }
  // A muscle this lift emphasises that the archetype forgot still lights up —
  // otherwise a close-grip bench would show no triceps at all if the pattern
  // happened not to name them.
  for (const id of work.primary) if (out[id] === undefined) out[id] = 0.75
  for (const id of work.secondary) if (out[id] === undefined) out[id] = 0.4
  return out
}
