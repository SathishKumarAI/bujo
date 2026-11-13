import { habitDoneOn } from '../../lib/stats'
import { isScheduledOn } from '../../lib/schedule'
import { cat } from '../../lib/colors'
import type { Habit, JournalData } from '../../lib/types'

/** The last seven days of one habit as squares — read-only, see the note in `HabitRows`. */
export function HabitWeek({ h, data, days, today }: { h: Habit; data: JournalData; days: string[]; today: string }) {
  const accent = cat(h.color ?? 'mauve')
  return (
    <span aria-hidden className="flex shrink-0 items-center gap-[2px] sm:gap-[3px]">
      {days.map((d) => {
        const met = habitDoneOn(data, h, d)
        const scheduled = isScheduledOn(h, d)
        const isToday = d === today
        return (
          <span
            key={d}
            title={`${d}${scheduled ? (met ? ' · done' : ' · missed') : ' · not scheduled'}`}
            className="size-2.5 rounded-[3px] sm:size-3.5"
            style={{
              background: met ? accent : scheduled ? cat('surface1') : 'transparent',
              border: scheduled ? undefined : `1px solid ${cat('surface1')}`,
              outline: isToday ? `1px solid ${cat('overlay0')}` : undefined,
              outlineOffset: 1,
            }}
          />
        )
      })}
    </span>
  )
}
