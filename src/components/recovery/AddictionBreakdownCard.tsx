import { CalendarX, Clock, Flame, Hash, TrendDown, TrendUp, Minus } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card, StatTile } from '../ui'
import { onRaised } from '../../lib/colors'
import { CalendarHeatmap } from '../page/CalendarHeatmap'
import { HourStrip } from './HourStrip'
import type { LapseProfile } from '../../lib/lapse'
import type { urgeHourHistogram, peakUrgeHour, UrgeCoverage } from '../../lib/urge'

type HourHist = ReturnType<typeof urgeHourHistogram>
type PeakHour = ReturnType<typeof peakUrgeHour>

/** `down` is the good direction for a lapse count, which is why it is green. */
const DIRECTION = {
  down: { word: 'falling', tone: 'green', icon: TrendDown },
  flat: { word: 'holding', tone: 'peach', icon: Minus },
  up: { word: 'rising', tone: 'red', icon: TrendUp },
} as const

/**
 * One tracked addiction, answering the three questions separately: **how much ·
 * on what days · at what times.**
 *
 * Every "when" reading on this page was pooled across every addiction before
 * this card — `RiskiestDaysCard` counts resets by weekday for all of them at
 * once, `HighRiskHoursCard` draws one clock for all of them, and
 * `LapseCountCard` (the only per-addiction chart) is gated on
 * `hasLapseQuantity`, so an addiction logged once a day had **no chart at all**.
 * A pooled weekday peak is the average of two different problems and is
 * actionable for neither.
 *
 * ── What it does NOT duplicate ───────────────────────────────────────────────
 *
 * `LapseCountCard` still owns the weekday *bar chart* for a quantified streak,
 * and this card deliberately does not draw a second one — a fourth weekday bar
 * implementation on one page would read as four unrelated things. The weekday
 * reading here is a **sentence** off the same `lapseByWeekday`, and the
 * calendar's rows are weekdays anyway, so the pattern is visible in the grid
 * without a chart restating it.
 *
 * The clock is `HourStrip`, the same component `HighRiskHoursCard` renders,
 * extracted rather than copied when the second caller appeared.
 *
 * ── The honesty problem, and why it is on screen ─────────────────────────────
 *
 * **`Relapse` has a date and no time, so there is no hour-of-day reading for a
 * lapse.** The clock is built from the *urge* log, which is a different record:
 * `UrgeWin` has an `at` timestamp but **no addiction field**, so the only join
 * available is its free-text `trigger` naming this addiction (`urgesLabelled`).
 * That join can be empty — `ADDICTION_PRESETS` offers "Nicotine" while
 * `URGE_PRESETS` offers "Smoking" — and when it is, the card says so and says
 * what to do about it rather than drawing an empty grid that reads as "no urges
 * at any hour". Both branches are seeded in `lib/demo.ts` on purpose.
 *
 * `coverage` is printed on every render, empty branch or not, because a clock
 * built from one of six urges must not look like one built from six.
 *
 * ── Colour ──────────────────────────────────────────────────────────────────
 *
 * Two hues, and neither is categorical. `red` for lapses (the hue
 * `RiskiestDaysCard` and `LapseCountCard` already use on this page), `peach` for
 * urges (the hue `HighRiskHoursCard` uses). Both are single-hue sequential
 * ramps. **Nothing here is coloured by which addiction it is**: COD-116 is open
 * against this page's ten-accent index palette (sky/sapphire at dE 5.7 in
 * latte), and identity is carried by the card's own title, which is what a
 * ten-category chart actually wants.
 */
