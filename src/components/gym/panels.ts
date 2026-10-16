import { Barbell, ChartBar, Clock, Person, Scales, SlidersHorizontal } from '@/components/icons'

/**
 * The six rows of the Strength review bar, and the one line each says about
 * WHEN you read it.
 *
 * Its own module because `Review.tsx` exports a component and the view needs
 * the list too — zone 1's facts are shortcuts into a row, and a control that
 * cannot reach the state it names is a control that lies.
 *
 * ── What this replaces, measured ──────────────────────────────────────────
 *
 * Four `QuietSection` folds stacked in the review column: *This week*, *Am I
 * getting stronger?*, *What am I neglecting?*, *How is my body changing?*. The
 * page shipped at **1.7 desktop screens and opened to 3.6**, and on a phone
 * **3.6 → 8.6**; the review column alone was **3016px** at 1440 and 3737px at
 * 390, with **28** `aria-expanded` controls on the page. Three of the four
 * folds started shut, so the page you landed on was a form and four grey bars,
 * and the answer you came back for was behind whichever one you guessed right.
 *
 * A fold hides a section's HEIGHT and keeps its row; a rail shows one section
 * and keeps none of the others. That is the whole difference, and it is why
 * four pages in this cluster now carry one bar each.
 *
 * ── The order is the order the questions arrive in ────────────────────────
 *
 * | # | row | the question |
 * |---|---|---|
 * | 1 | Week | what have I actually done in the last seven days, and where is the volume going |
 * | 2 | Sessions | what did I log — and the page had NO history at all before |
 * | 3 | Strength | am I getting stronger: records, standards, effort |
 * | 4 | Balance | what am I neglecting: movement split, recovery, frequency, stalls |
 * | 5 | Body | how is my body changing: weight trend and photos |
 * | 6 | Tools | mid-session lookups: anatomy, plate maths, routines, the library |
 *
 * **Tools is a row and was a fold in the act column.** Its contents are used
 * while building a session, which was the argument for putting them beside the
 * logger — and that argument survives the move, because zone 3 is BESIDE zone
 * 2 rather than below it: the anatomy map and the logger are on screen
 * together now, which a fold under the form never allowed. With that fold open
 * the act column measured **3001px**. Reported as "it is wasting scrolling".
 *
 * **The page opens on Week**, not on Sessions, and that is the one difference
 * from the sport pages. Those are logged from a phone minutes after the thing
 * happened, so the row you want is the one you just wrote to. A lifting
 * session is logged set by set over an hour with the logger already open in
 * zone 2 — the row you want afterwards is what the week now looks like.
 */
export const GYM_PANELS = [
  { id: 'week', label: 'Week', blurb: 'Right after a session · volume, sets per muscle, and where the week stands', icon: ChartBar, color: 'mauve' },
  { id: 'sessions', label: 'Sessions', blurb: 'What you logged · every session, newest first, and one you can still correct', icon: Clock, color: 'green' },
  { id: 'strength', label: 'Strength', blurb: 'Am I getting stronger · records, big-three standards, effort trend', icon: Barbell, color: 'yellow' },
  { id: 'balance', label: 'Balance', blurb: 'Before you pick tomorrow’s split · push/pull/legs, what is rested, what has stalled', icon: Scales, color: 'teal' },
  { id: 'body', label: 'Body', blurb: 'Once a week at most · weight trend and dated photos', icon: Person, color: 'sky' },
  { id: 'tools', label: 'Tools', blurb: 'Mid-session · anatomy, plate maths, saved routines, coach sessions, the library', icon: SlidersHorizontal, color: 'blue' },
] as const

export type GymPanelId = typeof GYM_PANELS[number]['id']
