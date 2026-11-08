import { useJournal } from '../../store'
import { dataSummary } from '../../lib/csv'
import { Database } from '@/components/icons'
import { Cell, Cells } from '../ui/cells'
import { InfoCell } from '../ui/infoCell'

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
 * Two rows answer two different questions: **browser storage** says "will
 * this stop working" and **days with data** says "how complete is my record".
 * Storage measures the journal JSON only — photos live in IndexedDB
 * (`imageStore.ts`), off this budget.
 */
export function YourDataCard() {
  const { data } = useJournal()
  const sum = dataSummary(data)
  const pct = Math.min(100, Math.round((sum.bytes / BUDGET_BYTES) * 100))
  const warn = pct >= 80
  // Value rows, iOS "About" style — no tiles and no bars (Settings draws as a
  // phone everywhere, and a phone draws no visualizations); the per-domain
  // counts open a sheet.
  return (
    <Cells title="Your data" aside="on this device">
      <Cell title="Records" trail={sum.totalRecords} />
      <Cell title="Active days" subtitle={sum.totalRecords > 0 ? `${sum.firstDay} to ${sum.lastDay}` : undefined} trail={sum.activeDays} />
      {sum.totalRecords > 0 && <Cell title="Days with data" subtitle={`of ${sum.spanDays} in your span`} trail={`${sum.coveragePct}%`} />}
      <Cell title="Photos" trail={sum.photos} />
      <Cell title="Browser storage" subtitle={warn ? 'Getting full — export a backup now' : `${Math.round(sum.bytes / 1024)} KB of journal text`} trail={`${pct}% of ~5 MB`} />
      {sum.counts.length > 0 && (
        <InfoCell title="By domain" subtitle={`${sum.counts.length} ${sum.counts.length === 1 ? 'domain' : 'domains'}`} icon={Database} tone="teal">
          <Cells>
            {sum.counts.map((c) => <Cell key={c.label} title={c.label} trail={c.count} />)}
          </Cells>
        </InfoCell>
      )}
    </Cells>
  )

}
