import { ChartBar, Clock, Medal, PersonSimpleRun, Sword } from '@/components/icons'

/**
 * The five rows of the review bar, and the one line each says about WHEN you
 * read it. Its own module because `Review.tsx` exports a component and the
 * view needs this list too — zone 1's "what to do next" row names a panel.
 */

/*
 * THE ORDER IS A READING ORDER, AND IT IS NOT THE ORDER THINGS WERE BUILT IN.
 *
 * Asked for as "sessions as the second category". The row that answers the
 * question people arrive with goes first, and the rest descend by how often
 * you reach for them:
 *
 * | # | row | the question |
 * |---|---|---|
 * | 1 | Results | am I winning — the one thing a scoreline page is for |
 * | 2 | Sessions | what did I log, and can I fix that score |
 * | 3 | Activity | am I playing enough, and how hard |
 * | 4 | Matchups | who with, who against, where |
 * | 5 | Competition | entries and a rating, a few times a year |
 *
 * The page still OPENS on Sessions, which is not a contradiction: the order is
 * for finding things, the default is for the thirty seconds after you press
 * Log session, when the only thing you want is to see the row you just added.
 *
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
 *
 * `phone` — A PHONE IS FOR LOGGING, A DESKTOP IS FOR READING.
 *
 * Asked for directly: on a phone, "no chance for any visualizations — if they
 * want to see visualizations, they need to use the desktop". So a phone gets
 * only the panels you WRITE to (the session history you fix a score in, the
 * event and DUPR forms) and none of the three analytics panels. Decided by
 * `useDevice()`, i.e. the screen's width, never by a desktop/mobile mode.
 * Adding a panel: `phone: true` only if it holds a form or your own entries.
 */
export const PB_PANELS = [
  { id: 'results', label: 'Results', blurb: 'Am I winning · form, margins, the win-rate trend and which days go well', icon: PersonSimpleRun, color: 'sky', phone: false },
  { id: 'sessions', label: 'Sessions', blurb: 'What you logged · every session, newest first, and a score you can still fix', icon: Clock, color: 'green', phone: true },
  { id: 'activity', label: 'Activity', blurb: 'Am I playing · volume, cadence, effort and the badges that follow from them', icon: ChartBar, color: 'teal', phone: false },
  { id: 'matchups', label: 'Matchups', blurb: 'Before you pick a partner or a court · who you win with, who beats you, and where', icon: Sword, color: 'red', phone: false },
  { id: 'competition', label: 'Competition', blurb: 'Before an entry and after a result · events, the DUPR trend, kept apart from casual play', icon: Medal, color: 'yellow', phone: true },
] as const

/** The panels this device shows — every one on a desktop, the logging ones on a phone. */
export const panelsFor = (phone: boolean) => (phone ? PB_PANELS.filter((p) => p.phone) : PB_PANELS)
