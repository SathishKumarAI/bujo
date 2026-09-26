import { useJournal } from '../../store'
import { Card, StatTile } from '../ui'
import { cat, onRaised } from '../../lib/colors'
import { dataSummary } from '../../lib/csv'

/** localStorage's practical ceiling. The journal JSON is what counts against it. */
const BUDGET_BYTES = 5 * 1024 * 1024

/**
 * YOUR DATA · one card, one source, for "how much of this is there".
 *
 * The Data tab used to open with **two** cards that counted the same journal.
 * "Your data at a glance" drew six StatTiles and a storage bar at the top;
 * "Journal summary" drew a span, a coverage bar and ten count pills near the
 * bottom. Measured on the demo seed, four of the six tiles repeated four of
 * the ten pills verbatim — Entries 90, Workouts 26, Memories 15 — about 2,000
 * pixels apart on one tab.
 *
 * The fifth was worse than a repeat. Both said **Habits**, the tile counting
 * `!archived` and the pill counting all of them, so archiving a habit made the
 * page contradict itself in two places with no way to tell which was meant.
 * That is the finding: the duplication was not only noise, it was a
 * disagreement waiting for an archived habit to expose it. `dataSummary()` now
 * owns every number here — counts, photos and bytes included — so a second
 * definition has nowhere to live.
 *
 * Two progress bars became two, deliberately: **storage used** answers "will
 * this stop working" and **coverage** answers "how complete is my record".
 * They are different questions and both belong, but they sit in one card now
 * rather than bracketing a 3,000px tab.
 */
export function YourDataCard() {
  const { data } = useJournal()
  const sum = dataSummary(data)
  const pct = Math.min(100, Math.round((sum.bytes / BUDGET_BYTES) * 100))
  const warn = pct >= 80

  return (
    <Card band title="Your data" subtitle="Everything stored on this device" className="mb-5">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <StatTile compact label="Records" value={sum.totalRecords} />
        <StatTile compact label="Active days" value={sum.activeDays} />
        <StatTile compact label="Days span" value={sum.spanDays} />
        <StatTile compact label="Photos" value={sum.photos} />
        <StatTile compact label="KB stored" value={Math.round(sum.bytes / 1024)} />
        <StatTile compact label="Domains" value={sum.counts.length} />
      </div>

      {/* Storage used · the budget question. Measures the JSON blob only, which
          is the right number for THAT budget — photos moved to IndexedDB
          (`imageStore.ts`) and are neither in this count nor on this quota. */}
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-label">
          <span className="text-fg-2">Browser storage used</span>
          <span style={{ color: warn ? cat('peach') : cat('subtext1') }}>{pct}% of ~5 MB</span>
        </div>
        <div className="h-2 overflow-hidden rounded-pill bg-ink-2">
          <div className="h-full rounded-pill" style={{ width: `${pct}%`, background: cat(warn ? 'peach' : 'green') }} />
        </div>
        {warn && (
          <p className="mt-1.5 text-label text-peach">
            Getting full. Export a backup now. Photos are NOT counted here — they live in
            IndexedDB, off this budget — so this is journal text: trim old collections or entries.
          </p>
        )}
      </div>

      {/* Coverage · the completeness question. Hidden on an empty journal
          rather than drawn as a 0% bar over a null date range: the whole card
          above already says the true thing, and a zeroed bar reads as a total
          failure that never happened (the `count ? x : 0` trap). */}
      {sum.totalRecords > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <div className="mb-1 flex justify-between text-label">
            <span className="text-fg-2">
              Days with data · {sum.firstDay} to {sum.lastDay}
            </span>
            <span style={{ color: onRaised('subtext1') }}>{sum.coveragePct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-pill bg-ink-2">
            <div className="h-full rounded-pill" style={{ width: `${sum.coveragePct}%`, background: cat('teal') }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sum.counts.map((c) => (
              <span key={c.label} className="inline-flex items-center gap-1 rounded-pill bg-ink-2 px-2 py-0.5 text-label text-fg-1">
                {c.label} <span className="font-medium text-fg-1">{c.count}</span>
              </span>
            ))}
          </div>
          <p className="mt-2 text-label text-fg-2">
            {sum.totalRecords} records across {sum.counts.length} {sum.counts.length === 1 ? 'domain' : 'domains'} · coverage is how many days in your tracked span have at least one record.
          </p>
        </div>
      )}
    </Card>
  )
}
