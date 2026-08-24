import { PersonSimpleRun, Smiley, Sun } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import { useJournal } from '../../store'
import { Card } from '../ui'
import { MasonryGrid } from '../shell/CardGrid'
import { cat } from '../../lib/colors'
import { bestWorstWeekday, metricVolatility, weekdayWeekendSplit } from '../../lib/correlations'

/**
 * The three mood read-backs that used to be Insights' "Mood analytics" drawer.
 *
 * They moved to Stats under BUJO-281: Insights answers *what changed and what do
 * I do next*, Stats is *the record*, and a weekday average is a record. They
 * render inside Stats' existing "Mood views" fold rather than a new one — Stats
 * already had six, and relocating a drawer intact is not a fix.
 *
 * Each panel gates itself on having data, so the component renders nothing at
 * all on an empty journal and its host fold degrades to the calendar alone.
 */
export function MoodAnalytics() {
  const { data } = useJournal()
  const moodWd = bestWorstWeekday(data, 'mood')
  const split = weekdayWeekendSplit(data)
  const moodVol = metricVolatility(data, 'mood')

  if (!moodWd.best && split.habitWeekday == null && !moodVol.band) return null

  return (
    <MasonryGrid>
      {moodWd.best && moodWd.worst && (
        <Card band title="Best & worst day" subtitle="When your mood runs brightest">
          <div className="mb-3 flex items-center gap-2 text-body">
            <AppIcon as={Sun} size="sm" style={{ color: cat('yellow') }} />
            <span className="text-fg-1">
              Brightest on <strong className="text-fg-1">{moodWd.best.label}</strong> ({moodWd.best.avg}/10),
              dimmest on <strong className="text-fg-1">{moodWd.worst.label}</strong> ({moodWd.worst.avg}/10).
            </span>
          </div>
          {/* `items-stretch`, not `items-end`. Cross-axis `end` sizes each
              column to its own content — two lines of text, 34px — so the
              `flex-1` bar track below got zero height and every bar in the
              chart rendered at 0px. The row is 100px tall and drew nothing
              but its numbers and its day labels. Stretched, the column
              takes the row's full height and the track has something for
              the percentage to resolve against. The bars still sit on the
              baseline: that is the track's own `items-end`, one level in.
              Six charts across four files had this exact bug. */}
          <div className="flex items-stretch justify-between gap-2" style={{ height: 100 }} role="img" aria-label="Average mood by weekday">
            {moodWd.rows.map((r) => (
              <div key={r.weekday} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-micro tabular-nums text-fg-2">{r.avg == null ? '–' : r.avg}</span>
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t" style={{ height: `${r.avg == null ? 2 : Math.max(2, (r.avg / 10) * 100)}%`, background: r.avg == null ? cat('surface0') : r.weekday === moodWd.best!.weekday ? cat('green') : r.weekday === moodWd.worst!.weekday ? cat('peach') : cat('surface1') }} title={r.days ? `${r.avg}/10 over ${r.days}d` : 'no data'} />
                </div>
                <span className="text-micro text-fg-2">{r.label}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(split.habitWeekday != null || split.moodWeekday != null) && (
        <Card band title="Weekday vs weekend" subtitle="How your week splits in two">
          <div className="grid grid-cols-2 gap-3 text-body">
            <SplitCol label="Weekdays" habit={split.habitWeekday} mood={split.moodWeekday} days={split.weekdayDays} />
            <SplitCol label="Weekends" habit={split.habitWeekend} mood={split.moodWeekend} days={split.weekendDays} />
          </div>
        </Card>
      )}

      {moodVol.band && (
        <Card band title="Mood stability" subtitle={`Last ${moodVol.days} logged days, how steady you've felt`}>
          <p className="text-display font-medium" style={{ color: cat(moodVol.stability! >= 70 ? 'green' : moodVol.stability! >= 40 ? 'yellow' : 'peach') }}>
            {moodVol.stability}<span className="text-heading text-fg-2">/100</span>
          </p>
          <p className="mt-1 text-body capitalize text-fg-1">
            <span className="mr-1.5 rounded px-1.5 py-0.5 text-label" style={{ background: cat('surface0'), color: moodVol.band === 'steady' ? cat('green') : moodVol.band === 'volatile' ? cat('peach') : cat('subtext0') }}>{moodVol.band}</span>
            avg {moodVol.mean}/10 · swing ±{moodVol.sd}
          </p>
          <p className="mt-2 text-label text-fg-2">Stability ignores the average — it measures how much your days swing, not how high they sit.</p>
        </Card>
      )}
    </MasonryGrid>
  )
}

function SplitCol({ label, habit, mood, days }: { label: string; habit: number | null; mood: number | null; days: number }) {
  return (
    <div className="rounded-none border border-line bg-ink-0 p-3">
      <p className="mb-2 text-label font-medium text-fg-2">{label}</p>
      <p className="flex items-center gap-1.5 text-fg-1">
        <AppIcon as={PersonSimpleRun} size="sm" style={{ color: cat('mauve') }} />
        <strong className="tabular-nums">{habit == null ? '—' : Math.round(habit * 100) + '%'}</strong>
        <span className="text-label text-fg-2">habits</span>
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-fg-1">
        <AppIcon as={Smiley} size="sm" style={{ color: cat('green') }} />
        <strong className="tabular-nums">{mood == null ? '—' : `${mood}/10`}</strong>
        <span className="text-label text-fg-2">mood</span>
      </p>
      {days > 0 && <p className="mt-1 text-micro text-fg-2">{days} scheduled day{days === 1 ? '' : 's'}</p>}
    </div>
  )
}
