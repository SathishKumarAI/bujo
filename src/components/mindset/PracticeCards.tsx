import { Icon } from '@/components/Icon'
import { categoryIcon } from './categoryIcon'
import { Card } from '../ui'
import { CalendarHeatmap, MicroPips } from '../page'
import { categoryCounts, currentStreak, daysWithMarks, practiceData, type PracticeLog } from '../../lib/mindsetPractice'
import { principleById } from '../../lib/mindset'
import { addDays, todayISO } from '../../lib/date'

/**
 * The three review cards, split out of one `PracticeBand`.
 *
 * `PracticeBand` was a `mod/Band` holding a 26-week calendar and a category
 * chart side by side in two `BandCell`s — two different questions sharing one
 * row because the Modernist grid wanted a row, not because they answer
 * together. Under a rail they are two groups (`practice` and `balance`), so
 * the cell split had to go anyway, and the band with it.
 *
 * All three are DOM rather than a charting library: 182 day cells, nine bars
 * and twenty-one pips do not justify a dependency, and the day grid already
 * exists as an accessible table shared with Stats, Trackers and the Body
 * cluster.
 */

/**
 * YOUR RUN · the card that did not exist.
 *
 * `lib/mindsetPractice.ts` has exported `currentStreak` and `daysWithMarks`
 * for as long as this page has existed and **nothing on screen read either**.
 * The page drew a 26-week grid and left the reader to count: a grid answers
 * "when", and the question that decides whether you open the app tomorrow is
 * "am I on a run right now".
 *
 * The pips are the last 21 days at the same scale the grid uses, so the two
 * cards agree rather than offering two readings of one record.
 */
export function StreakCard({ log }: { log: PracticeLog }) {
  const today = todayISO()
  const streak = currentStreak(log, today)
  const total = daysWithMarks(log)
  const recent = Array.from({ length: 21 }, (_, i) => {
    const date = addDays(today, -(20 - i))
    return { on: (practiceData(log).find((d) => d.date === date)?.value ?? 0) > 0, date }
  })
  const done = recent.filter((d) => d.on).length

  return (
    <Card band title="Your run" subtitle="Days in a row, and the fortnight behind it">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <span>
          {/* `—`, not `0`. Zero is a measurement — it says you practised and
              broke the run today. An em dash says nobody has told us yet, and
              printing the first for the second makes a new journal look like a
              failed one. */}
          <span className="num text-display font-medium text-fg-1">{streak || '—'}</span>
          <span className="ml-1.5 text-label text-fg-2">{streak === 1 ? 'day' : 'days'} in a row</span>
        </span>
        <span className="text-label text-fg-2">
          <span className="num text-fg-1">{total}</span> days practised in all
        </span>
      </div>
      <div className="mt-3">
        <MicroPips
          pips={recent}
          label={`Last 21 days: practised on ${done} of them — ${recent.map((d) => `${d.date} ${d.on ? 'yes' : 'no'}`).join(', ')}`}
        />
        <p className="mt-1.5 text-caption text-fg-3">Last 21 days · {done} marked</p>
      </div>
    </Card>
  )
}

/** The 26-week calendar, unchanged in substance — it was only ever in the wrong box. */
export function PracticeHeatmapCard({ log, today }: { log: PracticeLog; today: string }) {
  return (
    <Card band title="Practice, last 26 weeks" subtitle="One mark per day you practised a principle">
      <CalendarHeatmap
        weeks={26}
        fluid
        today={today}
        data={practiceData(log)}
        unit="marked"
        label="Mindset practice: one cell per day in the last 26 weeks"
      />
      {/* The grid's axis, so it spans the grid. */}
      <div className="mt-2 flex justify-between text-caption text-fg-3">
        <span>26 weeks ago</span>
        <span>This week</span>
      </div>
    </Card>
  )
}

/**
 * CATEGORY BALANCE · where the practice clustered.
 *
 * The accent marks the categories your *focus* principles belong to and
 * nothing else — nine categories is nine hues if you let it be, and the
 * contract spends the accent once per page.
 */
export function CategoryBalanceCard({ log, focusedIds }: { log: PracticeLog; focusedIds: Set<string> }) {
  const rows = categoryCounts(log)
  const active = new Set(
    [...focusedIds].map((id) => principleById(id)?.category).filter((c): c is string => !!c),
  )
  const any = rows.some((r) => r.count > 0)

  return (
    <Card band title="Category balance" subtitle="Which kinds of principle you actually reach for">
      {rows.map((r) => {
        const on = active.has(r.name)
        return (
          <div key={r.name} className="grid grid-cols-[minmax(0,8.75rem)_1fr_1.75rem] items-center gap-3 py-1">
            <span className="flex min-w-0 items-center gap-1.5 text-label text-fg-2">
              <Icon as={categoryIcon(r.name)} size="sm" className="shrink-0 text-fg-3" />
              <span className="truncate">{r.name}</span>
            </span>
            {/* The track is drawn at every width; a category at zero shows an
                empty track rather than nothing, which is the difference
                between "none yet" and "the chart is broken". */}
            <span className="block h-2.5 rounded-pill bg-ink-2">
              <span
                className={`block h-full rounded-pill ${on ? 'bg-brand' : 'bg-fg-2'}`}
                style={{ width: `${Math.round(r.share * 100)}%` }}
              />
            </span>
            <span className="num text-right text-caption text-fg-2">{r.count}</span>
          </div>
        )
      })}
      {!any && (
        <p className="mt-2 text-label text-fg-2">
          Nothing marked yet — the tracks fill as you practise.
        </p>
      )}
    </Card>
  )
}
