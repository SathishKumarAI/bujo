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

/** The category names, as a type — so a map keyed by category (the icon
 *  registry) fails to compile when a category is added and not handled. */
export type MindsetCategory = (typeof MINDSET_CATEGORIES)[number]

export const MINDSET_LIBRARY: MindsetPrinciple[] = [
  // Focus & presence
  { id: 'present', title: 'Work on what is in front of you', why: 'Attention spent on an outcome you cannot touch yet is attention taken from the step that would get you there.', category: 'Focus & presence' },
  { id: 'single-task', title: 'One thing at a time', why: 'Two tasks held at once are not two halves of your attention. Each keeps paying the cost of reloading the other.', category: 'Focus & presence' },
  { id: 'process', title: 'Judge the decision, not the result', why: 'A good call can lose and a careless one can win. Reviewing what you knew at the time is the only review that improves the next call.', category: 'Focus & presence' },
  { id: 'point-by-point', title: 'Shrink it to the next rep', why: 'Name the one action in front of you. A task you can picture finishing is one you can start.', category: 'Focus & presence' },
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
  { id: 'short-memory', title: 'Close the last mistake before the next attempt', why: 'Rehearsing an error while you work carries its tension into the work that follows.', category: 'Resilience' },
  { id: 'feedback', title: 'Ask what a setback is evidence of', why: 'A failure narrows the space of what works. That is worth something; a verdict on you is not.', category: 'Resilience' },
  { id: 'controllables', title: 'Sort it into what you can move', why: 'Preparation and response are yours; timing, other people and luck are not. Spend the worry where it can change something.', category: 'Resilience' },
  { id: 'get-up', title: 'Return the next day', why: 'What separates people who finish is rarely the size of the setback. It is how long they stay away after one.', category: 'Resilience' },
  { id: 'rejection', title: 'Rejection is routing, not ranking', why: 'A desk reject says the venue was wrong, not that the work was.', category: 'Resilience' },
  { id: 'long-middle', title: 'The long middle is the work', why: 'Every project has a stretch where nothing works. That stretch is the job, not a warning sign.', category: 'Resilience' },
  // Growth mindset
  { id: 'yet', title: 'Add "yet" and see what changes', why: '"I cannot do this" closes the question. "I cannot do this yet" asks what the next step is.', category: 'Growth mindset' },
  { id: 'hard-thing', title: 'Work on what you keep skipping', why: 'The part of the practice you reliably avoid is usually the part with the most left to gain.', category: 'Growth mindset' },
  { id: 'effort', title: 'Prefer the schedule to the sprint', why: 'A week of ordinary sessions leaves more behind than one heroic day, and costs less to repeat.', category: 'Growth mindset' },
  { id: 'plateau', title: 'Expect the flat stretch', why: 'Skill consolidates before it shows. A plateau is the normal shape of learning, not a signal to change plan.', category: 'Growth mindset' },
  { id: 'show-early', title: 'Show it before it is ready', why: 'Feedback on a draft costs an hour; feedback on a finished thing costs a month.', category: 'Growth mindset' },
  // Composure
  { id: 'breathe', title: 'Lengthen the exhale', why: 'A slow out-breath is the one lever over your own arousal you can reach deliberately, in seconds, anywhere.', category: 'Composure' },
  { id: 'name-it', title: 'Say which feeling it is', why: 'Putting a specific word to a state — not "bad" but "dreading the review" — makes it something you can act on.', category: 'Composure' },
  { id: 'routine', title: 'Keep one opening routine', why: 'The same three actions before hard work stop the start being a decision, on the days when the start is the whole battle.', category: 'Composure' },
  { id: 'smooth', title: 'Deliberate beats hurried', why: 'Rushing trades a minute saved for an hour of rework. The speed you can be accurate at is usually the faster route.', category: 'Composure' },
  { id: 'first-minute', title: 'Rehearse the first minute', why: 'Nerves peak at the start — knowing the opening sentence by heart carries you into the rest.', category: 'Composure' },
  // Confidence
  { id: 'confidence-choice', title: 'Count the evidence you already have', why: 'Confidence is a reading of your own record. One bad day is one data point against a long series.', category: 'Confidence' },
  { id: 'posture', title: 'Settle the body first', why: 'Unclench the jaw, drop the shoulders, slow the breath. The state you can change directly is the physical one.', category: 'Confidence' },
  { id: 'self-talk', title: 'Say it as you would to a colleague', why: 'A sentence you would never say to someone whose work you respect is not a useful sentence to say to yourself.', category: 'Confidence' },
  { id: 'visualize', title: 'Rehearse the steps, not the ending', why: 'Walking through how you will actually do the thing is preparation. Picturing it already done is not.', category: 'Confidence' },
  { id: 'improvising', title: 'Everyone is improvising', why: 'The composure you assume in the room is mostly rehearsal you did not see.', category: 'Confidence' },
  // Discipline
  { id: 'patience', title: 'Take the boring option once more', why: 'Most work is lost to avoidable errors rather than won by brilliance. Repeating the dull, correct move is the edge.', category: 'Discipline' },
  { id: 'systems', title: 'Design the default, not the intention', why: 'What you do on an average tired Tuesday is set by what is easiest, not by what you decided in January.', category: 'Discipline' },
  { id: 'bad-days', title: 'Set a floor for bad days', why: 'Decide in advance what the smallest acceptable session is, so a bad day costs you a little instead of the streak.', category: 'Discipline' },
  { id: 'honest-minutes', title: 'Twenty-five honest minutes', why: 'On a bad day the goal is to start, not to finish. The timer is the whole commitment.', category: 'Discipline' },
  // Connection
  { id: 'communicate', title: 'Say it while it is still cheap', why: 'A slip flagged on the day is a schedule change. The same slip flagged at the deadline is everyone else’s problem too.', category: 'Connection' },
  { id: 'good-intent', title: 'Assume the generous reading first', why: 'Most friction is a missing piece of context rather than ill will. Ask for the context before you answer the tone.', category: 'Connection' },
  { id: 'lift-others', title: 'Say the specific good thing', why: 'Name what someone actually did well. Vague praise is forgettable; precise praise tells them what to repeat.', category: 'Connection' },
  { id: 'ask-early', title: 'Ask at two hours, not two weeks', why: 'The question that feels embarrassing today is cheap; the same question in a month is expensive.', category: 'Connection' },
  { id: 'manage-up', title: 'Bring a recommendation', why: 'Arrive with the options and your pick — it turns a request into a decision.', category: 'Connection' },
]

export const principleById = (id: string) => MINDSET_LIBRARY.find((p) => p.id === id)
