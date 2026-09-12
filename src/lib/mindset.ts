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

/**
 * How many principles can be in focus at once.
 *
 * A cap, not a preference: the page's own advice was "keep it to 1–3 at a time
 * — focus beats breadth", and a list that grew past that quietly contradicted
 * it. Rendering is defensive about journals that already hold more (see
 * `FocusSlots`) — nothing is ever hidden, the cap only stops new additions.
 */
export const MINDSET_MAX_FOCUS = 3

/**
 * The categories, in the order the library groups them and the balance chart
 * draws them.
 *
 * `Deep work` and `Craft & scholarship` are the two newest, and they exist
 * because the first seven were written for an athlete. The person who actually
 * opens this app holds a job or is three years into a PhD, and the problems
 * they bring have no word in the sport vocabulary: a calendar that fills with
 * other people's meetings, a chapter that will not start, a reviewer who was
 * unkind, six months of work nobody wrote down.
 *
 * They are two categories rather than one because they name two different
 * skills. `Focus & presence` is attention inside a moment and `Deep work` is
 * attention across a week — the moves are not the same. `Craft & scholarship`
 * is the work itself: writing, reading, drafting, recording.
 */
export const MINDSET_CATEGORIES = [
  'Focus & presence', 'Deep work', 'Craft & scholarship', 'Resilience',
  'Growth mindset', 'Composure', 'Confidence', 'Discipline', 'Connection',
] as const

