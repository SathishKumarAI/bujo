/**
 * WHERE A CAPTURE LANDS · one record → the page that now holds it.
 *
 * Owns two things and nothing else: the kind → `ViewId` table, and the short
 * human line that names what was written. It knows nothing about navigation,
 * React or the receipt bar — `CaptureReceipt` does the moving, this decides
 * where to.
 *
 * It exists because the answer is not "the view you were on". Saying "I played
 * two games and scored 68" from Today writes a pickleball session, and leaving
 * the user on Today with a four-second toast is the difference between an app
 * that took dictation and an app that showed its work.
 *
 * Both capture paths route through here — the Talk dialog (which speaks
 * `ImportRecord`, the ingest envelope's vocabulary) and the quick-add bar
 * (which speaks `CaptureResult`, the local parser's). They disagree on names
 * for the same things, which is why there are two entry points and one table.
 */
import type { ViewId } from '../components/shell/viewChrome'
import type { ImportRecord, MetricRecord } from './ingest/envelope'
import { labelOf, modeOf } from '../domain/activities'
import type { CaptureResult } from './capture'

export type Landing = {
  /** The page that now holds the record. */
  view: ViewId
  /** How that page is named in the nav — the receipt says "Saved to {here}". */
  where: string
  /** What was written, in the user's terms. Never a record kind. */
  what: string
}

/**
 * Nutrition metrics live on their own page; wellbeing metrics live on Tracking.
 * They are one `kind` in the envelope because they are one row in the journal
 * (`DailyMetric`), so the split has to be made on the fields present.
 */
const NUTRITION_FIELDS = ['calories', 'protein', 'carbs', 'fat'] as const

const isNutrition = (m: MetricRecord) => NUTRITION_FIELDS.some((f) => typeof m[f] === 'number')

/** `mood 7 · sleep 8h`, from whichever fields the record actually carries. */
function metricFields(m: MetricRecord): string {
  const parts: string[] = []
  if (typeof m.mood === 'number') parts.push(`mood ${m.mood}`)
  if (typeof m.energy === 'number') parts.push(`energy ${m.energy}`)
  if (typeof m.stress === 'number') parts.push(`stress ${m.stress}`)
  if (typeof m.sleep === 'number') parts.push(`sleep ${m.sleep}h`)
  if (typeof m.steps === 'number') parts.push(`${m.steps} steps`)
  if (typeof m.restingHR === 'number') parts.push(`resting HR ${m.restingHR}`)
  if (typeof m.activeKcal === 'number') parts.push(`${m.activeKcal} active kcal`)
  for (const f of NUTRITION_FIELDS) {
    const v = m[f]
    if (typeof v === 'number') parts.push(f === 'calories' ? `${v} kcal` : `${v}g ${f}`)
  }
  return parts.join(' · ')
}

/**
 * One ingest record → where it landed.
 *
 * The switch is exhaustive over `RecordKind` and ends in a `never`, so adding a
 * kind to the envelope fails the typecheck here rather than silently landing on
 * Today. That is the same lesson `RECORD_KINDS` is written down for.
 */
export function landingForRecord(r: ImportRecord): Landing {
  switch (r.kind) {
    case 'metric':
      return isNutrition(r)
        ? { view: 'nutrition', where: 'Nutrition', what: metricFields(r) }
        : { view: 'trackers', where: 'Tracking', what: metricFields(r) }

    case 'workout': {
      const what = [labelOf(r.activity), r.durationMin ? `${r.durationMin} min` : null, r.distanceKm ? `${r.distanceKm} km` : null]
        .filter(Boolean)
        .join(' · ')
      if (r.activity === 'pickleball') return { view: 'pickleball', where: 'Pickleball', what }
      if (r.activity === 'pullups') return { view: 'pullups', where: 'Pull-ups', what }
      return modeOf(r.activity) === 'strength'
        ? { view: 'gym', where: 'Strength', what }
        : { view: 'fitness', where: 'Fitness', what }
    }

    // Weight and measurements are rendered by Gym, not by Tracking — the one
    // mapping here that cannot be guessed from the name.
    case 'body': {
      const parts = [
        typeof r.weightKg === 'number' ? `weight ${r.weightKg}kg` : null,
        typeof r.bodyFat === 'number' ? `body fat ${r.bodyFat}%` : null,
        ...Object.entries(r.measurements ?? {}).map(([k, v]) => `${k} ${v}`),
      ].filter(Boolean)
      return { view: 'gym', where: 'Strength', what: parts.join(' · ') }
    }

    case 'habit':
      return { view: 'trackers', where: 'Tracking', what: r.value != null ? `${r.habit} ${r.value}` : `${r.habit} ✓` }

    case 'cycle':
      return { view: 'cycle', where: 'Cycle', what: [r.flags?.join(', '), r.note].filter(Boolean).join(' · ') }

    case 'pickleball': {
      const score = r.gamesWon != null || r.gamesLost != null ? `${r.gamesWon ?? 0}–${r.gamesLost ?? 0}` : null
      return { view: 'pickleball', where: 'Pickleball', what: [r.format, score, r.partner ? `with ${r.partner}` : null].filter(Boolean).join(' · ') }
    }

    case 'entry':
      return { view: 'today', where: 'Today', what: r.text }
  }
  // Exhaustive above. Kept so a new kind is a typecheck failure, not a surprise.
  const never: never = r
  return never
}

/** One quick-add parse → where it landed. The parser's vocabulary, same table. */
export function landingForCapture(r: CaptureResult): Landing {
  switch (r.kind) {
    case 'gym':
      return { view: 'gym', where: 'Strength', what: [r.exercise, r.weight != null ? `${r.weight}${r.unit}` : null, r.reps != null ? `×${r.reps}` : null].filter(Boolean).join(' ') }
    case 'cardio':
      return r.activity === 'pickleball'
        ? { view: 'pickleball', where: 'Pickleball', what: labelOf(r.activity) }
        : { view: 'fitness', where: 'Fitness', what: [labelOf(r.activity), r.distanceKm ? `${r.distanceKm}km` : null, r.durationMin ? `${r.durationMin}min` : null].filter(Boolean).join(' · ') }
    case 'metric':
      return { view: 'trackers', where: 'Tracking', what: [r.mood != null ? `mood ${r.mood}` : null, r.sleep != null ? `sleep ${r.sleep}h` : null, r.stress != null ? `stress ${r.stress}` : null].filter(Boolean).join(' · ') }
    case 'habit':
      return { view: 'trackers', where: 'Tracking', what: r.value != null ? `${r.habit} ${r.value}` : `${r.habit} ✓` }
    case 'bullet':
      return { view: 'today', where: 'Today', what: r.raw }
  }
  const never: never = r
  return never
}

/**
 * A whole sentence → **one** destination.
 *
 * A spoken sentence can write three kinds at once ("ran 5k, mood 7, and a note
 * about my knee") and there is only one screen to go to. The first record wins,
 * deliberately: it is the thing the user said first, and every other rule —
 * most-records, most-specific, priority order — picks a page the sentence did
 * not lead with. The receipt lists the rest, so nothing is hidden by the choice.
 */
export function landingForRecords(records: readonly ImportRecord[]): Landing[] {
  return records.map(landingForRecord)
}
