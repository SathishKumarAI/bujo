/**
 * Pickleball Coaching Academy — a beginner→pro curriculum, practice schedule,
 * drill library, and mental-game track. Pure static content compiled from
 * research (see docs/research/pickleball-coaching-curriculum.md). No state.
 */

export interface AcademyLevel { id: string; name: string; dupr: string; color: string; skills: string[] }

export const ACADEMY_LEVELS: AcademyLevel[] = [
  { id: 'beginner', name: 'Beginner', dupr: '2.0–2.5', color: 'green', skills: [
    'Rules, scoring & the two-bounce rule',
    'Continental grip + athletic ready position',
    'Underhand serve (below waist, deep, cross-court)',
    'Deep, high return — then move to the kitchen',
    'Kitchen (NVZ) rules & line positioning',
    'Intro to the dink — soft, low, controlled',
  ] },
  { id: 'novice', name: 'Adv. Beginner', dupr: '3.0', color: 'teal', skills: [
    'Shot consistency — placement over power',
    'Consistent dinking (15–20 in a row)',
    'Third-shot drop — net it? swing higher, not harder',
    'Footwork — split-step before every shot',
    'Controlled directional volleys',
    'Basic third-shot drive (keep them guessing)',
  ] },
  { id: 'intermediate', name: 'Intermediate', dupr: '3.5', color: 'sky', skills: [
    'Purposeful dinking — angle to the backhand',
    'Transition-zone footwork',
    'Reset from the transition zone (soft hands)',
    'Drop-vs-drive decisions',
    'Speed-ups + intro to hand battles',
    'Intro to stacking (half-stack)',
  ] },
  { id: 'advanced', name: 'Advanced', dupr: '4.0', color: 'mauve', skills: [
    'Consistent resets under pressure',
    'Offensive cross-court dinking',
    'Speed-ups and counters',
    'Hand-speed battles (short path, no windup)',
    'Stacking and poaching',
    'Shot selection + specialty shots (Erne, ATP, lob)',
  ] },
  { id: 'pro', name: 'Pro', dupr: '4.5+', color: 'peach', skills: [
    'Elite hand battles — absorb pace with soft blocks',
    'Advanced spin serves',
    'Deception & disguise',
    'Advanced Erne / ATP execution',
    'Point construction',
    'Poaching, switching & adaptive game plans',
  ] },
]

export const WEEKLY_TEMPLATE: { day: string; focus: string; detail: string }[] = [
  { day: 'Mon', focus: 'Dinking / soft game', detail: 'Cross-court dink rallies (25–50 no-miss), then a dinks-only skinny game.' },
  { day: 'Tue', focus: 'Third-shot drops + transition', detail: 'Drop low / drive high / follow your shot in. 10 drops in a row, then add movement.' },
  { day: 'Wed', focus: 'Serve / return + footwork', detail: 'Deep serve placement, deep returns, split-step + ladder. (Or make this a rest day.)' },
  { day: 'Thu', focus: 'Transition zone / resets', detail: 'Soft blocks to reset speed-ups — paddle steady, out front, absorb, re-approach.' },
  { day: 'Fri', focus: 'Net play / speedups / hands', detail: 'Pattern volleys, reaction volleys, hand-battle exchanges. Stay relaxed, don’t flinch.' },
  { day: 'Sat', focus: 'Live play / games', detail: 'Match play with one tactical intention per game (e.g. every 3rd shot is a drop).' },
  { day: 'Sun', focus: 'Rest or wall', detail: 'True recovery, or a light 20–30 min wall session (200+ touches just above net height).' },
]

export const SESSION_TEMPLATE: { mins: string; activity: string }[] = [
  { mins: '0–10', activity: 'Dink warm-up — straight then cross-court; favour your weak side.' },
  { mins: '10–20', activity: 'Fast hands / volleys — pattern then reaction volleys.' },
  { mins: '20–30', activity: 'Dink games on the skinny court — attack only out of the air.' },
  { mins: '30–45', activity: 'Roll & reset — reset attacks in the transition zone, then pressure it.' },
  { mins: '45–55', activity: 'Drops & drives from the baseline — cross-court & down-the-line decisions.' },
  { mins: '55–60', activity: 'Point play — skinny singles or full points; serve → transition → kitchen.' },
]