export const MINDSET_LIBRARY: MindsetPrinciple[] = [
  // Focus & presence
  { id: 'present', title: 'Be here now', why: 'You can only act in this moment; worry lives in the future, regret in the past.', category: 'Focus & presence' },
  { id: 'single-task', title: 'One thing at a time', why: 'Attention is your scarcest resource; splitting it halves the quality of both.', category: 'Focus & presence' },
  { id: 'process', title: 'Process over outcome', why: 'You control your effort and choices, not the result; judge yourself on the former.', category: 'Focus & presence' },
  { id: 'point-by-point', title: 'Play point-by-point', why: 'Shrink the task to the next rep — the scoreboard takes care of itself.', category: 'Focus & presence' },
  { id: 'meeting-purpose', title: 'Know why you are in the room', why: 'If you cannot name the decision a meeting is for, you are the wrong attendee or it is the wrong meeting.', category: 'Focus & presence' },
  // Deep work
  { id: 'protect-mornings', title: 'Protect the first two hours', why: 'The hardest thinking deserves the freshest attention; meetings can have what is left.', category: 'Deep work' },
  { id: 'switching-cost', title: 'Switching has a price', why: 'The interruption is not the cost — reloading the problem afterwards is. Batch the shallow work.', category: 'Deep work' },
  { id: 'single-thread', title: 'Single-thread the week', why: 'Two projects run in parallel both finish late; one finished thing beats two at eighty per cent.', category: 'Deep work' },
  { id: 'shutdown', title: 'Close the day out loud', why: 'Write tomorrow’s first task before you stop — an open loop follows you home.', category: 'Deep work' },
  { id: 'no-is-a-plan', title: 'Saying no is planning', why: 'Every yes is a slice of the same week. Decline in the calendar, not in the apology.', category: 'Deep work' },
  // Craft & scholarship
  { id: 'write-to-think', title: 'Write to find out what you think', why: 'The argument you cannot write down is one you do not have yet.', category: 'Craft & scholarship' },
  { id: 'rough-draft', title: 'Ship the rough draft', why: 'A bad page can be edited; a blank one cannot. Lower the bar to start, raise it to finish.', category: 'Craft & scholarship' },
  { id: 'smallest-experiment', title: 'Run the smallest experiment', why: 'Ask what the cheapest test is that could change your mind, and run that one first.', category: 'Craft & scholarship' },
  { id: 'lab-notebook', title: 'Write it down the day it happens', why: 'Six months on, the result you did not record is a result you did not get.', category: 'Craft & scholarship' },
  { id: 'read-the-argument', title: 'Read for the argument', why: 'Ask what claim a paper makes and what would falsify it; the rest is detail.', category: 'Craft & scholarship' },
  { id: 'reviewer-is-data', title: 'Harsh feedback is still data', why: 'Strip the tone and keep the claim — it tells you how a real reader read you.', category: 'Craft & scholarship' },
  // Resilience
  { id: 'short-memory', title: 'Short memory — flush errors', why: 'Dwelling on a mistake leaks tension into the next attempt. Reset and move on.', category: 'Resilience' },
  { id: 'feedback', title: 'Setbacks are feedback', why: 'A miss tells you what to adjust; it’s information, not a verdict.', category: 'Resilience' },
  { id: 'controllables', title: 'Control the controllables', why: 'Effort, attitude, prep — yours. Weather, opponents, luck — not. Spend energy where it pays.', category: 'Resilience' },
  { id: 'get-up', title: 'Fall down 7, get up 8', why: 'Consistency through setbacks beats brilliance that quits.', category: 'Resilience' },
  { id: 'rejection', title: 'Rejection is routing, not ranking', why: 'A desk reject says the venue was wrong, not that the work was.', category: 'Resilience' },
  { id: 'long-middle', title: 'The long middle is the work', why: 'Every project has a stretch where nothing works. That stretch is the job, not a warning sign.', category: 'Resilience' },
  // Growth mindset
  { id: 'yet', title: 'The power of "yet"', why: 'Not "I can’t" but "I can’t yet" — ability is built, not fixed.', category: 'Growth mindset' },
  { id: 'hard-thing', title: 'Seek the hard thing', why: 'Growth lives just past comfort; the drill you avoid is the one you need.', category: 'Growth mindset' },
  { id: 'effort', title: 'Effort compounds', why: 'Small, repeated reps outpace bursts of talent over time.', category: 'Growth mindset' },
  { id: 'plateau', title: 'Embrace the plateau', why: 'Progress is stairs, not a ramp; the flat is where the next jump is loading.', category: 'Growth mindset' },
  { id: 'show-early', title: 'Show it before it is ready', why: 'Feedback on a draft costs an hour; feedback on a finished thing costs a month.', category: 'Growth mindset' },
  // Composure
  { id: 'breathe', title: 'Breathe to reset', why: 'A slow exhale (box breathing) pulls you out of fight-or-flight and sharpens focus.', category: 'Composure' },
  { id: 'name-it', title: 'Name it to tame it', why: 'Labelling the feeling ("I’m anxious") hands control back to your thinking brain.', category: 'Composure' },
  { id: 'routine', title: 'Pre-action routine', why: 'A small ritual before a key moment resets arousal — the most reliable composure tool.', category: 'Composure' },
  { id: 'smooth', title: 'Slow is smooth, smooth is fast', why: 'Rushing breeds errors; calm, deliberate action is quicker where it counts.', category: 'Composure' },
  { id: 'first-minute', title: 'Rehearse the first minute', why: 'Nerves peak at the start — knowing the opening sentence by heart carries you into the rest.', category: 'Composure' },
  // Confidence
  { id: 'confidence-choice', title: 'Confidence is a choice', why: 'It’s grounded in your training history — one bad rep doesn’t erase the thousands.', category: 'Confidence' },
  { id: 'posture', title: 'Body leads the mind', why: 'Strong posture and steady breathing feed real confidence (and unsettle rivals).', category: 'Confidence' },
  { id: 'self-talk', title: 'Coach your self-talk', why: 'Speak to yourself like a good coach would: firm, kind, forward-looking.', category: 'Confidence' },
  { id: 'visualize', title: 'Visualize success', why: 'Rehearsing the outcome primes the motor patterns to fire automatically.', category: 'Confidence' },
  { id: 'improvising', title: 'Everyone is improvising', why: 'The composure you assume in the room is mostly rehearsal you did not see.', category: 'Confidence' },
  // Discipline
  { id: 'patience', title: 'Patience — the high-percentage play', why: 'Most points (and goals) are lost, not won; do the smart thing one more time.', category: 'Discipline' },
  { id: 'systems', title: 'Systems over goals', why: 'You don’t rise to your goals; you fall to your systems. Build the daily habit.', category: 'Discipline' },
  { id: 'bad-days', title: 'Show up on bad days', why: 'Discipline is doing it when motivation is gone; that’s where the gap is built.', category: 'Discipline' },
  { id: 'honest-minutes', title: 'Twenty-five honest minutes', why: 'On a bad day the goal is to start, not to finish. The timer is the whole commitment.', category: 'Discipline' },
  // Connection
  { id: 'communicate', title: 'Communicate early', why: 'The late call costs the point; say it loud and soon, partner or team.', category: 'Connection' },
  { id: 'good-intent', title: 'Assume good intent', why: 'Most friction is a misread, not malice; lead with charity and de-escalate.', category: 'Connection' },
  { id: 'lift-others', title: 'Lift others', why: 'A paddle tap, an encouraging word — positive energy raises the whole team’s level.', category: 'Connection' },
  { id: 'ask-early', title: 'Ask at two hours, not two weeks', why: 'The question that feels embarrassing today is cheap; the same question in a month is expensive.', category: 'Connection' },
  { id: 'manage-up', title: 'Bring a recommendation', why: 'Arrive with the options and your pick — it turns a request into a decision.', category: 'Connection' },
]

export const principleById = (id: string) => MINDSET_LIBRARY.find((p) => p.id === id)
