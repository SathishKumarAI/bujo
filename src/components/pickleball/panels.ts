import { ChartBar, Clock, Medal, PersonSimpleRun, Sword } from '@/components/icons'

/**
 * The five rows of the review bar, and the one line each says about WHEN you
 * read it. Its own module because `Review.tsx` exports a component and the
 * view needs this list too — zone 1's "what to do next" row names a panel.
 */

/*
 * RESULTS AND ACTIVITY, NOT PERFORMANCE AND TRENDS.
 *
 * Asked, and there was no answer that survived it: both rows meant "how am I
 * doing over time". One held the stat cards and the other the charts, which is
 * a split by WIDGET - the reader does not care which library drew a number.
 *
 * The question people actually arrive with splits in two: **am I winning**
 * (form, margins, the win-rate trend, which days go well) and **am I playing**
 * (volume, cadence, effort, and the badges that follow from them). Each chart
 * now sits beside the figures it explains rather than in a gallery of charts.
 *
 * ONE OR TWO WORDS PER ROW, AND THE SENTENCE UNDER THE HEADING.
 *
 * They were "Competition & rating", "Trends & volume" and "Opponents, partners
 * & venues" — three labels that are summaries, not names. On a phone the five
 * of them wrapped the bar to THREE lines, and "Opponents, partners & venues"
 * alone is wider than half the screen. The row names the subject; the blurb
 * under the heading, which is right there once you pick it, says what is in it
 * and when to read it.
 *
 * THE BLURB SAYS WHEN YOU READ IT, NOT WHAT IS IN IT.
 *
 * They used to restate the label — "Performance · form, streaks, effort and
 * how regularly you get on court" — which is the heading again in more words,
 * and leaves the one question somebody standing at a rail actually has
 * unanswered: which of these four is the one for right now. The Coaching pass
 * landed on the same rule from the other end (every section says when it
 * happens, and what it is not), and it is the cheapest sentence on the page:
 * it changes no layout and it is the only thing between four plausible rows.
 *
 * The moment comes first, then what answers it. Keep it one line.
 */
export const PB_PANELS = [
  { id: 'sessions', label: 'Sessions', blurb: 'Straight after you log \u00b7 every session, newest first, and a score you can still fix', icon: Clock, color: 'green' },
  { id: 'competition', label: 'Competition', blurb: 'Before an entry and after a result · events, the DUPR trend, kept apart from casual play', icon: Medal, color: 'yellow' },
  { id: 'results', label: 'Results', blurb: 'Am I winning · form, margins, the win-rate trend and which days go well', icon: PersonSimpleRun, color: 'sky' },
  { id: 'activity', label: 'Activity', blurb: 'Am I playing · volume, cadence, effort and the badges that follow from them', icon: ChartBar, color: 'teal' },
  { id: 'matchups', label: 'Matchups', blurb: 'Before you pick a partner or a court · who you win with, who beats you, and where', icon: Sword, color: 'red' }
] as const
