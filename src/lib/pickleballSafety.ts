/**
 * WHAT ACTUALLY HURTS PEOPLE ON A PICKLEBALL COURT, AND THE MOMENT IT HAPPENS.
 *
 * Owns: the injury scenarios, the warm-up sequence, the protective gear notes
 * and the list of bodies this content was gathered from. Does not own the
 * rehab/prehab exercises (`KNEE_REHAB` in `pickleballAcademy.ts`, which is a
 * list of movements), the curriculum, or anything about how the page draws.
 *
 * **Why scenarios and not a list of injuries.** The page already carried
 * twenty-three knee exercises and five one-line tips, and neither answered the
 * question somebody actually has, which is *"when does this happen to me, and
 * what do I do about it"*. "Protect the ankles" is true and unusable. "You
 * reached wide for a cross-court dink with a crossover step instead of a
 * shuffle, and the ankle rolled under a loaded foot" is the same claim with
 * the moment attached — and the moment is the part you can train.
 *
 * **What this is not.** Not medical advice, not a diagnosis, and not written
 * by a clinician. It is widely-published consensus guidance — the kind every
 * sports-medicine body says the same way — plus court-specific detail from
 * playing. `SAFETY_DISCLAIMER` says exactly that and the page prints it at the
 * top of every section, not just this one. The `redFlags` on each scenario are
 * the only part that is close to an instruction, and every one of them says
 * the same thing: stop, and see somebody.
 *
 * **Sources are searched, not pinned.** `SAFETY_SOURCES` carries the body's
 * name and what it is good for, and the link is BUILT from the name — the
 * pattern `lib/video.ts` already uses, for the reason CLAUDE.md records: a
 * pinned page rots and a search always lands. Nothing here cites a URL that
 * was not checked, because nothing here cites a URL at all.
 */

/** Built, not pinned — see the header. */
export function sourceSearchUrl(name: string, topic: string): string {
  return `https://duckduckgo.com/?q=${encodeURIComponent(`${name} ${topic}`)}`
}

/**
 * Printed at the top of every Coaching section.
 *
 * One sentence per claim it has to make: who wrote it, where it came from, and
 * what to do instead when it matters. Kept here rather than in the view so the
 * wording is one string and not seven.
 */
export const SAFETY_DISCLAIMER = {
  short: 'Educational only — gathered from public coaching and sports-medicine guidance, plus our own time on court. Not instruction, not medical advice.',
  long: 'Nobody here is your coach or your clinician. This section is assembled from publicly published coaching material and the general injury-prevention guidance sports-medicine bodies agree on, plus what we have learned playing. It can be wrong for you specifically. For anything painful, swollen, or that keeps coming back, see a physio or a doctor — and for technique, an hour with a real coach beats any amount of reading.',
} as const

export interface InjuryScenario {
  id: string
  /** The injury, in the words a search engine understands. */
  name: string
  /** Body part, for the chip beside the name. */
  area: 'Ankle' | 'Knee' | 'Calf' | 'Elbow' | 'Shoulder' | 'Whole body'
  /** THE MOMENT. The shot, the step, the point in the session. */
  where: string
  /** What the joint is doing when it goes. */
  mechanism: string
  /** First minutes and hours. Short, and never a diagnosis. */
  now: string[]
  /** The training and the habits that make it less likely. */
  prevent: string[]
  /** Stop and see somebody. The only near-instruction in this file. */
  redFlags: string[]
}

/**
 * Six scenarios, ordered by how often they end somebody's season.
 *
 * The ankle is first because it is the one that happens most; the fall is last
 * because it is the one that costs most, and both of those orderings are
 * deliberate — a list sorted by frequency alone buries the wrist fracture.
 */
