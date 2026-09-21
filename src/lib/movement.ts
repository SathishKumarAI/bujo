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

/** The pose a figure stands in when no pattern applies. Exported so the view
 *  and the camera framing use the same one as the patterns do. */
export const REST: Pose = { shoulder: 0, shoulderOut: 0.08, elbow: 0.12, hip: 0, knee: 0.04, spine: 0 }

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

/**
 * A short, sharp spike — for lifts whose point is speed, not time under load.
 *
 * A kettlebell swing drawn with `depth` would look like a slow hinge, which is
 * the opposite of what a swing teaches. Effort is near zero on the backswing
 * and near maximal for a moment at the snap.
 */
const snap = (t: number) => Math.pow(Math.max(0, Math.sin(Math.PI * t)), 4) * 0.9 + 0.1

/** Ground contact — the brief moment of a stride when the leg is loaded. */
const strike = (t: number) => Math.pow(Math.max(0, Math.sin(2 * Math.PI * t + 0.6)), 3)

/** The counter-movement dip: down early, extended hard through the second half. */
const dip = (t: number) => (t < 0.45 ? arc(t / 0.9) : Math.max(0, 1 - (t - 0.45) / 0.3) * arc(0.5))

const PATTERNS: { match: string[]; movement: Movement }[] = [
  // ── Running. Not `steady`: a sprint's whole character is that effort is
  //    not even, and drawing it flat would say the opposite. One stride is
  //    the cycle here, so `t` is a step rather than a rep. ──
  {
    match: ['run', 'sprint', 'jog', 'jogging', 'hill repeat'],
    movement: {
      id: 'gait',
      label: 'Running gait',
      cue: 'Land mid-foot under your hips, quick turnover, tall posture.',
      pose: (t) => ({
        ...REST,
        hip: 0.75 * Math.sin(2 * Math.PI * t),
        knee: 0.35 + 0.75 * Math.abs(Math.sin(2 * Math.PI * t + 0.6)),
        shoulder: -0.7 * Math.sin(2 * Math.PI * t),
        elbow: 1.5,
        spine: 0.12,
      }),
      drive: (t) => ({ [M.quads]: 0.45 + 0.4 * strike(t), [M.calves]: 0.4 + 0.5 * strike(t), [M.glutes]: 0.4 + 0.4 * strike(t), [M.hamstrings]: 0.4 + 0.3 * strike(t), [M.soleus]: 0.35 + 0.3 * strike(t), [M.abs]: hold() }),
    },
  },
  {
    match: ['hip abduction', 'hip adduction', 'clamshell', 'monster walk', 'lateral band walk'],
    movement: {
      id: 'hip-abd',
      label: 'Hip abduction',
      cue: 'Drive the knee out against the resistance; keep the pelvis level.',
      pose: (t) => ({ ...REST, hip: 0.1, knee: 0.55, shoulder: -0.15, spine: 0.05 * depth(t) }),
      drive: (t) => ({ [M.glutes]: 0.3 + 0.7 * depth(t), [M.quads]: 0.25 + 0.2 * depth(t), [M.obliques]: hold() }),
    },
  },

  // ── Explosive: effort spikes in a short window rather than tracking depth.
  //    A swing is not a slow hinge, and drawing it as one would teach the
  //    wrong thing about the only lift here whose *speed* is the point. ──
  {
    match: ['kettlebell swing', 'kb swing', 'swing', 'power clean', 'hang clean', 'clean and jerk', 'clean', 'snatch', 'high pull'],
    movement: {
      id: 'ballistic-hinge',
      label: 'Ballistic hinge',
      cue: 'Hike it back, then snap the hips through. The arms are rope, not levers.',
      pose: (t) => ({ ...REST, spine: 0.95 * depth(t), hip: 1.05 * depth(t), knee: 0.3 * depth(t), shoulder: -0.2 - 1.5 * (1 - depth(t)), elbow: 0.15 }),
      drive: (t) => ({ [M.glutes]: snap(t), [M.hamstrings]: snap(t) * 0.9, [M.traps]: 0.3 + 0.5 * snap(t), [M.lats]: hold(), [M.abs]: hold(), [M.quads]: 0.25 + 0.35 * snap(t) }),
    },
  },
  {
    match: ['box jump', 'broad jump', 'jump squat', 'jump rope', 'skipping', 'pogo', 'bounding', 'burpee'],
    movement: {
      id: 'jump',
      label: 'Triple extension',
      cue: 'Dip, then drive ankle–knee–hip together. Land soft, mid-foot.',
      pose: (t) => ({ ...REST, hip: 1.1 * dip(t), knee: 1.4 * dip(t), spine: 0.3 * dip(t), shoulder: -0.3 + 1.6 * (1 - dip(t)) }),
      drive: (t) => ({ [M.quads]: snap(t), [M.calves]: snap(t), [M.glutes]: snap(t) * 0.9, [M.soleus]: 0.3 + 0.4 * snap(t), [M.hamstrings]: 0.3 + 0.3 * snap(t), [M.abs]: hold() }),
    },
  },
  {
    match: ['thruster', 'wall ball'],
    movement: {
      id: 'thruster',
      label: 'Squat to press',
      cue: 'One movement, not two — the legs launch it and the shoulders finish it.',
      pose: (t) => ({ ...REST, hip: 1.35 * dip(t), knee: 1.55 * dip(t), spine: 0.2 * dip(t), shoulder: -1.2 - 1.1 * (1 - dip(t)), elbow: 0.4 + 1.4 * dip(t) }),
      drive: (t) => ({ [M.quads]: 0.35 + 0.65 * dip(t), [M.glutes]: 0.3 + 0.6 * dip(t), [M.shoulders]: lockout(t), [M.triceps]: lockout(t) * 0.8, [M.abs]: hold() }),
    },
  },

  // ── Carries: nothing moves at the joints. The work is holding position
  //    while walking, so effort is flat and the legs only tick over. ──
  {
    match: ['farmer carry', 'farmers carry', 'farmer walk', 'suitcase carry', 'loaded carry', 'sled push', 'sled drag', 'yoke'],
    movement: {
      id: 'carry',
      label: 'Loaded carry',
      cue: 'Ribs down, shoulders back, walk. The grip and the trunk are the exercise.',
      // A gentle stride so the figure is not frozen — this is the one pattern
      // where the limbs move and the *effort* does not.
      pose: (t) => ({ ...REST, hip: 0.3 * Math.sin(2 * Math.PI * t), knee: 0.15 + 0.2 * Math.abs(Math.sin(2 * Math.PI * t)), shoulder: -0.08, elbow: 0.1 }),
      drive: () => ({ [M.traps]: 0.9, [M.abs]: 0.75, [M.obliques]: 0.7, [M.quads]: 0.45, [M.glutes]: 0.4, [M.calves]: 0.35 }),
    },
  },

  // ── Hanging trunk flexion. The lats hold the hang the whole time; the abs
  //    do the rep. Two different jobs in one picture, which is the point. ──
  {
    match: ['toes-to-bar', 'toes to bar', 'hanging knee raise', 'hanging leg raise', 'knees to elbows'],
    movement: {
      id: 'hang-flex',
      label: 'Hanging flexion',
      cue: 'Hang tall, then curl the pelvis up — do not just swing the legs.',
      pose: (t) => ({ ...REST, shoulder: -2.9, shoulderOut: 0.3, elbow: 0.1, hip: 1.7 * depth(t), knee: 0.9 * depth(t), spine: 0.35 * depth(t) }),
      drive: (t) => ({ [M.abs]: 0.3 + 0.7 * depth(t), [M.obliques]: 0.25 + 0.4 * depth(t), [M.lats]: hold(), [M.quads]: 0.2 + 0.3 * depth(t) }),
    },
  },

  // ── Anti-movement. Like the plank, the exercise is that nothing happens —
  //    but asymmetric, so the obliques carry it. ──
  {
    match: ['pallof', 'anti-rotation', 'side plank', 'bird dog', 'copenhagen'],
    movement: {
      id: 'anti-rotation',
      label: 'Anti-rotation hold',
      cue: 'The load wants to twist you. The exercise is refusing.',
      pose: () => ({ ...REST, shoulder: -1.5, shoulderOut: 0.2, elbow: 0.3, spine: 0.04 }),
      drive: () => ({ [M.obliques]: 0.9, [M.abs]: 0.75, [M.glutes]: 0.45, [M.shoulders]: 0.35 }),
    },
  },
  {
    match: ['superman', 'reverse hyper', 'jefferson curl'],
    movement: {
      id: 'extend',
      label: 'Trunk extension',
      cue: 'Lift from the glutes and the back, not by cranking the neck.',
      pose: (t) => ({ ...REST, spine: 0.5 - 0.65 * depth(t), hip: 0.4 - 0.5 * depth(t), shoulder: -1.9 }),
      drive: (t) => ({ [M.glutes]: 0.3 + 0.7 * depth(t), [M.hamstrings]: 0.25 + 0.55 * depth(t), [M.lats]: 0.3 + 0.35 * depth(t), [M.traps]: 0.3 + 0.3 * depth(t) }),
    },
  },

  // ── Scapular work: tiny range, and that is the teaching point. The pose
  //    barely changes because the movement barely does. ──
  {
    match: ['scapular', 'scap pull', 'y raise', 'cuban press', 'scarecrow', 'external rotation', 'band pull-apart'],
    movement: {
      id: 'scap',
      label: 'Scapular control',
      cue: 'Small range on purpose — move the shoulder blades, not the arms.',
      pose: (t) => ({ ...REST, shoulder: -1.35 - 0.2 * depth(t), shoulderOut: 0.45 + 0.25 * depth(t), elbow: 0.5 }),
      drive: (t) => ({ [M.traps]: 0.35 + 0.6 * depth(t), [M.shoulders]: 0.3 + 0.45 * depth(t), [M.lats]: 0.25 + 0.3 * depth(t) }),
    },
  },

  // ── Steady-state machines: a gait cycle, even effort. Listed before the
  //    running rule so "assault bike" does not read as a sprint. ──
  {
    match: ['stair climber', 'stairmaster', 'elliptical', 'assault bike', 'air bike', 'treadmill', 'incline walk', 'ski erg', 'battle rope'],
    movement: {
      id: 'steady',
      label: 'Steady state',
      cue: 'Aerobic work — the number that matters is the time, not the effort per rep.',
      pose: (t) => ({ ...REST, hip: 0.55 * Math.sin(2 * Math.PI * t), knee: 0.25 + 0.5 * Math.abs(Math.sin(2 * Math.PI * t)), shoulder: -0.45 * Math.sin(2 * Math.PI * t), elbow: 0.7 }),
      drive: () => ({ [M.quads]: 0.6, [M.glutes]: 0.5, [M.calves]: 0.45, [M.hamstrings]: 0.4 }),
    },
  },

  {
    match: ['bench', 'chest press', 'push up', 'push-up', 'pushup', 'dip', 'close grip', 'incline', 'decline', 'floor press', 'spoto press', 'landmine press', 'jm press', 'tate press'],
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
    match: ['pull-up', 'pullup', 'chin-up', 'chinup', 'lat pulldown', 'pulldown', 'pull-down', 'dead hang', 'negatives', 'muscle up', 'muscle-up'],
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
    match: ['deadlift', 'romanian', 'rdl', 'stiff leg', 'stiff-leg', 'good morning', 'hyperextension', 'back extension', 'hip thrust', 'glute bridge', 'glute ham raise', 'ghr'],
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
