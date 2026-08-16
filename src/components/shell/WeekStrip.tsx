import { useJournal } from '../../store'
import { currentStreak, loggedWeek } from '../../lib/stats'
import { todayISO, prettyDay } from '../../lib/date'

/**
 * The header's week: seven cells, one per day, filled on a day you logged
 * anything — plus the streak that follows from them.
 *
 * From the redesign handoff, and the one piece of its shell this app did not
 * already have. It earns the space because it answers "am I keeping this up?"
 * from wherever you are, which is the question a journal's navigation should
 * be able to answer without navigating.
 *
 * It lived in the rail until the rail was deleted. A vertical stack could give
 * it a caption, a 24px cell row and the streak on its own line; a header row
 * cannot, so the caption is `sr-only`, the cells are 8px, and the streak is the
 * only visible text. Same data, same definitions, a tenth of the space —
 * `hidden lg:flex`, because below that the bar has no room to spare.
 *
 * "Logged" is `lib/stats.activeDays` — entries, memories, workouts, pickleball
 * and habit completions — the same definition the streak on Insights uses. A
 * second definition of an active day is how two screens end up disagreeing
 * about the same number.
 *
 * Rendered as a table so a screen reader gets the days, not seven unlabelled
 * boxes. Future days in the current week are drawn empty and say so.
 */
export function WeekStrip() {
  const { data } = useJournal()
  const today = todayISO()
  const days = loggedWeek(data, today, data.settings.weekStart ?? 0)
  const streak = currentStreak(data, today)

  return (
    <div className="hidden items-center gap-2 pr-1 lg:flex">
      <table className="border-separate" style={{ borderSpacing: 2 }}>
        <caption className="sr-only">
          This week's logging: {days.filter((d) => d.logged).length} of 7 days logged
        </caption>
        <tbody>
          <tr>
            {days.map(({ date, logged, future }) => {
              const state = logged ? 'logged' : future ? 'still to come' : 'nothing logged'
              return (
                <td key={date} className="p-0">
                  <span className={`block size-2 border border-line ${logged ? 'bg-fg-1' : ''}`} title={`${prettyDay(date)} — ${state}`}>
                    <span className="sr-only">
                      {prettyDay(date)}: {state}
                    </span>
                  </span>
                </td>
              )
            })}
          </tr>
        </tbody>
      </table>
      <span className="font-display text-micro font-medium whitespace-nowrap text-fg-2 tabular-nums">
        {streak}d
      </span>
    </div>
  )
}