export interface AcademyDrill { name: string; skill: string; how: string }

export const ACADEMY_DRILLS: AcademyDrill[] = [
  { skill: 'Dinking', name: 'Figure-8', how: 'One player always down-the-line, the other always cross-court — trace a figure-8.' },
  { skill: 'Dinking', name: 'Cross-court rally', how: 'Diagonal partners trade only cross-court dinks; aim for 50+ in a row.' },
  { skill: 'Dinking', name: 'Dink to targets', how: 'Land dinks on cones placed in the kitchen.' },
  { skill: 'Dinking', name: 'Skinny singles', how: 'Singles on half the court for accuracy + decisions.' },
  { skill: 'Third-shot drop', name: 'Nine-point drill', how: '9 tape targets NVZ→baseline; hit a drop from each, restart on a miss.' },
  { skill: 'Third-shot drop', name: '0-to-60', how: 'Feeder at net feeds deep; score 1 per good drop, race to 60.' },
  { skill: 'Third-shot drop', name: 'Slinky', how: 'Two dinks at the kitchen, step back two steps, two drops; retreat to baseline.' },
  { skill: 'Reset / transition', name: 'Catch the drive', how: 'Partner drives fast low balls; absorb each into the kitchen with a still, open paddle.' },
  { skill: 'Reset / transition', name: 'Drive, drop & reset', how: 'Drive, then drop, then reset through the transition zone; play to 11 skinny.' },
  { skill: 'Reset / transition', name: 'Yellow-light reset', how: 'Block-and-reset low balls, counter attackable ones, let shoulder-high balls sail out.' },
  { skill: 'Serve', name: 'Three-zone depth', how: 'Alternate serving to near, mid, and deep zones in the box.' },
  { skill: 'Serve', name: 'Target accuracy', how: 'Hit a baseline-corner target 10 times in a row before switching sides.' },
  { skill: 'Return', name: 'Deep return to cone', how: 'Land returns within a foot of a cone; move the cone line→middle→cross.' },
  { skill: 'Volleys / hands', name: 'Kitchen sweep', how: 'Volley at varied angles while sidestepping along the kitchen line.' },
  { skill: 'Volleys / hands', name: 'Straight-hands battle', how: 'Trade straight volleys at a shared pace, find rhythm, then add power.' },
  { skill: 'Volleys / hands', name: 'Firefight', how: 'Dink cooperatively, then speed one up to start a hands battle; reset, repeat.' },
  { skill: 'Footwork', name: 'Split-step reaction', how: 'On a random cue, fire an explosive split-step hop. 3×20.' },
  { skill: 'Footwork', name: 'Shuffle volley', how: 'Alternate FH/BH volleys against a wall while shuffling along the net line.' },
  { skill: 'Solo / wall', name: 'Wall rallies', how: 'Continuous FH/BH against a wall, low and just above net height; split-step each rebound.' },
  { skill: 'Solo / wall', name: 'Wall dink', how: 'Tape a net line; dink softly just above it with out-front contact.' },
  { skill: 'Solo / wall', name: 'Wall serve targets', how: 'Tape target zones; groove serve and drop trajectories.' },
]

export interface MindsetPrinciple { title: string; why: string }

