import { useMemo, useState } from 'react'
import { Flower, NotePencil, ShieldWarning, Thermometer } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../store'
import { addDays, monthDays, prettyDay, prettyMonth, todayISO } from '../lib/date'
import { Card, Pill } from '../components/ui'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { PageLayout, SummaryStrip } from '../components/page'
import { CardGrid } from '../components/shell/CardGrid'
import { useCursor } from '../components/shell/Page'
import { onRaised } from '../lib/colors'
import {
  avgCycleLength, coverline, cycleDay, cycleHistory, daysUntilNextPeriod,
  flagPatternByDay, nextPeriodEstimate, periodStarts, phaseBands, phaseOf,
} from '../lib/cycleInsights'
import { BBT_RULES, CYCLE_DISCLAIMER, CYCLE_PHASES, TRACKING_TIPS } from '../lib/cycleGuide'
import {
  BbtChart, CycleHistoryChart, CycleWheel, DayEditor, MonthList, SymptomPattern,
  type BbtPoint,
} from '../components/cycle'

/**
 * CYCLE · on the three-zone contract, and with something to show.
 *
 * It was two cards and a fold: a day editor, a month list, a basal-temperature
 * line for the calendar month, and the reference shelf. Everything it knew, it
 * knew about *one month*, and the one thing a cycle log can tell you that a
 * calendar cannot — how this cycle compares to the last four, and which day of
 * the cycle the cramps land on — was nowhere on the page.
 *
 * **It had also never been seen with data.** `lib/demo.ts` seeded every domain
 * but this one, so the whole orientation block (`{day != null && phase && …}`)
 * was absent from the DOM, the chart drew a bare grid, and the month list drew
 * thirty empty rows. `npm run a11y` visits this page on every run and could
 * not fail on any of it — the empty-journal trap from CLAUDE.md, one domain
 * deep. The seed now writes four cycles with a real biphasic temperature
 * shift, which is what made the rest of this pass checkable.
 *
 * Zone 1 · cycle day, phase, next period, personal average — the four facts.
 * Zone 2 · the day editor and the month, which is the only thing that writes.
 * Zone 3 · the wheel, the cycle-by-cycle chart, the symptom pattern, the
 *          temperature chart, then the guide.
 *
 * Everything in zone 3 is keyed to the **cycle**, not the calendar month, and
 * that is the substantive change: a month boundary cuts a cycle at an
 * arbitrary point, so a perfectly ordinary chart read as two unrelated
 * fragments. The month list stays month-shaped because it is a diary and you
 * look things up in it by date — it just carries the cycle day now too.
 *
 * Every estimate is worded as one, every derivation returns `null` rather than
 * a fake zero, and nothing here predicts. See `lib/cycleInsights.ts`.
 */