export function AddictionBreakdownCard({
  profile,
  hourHist,
  peakHour,
  urges,
  coverage,
}: {
  profile: LapseProfile
  hourHist: HourHist
  peakHour: PeakHour
  /** Urges whose label named this addiction — the clock's own denominator. */
  urges: number
  /** The whole log's match rate, so the reader knows what the clock cannot see. */
  coverage: UrgeCoverage
}) {
  const { name, total, days, perDay, quantified, peak, trend } = profile
  const dir = DIRECTION[trend.direction]
  // "times" only when a quantity was really recorded; otherwise every row wears
  // the `count ?? 1` default and `total` is a count of days wearing a 1.
  const unit = quantified ? 'times' : 'days'

  return (
    <Card enlargeable band hideInfo
      title={<span className="inline-flex items-center gap-2"><Icon as={Flame} size="md" className="text-red" /> {name}</span>}
      subtitle={
        total == null
          ? 'Nothing logged yet · the grids below fill in as you log'
          : `${total} ${unit} over ${days} day${days === 1 ? '' : 's'}${peak ? ` · heaviest on ${peak.label}s` : ''} · ${dir.word}`
      }
    >
      {/* HOW MUCH · the first of the three questions.
          `—` rather than 0 where nothing is logged: `lapseProfile` returns null
          for exactly this, and a zero here would claim a day you were clean on
          a day that was never observed. */}
      <div className="grid grid-cols-3 gap-2">
        <StatTile compact label={quantified ? 'Times' : 'Lapse days'} value={total ?? '—'} color="red" icon={<Icon as={Hash} size="sm" />} />
        <StatTile compact label={quantified ? 'Per lapse day' : 'Days affected'} value={quantified ? (perDay ?? '—') : days} />
        <StatTile compact label="Per week, 8wk" value={trend.avgPerWeek} color={dir.tone} icon={<Icon as={dir.icon} size="sm" />} />
      </div>

      {/* `@container` on the wrapper, `@md` on the grid: an element cannot query
          itself, so one div with both does nothing (the same split
          `views/NoFap.tsx` documents around its rail). The card is ~690px in
          the 722px review pane and ~330px on a phone, so the two-up fires on
          desktop and stacks on a phone with no media query and no measurement.
          `min-w-0` per cell because the calendar is a table and a table's
          min-content can otherwise drag the shared track — the `grid-cols`
          trap in CLAUDE.md. */}
      <div className="@container mt-3">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-x-5 gap-y-4 @md:grid-cols-2">
          {/* ON WHAT DAYS */}
          <section className="min-w-0">
            <h3 className="mb-1.5 flex items-center gap-1.5 border-b border-line pb-1 text-label text-fg-2">
              <Icon as={CalendarX} size="sm" className="text-red" /> On what days
            </h3>
            {/* `fluid`, so the cell size falls out of whichever column this
                lands in — a fixed 11px cell cannot be right at both a 340px
                half-column and a 690px enlarged card. */}
            <CalendarHeatmap
              weeks={12}
              data={profile.heat}
              color="red"
              unit={quantified ? 'times' : ''}
              fluid
              label={`${name}: twelve weeks of lapse days, ${days} logged. Rows are weekdays, Sunday at the top.`}
            />
            <p className="mt-1.5 text-label text-fg-2">
              {peak
                ? <>Rows are weekdays. Heaviest is <span className="font-medium" style={{ color: onRaised('red') }}>{peak.label}</span>{peak.avg != null && quantified && <> at {peak.avg} a time</>} · {peak.days} of {days} lapse day{days === 1 ? '' : 's'} fell there.</>
                : <>Rows are weekdays, Sunday at the top. Nothing logged in this window — an empty cell is a clear day.</>}
            </p>
          </section>

          {/* AT WHAT TIMES */}
          <section className="min-w-0">
            <h3 className="mb-1.5 flex items-center gap-1.5 border-b border-line pb-1 text-label text-fg-2">
              <Icon as={Clock} size="sm" className="text-peach" /> At what times
            </h3>
            {urges > 0 && peakHour ? (
              <>
                <HourStrip hourHist={hourHist} label={`${name}: urges by hour of day, peak at ${peakHour.label} with ${peakHour.count} of ${urges}.`} />
                <p className="mt-1.5 text-label text-fg-2">
                  Urges labelled <span className="font-medium text-fg-1">{name}</span> cluster at{' '}
                  <span className="font-medium" style={{ color: onRaised('peach') }}>{peakHour.label}</span> · {peakHour.count} of {urges}.
                </p>
              </>
            ) : (
              /* Not an empty grid. A 24-cell grid of empty cells reads as "no
                 urges at any hour", which is a measurement; "nothing is
                 labelled this" is a gap in the record, and they call for
                 opposite responses. */
              <p className="text-label text-fg-2">
                No urge carries the label <span className="font-medium text-fg-1">{name}</span>, so there is no clock to draw.
                Tap or type that exact word in <span className="font-medium text-fg-1">Urge surfing → What is it?</span> and this fills in.
              </p>
            )}
            {/* The denominator, on every render. `count ?? 1` has a partner
                mistake: a chart drawn from a subset that does not say so. */}
            <p className="mt-1.5 text-label text-fg-3">
              A lapse records the day, not the time — this clock is your <em>urges</em>, and{' '}
              <span className="num">{coverage.matched}</span> of <span className="num">{coverage.total}</span> logged urge{coverage.total === 1 ? '' : 's'} carry a label matching a tracked addiction.
            </p>
            <p className="mt-1 text-label text-fg-3">
              Knowing which situations and times set off a craving is what lets you plan for one.{' '}
              <a href="https://www.nhs.uk/better-health/quit-smoking/staying-smoke-free/understand-your-smoking-triggers-and-cravings/" target="_blank" rel="noreferrer">NHS · Understand your triggers and cravings</a>
            </p>
          </section>
        </div>
      </div>
    </Card>
  )
}
