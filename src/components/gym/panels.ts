import { Barbell, ChartBar, Clock, MagnifyingGlass, Person, Scales, Stack } from '@/components/icons'

/**
 * The seven rows of the Strength review bar, and the one line each says about
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
 * | 6 | Load | start a session from a prescription: saved routines, the coach's 29 |
 * | 7 | Lookup | what does this lift hit, and what else could I do: anatomy, the library |
 *
 * **Rows 6 and 7 were a "Look up & tools" fold in the act column**, which with
 * that fold open measured **3001px**. Reported as "it is wasting scrolling",
 * then as "take the coach sessions to something, add as a new thing, and the
 * plate calculator again as a new thing — or think where you can put it".
 *
 * So they were sorted by the question they answer rather than kept in one
 * bucket called Tools:
 *
 * | Panel | Went to | Because |
 * |---|---|---|
 * | Saved routines · Coach sessions | **Load** | Both are "put a prescription in today's logger" — one verb, two sources. The logger's own quick-load row was a third door and is gone |
 * | Anatomy map · wger library | **Lookup** | Both answer "what is this lift" — one from the muscles out, one from the catalogue in |
 * | Plate calculator | **zone 2** | It is not a lookup. You use it standing at the rack with a target weight, between sets, like the rest timer beside it — and it now seeds its target from the heaviest weight in the open session |
 *
 * The argument for keeping any of it in zone 2 was that it is used during the
 * act, and for the two rows that argument survives the move: zone 3 is BESIDE
 * zone 2, not below it, so the anatomy map and the logger are on screen
 * together now, which a fold under the form never allowed.
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
  { id: 'load', label: 'Load', blurb: 'Starting a session · your saved routines and the coach’s 29, into today’s logger', icon: Stack, color: 'blue' },
  { id: 'lookup', label: 'Lookup', blurb: 'What does this lift hit · the muscle map, the cues, and wger’s library', icon: MagnifyingGlass, color: 'lavender' },
] as const

export type GymPanelId = typeof GYM_PANELS[number]['id']