export function Cycle() {
  const { data, setCycle } = useJournal()
  const { month: ym } = useCursor()
  const unit = data.settings.tempUnit
  const days = monthDays(ym)
  const today = todayISO()
  const log = data.cycle

  const [selected, setSelected] = useState(() => (days.includes(today) ? today : days[0]))
  const sel = days.includes(selected) ? selected : days[0]
  const selEntry = log.find((x) => x.date === sel)

  // Orientation, derived from the log. All null until the log can answer — a
  // fake "day 0" would be the `count ? x : 0` trap.
  const day = cycleDay(log, today)
  const length = avgCycleLength(log)
  const phase = day != null ? phaseOf(day, length) : null
  const nextPeriod = nextPeriodEstimate(log, today)
  const untilNext = daysUntilNextPeriod(log, today)

  const history = useMemo(() => cycleHistory(log, today), [log, today])
  const bands = useMemo(() => phaseBands(length), [length])
  const pattern = useMemo(() => flagPatternByDay(log, today), [log, today])

  // Cycle day for any date, for the month list's second column.
  const cycleDayOf = useMemo(() => {
    const starts = periodStarts(log)
    return (date: string) => {
      const start = [...starts].reverse().find((s) => s <= date)
      if (!start) return null
      const n = Math.round((Date.parse(date) - Date.parse(start)) / 86_400_000) + 1
      // Beyond a plausible cycle it is not "day 74", it is a gap in the log.
      return n > 0 && n <= 60 ? n : null
    }
  }, [log])

  /**
   * The temperature chart's data, by **cycle day of the current cycle** when
   * one is running, and by day-of-month otherwise. The fallback matters: with
   * no period start there is no cycle to index against, and plotting nothing
   * would hide readings someone actually took.
   */
  const { bbt, bbtLabel } = useMemo((): { bbt: BbtPoint[]; bbtLabel: string } => {
    const running = history[history.length - 1]
    if (running) {
      const span = Math.max(running.length, length ?? 28)
      return {
        bbt: Array.from({ length: span }, (_, i) => {
          const date = addDays(running.start, i)
          const c = log.find((x) => x.date === date)
          return { day: i + 1, temp: c?.temp, flags: c?.flags ?? [] }
        }),
        bbtLabel: `cycle day, from ${prettyDay(running.start)}`,
      }
    }
    return {
      bbt: days.map((d) => {
        const c = log.find((x) => x.date === d)
        return { day: Number(d.slice(8)), temp: c?.temp, flags: c?.flags ?? [] }
      }),
      bbtLabel: `day of ${prettyMonth(ym)}`,
    }
  }, [history, log, days, length, ym])

  const finished = history.filter((c) => !c.current)
  const periodLen = finished.length
    ? Math.round(finished.reduce((s, c) => s + c.periodDays, 0) / finished.length)
    : null
  const shift = coverline(bbt)

  function toggleFlag(date: string, flag: string) {
    const cur = log.find((c) => c.date === date)?.flags ?? []
    setCycle(date, { flags: cur.includes(flag) ? cur.filter((f) => f !== flag) : [...cur, flag] })
  }

  return (
    <PageLayout
      tier={1180}
      zone1={
        /* Not `StatBar`: three of these four are estimates and the phase is a
           coloured pill, and a bar that renders every value in the mono face
           would spell "Luteal · estimate" in the typewriter. The shape is the
           contract's — one row, at most four facts, spanning both columns. */
        <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2 border-b border-line pb-3">
          <Fact label="Cycle day" value={day != null ? <span className="num text-heading font-medium text-fg-1">{day}</span> : <span className="text-body text-fg-2">not started</span>} />
          <Fact
            label="Phase"
            value={phase
              ? <Pill color={phase.color} size="micro" className="px-2">{phase.label} · estimate</Pill>
              : <span className="text-body text-fg-2">—</span>}
          />
          <Fact
            label="Next period"
            value={nextPeriod
              ? (
                <span className="text-body text-fg-1">
                  ~{prettyDay(nextPeriod)}
                  {untilNext != null && (
                    <span className="ml-1.5 text-label text-fg-2">
                      {untilNext === 0 ? 'today' : untilNext > 0 ? `in ${untilNext}d` : `${-untilNext}d late`}
                    </span>
                  )}
                </span>
              )
              : <span className="text-body text-fg-2">needs two periods</span>}
          />
          <Fact
            label="Your average"
            value={length != null
              ? <span className="text-body text-fg-1"><span className="num font-medium">{length}</span> days</span>
              : <span className="text-body text-fg-2">—</span>}
          />
        </div>
      }
      zone2={
        <Card band title="Log a day" subtitle="Tap a day, set a temperature, flag what happened" hideInfo>
          <DayEditor
            date={sel}
            entry={selEntry}
            unit={unit}
            onTemp={(temp) => setCycle(sel, { temp })}
            onToggleFlag={(f) => toggleFlag(sel, f)}
          />
          <div className="mt-3">
            <MonthList
              days={days}
              entries={log}
              selected={sel}
              today={today}
              cycleDayOf={cycleDayOf}
              onSelect={setSelected}
            />
          </div>
        </Card>
      }
      zone3={
        <>
          <SummaryStrip items={[
            { label: 'Cycles logged', value: finished.length, empty: finished.length === 0 },
            { label: 'Avg period', value: periodLen != null ? `${periodLen} days` : '—', empty: periodLen == null },
            { label: 'Temp shift', value: shift != null ? `seen · ${shift}°` : 'not yet', empty: shift == null },
          ]} />

          <CardGrid>
            <Card band title="Where you are" subtitle="The cycle as one shape, not a line that restarts every month" hideInfo>
              <CycleWheel day={day} length={length ?? 28} bands={bands} />
              <p className="mt-3 text-label text-fg-2">
                Widths come from your own average ({length ?? 28} days). The luteal half is the
                stable one — about fourteen days — so a longer cycle is almost always a longer
                first half, which is why ovulation is placed back from the <em>next</em> period
                rather than forward from the last.
              </p>
            </Card>

            <Card band title="Cycle length" subtitle="Regular is a range, not a number" hideInfo>
              <CycleHistoryChart history={history} average={length} />
            </Card>
          </CardGrid>

          <Card band title="Basal temperature" subtitle="Read for the shift, not the number" hideInfo className="mt-4">
            <BbtChart points={bbt} unit={unit} label={bbtLabel} />
          </Card>

          <Card band title="Symptom pattern" subtitle="Which cycle day each flag tends to land on" hideInfo className="mt-4">
            <SymptomPattern pattern={pattern} />
          </Card>

          {/* ── Guide · the same shelf the training pages keep. Static
              reference (lib/cycleGuide, counts pinned by its test). ── */}
          <section className="mt-4 flex flex-col gap-3">
            <h2 className="text-label text-fg-2">Guide</h2>

            <CollapsibleSection
              variant="quiet" defaultOpen={false} stickyKey="cycle.phases"
              icon={Flower} color="mauve"
              title="The four phases"
              subtitle="What each one is, how it can feel, what helps"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {CYCLE_PHASES.map((ph) => (
                  <div key={ph.id} className="rounded-card bg-ink-2 p-3">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="text-body font-medium" style={{ color: onRaised(ph.color) }}>{ph.name}</span>
                      <Pill color={ph.color} size="micro" className="px-2">{ph.days}</Pill>
                    </div>
                    <p className="text-label text-fg-2">{ph.what}</p>
                    <p className="mt-1 text-label text-fg-2"><span className="font-medium text-fg-1">How it can feel:</span> {ph.feel}</p>
                    <p className="mt-1 text-label text-fg-2"><span className="font-medium" style={{ color: onRaised('green') }}>Helps:</span> {ph.tip}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-label text-fg-2">Day ranges assume the textbook 28 days — 21–35 is a normal range, and the wheel above uses your logged average once two periods anchor it.</p>
            </CollapsibleSection>

            <CollapsibleSection
              variant="quiet" defaultOpen={false} stickyKey="cycle.bbt"
              icon={Thermometer} color="maroon"
              title="Basal temperature, done right"
              subtitle="Five rules that make the chart readable"
            >
              <ol className="space-y-1.5">
                {BBT_RULES.map((r, i) => (
                  <li key={i} className="flex gap-2 text-label text-fg-2">
                    <span className="shrink-0 font-medium text-mauve">{i + 1}.</span> {r}
                  </li>
                ))}
              </ol>
            </CollapsibleSection>

            <CollapsibleSection
              variant="quiet" defaultOpen={false} stickyKey="cycle.logging"
              icon={NotePencil} color="teal"
              title="What to log & why"
              subtitle="The flags above, and what each one buys you"
            >
              <ul className="grid gap-2 sm:grid-cols-2">
                {TRACKING_TIPS.map((t) => (
                  <li key={t.what} className="rounded-card bg-ink-2 p-2.5">
                    <p className="text-body font-medium text-fg-1">{t.what}</p>
                    <p className="text-label text-fg-2">{t.why}</p>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>

            <p className="inline-flex items-start gap-1.5 rounded-card bg-red/10 p-2 text-label text-fg-2">
              <Icon as={ShieldWarning} size="sm" className="mt-0.5 shrink-0 text-red" /> {CYCLE_DISCLAIMER}
            </p>
          </section>
        </>
      }
    />
  )
}

/** One zone-1 fact. Local because its value is a node, not a formatted string. */
function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-caption uppercase tracking-wide text-fg-2">{label}</p>
      <div className="mt-0.5">{value}</div>
    </div>
  )
}