export const MINDSET: MindsetPrinciple[] = [
  { title: 'Play point-by-point', why: 'Staying present keeps you reacting to the opponent, not the scoreboard.' },
  { title: 'Short memory — flush errors', why: 'Dwelling on the last miss leaks tension into the next point.' },
  { title: 'The patience game', why: 'Win by hitting the high-percentage ball one more time; errors decide most points.' },
  { title: 'Smart 80% shot', why: 'The disciplined shot forces their error; the flashy winner risks yours.' },
  { title: 'Beat the banger — block & reset', why: 'Out-banging power players is a losing trade; their hard balls are often wild.' },
  { title: 'Communicate loud & early', why: 'The late "mine/yours/switch" call costs the point, not the wrong one.' },
  { title: 'Positive partner energy', why: 'A paddle tap after an error keeps team focus and chemistry.' },
  { title: 'Pre-point routine', why: 'A breath + ritual resets arousal — the single most effective mental tool.' },
  { title: 'Breathe (box breathing)', why: 'Deliberate breathing shifts you out of fight-or-flight, sharpening reactions.' },
  { title: 'Control tilt', why: 'Acknowledge frustration, then re-anchor in feet/paddle/breath to stop the snowball.' },
  { title: 'Reframe nerves as readiness', why: 'Performance peaks at moderate arousal — find your zone, not calm.' },
  { title: 'Process over outcome', why: 'Judge yourself on executing the right idea; mistakes are feedback.' },
  { title: 'Confidence is a choice', why: 'It’s grounded in your training — one bad serve doesn’t erase thousands.' },
  { title: 'Strong body language', why: 'A ready posture + positive self-talk feeds performance and unsettles opponents.' },
  { title: 'Visualize the target', why: 'Lock onto the spot, not your mechanics, so trained motor skills fire automatically.' },
  { title: 'Controlled aggression', why: 'Under pressure, play bold but smart — placement and spin over outright winners.' },
]

export interface AcademyWeek {
  week: number
  focus: string
  skills: string
  /** Plain "do this" summary for the week. */
  doThis: string
  /** 2–3 specific drills to run this week. */
  drills: string[]
  /** A measurable goal to hit before moving on. */
  goal: string
}