export const COURT_INJURIES: InjuryScenario[] = [
  {
    id: 'ankle-sprain',
    name: 'Lateral ankle sprain',
    area: 'Ankle',
    where: 'Reaching wide for a cross-court dink with a crossover step instead of a shuffle. Also: stepping on a stray ball between points, and the first hard lateral push of a session you did not warm up for.',
    mechanism: 'The foot rolls inward under a planted, loaded ankle — the outside ligaments take the whole stop. A crossover step gets you there faster and leaves the foot pointing the wrong way when you arrive.',
    now: [
      'Stop the session. "Walking it off" is how a two-week sprain becomes a six-week one.',
      'Ice 15–20 minutes, compress, and get the foot above the hip when you sit.',
      'Put weight through it as pain allows rather than keeping it completely still — early loading is what current guidance favours.',
    ],
    prevent: [
      'Shuffle to the wide ball; keep the feet apart and never cross one in front of the other at speed.',
      'Court shoes, not running shoes. A running shoe is built to roll forward over a soft, tall heel, which is exactly the platform that tips sideways.',
      'Single-leg balance, 30–45s each side, three times a week. It is the cheapest thing on this page and it is the one with the best evidence behind it.',
      'A lace-up ankle brace if you have sprained it before — previous sprain is the strongest predictor of the next one.',
      'Clear stray balls off your court before serving. This is not a fitness intervention and it prevents more sprains than any of them.',
    ],
    redFlags: [
      'You cannot put weight on it for four steps.',
      'Bone tenderness along the back edge of either ankle knob rather than soft-tissue soreness below it.',
      'Numbness, or a foot that looks the wrong shape.',
    ],
  },
  {
    id: 'knee-ligament',
    name: 'Knee ligament strain (ACL / MCL)',
    area: 'Knee',
    where: 'A hard stop at the kitchen line, or a plant-and-cut to chase a ball wide to the forehand. Almost never contact — it is a deceleration injury.',
    mechanism: 'You stop on a flat, planted foot and the knee collapses inward over it while the hip stays behind. The ligament is what is left holding the rotation.',
    now: [
      'A pop, swelling inside the hour, or a knee that gives way under you is a stop-now list of three.',
      'Ice and elevate, and get it looked at rather than waiting to see how it feels on Saturday.',
    ],
    prevent: [
      'Stop with the hips back and the knee tracking over the second toe, not over the inside of the foot. Rehearse it slowly before you need it at speed.',
      'Strengthen the hip abductors and the hamstrings — the valgus collapse is usually a hip that cannot hold the knee out.',
      'Land soft. A stop you can hear is a stop the ligaments absorbed.',
      'On the gap a brace fills: a neoprene sleeve gives warmth and a sense of where the joint is, and it does **not** stabilise a ligament. A hinged brace does, and it belongs on a clinician’s recommendation after an injury, not as a precaution.',
    ],
    redFlags: [
      'An audible pop at the moment it happened.',
      'Swelling within an hour (rather than next-day stiffness).',
      'The knee buckling when you put weight through it.',
    ],
  },
  {
    id: 'calf-achilles',
    name: 'Calf strain / Achilles rupture',
    area: 'Calf',
    where: 'The explosive first step out of a dead stop — most often pushing off the kitchen line for a ball dropped behind you. Disproportionately the first game back after a week off, and disproportionately in the over-40s.',
    mechanism: 'A cold, stiff calf takes a sudden lengthening load under full body weight. People describe it as being kicked in the back of the leg by somebody who was not there.',
    now: [
      'Stop. Do not test it by sprinting.',
      'If you cannot push off, cannot do a single heel raise on that leg, or can feel a gap in the tendon, treat it as urgent rather than as a strain.',
    ],
    prevent: [
      'Calf raises three times a week, through full range, including the slow lowering half.',
      'Actually warm up before the first point. This injury is the clearest argument on the page for the eight minutes below.',
      'Come back from a layoff at 70%, for a whole session, before you play a tiebreak.',
    ],
    redFlags: [
      'A sudden sharp blow-like pain with no contact.',
      'You cannot rise onto the toes of that foot.',
      'A palpable dip in the tendon above the heel.',
    ],
  },
  {
    id: 'elbow',
    name: '"Pickleball elbow" (lateral epicondyle tendinopathy)',
    area: 'Elbow',
    where: 'Builds over weeks, not in one point. Shows up on backhand blocks and drives late in a session, and is worst the morning after.',
    mechanism: 'Repetitive load through the wrist extensors, almost always with a grip far tighter than the shot needs and a swing coming from the arm rather than the body.',
    now: [
      'Back the volume off rather than stopping entirely — tendons respond to load being managed, not removed.',
      'Ice after play if it is sore; heat before, if it is stiff.',
    ],
    prevent: [
      'Grip at 4/10. Tighten at contact only. The single most common cause on this list is squeezing a paddle for two hours.',
      'Drive from legs and core; the arm is the last link, not the engine.',
      'Check the grip size and the paddle weight — a grip too small makes you squeeze to keep control of it.',
      'Slow, heavy wrist-extensor work (the lowering half especially), built up gradually. This is the standard tendinopathy answer and it is slow on purpose.',
    ],
    redFlags: [
      'Pain at rest or at night, rather than only when loaded.',
      'Grip strength dropping away — opening a jar, holding a kettle.',
      'No change after six to eight weeks of managing it.',
    ],
  },
  {
    id: 'shoulder',
    name: 'Rotator-cuff irritation',
    area: 'Shoulder',
    where: 'Overheads and hard serves — especially the first ones of the day, and the smash at the end of a long rally when the arm is tired and the technique has gone.',
    mechanism: 'A cuff that has not been warmed or strengthened for overhead work takes the deceleration of a full swing.',
    now: [
      'Stop serving hard and stop hitting overheads. Dinking is usually still fine, which is what makes this one easy to play through and make worse.',
    ],
    prevent: [
      'Band external rotations and scapular work twice a week — low weight, high quality.',
      'Warm the shoulder up before the first hard serve: arm circles, then five serves at 60% before any at 80%.',
      'Let a lob go rather than hitting a desperate overhead off balance.',
    ],
    redFlags: [
      'Pain reaching behind your back or sleeping on that side.',
      'Weakness lifting the arm out to the side, not just pain.',
    ],
  },
  {
    id: 'fall',
    name: 'Falling backwards — wrist, hip, head',
    area: 'Whole body',
    where: 'Backpedalling for a lob. It is the single highest-consequence mistake on a pickleball court and it is entirely avoidable.',
    mechanism: 'Heels catch, the centre of mass is already behind them, and you land on an outstretched hand — or on the back of your head.',
    now: [
      'Any head contact ends the session, with no exceptions and no self-assessment.',
      'A wrist you cannot move or that is visibly out of line is an imaging question, not an ice question.',
    ],
    prevent: [
      'Never backpedal. Turn, run, and play it over the shoulder — or let it bounce and give up the court position. The point is not worth a hip.',
      'Call the lob for your partner. "Back!" is a cheap shot to give away.',
      'If balance is already a known issue, say so and play with people who will not lob you.',
    ],
    redFlags: [
      'Any loss of consciousness, confusion, repeated questions, or a headache that gets worse.',
      'An obvious deformity, or weight you cannot bear.',
    ],
  },
]

