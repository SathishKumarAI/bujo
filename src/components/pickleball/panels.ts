import { ChartBar, Clock, Medal, PersonSimpleRun, Sword } from '@/components/icons'

/**
 * The five rows of the review bar, and the one line each says about WHEN you
 * read it. Its own module because `Review.tsx` exports a component and the
 * view needs this list too — zone 1's "what to do next" row names a panel.
 */

/*
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
  { id: 'competition', label: 'Competition & rating', blurb: 'Before an entry and after a result · events, the DUPR trend, kept apart from casual play', icon: Medal, color: 'yellow' },
  { id: 'performance', label: 'Performance', blurb: 'Straight after a session · form, effort, and whether you are getting on court at all', icon: PersonSimpleRun, color: 'sky' },
  { id: 'trends', label: 'Trends & volume', blurb: 'Once a month · win rate over time, games per week, where the habit is going', icon: ChartBar, color: 'teal' },
  { id: 'matchups', label: 'Opponents, partners & venues', blurb: 'Before you pick a partner or a court · who you win with, who beats you, and where', icon: Sword, color: 'red' }
] as const