export const TWELVE_WEEK: AcademyWeek[] = [
  { week: 1, focus: 'Fundamentals & rules', skills: 'Grip, ready position, NVZ rules, scoring, ball-drop control.',
    doThis: 'Learn the continental grip, the athletic ready stance, and the two-bounce rule. Drop-and-hit a ball to feel clean contact.',
    drills: ['Ball-drop control: drop, let it bounce, hit a soft target — 20 reps', 'Shadow ready-position + split-step, 3×20'],
    goal: 'Explain the 2-bounce + kitchen rules and rally 10 balls without a mishit.' },
  { week: 2, focus: 'Serve & return depth', skills: 'Deep serve (9/10), deep return + advance behind it.',
    doThis: 'Groove a legal, deep underhand serve. Return deep and high, then walk in behind it.',
    drills: ['Serve target accuracy: 10 in the back third before switching', 'Deep-return-to-cone: land within a foot of a deep cone'],
    goal: '9/10 serves in; returns land in the back third 7/10.' },
  { week: 3, focus: 'Positioning & movement', skills: 'Move to NVZ as a unit, split-step, return-and-rush.',
    doThis: 'After every return, get to the kitchen line with your partner. Split-step before each shot.',
    drills: ['Return-and-rush: return, sprint to the line, split-step', 'Footwork ladder / in-and-out steps, 3×30s'],
    goal: 'Reach the kitchen line as a team on 8/10 returns.' },
  { week: 4, focus: 'Dinking foundations', skills: 'Sustained straight dinks, soft hands; 20→50 rally.',
    doThis: 'Soft hands, paddle out front, contact in front of you. Keep it low and unattackable.',
    drills: ['Straight-on dink rally — build to 25 no-miss', 'Wall dink just above a taped net line'],
    goal: 'Sustain a 25+ dink rally.' },
  { week: 5, focus: 'Dink control & placement', skills: 'Cross-court dinks, height/depth control, spotting pop-ups.',
    doThis: 'Add direction: cross-court and to the backhand. Watch for balls you can attack.',
    drills: ['Cross-court dink rally — 50+ in a row', 'Figure-8 dinks', 'Dink-to-targets in the kitchen'],
    goal: '50+ cross-court dinks; place 7/10 to a target.' },
  { week: 6, focus: 'Third-shot-drop intro', skills: 'Soft drop, high net clearance; NVZ→mid→baseline progression.',
    doThis: 'The gateway skill. Soft upward arc into the kitchen. Net it? Aim higher, not harder.',
    drills: ['Slinky drill (dink → step back → drop to baseline)', 'Nine-point drop from the NVZ row first'],
    goal: 'Drop softly into the kitchen 6/10 from mid-court.' },
  { week: 7, focus: 'Drop under pressure', skills: 'Baseline drops + move up; 50+/session, 7/10 into the kitchen.',
    doThis: 'Drop from the baseline, then follow it in two steps. This is the 3.5 gate.',
    drills: ['0-to-60 (race to 60 good drops)', 'Nine-point drill full court'],
    goal: '~90% drops land unattackable; 7/10 from the baseline.' },
  { week: 8, focus: 'Transition & resets', skills: 'Reset fast balls low; 3–5 in a row before advancing.',
    doThis: 'In no-man’s-land, absorb pace with a still, open paddle and reset into the kitchen.',
    drills: ['Catch-the-drive reset', 'Drive-drop-reset to 11 skinny'],
    goal: 'Reset 3–5 hard balls in a row before stepping in.' },
  { week: 9, focus: 'Volleys & punch volley', skills: 'Deep punch volleys (control), block volleys, firefight footwork.',
    doThis: 'Control over power at the net. Punch deep, block the fast ones, stay relaxed.',
    drills: ['Kitchen sweep (volley + shuffle)', 'Straight-hands battle, build pace'],
    goal: 'Keep 20 controlled volleys without popping one up.' },
  { week: 10, focus: 'Speedups & hands', skills: 'Attack-above-waist / dink-below-waist, counters, hand battles.',
    doThis: 'Speed up only attackable (high) balls when balanced; counter, then reset.',
    drills: ['Firefight (dink → speed-up → battle → reset)', 'Reaction volleys, random placement'],
    goal: 'Win the hands battles you start; correct attack-vs-dink choice 8/10.' },
  { week: 11, focus: 'Strategy & shot selection', skills: 'Stacking basics, communication, reading patterns, pace control.',
    doThis: 'Play with intent: stack to protect a forehand, call the middle, pick the smart shot.',
    drills: ['Skinny singles for shot selection', 'Play games with one tactical rule each'],
    goal: 'Stack without positioning errors; verbalise your plan each point.' },
  { week: 12, focus: 'Match play & prep', skills: 'Specialty-shot awareness (ATP/Erne), patterns, log ~6 DUPR games.',
    doThis: 'Put it together in real games. Learn when an ATP/Erne is on. Log matches for a rating.',
    drills: ['Full points: serve → transition → kitchen', 'Awareness reps: ATP & Erne setups'],
    goal: 'A complete game with no glaring weakness + ~6 logged matches.' },
]

export const ACADEMY_TOTAL_WEEKS = 12

// ── Technique guide (the "how") ──────────────────────────────────────────────
// Step-by-step so the app is the only place you need.

export interface Technique {
  name: string
  group: string
  what: string
  how: string[]
  cues: string[]
  mistakes: string[]
}

