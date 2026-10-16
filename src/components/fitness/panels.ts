import { ChartBar, Clock, Medal, SquaresFour } from '@/components/icons'

/**
 * The four rows of the review bar, and the one line each says about WHEN you
 * read it.
 *
 * Its own module because `Review.tsx` exports a component and the view needs
 * this list too: zone 1's next-step sentence is a button INTO a row, and a
 * button that cannot reach the state it names is a button that lies.
 *
 * THE ORDER IS A READING ORDER. Volume first, because "am I training enough"
 * is the question a fitness record exists to answer, and because it is the row
 * the next-step sentence points at most often. Then what you logged, then
 * whether you are getting fitter, then what you actually do with the time.
 *
 * **The page opens on Sessions, which is not a contradiction.** The order is
 * for finding things; the default is for the thirty seconds after you press Log
 * session, when the only thing you want is the row you just added. Same split
 * as `components/pickleball/panels.ts`, for the same reason.
 *
 * ONE OR TWO WORDS PER ROW. Four labels come to ~260px, so the bar is one line
 * at every width this page has — including the 324px phone column, where
 * `SectionRail`'s chip row wraps rather than scrolling (three of eight pull-up
 * chapters once went missing to a strip that scrolled with nothing saying so).
 *
 * THE BLURB SAYS WHEN YOU READ IT, NOT WHAT IS IN IT. A reader standing at a
 * bar has exactly one question — which of these four is the one for right now
 * — and a blurb that restates the label leaves it unanswered.
 */
export const FITNESS_PANELS = [
  { id: 'volume', label: 'Volume', blurb: 'Am I training enough · the last eight weeks, your cadence, and the calendar', icon: ChartBar, color: 'teal' },
  { id: 'sessions', label: 'Sessions', blurb: 'What you logged · newest first, and a session you can still correct', icon: Clock, color: 'green' },
  { id: 'bests', label: 'Bests', blurb: 'Am I getting fitter · your best per activity, and the next round number', icon: Medal, color: 'yellow' },
  { id: 'mix', label: 'Mix', blurb: 'What you actually do · which activities, and which days of the week', icon: SquaresFour, color: 'sky' },
] as const

export type FitnessPanelId = typeof FITNESS_PANELS[number]['id']
