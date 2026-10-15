import { ChartBar, Clock, Medal, PersonSimpleRun, Sword } from '@/components/icons'

/**
 * The five rows of the review bar, and the one line each says about WHEN you
 * read it. Its own module because `Review.tsx` exports a component and the
 * view needs this list too — zone 1's "what to do next" row names a panel.
 */

/*
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
  { id: 'performance', label: 'Performance', blurb: 'Straight after a session · form, effort, and whether you are getting on court at all', icon: PersonSimpleRun, color: 'sky' },
  { id: 'trends', label: 'Trends', blurb: 'Once a month · win rate over time, games per week, where the habit is going', icon: ChartBar, color: 'teal' },
  { id: 'matchups', label: 'Matchups', blurb: 'Before you pick a partner or a court · who you win with, who beats you, and where', icon: Sword, color: 'red' }
] as const