export const TECHNIQUES: Technique[] = [
  {
    name: 'Continental grip', group: 'Foundations',
    what: 'The one grip for almost everything — like holding a hammer to chop.',
    how: ['Shake hands with the paddle; the V of thumb+index sits on the top edge.', 'Same grip for forehand, backhand, volleys, dinks — no switching.', 'Hold firm but relaxed (4/10 pressure); tighten only at contact.'],
    cues: ['"Hammer grip"', 'Relaxed hands = soft touch'],
    mistakes: ['Death-gripping (kills touch + pops dinks up)', 'Switching grips mid-rally (too slow at the net)'],
  },
  {
    name: 'Ready position', group: 'Foundations',
    what: 'The athletic stance you return to between every shot.',
    how: ['Feet wider than shoulders, knees bent, weight on the balls of your feet.', 'Paddle up at chest height, out in front, tip pointing up.', 'Slight forward lean; stay light, ready to split-step.'],
    cues: ['"Paddle up, knees bent"', 'Nose over toes'],
    mistakes: ['Paddle hanging low (no time to react up high)', 'Standing tall/flat-footed'],
  },
  {
    name: 'Split-step', group: 'Footwork',
    what: 'A small hop that loads your legs just as the opponent strikes, so you can move any direction.',
    how: ['As they’re about to contact the ball, do a tiny hop and land on the balls of both feet.', 'Land balanced and slightly wide; then push off toward the ball.', 'Do it before EVERY shot — serve return, at the kitchen, in transition.'],
    cues: ['"Hop as they hit"', 'Land light, then explode'],
    mistakes: ['Moving while they strike (caught flat)', 'A big jump (too slow to land)'],
  },
  {
    name: 'Serve (underhand)', group: 'Serve & return',
    what: 'Start the point: a deep, legal underhand serve.',
    how: ['Stand behind the baseline; ball in non-paddle hand.', 'Contact below the waist with an upward, low-to-high swing.', 'Hit deep and cross-court into the service box; aim 1–2 ft inside the baseline.', 'Once deep is reliable, add pace/spin and target the backhand.'],
    cues: ['"Low to high"', 'Deep first, fancy later'],
    mistakes: ['Contacting above the waist (illegal)', 'Aiming for lines (errors > the tiny edge gained)'],
  },
  {
    name: 'Return of serve', group: 'Serve & return',
    what: 'Return deep, then sprint to the kitchen — the returning team’s biggest advantage.',
    how: ['Take it after the bounce (two-bounce rule) with a compact stroke.', 'Hit it high and DEEP to pin the server back.', 'Immediately move forward to the kitchen line as the ball travels.', 'Split-step as your partner-side opponent contacts the third shot.'],
    cues: ['"Deep, then run"', 'Height buys you time to get up'],
    mistakes: ['Short returns (lets them attack)', 'Admiring the return instead of moving up'],
  },
  {
    name: 'Dink', group: 'Soft game',
    what: 'A soft shot that arcs just over the net into the kitchen, too low to attack.',
    how: ['Continental grip, paddle out in front, knees bent.', 'Push/lift the ball with the shoulder — no wrist flick, almost no backswing.', 'Contact out in front and below the net; let the legs do the lifting.', 'Aim low over the net; vary cross-court vs down-the-line.'],
    cues: ['"Lift with the legs"', 'Contact in front, soft hands'],
    mistakes: ['Wristy swings (pop-ups)', 'Standing tall (you’ll hit down into the net)', 'Too high (gets attacked)'],
  },
  {
    name: 'Third-shot drop', group: 'Soft game',
    what: 'From the baseline, a soft arc that lands unattackable in the kitchen so you can advance. The skill that unlocks 3.5.',
    how: ['Drop or let the ball come to you; low-to-high lift, minimal backswing.', 'Aim for the peak of the arc to be on YOUR side, falling into the kitchen.', 'If you net it, swing HIGHER and softer — not harder.', 'After the drop, take two steps in and split-step.'],
    cues: ['"Arc it, don’t hit it"', 'Net it? aim higher'],
    mistakes: ['Driving it flat (sits up to be smashed)', 'Not moving up after a good drop'],
  },
  {
    name: 'Reset', group: 'Transition',
    what: 'Absorbing a hard ball softly into the kitchen when you’re caught in the transition zone.',
    how: ['Get low, paddle out front, loose grip — like catching an egg.', 'No swing: let the ball hit a soft, slightly-open paddle and die short.', 'Stay balanced; reset 3–5 in a row before advancing again.'],
    cues: ['"Catch it, don’t hit it"', 'Soft hands, low base'],
    mistakes: ['Swinging at it (pops up)', 'Backing up instead of resetting'],
  },
  {
    name: 'Volley / punch volley', group: 'Net play',
    what: 'Hitting out of the air at the kitchen line — controlled, not wild.',
    how: ['Paddle up, contact in front, short punch — no big swing.', 'Punch deep at the opponent’s feet or hip (the "chicken wing").', 'Only attack balls contacted ABOVE net height; below = dink/reset.'],
    cues: ['"Punch, don’t swing"', 'Above the net = go, below = soft'],
    mistakes: ['Swinging hard (errors)', 'Attacking low balls'],
  },
  {
    name: 'Speed-up & counter', group: 'Net play',
    what: 'Accelerating an attackable ball to start a hands battle — then countering theirs.',
    how: ['Pick a ball at/above net height when you’re balanced.', 'Compact flick from the shoulder/elbow; aim at the body or the dominant shoulder.', 'Expect the counter: reset your paddle to the middle immediately.', 'Counter blocks: short paddle, tip up, redirect — don’t wind up.'],
    cues: ['"Attack high, balanced"', 'Reset paddle after every speed-up'],
    mistakes: ['Speeding up low/off-balance', 'Winding up in a hands battle (too slow)'],
  },
  {
    name: 'Stacking', group: 'Strategy',
    what: 'Lining up so your stronger (usually forehand) side stays in the middle.',
    how: ['Both partners start on the same side; after the serve/return, switch to your preferred sides.', 'Use a hand signal behind the back to confirm who covers where.', 'Communicate every point; switch back when the situation resets.'],
    cues: ['"Forehands in the middle"', 'Signal + call it'],
    mistakes: ['Stacking without communicating (open court)', 'Forgetting to switch back'],
  },
  {
    name: 'Erne', group: 'Specialty',
    what: 'Jumping around the kitchen (outside the sideline) to volley a cross-court dink early — an advanced poach.',
    how: ['Read a predictable cross-court dink heading to your sideline.', 'Either jump over the corner of the kitchen or step around it, landing outside the line.', 'Volley the ball before it crosses — into the open court or at feet.'],
    cues: ['"Bait the cross-court, then pounce"', 'Land outside the kitchen line'],
    mistakes: ['Going too early (telegraphed)', 'Touching the kitchen (fault)'],
  },
  {
    name: 'ATP (around the post)', group: 'Specialty',
    what: 'Returning a wide ball around the outside of the net post — it can land below net height.',
    how: ['On a sharply angled ball pulling you wide, let it travel past the sideline.', 'Track it low and hit around (not over) the post into the open court.', 'No height requirement — the net isn’t in the way.'],
    cues: ['"Let it pull you wide, then go around"', 'Low and flat is fine'],
    mistakes: ['Trying to go over the net instead of around', 'Rushing — let the angle develop'],
  },
  {
    name: 'Defensive lob', group: 'Specialty',
    what: 'A high, deep ball over the net players to buy time or flip pressure.',
    how: ['From a dink or under pressure, lift the ball high and DEEP toward the baseline.', 'Aim over the backhand shoulder; depth matters more than height.', 'Use sparingly and with the wind/sun in your favour.'],
    cues: ['"High and deep, over the backhand"', 'Surprise, not staple'],
    mistakes: ['Short lobs (free smash)', 'Overusing it (becomes predictable)'],
  },
]