export interface WarmupBlock {
  mins: string
  name: string
  how: string
  /** The injury on this page it is here to make less likely. */
  why: string
}

/**
 * Eight minutes, in the order the body wants them: temperature, then range,
 * then load, then the actual movements of the game, then the shot at 60%.
 *
 * Written as a sequence rather than a list of stretches because the order is
 * the content — static stretching a cold muscle is the thing this replaces,
 * and opening with a hard serve is how the shoulder entry above happens.
 */
export const WARMUP: WarmupBlock[] = [
  { mins: '0–2', name: 'Walk or jog the court', how: 'Brisk laps or easy side-to-side. You want warm, not tired — you should still be able to talk.', why: 'Everything below works better on warm tissue. This is the part people skip.' },
  { mins: '2–3', name: 'Leg swings', how: '10 front-to-back and 10 side-to-side each leg, holding the fence. Controlled, not ballistic.', why: 'Hips. A hip that will not open makes the knee do the rotating.' },
  { mins: '3–4', name: 'Ankle circles + 10 calf raises', how: '10 circles each way per foot, then 10 slow heel raises, lowering slower than you lift.', why: 'The ankle and the calf — the two most common acute injuries on this page.' },
  { mins: '4–5', name: '10 squats + 5 lateral lunges each side', how: 'Bodyweight. Hips back, knee over the second toe. The lunge is a slow rehearsal of the wide reach.', why: 'Loads the knee through range, and practises the exact stop that tears ligaments when it is done cold and fast.' },
  { mins: '5–6', name: 'Arm circles + 10 external rotations', how: 'Circles both directions, then a light band (or just the paddle) rotating the forearm out with the elbow pinned to the ribs.', why: 'The shoulder, before the first overhead rather than after it.' },
  { mins: '6–7', name: 'Split-steps and shuffles', how: '4 court-widths of lateral shuffle with a split-step at each end. Feet never cross.', why: 'Rehearses the movement pattern that replaces the crossover step — the ankle-sprain mechanism.' },
  { mins: '7–8', name: 'Dinks, then serves at 60% → 80%', how: 'Two minutes of easy cross-court dinks, five serves at about 60%, five at about 80%. Full pace is for the first point, not before it.', why: 'Ramps the arm. Opening at 100% is the elbow and shoulder entries above.' },
]

