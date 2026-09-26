import { useMemo, useState } from 'react'
import { CalendarBlank, ShieldWarning } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../store'
import { addDays, monthDays, prettyDay, prettyMonth, todayISO } from '../lib/date'
import { Card, Pill } from '../components/ui'
import { Abbr } from '../components/Abbr'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { PageLayout, SectionRail, SummaryStrip } from '../components/page'
import { CardGrid, SPAN_2 } from '../components/shell/CardGrid'
import { useCursor } from '../components/shell/Page'
import { useDevice } from '../components/shell/device'
import { useStickyState } from '../lib/useStickyState'
import {
  avgCycleLength, coverline, cycleDay, cycleHistory, daysUntilNextPeriod,
  driveByPhase, drivePeak, flagPatternByDay, nextPeriodEstimate, periodStarts,
  phaseBands, phaseOf,
} from '../lib/cycleInsights'
import { CYCLE_DISCLAIMER } from '../lib/cycleGuide'
import {
  CYCLE_CARDS, CYCLE_GROUPS, DEFAULT_GROUP, GROUP_BLURB, GROUP_LABEL, type CycleGroup,
} from '../lib/cycleCards'
import {
  BbtChart, BbtRulesCard, CycleHistoryChart, CycleWheel, DayEditor, DriveByPhase, FertileWindow,
  FlagLegend, FoodCard, LoggingCard, MonthList, PhasesCard, SymptomPattern,
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
 * Zone 2 · the day editor (temperature, flags, drive), the legend that decodes
 *          the flag colours, and the month — the only things that write.
 * Zone 3 · **a rail over four groups** — This cycle, Fertility, Patterns,
 *          Guide — one group on screen at a time. `lib/cycleCards.ts` is the
 *          registry and `Cycle.test.tsx` binds it to what renders.
 *
 * **The four folds are gone, and that is this pass.** Zone 3 shipped as an
 * unlabelled grid of four cards, two loose ones, and a "Guide" shelf of four
 * `CollapsibleSection`s that all shipped **closed** — so `page-census` read
 * `cycle folds 4 · open 0` against the modernised Insights' `folds 0`, and
 * `space-audit` read **4.4 screens shipped / 10.6 open** on a phone. That
 * 6.2-screen gap is content on the page that is not on the page, and COD-230
 * is open on it. Four fold titles became four rail rows: the same move #270
 * made on Insights and Coaching made on its manual, and the only lever that
 * has worked here — taking content off the page rather than reflowing it.
 * The `stickyKey`s went with the folds; the rail remembers the group instead
 * (`bujo.ui.cycle.group`), which is what Coaching's chapter rail does.
 *
 * **The legend is in zone 2 and not in the guide**, because "which colour is
 * which" is asked while pressing the chips, and a rail row would answer it on a
 * group you have to select first. `FertileWindow` is the one graphic that is not
 * about *your* log: it explains what the narrow green band is and why two
 * signals point at it from opposite sides in time, which a ring cannot show and
 * a paragraph cannot hold.
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
  const isPhone = useDevice() === 'mobile'
  const unit = data.settings.tempUnit
  const days = monthDays(ym)
  const today = todayISO()
  const log = data.cycle

  const [selected, setSelected] = useState(() => (days.includes(today) ? today : days[0]))
  /* Which zone-3 group is on screen. Sticky, because the four folds it replaces
     each had a `stickyKey` and losing that is a regression dressed as a
     redesign — `allowed` is the registry, so a renamed group cannot resurrect
     from a stale localStorage key. */
  const [group, setGroup] = useStickyState<CycleGroup>('cycle.group', DEFAULT_GROUP, CYCLE_GROUPS)
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
  const drive = useMemo(() => driveByPhase(log, today, length), [log, today, length])
  const peak = useMemo(() => drivePeak(drive), [drive])

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

  /**
   * Zone 3's ten cards, by the id `lib/cycleCards.ts` knows each under. A record
   * because the rail renders one group and the rest must not be in the DOM, and
   * because `Cycle.test.tsx` reads the rendered `data-card` set back against the
   * registry in both directions.
   *
   * Which cards take the full row is the registry's `wide` flag, applied to the
   * `data-card` wrapper below — the wrapper is the grid item, so `SPAN_2` on the
   * `Card` inside it does nothing at all. Measured before that was understood:
   * the temperature chart and the symptom grid both rendered 351px wide in a
   * 722px zone, having asked for the row.
   */
  const cards: Record<string, React.ReactNode> = {
    wheel: (
      <Card band title="Where you are" subtitle="The cycle as one shape, not a line that restarts every month" hideInfo>
        <CycleWheel day={day} length={length ?? 28} bands={bands} />
        {/* Two lines, not four: where ovulation is placed and why is the
            fertile-window card's whole subject, one row down. */}
        <p className="mt-3 text-label text-fg-2">
          Widths come from your own average ({length ?? 28} days). The luteal half is the
          stable one — about fourteen days — so a longer cycle is almost always a longer
          first half.
        </p>
      </Card>
    ),

    length: (
      <Card band title="Cycle length" subtitle="Regular is a range, not a number" hideInfo>
        <CycleHistoryChart history={history} average={length} />
      </Card>
    ),

    /* Not in the guide group, and that is the whole point: "what is ovulation
       and how do I tell it from the phases either side" was the question, so
       the answer is on the page. The wheel says where you are; this says what
       the narrow green band actually is and why two different signals point at
       it from opposite sides. */
    fertile: (
      <Card band title="Ovulation & the fertile window" subtitle="One day, two signals, and a window wider than both" hideInfo>
        <FertileWindow bands={bands} length={length ?? 28} />
      </Card>
    ),

    /* The title says the words; the ⓘ says what a *basal* temperature is and
       why a reading taken after you are up is not one. That distinction is the
       difference between a chart with a visible shift and a chart of noise. */
    bbt: (
      <Card band title={<Abbr term="BBT">Basal temperature</Abbr>} subtitle="Read for the shift, not the number" hideInfo>
        <BbtChart points={bbt} unit={unit} label={bbtLabel} />
      </Card>
    ),

    symptoms: (
      <Card band title="Symptom pattern" subtitle="Which cycle day each flag tends to land on" hideInfo>
        <SymptomPattern pattern={pattern} />
      </Card>
    ),

    drive: (
      <Card band title="Drive by phase" subtitle="Your own answer to the textbook claim" hideInfo>
        <DriveByPhase rows={drive} peak={peak} />
      </Card>
    ),

    /* ── Guide · the same shelf the training pages keep. Static reference from
       lib/cycleGuide; titles, bodies and widths all in cycle/Guide.tsx. ── */
    phases: <PhasesCard />,
    food: <FoodCard />,
    bbtrules: <BbtRulesCard />,
    logging: <LoggingCard />,
  }

  /** What the selected group renders, and what the rail counts. Same predicate
   *  for both, so a card that yields nothing can never leave a heading over an
   *  empty grid or a rail row promising a card that is not there. */
  const idsIn = (g: CycleGroup) => CYCLE_CARDS.filter((c) => c.group === g && cards[c.id])
  const shown = idsIn(group)

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
        <Card band title="Log a day" subtitle="Tap a day, set a temperature, flag what happened, rate the drive" hideInfo>
          <DayEditor
            date={sel}
            entry={selEntry}
            unit={unit}
            onTemp={(temp) => setCycle(sel, { temp })}
            onToggleFlag={(f) => toggleFlag(sel, f)}
            onDrive={(drive) => setCycle(sel, { drive })}
          />

          {/* The legend belongs to the act, not to the review: it decodes the
              chips six pixels above it, and the dead column beside a form is
              exactly where PAGE-SHAPE says to put the thing you need while
              doing the thing. Not folded — the report was that the colours are
              undecipherable, and a closed fold is the same page. */}
          <FlagLegend />

          {/* COD-230 · the month list is 956px of a 3,703px phone page — two
              15-row columns that stack below `sm`, because the rows cannot be
              made narrower: 24 + 40 + 56px of columns plus gaps and five dots
              is ~227px of min-content against 167px of available column at
              390. So it folds on a phone instead, closed, with the day editor
              (which is what you opened the page to use) left in the open.
              Measured: 4.1 → 3.0 screens shipped, open unchanged at 6.3 before
              the new content, and the desktop page does not fold at all
              because there is nothing to win there — the column is dead space
              either way. `useDevice` rather than a CSS-hidden second copy: two
              copies of a thirty-row list is how the two come to disagree. */}
          {isPhone ? (
            <div className="mt-3">
              <CollapsibleSection
                variant="quiet" defaultOpen={false} stickyKey="cycle.month"
                icon={CalendarBlank} color="mauve"
                title={prettyMonth(ym)}
                subtitle="Every day, its temperature and its cycle day"
              >
                <MonthList
                  days={days}
                  entries={log}
                  selected={sel}
                  today={today}
                  cycleDayOf={cycleDayOf}
                  onSelect={setSelected}
                />
              </CollapsibleSection>
            </div>
          ) : (
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
          )}
        </Card>
      }
      zone3={
        <>
          <SummaryStrip items={[
            { label: 'Cycles logged', value: finished.length, empty: finished.length === 0 },
            { label: 'Avg period', value: periodLen != null ? `${periodLen} days` : '—', empty: periodLen == null },
            { label: 'Temp shift', value: shift != null ? `seen · ${shift}°` : 'not yet', empty: shift == null },
          ]} />

          {/* `@container/page` on the OUTER div and the grid on the inner one:
              an element cannot query itself, so putting both on one div means
              the two-column rail layout never fires. And the phone column is
              spelled out because a grid with no `grid-template-columns` gets a
              single implicit `auto` track sized to its widest item’s
              min-content — a chip row makes that wider than the viewport and
              scrolls the whole page sideways. Both traps are in
              docs/PAGE-SHAPE.md and both were hit on the first call site. */}
          <div className="@container/page mt-4">
            <div className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-3 @4xl/page:grid-cols-[11rem_minmax(0,1fr)]">
              {/* No "All" row: the four groups do not overlap and there is no
                  search on this page to cross them, so All could only offer the
                  10.6-screen phone page this replaces. Coaching’s rail omits
                  it for the same reason. */}
              <SectionRail
                label="Cycle sections"
                groups={CYCLE_GROUPS.map((g) => ({ id: g, label: GROUP_LABEL[g], count: idsIn(g).length }))}
                value={group}
                onChange={(id) => setGroup((id as CycleGroup | null) ?? DEFAULT_GROUP)}
              />
              <div className="min-w-0">
                <section data-domain={group}>
                  <div className="mb-3 flex flex-wrap items-baseline gap-x-3 border-b border-line pb-1.5">
                    <h2 className="font-display text-heading font-medium text-fg-1">{GROUP_LABEL[group]}</h2>
                    <p className="text-label text-fg-2">{GROUP_BLURB[group]}</p>
                    <span className="num ml-auto text-label text-fg-3">{shown.length}</span>
                  </div>
                  {/* Two columns is the ceiling here, and it is a correction
                      rather than a preference. `CardGrid` asks the *viewport*,
                      so at 1600 its `2xl:grid-cols-3` fired inside this 722px
                      split column and resolved to three tracks of **227px** —
                      the "cards a third of the size" half of the report. Two
                      tracks of 350 is what 1440 already did. `MasonryGrid` is
                      not the answer either: it breaks on its container at
                      768px, so at 722 it would silently draw one column. */}
                  <CardGrid className="2xl:grid-cols-2">
                    {shown.map((c) => (
                      <div key={c.id} data-card={c.id} className={c.wide ? `min-w-0 ${SPAN_2}` : 'min-w-0'}>{cards[c.id]}</div>
                    ))}
                  </CardGrid>
                </section>
              </div>
            </div>
          </div>

          {/* Outside the rail, and deliberately: a medical disclaimer behind a
              row you have to select is a disclaimer most readers never meet. It
              was always visible under the guide shelf and it stays that way. */}
          <p className="mt-4 inline-flex items-start gap-1.5 rounded-card bg-red/10 p-2 text-label text-fg-2">
            <Icon as={ShieldWarning} size="sm" className="mt-0.5 shrink-0 text-red" /> {CYCLE_DISCLAIMER}
          </p>
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
