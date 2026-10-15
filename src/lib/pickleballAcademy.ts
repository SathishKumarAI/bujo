/**
 * Pickleball Coaching Academy — a beginner→pro curriculum, practice schedule,
 * drill library, and mental-game track. Pure static content compiled from
 * research (see docs/research/pickleball-coaching-curriculum.md). No state.
 */

export interface AcademyLevel {
  id: string
  name: string
  dupr: string
  color: string
  skills: string[]
  /** THE SYMPTOMS. A rating is a number; this is what the number feels like
   *  from inside a game, which is how anybody actually places themselves. */
  youAreHere: string
  /** The ONE thing that moves you up. Not a list — a list is what the `skills`
   *  column already is, and a list is why people plateau working on six. */
  unlock: string
}

export const ACADEMY_LEVELS: AcademyLevel[] = [
  { id: 'beginner', name: 'Beginner', dupr: '2.0–2.5', color: 'green', skills: [
    'Rules, scoring & the two-bounce rule',
    'Continental grip + athletic ready position',
    'Underhand serve (below waist, deep, cross-court)',
    'Deep, high return — then move to the kitchen',
    'Kitchen (NVZ) rules & line positioning',
    'Intro to the dink — soft, low, controlled',
  ],
    youAreHere: 'You are still thinking about whether it bounced twice, your serve misses the box under pressure, and you play most of the point from the baseline because that is where you started.',
    unlock: 'Get every serve in and every return deep — then walk to the kitchen line and stay there. Placement and position beat every shot you do not have yet.',
  },
  { id: 'novice', name: 'Adv. Beginner', dupr: '3.0', color: 'teal', skills: [
    'Shot consistency — placement over power',
    'Consistent dinking (15–20 in a row)',
    'Third-shot drop — net it? swing higher, not harder',
    'Footwork — split-step before every shot',
    'Controlled directional volleys',
    'Basic third-shot drive (keep them guessing)',
  ],
    youAreHere: 'You can rally. But your third shot is a drive every single time, and when it comes back you are stranded in the middle of the court.',
    unlock: 'The third-shot drop. It is the one gate between 3.0 and 3.5, and if it keeps hitting the net the answer is a higher, wider swing — not a harder one.',
  },
  { id: 'intermediate', name: 'Intermediate', dupr: '3.5', color: 'sky', skills: [
    'Purposeful dinking — angle to the backhand',
    'Transition-zone footwork',
    'Reset from the transition zone (soft hands)',
    'Drop-vs-drive decisions',
    'Speed-ups + intro to hand battles',
    'Intro to stacking (half-stack)',
  ],
    youAreHere: 'Your drops and dinks are real, and you still lose the fast exchanges at the net and panic crossing the transition zone.',
    unlock: 'The reset: absorb the drive with an open paddle and no backswing, and only move forward on a ball above the net. Advancing on a low ball is what keeps feeding them the attack.',
  },
  { id: 'advanced', name: 'Advanced', dupr: '4.0', color: 'mauve', skills: [
    'Consistent resets under pressure',
    'Offensive cross-court dinking',
    'Speed-ups and counters',
    'Hand-speed battles (short path, no windup)',
    'Stacking and poaching',
    'Shot selection + specialty shots (Erne, ATP, lob)',
  ],
    youAreHere: 'Your shots are reliable. You lose to people whose shots are worse than yours, and you cannot say why.',
    unlock: 'Shot selection. The 3.5→4.0 leap is mostly cognitive: drive the pop-ups, drop the rest, and know which pattern you are building before you start it.',
  },
  { id: 'pro', name: 'Pro', dupr: '4.5+', color: 'peach', skills: [
    'Elite hand battles — absorb pace with soft blocks',
    'Advanced spin serves',
    'Deception & disguise',
    'Advanced Erne / ATP execution',
    'Point construction',
    'Poaching, switching & adaptive game plans',
  ],
    youAreHere: 'You win at your club and lose to anyone who plays tournaments — they seem to know what you are doing before you do it.',
    unlock: 'Deception and point construction: identical mechanics for the dink and the speed-up, and every point aimed at your strength against their weakness.',
  },
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

/**
 * THE SYMPTOM EACH DRILL GROUP CURES, keyed by `AcademyDrill.skill`.
 *
 * Per group rather than per drill, deliberately: the twenty-one drills inside
 * a group are variations on one fix, and writing twenty-one near-identical
 * sentences is how a data file stops being read. What somebody needs at the
 * top of the list is "my dinks pop up and get attacked" — then any drill under
 * it will do.
 *
 * Keyed by the string in the data rather than by an enum because that string
 * is already the grouping key the page renders. A missing key renders nothing
 * rather than crashing, and `pickleballAcademy.test.ts` asserts every group
 * present in `ACADEMY_DRILLS` has one — a lookup that silently returns
 * undefined for a renamed group is the dead-field trap in CLAUDE.md.
 */
export const DRILL_FIXES: Record<string, string> = {
  'Dinking': 'Your dinks sit up and get attacked, or rallies end because you miss before they do.',
  'Third-shot drop': 'You drive every third shot, they punch it back, and you never get to the kitchen line.',
  'Reset / transition': 'You get stuck in no-man’s-land and take the next ball at your feet, over and over.',
  'Serve': 'Serves land short and give them a free attacking return — or miss the box when the score is close.',
  'Return': 'Your return is short or low, so you are still walking forward when their third shot arrives.',
  'Volleys / hands': 'You lose every fast exchange at the net, and you flinch or wind up instead of blocking.',
  'Footwork': 'You arrive late and off balance, reach instead of step, and cross your feet going wide.',
  'Solo / wall': 'You have nobody to drill with — this is the group that needs one person and a wall.',
}

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

export interface MindsetPrinciple {
  title: string
  why: string
  /** THE MOMENT in a match this principle is about. A principle with no
   *  scenario is a poster; the scenario is what makes it recallable at 9–9. */
  when: string
  /** The specific thing to do when you notice it. Not "stay calm". */
  do: string
}

export const MINDSET: MindsetPrinciple[] = [
  { title: 'Play point-by-point', why: 'Staying present keeps you reacting to the opponent, not the scoreboard.',
    when: 'You are 7–10 down and already doing the arithmetic on whether you can still win.',
    do: 'Say the score out loud before you serve, then think about one thing: where this serve goes. The scoreboard is not a shot.' },
  { title: 'Short memory — flush errors', why: 'Dwelling on the last miss leaks tension into the next point.',
    when: 'You netted an easy third-shot drop and you are still annoyed two points later.',
    do: 'Give it one physical reset — turn to the back fence, breathe out, re-grip — then it is gone. A ritual beats an intention.' },
  { title: 'The patience game', why: 'Win by hitting the high-percentage ball one more time; errors decide most points.',
    when: 'A dink rally has gone fifteen balls and you want it over, so you attack one off your shoelaces.',
    do: 'Count to eight in your head before you let yourself look for an attack. Most rallies end in an error, and patience makes it theirs.' },
  { title: 'Smart 80% shot', why: 'The disciplined shot forces their error; the flashy winner risks yours.',
    when: 'The ball sits up slightly and the down-the-line winner is on — at about 50/50.',
    do: 'Take the cross-court drive you make eight times out of ten instead. Winners feel like points; percentages are points.' },
  { title: 'Beat the banger — block & reset', why: 'Out-banging power players is a losing trade; their hard balls are often wild.',
    when: 'Someone is driving every third shot hard at your chest and you are losing the exchange.',
    do: 'Stop swinging back. Loose grip, paddle out front, let it hit you — the block drops short and now they have to dink.' },
  { title: 'Communicate loud & early', why: 'The late "mine/yours/switch" call costs the point, not the wrong one.',
    when: 'A ball splits the middle and you both watch it, or you both swing.',
    do: '"Mine" / "Yours" before it crosses the net, not as it arrives. Middle is the forehand’s by default — agree that before the game.' },
  { title: 'Positive partner energy', why: 'A paddle tap after an error keeps team focus and chemistry.',
    when: 'Your partner has missed three in a row and has gone quiet.',
    do: 'Paddle tap and one specific thing they did well. Teams lose points in pairs; so do people’s hands.' },
  { title: 'Pre-point routine', why: 'A breath + ritual resets arousal — the single most effective mental tool.',
    when: 'Big point, and you can feel yourself rushing the serve.',
    do: 'The same three things every time: bounce, breath, target. Routine is what you fall back on when the conscious part is busy being nervous.' },
  { title: 'Breathe (box breathing)', why: 'Deliberate breathing shifts you out of fight-or-flight, sharpening reactions.',
    when: 'Your heart rate is up at a changeover and your hands are quick and sloppy.',
    do: 'Four in, four hold, four out, four hold — twice. It is the fastest control you have over arousal.' },
  { title: 'Control tilt', why: 'Acknowledge frustration, then re-anchor in feet/paddle/breath to stop the snowball.',
    when: 'A bad line call two points ago is still running in your head.',
    do: 'Re-anchor in three senses: the grip in your hand, your feet on the court, the ball’s sound. You cannot argue and perceive at the same time.' },
  { title: 'Reframe nerves as readiness', why: 'Performance peaks at moderate arousal — find your zone, not calm.',
    when: 'First tournament match, hands shaking in the warm-up.',
    do: 'Name it as readiness rather than fear — same physiology, different label. You want to be somewhere in the middle of the arousal curve, not flat.' },
  { title: 'Process over outcome', why: 'Judge yourself on executing the right idea; mistakes are feedback.',
    when: 'You won but played badly, or lost a match you executed well.',
    do: 'Score the three things you were working on, not the result. The result is a lagging indicator of the things.' },
  { title: 'Confidence is a choice', why: 'It’s grounded in your training — one bad serve doesn’t erase thousands.',
    when: 'You double-fault the first serve of the match.',
    do: 'One bad serve against several thousand good ones is not evidence. Act as the player your practice says you are, including the body language.' },
  { title: 'Strong body language', why: 'A ready posture + positive self-talk feeds performance and unsettles opponents.',
    when: 'Shoulders down, head shaking, after a miss.',
    do: 'Stand up, paddle up, walk back at normal speed. Your opponent reads it, your partner reads it, and so does your own nervous system.' },
  { title: 'Visualize the target', why: 'Lock onto the spot, not your mechanics, so trained motor skills fire automatically.',
    when: 'You keep hitting “away from them” and it keeps going out.',
    do: 'Pick a spot the size of a paddle and look at it. Aiming at a space is aiming at nothing.' },
  { title: 'Controlled aggression', why: 'Under pressure, play bold but smart — placement and spin over outright winners.',
    when: 'You are flat and passive, pushing every ball back and losing anyway.',
    do: 'Aggression is earlier contact and better placement, not harder swinging. Step in and take it out of the air.' },
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
  /** THE SITUATION this shot is the answer to. `what` says what the shot is
   *  and `how` says how to hit it; neither said when to choose it, which is
   *  the decision people actually get wrong at 3.0–3.5. */
  when: string
  how: string[]
  cues: string[]
  mistakes: string[]
}

export const TECHNIQUES: Technique[] = [
  {
    name: 'Continental grip', group: 'Foundations',
    what: 'The one grip for almost everything — like holding a hammer to chop.',
    when: 'Always — it is the grip you hold for the whole point. The moment you catch yourself changing grip mid-rally you have already lost the half-second the exchange needed.',
    how: ['Shake hands with the paddle; the V of thumb+index sits on the top edge.', 'Same grip for forehand, backhand, volleys, dinks — no switching.', 'Hold firm but relaxed (4/10 pressure); tighten only at contact.'],
    cues: ['"Hammer grip"', 'Relaxed hands = soft touch'],
    mistakes: ['Death-gripping (kills touch + pops dinks up)', 'Switching grips mid-rally (too slow at the net)'],
  },
  {
    name: 'Ready position', group: 'Foundations',
    what: 'The athletic stance you return to between every shot.',
    when: 'Between every single shot. The tell that you have lost it: you are reaching DOWN for dinks instead of already being low.',
    how: ['Feet wider than shoulders, knees bent, weight on the balls of your feet.', 'Paddle up at chest height, out in front, tip pointing up.', 'Slight forward lean; stay light, ready to split-step.'],
    cues: ['"Paddle up, knees bent"', 'Nose over toes'],
    mistakes: ['Paddle hanging low (no time to react up high)', 'Standing tall/flat-footed'],
  },
  {
    name: 'Split-step', group: 'Footwork',
    what: 'A small hop that loads your legs just as the opponent strikes, so you can move any direction.',
    when: 'As your opponent strikes the ball, every time — not when you see where it is going. A split-step after the ball is just a hop.',
    how: ['As they’re about to contact the ball, do a tiny hop and land on the balls of both feet.', 'Land balanced and slightly wide; then push off toward the ball.', 'Do it before EVERY shot — serve return, at the kitchen, in transition.'],
    cues: ['"Hop as they hit"', 'Land light, then explode'],
    mistakes: ['Moving while they strike (caught flat)', 'A big jump (too slow to land)'],
  },
  {
    name: 'Serve (underhand)', group: 'Serve & return',
    what: 'Start the point: a deep, legal underhand serve.',
    when: 'The start of every point you serve. Deep and in beats clever: a serve that lands past the mid-line pins them back and buys you the third shot.',
    how: ['Stand behind the baseline; ball in non-paddle hand.', 'Contact below the waist with an upward, low-to-high swing.', 'Hit deep and cross-court into the service box; aim 1–2 ft inside the baseline.', 'Once deep is reliable, add pace/spin and target the backhand.'],
    cues: ['"Low to high"', 'Deep first, fancy later'],
    mistakes: ['Contacting above the waist (illegal)', 'Aiming for lines (errors > the tiny edge gained)'],
  },
  {
    name: 'Return of serve', group: 'Serve & return',
    what: 'Return deep, then sprint to the kitchen — the returning team’s biggest advantage.',
    when: 'Every point you receive. Hit it high and DEEP — the height is what buys you the walk to the kitchen behind it.',
    how: ['Take it after the bounce (two-bounce rule) with a compact stroke.', 'Hit it high and DEEP to pin the server back.', 'Immediately move forward to the kitchen line as the ball travels.', 'Split-step as your partner-side opponent contacts the third shot.'],
    cues: ['"Deep, then run"', 'Height buys you time to get up'],
    mistakes: ['Short returns (lets them attack)', 'Admiring the return instead of moving up'],
  },
  {
    name: 'Dink', group: 'Soft game',
    what: 'A soft shot that arcs just over the net into the kitchen, too low to attack.',
    when: 'Once both teams are at the kitchen and nobody has a ball above net height. It is the default; the attack is the exception.',
    how: ['Continental grip, paddle out in front, knees bent.', 'Push/lift the ball with the shoulder — no wrist flick, almost no backswing.', 'Contact out in front and below the net; let the legs do the lifting.', 'Aim low over the net; vary cross-court vs down-the-line.'],
    cues: ['"Lift with the legs"', 'Contact in front, soft hands'],
    mistakes: ['Wristy swings (pop-ups)', 'Standing tall (you’ll hit down into the net)', 'Too high (gets attacked)'],
  },
  {
    name: 'Third-shot drop', group: 'Soft game',
    what: 'From the baseline, a soft arc that lands unattackable in the kitchen so you can advance. The skill that unlocks 3.5.',
    when: 'You served, they returned deep, you are at the baseline and they own the net. This is the shot that gets you forward — and it is the 3.0→3.5 gate.',
    how: ['Drop or let the ball come to you; low-to-high lift, minimal backswing.', 'Aim for the peak of the arc to be on YOUR side, falling into the kitchen.', 'If you net it, swing HIGHER and softer — not harder.', 'After the drop, take two steps in and split-step.'],
    cues: ['"Arc it, don’t hit it"', 'Net it? aim higher'],
    mistakes: ['Driving it flat (sits up to be smashed)', 'Not moving up after a good drop'],
  },
  {
    name: 'Reset', group: 'Transition',
    what: 'Absorbing a hard ball softly into the kitchen when you’re caught in the transition zone.',
    when: 'You are caught in the transition zone and they are driving at your feet. Soften it into the kitchen and advance only once the next ball is above the net.',
    how: ['Get low, paddle out front, loose grip — like catching an egg.', 'No swing: let the ball hit a soft, slightly-open paddle and die short.', 'Stay balanced; reset 3–5 in a row before advancing again.'],
    cues: ['"Catch it, don’t hit it"', 'Soft hands, low base'],
    mistakes: ['Swinging at it (pops up)', 'Backing up instead of resetting'],
  },
  {
    name: 'Volley / punch volley', group: 'Net play',
    what: 'Hitting out of the air at the kitchen line — controlled, not wild.',
    when: 'At the net on anything above net height. Punch it at their feet or at the gap — not a swing, a jab.',
    how: ['Paddle up, contact in front, short punch — no big swing.', 'Punch deep at the opponent’s feet or hip (the "chicken wing").', 'Only attack balls contacted ABOVE net height; below = dink/reset.'],
    cues: ['"Punch, don’t swing"', 'Above the net = go, below = soft'],
    mistakes: ['Swinging hard (errors)', 'Attacking low balls'],
  },
  {
    name: 'Speed-up & counter', group: 'Net play',
    what: 'Accelerating an attackable ball to start a hands battle — then countering theirs.',
    when: 'A ball at or above shoulder height when YOU are balanced and they are not. Speeding up off a low ball is the most common unforced error at 3.5.',
    how: ['Pick a ball at/above net height when you’re balanced.', 'Compact flick from the shoulder/elbow; aim at the body or the dominant shoulder.', 'Expect the counter: reset your paddle to the middle immediately.', 'Counter blocks: short paddle, tip up, redirect — don’t wind up.'],
    cues: ['"Attack high, balanced"', 'Reset paddle after every speed-up'],
    mistakes: ['Speeding up low/off-balance', 'Winding up in a hands battle (too slow)'],
  },
  {
    name: 'Stacking', group: 'Strategy',
    what: 'Lining up so your stronger (usually forehand) side stays in the middle.',
    when: 'When a left-and-right-handed pairing (or one much stronger forehand) means the normal sides keep putting your backhands in the middle.',
    how: ['Both partners start on the same side; after the serve/return, switch to your preferred sides.', 'Use a hand signal behind the back to confirm who covers where.', 'Communicate every point; switch back when the situation resets.'],
    cues: ['"Forehands in the middle"', 'Signal + call it'],
    mistakes: ['Stacking without communicating (open court)', 'Forgetting to switch back'],
  },
  {
    name: 'Erne', group: 'Specialty',
    what: 'Jumping around the kitchen (outside the sideline) to volley a cross-court dink early — an advanced poach.',
    when: 'They are dinking predictably cross-court into your sideline. Move after they commit, not before — early is just giving up the court.',
    how: ['Read a predictable cross-court dink heading to your sideline.', 'Either jump over the corner of the kitchen or step around it, landing outside the line.', 'Volley the ball before it crosses — into the open court or at feet.'],
    cues: ['"Bait the cross-court, then pounce"', 'Land outside the kitchen line'],
    mistakes: ['Going too early (telegraphed)', 'Touching the kitchen (fault)'],
  },
  {
    name: 'ATP (around the post)', group: 'Specialty',
    what: 'Returning a wide ball around the outside of the net post — it can land below net height.',
    when: 'A cross-court dink pulls you wide and the ball is OUTSIDE the post — then there is no net in the way and no height limit. Rare, legal, and worth recognising.',
    how: ['On a sharply angled ball pulling you wide, let it travel past the sideline.', 'Track it low and hit around (not over) the post into the open court.', 'No height requirement — the net isn’t in the way.'],
    cues: ['"Let it pull you wide, then go around"', 'Low and flat is fine'],
    mistakes: ['Trying to go over the net instead of around', 'Rushing — let the angle develop'],
  },
  {
    name: 'Defensive lob', group: 'Specialty',
    what: 'A high, deep ball over the net players to buy time or flip pressure.',
    when: 'You are both pushed back and losing the exchange. It is the one shot that buys seconds — and it is a reset, not a winner.',
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