/**
 * After the last point — the half of a session people skip twice.
 *
 * Absorbed the two tips the old "Play safe" row carried that the warm-up above
 * does not (cooling down, and drinking before you are thirsty). Three lines
 * rather than a second sequence: the cool-down genuinely is three things, and
 * padding it to match the warm-up's seven would be inventing content.
 */
export const AFTER_PLAY: string[] = [
  'Walk until your breathing settles before you sit down in the car.',
  'Hold a calf, a hip-flexor and a shoulder stretch for 20–30s each — this is where static stretching belongs, not before you play.',
  'Drink before you are thirsty, during as well as after. Thirst is a lagging indicator, and cramp is a late one.',
]

export interface GearNote {
  item: string
  helps: string
  /** The honest half — what it does not do. A claim with no limit is marketing. */
  limit: string
}

/**
 * What to put on, and what it will not do.
 *
 * Every row carries a `limit`, because the useful thing to know about a knee
 * sleeve is the half the box does not print.
 */
export const PROTECTIVE_GEAR: GearNote[] = [
  { item: 'Court shoes', helps: 'Lateral support and a flatter, firmer platform for stopping and pushing sideways.', limit: 'Worn-out tread is the same as no court shoe. Check the outsole, not the age.' },
  { item: 'Lace-up ankle brace', helps: 'The best-supported piece of gear here, for anyone who has already sprained that ankle.', limit: 'It is not a substitute for the balance work — and bracing one ankle does nothing for the other.' },
  { item: 'Knee sleeve', helps: 'Warmth and a better sense of where the joint is, which many people genuinely play better with.', limit: 'It does not stabilise a ligament. If you want stability you are asking about a hinged brace, which is a clinical decision.' },
  { item: 'Eye protection', helps: 'Cheap insurance against a ball or a paddle at the kitchen line, where reaction distance is about nothing.', limit: 'Only if you actually wear it. An eye injury is the one on this page you do not get to rehab.' },
  { item: 'Overgrip / correct grip size', helps: 'A grip that fits lets you hold the paddle at 4/10 instead of squeezing it.', limit: 'Gear cannot fix an all-arm swing — that is the elbow entry, and the fix is technique.' },
]

export interface SafetySource {
  name: string
  /** What this body is actually good for, so the link means something. */
  good: string
  /** The search the link runs — see `sourceSearchUrl`. */
  topic: string
}

/**
 * Credited, and reachable by search rather than by a pinned page.
 *
 * None of these organisations wrote a word of this file; what they publish is
 * where the consensus parts came from, and naming them is how somebody checks
 * a claim they doubt.
 */
export const SAFETY_SOURCES: SafetySource[] = [
  { name: 'USA Pickleball', good: 'Official rules, court standards, and the sport’s own safety guidance.', topic: 'pickleball safety guidelines' },
  { name: 'AAOS OrthoInfo', good: 'Plain-language orthopaedic explanations of each injury on this page.', topic: 'ankle sprain ACL achilles tendinopathy' },
  { name: 'National Athletic Trainers’ Association', good: 'Position statements on ankle sprain management and return to play.', topic: 'position statement ankle sprain management' },
  { name: 'British Journal of Sports Medicine', good: 'Where the evidence on prevention programmes and tendon loading is argued.', topic: 'injury prevention balance training tendinopathy loading' },
  { name: 'The Dink · Better Pickleball · Selkirk', good: 'Coaching outlets the technique and drill material is synthesised from.', topic: 'pickleball drills technique coaching' },
]
