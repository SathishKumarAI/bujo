import type { ReactNode } from 'react'
import { Icon } from '@/components/Icon'
import { SectionRail, StatGrid, SummaryStrip } from '../page'
import { onRaised } from '../../lib/colors'
import { todayISO } from '../../lib/date'
import {
  averages, loggedDays, topFoods, trainingBalance, weekdayIntake, type Targets,
} from '../../lib/nutritionReview'
import { dailySeries, heatDays } from '../../lib/nutritionSeries'
import { useJournal } from '../../store'
import { useDevice } from '../shell/device'
import { NUTRITION_PANELS } from './panels'
import { BalanceCard, FortnightCard, RemainingCard, TargetsCard, TopFoodsCard, WeekdayCard } from './Cards'
import { CalorieCalendarCard, CalorieWaveCard } from './Charts'

/**
 * ZONE 3 · the day and the fortnight, behind ONE bar.
 *
 * WHAT THIS FILE OWNS: which row is on screen and which cards it holds.
 * WHAT IT DOES NOT OWN: the arithmetic (`lib/nutritionReview.ts`), the act, or
 * any card's internals.
 *
 * It was three stacked sections — a summary strip, the macro split and
 * fourteen dated rows — measuring **842px** of review at every width, against
 * an act column of **868px** at 1440 and **2258px** on a phone.
 *
 * The bar is worth it here for a different reason than on Strength: not
 * because the page is long, but because the three rows answer questions at
 * completely different cadences. The macro split is read while deciding what
 * to eat; the fortnight is read on a Sunday; the patterns are read when a week
 * keeps going wrong in the same place. Stacked, every one of those is in the
 * way of the other two.
 *
 * It reads the store directly rather than taking a dozen aggregates as props —
 * each is one pass over `data.metrics`, and a prop list that long is a second
 * place for two components to disagree about what a number means.
 */
export function NutritionReview({ panel: chosen, onPanel, date, onDate, targets, onTargets, macroBar, dayLog }: {
  panel: string
  onPanel: (id: string) => void
  /** The day being logged — the Today row is about this date, not about now. */
  date: string
  onDate: (d: string) => void
  targets: Targets
  onTargets: (patch: Partial<Targets>) => void
  /**
   * The macro-split visual, passed as a SLOT.
   *
   * It is the page's signature and it belongs to the day the ACT is editing,
   * so the view owns it; threading the day's four totals through here to
   * rebuild it would be a second opinion about what the day holds.
   */
  macroBar?: ReactNode
  /**
   * The day's logged foods, with their editor — also a slot, and in the Today
   * row rather than in the act.
   *
   * It is a read-back of the day with corrections on it, which is review work;
   * in the act it sat under a picker, a search and a legend, which is the
   * furthest point from the chip that put it there. The state it edits belongs
   * to the act, so the view owns it and this row borrows it.
   */
  dayLog?: ReactNode
}) {
  const { data } = useJournal()
  const today = todayISO()
  // A phone logs, a desktop reads: Trend and Patterns are charts, and the
  // macro bar repeats "What is left" in colour, so a phone gets the Today
  // panel alone and no picker for one row.
  const phone = useDevice() === 'mobile'
  const panel = phone ? 'today' : chosen

  const days = loggedDays(data, 14, today, targets)
  const avg = averages(days)
  const weekdays = weekdayIntake(days)
  const foods = topFoods(data, 14, today)
  const balance = trainingBalance(data, targets, 14, today)
  const m = data.metrics.find((x) => x.date === date)
  /*
    THREE WINDOWS, each as long as its question and no longer.

    | window | for | why not longer, why not shorter |
    |---|---|---|
    | 14 days | the cards that judge | long enough to mean something, short enough to still be about this week |
    | 28 days | the wave | a wave needs points, and at EIGHT weeks the demo drew thirty of fifty-six — two thirds of the chart was the time before you started logging, which is not a gap in your history, it is not your history. Measured on the first screenshot |
    | 20 weeks | the calendar | `DayGrid` clamps a fluid cell at ~32px and centres what is left, so twelve weeks is 13 columns of 32px **centred in a 678px card**. Twenty-one columns fill it, and "a lot of empty space, why are you not scaling it to the sides" is a report this repo has already had once |
  */
  const series = dailySeries(data, 28, today, targets)
  const cells = heatDays(data, 140, today)

  const current = NUTRITION_PANELS.find((p) => p.id === panel) ?? NUTRITION_PANELS[0]

  return (
    <section className="mt-2">
      {/* `sr-only`: the bar under it names every row. */}
      <h2 className="sr-only">The record</h2>
      <div className="@container/page">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-y-3">
          {!phone && <SectionRail
            label="Nutrition record"
            groups={NUTRITION_PANELS.map((g) => ({ id: g.id, label: g.label }))}
            value={panel}
            onChange={(id: string | null) => onPanel(id ?? 'today')}
            railAt="never"
          />}
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-baseline gap-x-3 border-b border-line pb-1.5">
              <h3 className="flex items-center gap-2 text-heading font-medium text-fg-1">
                <Icon as={current.icon} size="md" style={{ color: onRaised(current.color) }} />
                {current.label}
              </h3>
              <p className="text-label text-fg-2">{current.blurb}</p>
            </div>

            {panel === 'today' && (<>
              {/* What you logged, FIRST: the macro split is the consequence,
                  and you cannot judge a ratio you cannot correct. */}
              {dayLog}
              {!phone && <div className={dayLog ? 'mt-4' : undefined}>{macroBar}</div>}
              <div className="mt-4">
                <StatGrid>
                  <RemainingCard m={m} targets={targets} />
                </StatGrid>
              </div>
            </>)}

            {panel === 'trend' && (<>
              {/* Not the day's calories or protein: those are the rings in zone
                  1, and a review that restates the orientation zone is not
                  reviewing anything. What this can say is the FORTNIGHT. */}
              <SummaryStrip items={[
                { label: 'Days logged', value: avg.days, suffix: ' of 14', empty: avg.days === 0 },
                { label: 'Daily average', value: avg.kcal ?? 0, suffix: ' kcal', empty: avg.kcal == null },
                { label: 'Inside target', value: avg.inTarget, suffix: ` of ${avg.days}`, empty: avg.days === 0 },
              ]} />
              <div className="mt-4">
                <StatGrid>
                  {/* THE SHAPE FIRST, then the ledger behind it. The wave says
                      whether the fortnight was steady; `FortnightCard` says
                      which day to open. A reader who only looks at the top of
                      this row still leaves with the finding. */}
                  <CalorieWaveCard series={series} targets={targets} />
                  <CalorieCalendarCard cells={cells} targets={targets} weeks={20} />
                  <FortnightCard days={days} averages={avg} targets={targets} onPick={onDate} />
                  <TargetsCard targets={targets} onChange={onTargets} />
                </StatGrid>
              </div>
            </>)}

            {panel === 'patterns' && (
              <StatGrid>
                <WeekdayCard rows={weekdays} targets={targets} />
                <TopFoodsCard foods={foods} />
                {/* MOVED OFF TREND. "Are trends and patterns the same? If so
                    combine them" — they are not, and this card is why the line
                    had blurred. What the training days ate is not a movement
                    over time; it is a split of the same fortnight by something
                    about the day, which is exactly what `WeekdayCard` does and
                    exactly what this row is for. Trend is now WHEN, Patterns
                    is WHY. */}
                <BalanceCard balance={balance} />
              </StatGrid>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
