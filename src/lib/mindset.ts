/**
 * Mindset / thinking-style library — app-wide (not just pickleball). The user
 * picks principles to actively work on and journals a note per principle. Pure
 * static content; the chosen focuses + notes live in JournalData.mindsetFocus.
 */

export interface MindsetPrinciple {
  id: string
  title: string
  why: string
  category: string
}

export const MINDSET_CATEGORIES = [
  'Focus & presence', 'Resilience', 'Growth mindset',
  'Composure', 'Confidence', 'Discipline', 'Connection',
] as const

export const MINDSET_LIBRARY: MindsetPrinciple[] = [
  // Focus & presence
  { id: 'present', title: 'Be here now', why: 'You can only act in this moment; worry lives in the future, regret in the past.', category: 'Focus & presence' },
  { id: 'single-task', title: 'One thing at a time', why: 'Attention is your scarcest resource; splitting it halves the quality of both.', category: 'Focus & presence' },
  { id: 'process', title: 'Process over outcome', why: 'You control your effort and choices, not the result; judge yourself on the former.', category: 'Focus & presence' },
  { id: 'point-by-point', title: 'Play point-by-point', why: 'Shrink the task to the next rep — the scoreboard takes care of itself.', category: 'Focus & presence' },
  // Resilience
  { id: 'short-memory', title: 'Short memory — flush errors', why: 'Dwelling on a mistake leaks tension into the next attempt. Reset and move on.', category: 'Resilience' },
  { id: 'feedback', title: 'Setbacks are feedback', why: 'A miss tells you what to adjust; it’s information, not a verdict.', category: 'Resilience' },
  { id: 'controllables', title: 'Control the controllables', why: 'Effort, attitude, prep — yours. Weather, opponents, luck — not. Spend energy where it pays.', category: 'Resilience' },
  { id: 'get-up', title: 'Fall down 7, get up 8', why: 'Consistency through setbacks beats brilliance that quits.', category: 'Resilience' },
  // Growth mindset
  { id: 'yet', title: 'The power of "yet"', why: 'Not "I can’t" but "I can’t yet" — ability is built, not fixed.', category: 'Growth mindset' },
  { id: 'hard-thing', title: 'Seek the hard thing', why: 'Growth lives just past comfort; the drill you avoid is the one you need.', category: 'Growth mindset' },
  { id: 'effort', title: 'Effort compounds', why: 'Small, repeated reps outpace bursts of talent over time.', category: 'Growth mindset' },
  { id: 'plateau', title: 'Embrace the plateau', why: 'Progress is stairs, not a ramp; the flat is where the next jump is loading.', category: 'Growth mindset' },
  // Composure
  { id: 'breathe', title: 'Breathe to reset', why: 'A slow exhale (box breathing) pulls you out of fight-or-flight and sharpens focus.', category: 'Composure' },
  { id: 'name-it', title: 'Name it to tame it', why: 'Labelling the feeling ("I’m anxious") hands control back to your thinking brain.', category: 'Composure' },
  { id: 'routine', title: 'Pre-action routine', why: 'A small ritual before a key moment resets arousal — the most reliable composure tool.', category: 'Composure' },
  { id: 'smooth', title: 'Slow is smooth, smooth is fast', why: 'Rushing breeds errors; calm, deliberate action is quicker where it counts.', category: 'Composure' },
  // Confidence
  { id: 'confidence-choice', title: 'Confidence is a choice', why: 'It’s grounded in your training history — one bad rep doesn’t erase the thousands.', category: 'Confidence' },
  { id: 'posture', title: 'Body leads the mind', why: 'Strong posture and steady breathing feed real confidence (and unsettle rivals).', category: 'Confidence' },
  { id: 'self-talk', title: 'Coach your self-talk', why: 'Speak to yourself like a good coach would: firm, kind, forward-looking.', category: 'Confidence' },
  { id: 'visualize', title: 'Visualize success', why: 'Rehearsing the outcome primes the motor patterns to fire automatically.', category: 'Confidence' },
  // Discipline
  { id: 'patience', title: 'Patience — the high-percentage play', why: 'Most points (and goals) are lost, not won; do the smart thing one more time.', category: 'Discipline' },
  { id: 'systems', title: 'Systems over goals', why: 'You don’t rise to your goals; you fall to your systems. Build the daily habit.', category: 'Discipline' },
  { id: 'bad-days', title: 'Show up on bad days', why: 'Discipline is doing it when motivation is gone; that’s where the gap is built.', category: 'Discipline' },
  // Connection
  { id: 'communicate', title: 'Communicate early', why: 'The late call costs the point; say it loud and soon, partner or team.', category: 'Connection' },
  { id: 'good-intent', title: 'Assume good intent', why: 'Most friction is a misread, not malice; lead with charity and de-escalate.', category: 'Connection' },
  { id: 'lift-others', title: 'Lift others', why: 'A paddle tap, an encouraging word — positive energy raises the whole team’s level.', category: 'Connection' },
]

export const principleById = (id: string) => MINDSET_LIBRARY.find((p) => p.id === id)
