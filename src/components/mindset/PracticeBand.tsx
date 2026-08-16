import { Band, BandCell, BandRow } from '../mod'
import { CalendarHeatmap } from '../page'
import { categoryCounts, practiceData, type PracticeLog } from '../../lib/mindsetPractice'
import { principleById } from '../../lib/mindset'

/**
 * The review zone: how consistently you have practised, and where it clustered.
 *
 * Owns the two charts and nothing else — both read from `lib/mindsetPractice`,
 * which is where their arithmetic and its tests live.
 *
 * Both are DOM, not a charting library: 84 day cells and seven bars do not
 * justify a dependency, and the day grid already exists as an accessible table
 * (`components/ui/day-grid`) shared with Stats, Trackers and the Body cluster.
 */
export function PracticeBand({
  log,
  focusedIds,
  today,
}: {
  log: PracticeLog
  /** Principle ids currently in a focus slot — the only thing the accent marks. */
  focusedIds: Set<string>
  today: string
}) {
  const rows = categoryCounts(log)
  const activeCategories = new Set(
    [...focusedIds].map((id) => principleById(id)?.category).filter((c): c is string => !!c),
  )

  return (
    <Band>
      <BandRow>
        <BandCell className="basis-[26rem]">
          <h2 className="font-display text-heading font-medium text-fg-1">Practice, last 12 weeks</h2>
          <p className="mt-1 mb-4 text-label text-fg-2">One mark per day you practised a principle.</p>
          <CalendarHeatmap
            weeks={12}
            today={today}
            data={practiceData(log)}
            unit="marked"
            size={22}
            label="Mindset practice: one cell per day in the last 12 weeks"
          />
          <div className="mt-2 flex max-w-[22rem] justify-between text-micro tracking-[0.08em] text-fg-3 uppercase">
            <span>12 weeks ago</span>
            <span>This week</span>
          </div>
        </BandCell>

        <BandCell className="basis-[20rem]">
          <h2 className="font-display text-heading font-medium text-fg-1">Category balance</h2>
          <p className="mt-1 mb-4 text-label text-fg-2">Where your practice has clustered.</p>
          <div>
            {rows.map((r) => {
              const active = activeCategories.has(r.name)
              return (
                <div key={r.name} className="grid grid-cols-[7.5rem_1fr_1.75rem] items-center gap-3 py-1">
                  <span className="truncate text-label text-fg-2">{r.name}</span>
                  {/* The track is drawn at every width; a category at zero shows
                      an empty track rather than nothing, which is the difference
                      between "none yet" and "chart is broken". */}
                  <span className="block h-2.5 bg-ink-2">
                    <span
                      className={`block h-full ${active ? 'bg-brand' : 'bg-fg-1'}`}
                      style={{ width: `${Math.round(r.share * 100)}%` }}
                    />
                  </span>
                  <span className="num text-right text-caption text-fg-2">{r.count}</span>
                </div>
              )
            })}
          </div>
        </BandCell>
      </BandRow>
    </Band>
  )
}
