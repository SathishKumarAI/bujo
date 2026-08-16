import { useJournal } from '../../store'
import { currentStreak, loggedWeek } from '../../lib/stats'
import { todayISO, prettyDay } from '../../lib/date'

/**
 * The rail's week: seven cells, one per day, filled on a day you logged
 * anything — plus the streak that follows from them.
 *
 * From the redesign handoff, and the one piece of its shell this app did not
 * already have. It earns the space because it answers "am I keeping this up?"
 * from wherever you are, which is the question a journal's navigation should
 * be able to answer without navigating.
 *
 * "Logged" is `lib/stats.activeDays` — entries, memories, workouts, pickleball
 * and habit completions — the same definition the streak on Insights uses. A
 * second definition of an active day is how two screens end up disagreeing
 * about the same number.
 *
 * Rendered as a table so a screen reader gets the days, not seven unlabelled
 * boxes. Future days in the current week are drawn empty and say so.
 */
export function WeekStrip({ collapsed }: { collapsed: boolean }) {
  const { data } = useJournal()
  const today = todayISO()
  const days = loggedWeek(data, today, data.settings.weekStart ?? 0)
  const streak = currentStreak(data, today)

  return (
    <div className={`border-t border-line px-4 pt-3 pb-1 ${collapsed ? 'md:hidden' : ''}`}>
      <p className="pb-2 text-micro tracking-[0.14em] text-fg-3 uppercase">This week</p>
      <table className="w-full border-separate" style={{ borderSpacing: 3 }}>
        <caption className="sr-only">
          This week's logging: {days.filter((d) => d.logged).length} of 7 days logged
        </caption>
        <tbody>
          <tr>
            {days.map(({ date, logged, future }) => {
              const state = logged ? 'logged' : future ? 'still to come' : 'nothing logged'
              return (
                <td key={date} className="p-0">
                  <span className={`block h-6 border border-line ${logged ? 'bg-fg-1' : ''}`} title={`${prettyDay(date)} — ${state}`}>
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
      <p className="mt-2 font-display text-label font-medium text-fg-1">
        {streak} day{streak === 1 ? '' : 's'} in a row
      </p>
    </div>
  )
}