// ── Knee rehab / prehab (ACL & MCL) ──────────────────────────────────────────
// General educational content — NOT medical advice. After an injury, follow a
// physio's plan; don't push through sharp pain.

export type RehabEquip = 'none' | 'band' | 'weights'
export interface RehabExercise {
  name: string
  phase: 'prehab' | 'rehab'
  target: 'ACL' | 'MCL' | 'Knee'
  equip: RehabEquip
  how: string
}

export const KNEE_REHAB: RehabExercise[] = [
  // ── Prehab (prevention — build a bulletproof knee for the court) ──
  { name: 'Glute bridge', phase: 'prehab', target: 'Knee', equip: 'none', how: 'On your back, drive hips up squeezing glutes. 3×12. Posterior-chain base.' },
  { name: 'Single-leg balance', phase: 'prehab', target: 'ACL', equip: 'none', how: 'Stand on one foot 30–45s; progress to eyes closed / cushion. Trains stability.' },
  { name: 'Bodyweight squat', phase: 'prehab', target: 'Knee', equip: 'none', how: 'Sit back, knees track over toes, chest up. 3×12–15.' },
  { name: 'Reverse lunge', phase: 'prehab', target: 'Knee', equip: 'none', how: 'Step back, lower the back knee, drive up. 3×10/side — knee-friendlier than forward.' },
  { name: 'Calf raise', phase: 'prehab', target: 'Knee', equip: 'none', how: '3×15 slow up/down; protects ankle + knee on push-offs.' },
  { name: 'Nordic hamstring (assisted)', phase: 'prehab', target: 'ACL', equip: 'none', how: 'Kneel, anchor feet, lower slowly forward resisting with hamstrings. 3×5. Top ACL preventer.' },
  { name: 'Lateral band walk', phase: 'prehab', target: 'MCL', equip: 'band', how: 'Band above knees, step sideways staying low. 3×12/side — hip/knee lateral control.' },
  { name: 'Clamshell', phase: 'prehab', target: 'MCL', equip: 'band', how: 'Side-lying, band on knees, open the top knee. 3×15/side. Glute med for valgus control.' },
  { name: 'Terminal knee extension (TKE)', phase: 'prehab', target: 'ACL', equip: 'band', how: 'Band behind the knee, straighten against it. 3×15. Locks out quad/VMO.' },
  { name: 'Monster walk', phase: 'prehab', target: 'MCL', equip: 'band', how: 'Band at ankles, walk forward/back in a quarter-squat. 3×10 steps.' },
  { name: 'Goblet squat', phase: 'prehab', target: 'Knee', equip: 'weights', how: 'Hold a weight at the chest, squat deep + controlled. 3×10.' },
  { name: 'Romanian deadlift', phase: 'prehab', target: 'ACL', equip: 'weights', how: 'Hinge at the hips, soft knees, feel the hamstrings. 3×10. Hamstring strength = ACL armour.' },
  { name: 'Bulgarian split squat', phase: 'prehab', target: 'Knee', equip: 'weights', how: 'Rear foot elevated, lower straight down. 3×8/side. Single-leg strength + balance.' },
  { name: 'Step-up', phase: 'prehab', target: 'Knee', equip: 'weights', how: 'Drive through the top foot onto a box; control down. 3×10/side.' },
  // ── Rehab (recovery phases — clear with your physio first) ──
  { name: 'Quad set', phase: 'rehab', target: 'ACL', equip: 'none', how: 'Early phase. Tighten the thigh, push the knee flat for 5s. 3×10. Re-wakes the quad.' },
  { name: 'Heel slide', phase: 'rehab', target: 'Knee', equip: 'none', how: 'Early. Slide the heel toward you to restore bend (ROM). 3×10, gently.' },
  { name: 'Straight-leg raise', phase: 'rehab', target: 'ACL', equip: 'none', how: 'Early. Lift the straight leg ~30cm, control down. 3×10. No quad lag.' },
  { name: 'Mini-squat (0–45°)', phase: 'rehab', target: 'Knee', equip: 'none', how: 'Mid. Shallow, pain-free range; build depth over weeks. 3×12.' },
  { name: 'Wall sit', phase: 'rehab', target: 'Knee', equip: 'none', how: 'Mid. Hold a comfortable angle 20–40s. 3 rounds. Isometric quad.' },
  { name: 'Hamstring curl (band)', phase: 'rehab', target: 'ACL', equip: 'band', how: 'Mid. Curl the heel toward the glute against the band. 3×12.' },
  { name: 'Lateral step-down', phase: 'rehab', target: 'MCL', equip: 'none', how: 'Late. Off a low step, lower slowly with control (no valgus collapse). 3×8/side.' },
  { name: 'Balance + reach', phase: 'rehab', target: 'ACL', equip: 'none', how: 'Late. Single-leg, reach the free foot to clock points. Proprioception for return-to-court.' },
  { name: 'Controlled lateral bounds', phase: 'rehab', target: 'ACL', equip: 'none', how: 'Return-to-sport. Small side-to-side hops, stick the landing soft. Only when cleared.' },
]

