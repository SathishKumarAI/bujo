// Short, plain-language coaching for common lifts: a form cue (better muscle
// engagement) and an injury watch-out (train safer). Matched by keyword so it
// covers variations ("incline dumbbell press" → bench guidance). Written like a
// trainer + physio, not medical advice — generic, conservative cues only.

export interface ExerciseInfo {
  cue: string // do this for better engagement
  watch: string // avoid this to protect the joint
}

const RULES: { match: string[]; info: ExerciseInfo }[] = [
  { match: ['squat', 'lunge', 'leg press'], info: { cue: 'Brace your core, drive through mid-foot, knees tracking over toes.', watch: 'Don’t let knees cave in or the lower back round at the bottom.' } },
  { match: ['deadlift', 'rack pull', 'stiff', 'hyperextension'], info: { cue: 'Neutral spine, lats tight, push the floor away — hips and chest rise together.', watch: 'Never round the lower back under load; keep the bar close to your shins.' } },
  { match: ['bench', 'chest press', 'dumbbell press', 'incline', 'decline', 'pec', 'fly', 'push up', 'push-up', 'dips'], info: { cue: 'Retract shoulder blades, slight arch, elbows ~45° from the torso.', watch: 'Don’t flare elbows to 90° or bounce off the chest — protects the shoulder.' } },
  { match: ['overhead press', 'ohp', 'shoulder press', 'lateral raise', 'upright row'], info: { cue: 'Squeeze glutes, ribs down, press in a straight line; finish biceps by ears.', watch: 'Avoid excessive lower-back arch; lead lateral raises with elbows, not hands.' } },
  { match: ['row', 'lat pulldown', 'pull-down', 'pullover'], info: { cue: 'Pull with the elbows, drive them to your hips, squeeze the mid-back.', watch: 'Don’t shrug or yank with momentum — control the lowering phase.' } },
  { match: ['pull-up', 'pullup', 'chin-up', 'dead hang', 'negatives'], info: { cue: 'Start from a full dead-hang, pull elbows to ribs, chin clearly over the bar.', watch: 'Avoid kipping/jerking if training strict; ease in to protect elbows & shoulders.' } },
  { match: ['curl', 'zottman', 'hammer'], info: { cue: 'Pin elbows to your sides, control the lowering, full range top and bottom.', watch: 'Don’t swing the torso or hyperextend the wrist.' } },
  { match: ['tricep', 'skull crusher', 'pushdown', 'french press', 'kickback'], info: { cue: 'Keep elbows tucked and still; only the forearm moves.', watch: 'Go light on skull crushers; flaring elbows stresses the elbow joint.' } },
  { match: ['calf'], info: { cue: 'Full stretch at the bottom, pause and squeeze at the top.', watch: 'Don’t bounce out of the stretch — let the muscle do the work.' } },
  { match: ['plank', 'hollow', 'leg raise', 'l-sit', 'sit-up', 'mountain climber'], info: { cue: 'Tuck the pelvis, brace abs, breathe — quality over duration.', watch: 'Stop if the lower back sags; keep the rib cage down.' } },
  { match: ['run', 'sprint', 'walk', 'burpee', 'jump'], info: { cue: 'Land softly mid-foot, knees soft, relaxed shoulders.', watch: 'Build volume gradually; sharp joint pain means stop.' } },
]

/** Coaching for an exercise name, or null if we have nothing specific. */
export function exerciseInfo(name: string): ExerciseInfo | null {
  const n = name.toLowerCase()
  for (const r of RULES) if (r.match.some((m) => n.includes(m))) return r.info
  return null
}
