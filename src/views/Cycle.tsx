import { useMemo, useState } from 'react'
import { CaretLeft, CaretRight, ShieldWarning } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../store'
import { addDays, dayDiff, monthDays, prettyDay, prettyMonth, todayISO, ymOf } from '../lib/date'
import { Card, Pill } from '../components/ui'
import { Abbr } from '../components/Abbr'
import { ActHide, ActStrip, CardDeck, NextStepBlock, PageLayout, SectionRail, SPAN_PANEL, StatGrid, SummaryStrip, useActColumn } from '../components/page'
import { useCursor } from '../components/shell/Page'
import { useStickyState } from '../lib/useStickyState'
import {
  avgCycleLength, avgPeriodLength, coverline, cycleDay, cycleHistory, daysUntilNextPeriod,
  driveByPhase, drivePeak, flagPatternByDay, nextPeriodEstimate, nextStep, periodStarts,
  phaseBands, phaseOf,
} from '../lib/cycleInsights'
import { analyseCycles, detectOvulation, predict } from '../lib/ovulation'
import { insights, moodByPhase, patternGrid, type Align, type AlignedCycle } from '../lib/cyclePatterns'
import type { CycleGoal } from '../lib/cycleHelp'
import { feelingNotes, feelingsByPhase } from '../lib/cycleFeelings'
import { CYCLE_DISCLAIMER, CYCLE_DISCLAIMER_VERSION } from '../lib/cycleGuide'
import {
  CYCLE_CARDS, CYCLE_GROUPS, DECK_GROUPS, DEFAULT_GROUP, GROUP_BLURB, GROUP_LABEL,
  panelsIn, type CycleGroup,
} from '../lib/cycleCards'
import { STEP_ICON, STEP_TONE } from '../components/cycle/stepStyle'
import { useDevice } from '../components/shell/device'
import { DayStrip } from '../components/ui/dayStrip'
import { cat } from '../lib/colors'
import {
  BbtChart, CycleDataCard, CycleHistoryChart, CyclePrivacyLine, CycleWheel, CycleWelcome, DayLog,
  CycleMonth, DayEditor, DayMore, DriveByPhase, FertileWindow, FlagLegend, FoodCard, PhasesCard,
  CycleGoalCard, DayWindow, FeelingsCard, InfoTip, LutealCard, Manual, MoodByPhase, PatternGrid, PhaseFoodCard, SymptomPattern, type BbtPoint,
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
 * Zone 1 · cycle day, phase, next period, personal average — the four facts,
 *          and the month cursor, which is the page's only one.
 * Zone 2 · **today**. The day editor (temperature, flags, drive), the optional
 *          panel, and the legend that decodes the flag colours.
 * Zone 3 · **a rail over seven groups**, one on screen at a time, with the
 *          month CALENDAR beside the log in `Your log`. `lib/cycleCards.ts` is
 *          the registry and `Cycle.test.tsx` binds it to what renders.
 *
 * **The calendar is in zone 3 and not zone 2**, which is the one piece of this
 * page's shape that was argued twice. It shipped at the bottom of the act
 * column, under the editor and two folds — so a tap on a cell selected the day
 * in a form ~900px above it, inside a panel that is itself an 868px scroller.
 * Reported as *"what is the use of that staying in this low place? If I click
 * on it I need to scroll up and again make the changes."* Beside the log a tap
 * opens `DayWindow`, a dialog, so the gesture ends where it started — and the
 * two halves share one `pickDay` so the grid and the list cannot answer the
 * same question differently. Zone 2 keeps what an act column is for: the day
 * you are living in.
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
 * fragments. The calendar is the exception and stays month-shaped, because it
 * is a diary you look things up in by date.
 *
 * Every estimate is worded as one, every derivation returns `null` rather than
 * a fake zero, and nothing here predicts. See `lib/cycleInsights.ts`.
 */
export function Cycle() {
  const { data, setCycle, setSettings } = useJournal()
  const { month: ym, setMonth } = useCursor()
  const unit = data.settings.tempUnit
  const days = monthDays(ym)
  const today = todayISO()
  const log = data.cycle

  const [selected, setSelected] = useState(() => (days.includes(today) ? today : days[0]))
  /** True when the month cursor is on the month we are actually living in. */
  const thisMonth = ym === today.slice(0, 7)
  /** Shift the cursor a month. Local because the header's stepper is gone. */
  const shiftMonth = (delta: number) => {
    const [y, mo] = ym.split('-').map(Number)
    setMonth(ymOf(new Date(y, mo - 1 + delta, 1)))
  }
  /* The act column, which this page was the last on the contract not to have.
     Measured before: the review panel was **678px at 1440 and 854px at 1920**
     with the day editor holding 424/520px of the shell on every visit, and no
     way to give it back. Stacked it is worse than that — the editor, the
     legend and the month fold are 682px of phone above a review the page
     exists to show, which is why `useActColumn` starts shut when stacked —
     on a desktop window. A phone opens on the editor (COD-467). */
  const logCol = useActColumn('cycle')
  const phone = useDevice() === 'mobile'
  /* Which zone-3 group is on screen. Sticky, because the four folds it replaces
     each had a `stickyKey` and losing that is a regression dressed as a
     redesign — `allowed` is the registry, so a renamed group cannot resurrect
     from a stale localStorage key. */
  const [group, setGroup] = useStickyState<CycleGroup>('cycle.group', DEFAULT_GROUP, CYCLE_GROUPS)
  /**
   * Which manual section a ⓘ asked for, and the reason it is here at all.
   *
   * `InfoTip` has always taken an `onMore`, `lib/cycleHelp.ts` has always
   * carried **18** `more:` targets, and **no call site has ever passed one** —
   * so the "Learn more" link under every tip on this page has never rendered,
   * on any theme, at any width, since the component was written. Not sticky:
   * it is one journey's "take me to that section", not a preference.
   */
  const [manualSection, setManualSection] = useState<string | null>(null)
  /**
   * The day open in a window, or null.
   *
   * Pressing a row in `Your log` used to select the day and move the month
   * cursor, leaving the reader to find the act column — the other side of the
   * page on a desktop, a collapsed strip on a phone. The record is in the
   * review, so the way to correct it belongs over the review.
   */
  const [windowDay, setWindowDay] = useState<string | null>(null)
  /**
   * Open a day for editing — the one gesture both halves of `Your log` make.
   *
   * Hoisted because the calendar and the list are two ways of asking the same
   * question and must answer it identically: a tap on `Fri, Oct 9` in the
   * grid and a tap on its row have to land in the same place, or the card is
   * two features that look like one. It moves the month cursor as well as
   * the selection, so closing the window leaves the page on the day you were
   * just looking at rather than wherever it started.
   */
  const pickDay = (d: string) => { setMonth(d.slice(0, 7)); setSelected(d); setWindowDay(d) }
  /** Open the manual on a section. The rail row and the deck move together. */
  const showManual = (s: string) => { setGroup('manual'); setManualSection(s) }
  const sel = days.includes(selected) ? selected : days[0]
  const selEntry = log.find((x) => x.date === sel)

  /**
   * THE DETECTION ENGINE, run once for the page.
   *
   * Three things read it — the phase pill's confidence, the ring's ovulation
   * window and the temperature chart — and running it three times would be
   * three chances for them to disagree about which day the shift landed on.
   */
  const starts = useMemo(() => periodStarts(log), [log])
  const analysis = useMemo(() => analyseCycles(log, starts, unit === 'C' ? 'C' : 'F'), [log, starts, unit])
  const prediction = useMemo(
    () => predict(analysis.cycleLengths, analysis.lastStart, analysis.lutealLengths),
    [analysis],
  )

  // Orientation, derived from the log. All null until the log can answer — a
  // fake "day 0" would be the `count ? x : 0` trap.
  const day = cycleDay(log, today)
  const length = avgCycleLength(log)
  const phase = day != null ? phaseOf(day, length, analysis.current.day) : null
  const nextPeriod = nextPeriodEstimate(log, today)
  const untilNext = daysUntilNextPeriod(log, today)

  /**
   * WHAT TO DO, which this page did not say.
   *
   * Zone 1 was four facts and the privacy line — "Day 23 · Luteal · ~2 Nov
   * ±2d · 29 days" — and left the reader to work out that the thing to do was
   * take tomorrow's temperature. `docs/PAGE-ROLLOUT.md` step 6, and Cycle was
   * the last page on the contract without it.
   *
   * It reads the SAME detection engine the pill and the chart read, rather
   * than a second copy of "when did she ovulate".
   */
  const step = nextStep(log, {
    today,
    fertileFrom: analysis.current.fertileFrom,
    fertileTo: analysis.current.fertileTo,
    ovulationDay: analysis.current.day,
    spread: prediction.spread,
  })

  const goal: CycleGoal = data.settings.cycleGoal ?? 'understand'
  const detectedDay = analysis.current.day
  const history = useMemo(() => cycleHistory(log, today), [log, today])

  /**
   * PATTERNS · the fold that makes "does this follow my cycle" answerable.
   *
   * `alignedCycles` re-derives each cycle's ovulation from the same engine the
   * ring reads, rather than storing it — a second copy of "when did she
   * ovulate" is a second thing to keep in step.
   */
  const [align, setAlign] = useStickyState<Align>('cycle.align', 'period', ['period', 'ovulation'])
  const alignedCycles = useMemo<AlignedCycle[]>(() => starts.map((start, i) => {
    const next = starts[i + 1]
    const slice = log.filter((e) => e.date >= start && (next ? e.date < next : true))
    return {
      start,
      end: next ?? addDays(today, 1),
      ovulation: detectOvulation(slice, unit === 'C' ? 'C' : 'F', next).date,
    }
  }), [log, starts, today, unit])
  const grid = useMemo(() => patternGrid(log, alignedCycles, align), [log, alignedCycles, align])
  const gridInsights = useMemo(() => insights(grid, length), [grid, length])
  /** Phase label for any date, shared by the feelings card and mood-by-phase. */
  const phaseOfDate = useMemo(() => (date: string) => {
    const start = [...starts].reverse().find((sx) => sx <= date)
    if (!start) return null
    return phaseOf(dayDiff(start, date) + 1, length, detectedDay).label
  }, [starts, length, detectedDay])

  const feelings = useMemo(
    () => feelingsByPhase(log, phaseOfDate, ['Menstrual', 'Follicular', 'Ovulation window', 'Luteal']),
    [log, phaseOfDate],
  )
  const feelingLines = useMemo(() => feelingNotes(feelings), [feelings])

  const phaseRows = useMemo(() => moodByPhase(log, phaseOfDate), [log, phaseOfDate])
  // The ring follows the MEASURED ovulation when the chart found one, and falls
  // back to the calendar estimate when it did not. The legend's day ranges move
  // with it, which is the intended Stage 4 snapshot change.
  const bands = useMemo(() => phaseBands(length, detectedDay), [length, detectedDay])
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
    /* THE CHART FOLLOWS THE MONTH YOU ARE BROWSING.
     *
     * It used to plot the RUNNING cycle and nothing else, so paging back to
     * August left zone 2 showing August while the whole review — ring, phase,
     * chart — still showed October. That is the other half of "it still needs
     * to be saved for every month": the record was always there (August and
     * September both render their own rows), and what was missing is that
     * nothing except the day editor followed the reader.
     *
     * The cycle plotted is the one containing the selected day, which is the
     * cursor month's day. `bbtLabel` says which cycle it is, because a chart
     * that silently changed which cycle it drew would be worse than one that
     * never moved. */
    const running = history.find((c) => sel >= c.start && sel < addDays(c.start, c.length))
      ?? history[history.length - 1]
    if (running) {
      const span = Math.max(running.length, length ?? 28)
      return {
        bbt: Array.from({ length: span }, (_, i) => {
          const date = addDays(running.start, i)
          const c = log.find((x) => x.date === date)
          return { day: i + 1, temp: c?.temp, flags: c?.flags ?? [], disturbed: c?.tempDisturbed }
        }),
        bbtLabel: `cycle day, from ${prettyDay(running.start)}`,
      }
    }
    return {
      bbt: days.map((d) => {
        const c = log.find((x) => x.date === d)
        return { day: Number(d.slice(8)), temp: c?.temp, flags: c?.flags ?? [], disturbed: c?.tempDisturbed }
      }),
      bbtLabel: `day of ${prettyMonth(ym)}`,
    }
  }, [history, log, days, length, ym, sel])

  // Completed cycles only, for both stats: the one in progress has no length
  // yet, and counting it would make "cycles logged" tick up mid-cycle.
  const finished = history.filter((c) => !c.current)
  const periodLen = avgPeriodLength(history)
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
    data: <CycleDataCard />,
    luteal: (
      <Card band enlargeable title="Your luteal length" subtitle="Shift to period, cycle by cycle — the steadiest number you have" hideInfo>
        <LutealCard lengths={analysis.lutealLengths} />
      </Card>
    ),
    feelings: (
      <Card
        band
        enlargeable
        title="Desire, mood, energy & cravings"
        subtitle="Your logged mood, energy, drive and cravings, averaged by phase"
        hideInfo
      >
        {/* The sentences lead, the grid is the evidence. Someone who wants only
            the answer should not have to decode a matrix to get it. */}
        {feelingLines.length > 0 && (
          <ul className="mb-4 space-y-1">
            {feelingLines.map((l) => (
              <li key={l.key} className="text-body text-fg-1">{l.text}</li>
            ))}
          </ul>
        )}
        <FeelingsCard series={feelings} />
      </Card>
    ),
    drivephase: (
      <Card band enlargeable title="Drive through the cycle" subtitle="Your drive ratings, averaged over each phase of every cycle" hideInfo>
        <DriveByPhase rows={drive} peak={peak} />
      </Card>
    ),
    /* No wrapping `Card`: the manual IS nine cards now, in a deck, and a card
       of cards is the chrome this pass spent 5,435 phone pixels removing. */
    manual: <Manual section={manualSection} />,
    goal: (
      <Card band title="What you are tracking for" subtitle="Picks what this page leads with — nothing is hidden either way" hideInfo>
        <CycleGoalCard
          goal={goal}
          cycles={history.filter((c) => !c.current).length}
          onChange={(g) => setSettings({ cycleGoal: g })}
        />
      </Card>
    ),
    phasefood: (
      <Card band title="This phase" /* The phase name is NOT interpolated here, and that is a trap worth the
             comment: `phase.label.toLowerCase()` in this slot made the React
             Compiler treat `length` — an input to `phaseOf` — as
             possibly-mutated, and refuse to preserve the memoisation of six
             `useMemo`s a hundred lines above. The errors all pointed at
             `length`; none pointed here. The card's body names the phase. */
          subtitle="What tends to help in each phase, and which one you are in" hideInfo>
        <PhaseFoodCard phase={phase?.label ?? null} goal={goal} />
      </Card>
    ),
    grid: (
      <Card band enlargeable title="What lands on which day" subtitle="Every cycle you have logged, folded onto one axis" hideInfo>
        {/* The insights sit ABOVE the grid: the sentence is the finding and the
            grid is the evidence for it. A reader who wants only the answer gets
            it without decoding a heatmap. */}
        {gridInsights.length > 0 && (
          <ul className="mb-3 space-y-1">
            {gridInsights.map((i) => (
              <li key={i.key} className="text-body text-fg-1">{i.text}</li>
            ))}
          </ul>
        )}
        <PatternGrid grid={grid} onAlign={setAlign} avgLength={length} />
      </Card>
    ),
    moodphase: (
      <Card band enlargeable title="Mood & energy by phase" subtitle="Mood and energy you logged, averaged over each phase" hideInfo>
        <MoodByPhase rows={phaseRows} />
      </Card>
    ),
    wheel: (
      <Card band enlargeable title="Where you are" subtitle={`Your four phases, sized by your own ${length ?? 28}-day average`} hideInfo>
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
      <Card band enlargeable title="Cycle length" subtitle={`Your last ${finished.length} finished ${finished.length === 1 ? "cycle" : "cycles"}, against the 21–35 day normal range`} hideInfo>
        <CycleHistoryChart history={history} average={length} />
      </Card>
    ),

    /* Not in the guide group, and that is the whole point: "what is ovulation
       and how do I tell it from the phases either side" was the question, so
       the answer is on the page. The wheel says where you are; this says what
       the narrow green band actually is and why two different signals point at
       it from opposite sides. */
    fertile: (
      <Card band title="Ovulation & the fertile window" subtitle="Where the window sits, and what each of the two signs tells you" hideInfo>
        <FertileWindow bands={bands} length={length ?? 28} />
      </Card>
    ),

    /* The title says the words; the ⓘ says what a *basal* temperature is and
       why a reading taken after you are up is not one. That distinction is the
       difference between a chart with a visible shift and a chart of noise. */
    bbt: (
      <Card band enlargeable title={<Abbr term="BBT">Basal temperature</Abbr>} subtitle={`Every morning reading ${bbtLabel.startsWith("cycle day") ? "of this cycle" : "this month"}, with the shift marked`} hideInfo>
        <BbtChart
          points={bbt}
          unit={unit}
          label={bbtLabel}
          ovulationDay={analysis.current.day}
          fertileFrom={analysis.current.fertileFrom}
          fertileTo={analysis.current.fertileTo}
          confidence={analysis.current.confidence}
        />
      </Card>
    ),

    symptoms: (
      <Card band enlargeable title="Symptom pattern" subtitle="Which cycle day each flag tends to land on" hideInfo>
        <SymptomPattern pattern={pattern} />
      </Card>
    ),

    /* ── Guide · the same shelf the training pages keep. Static reference from
       lib/cycleGuide; titles, bodies and widths all in cycle/Guide.tsx. ── */
    /* Tapping a row selects that day in the editor — the only way to correct
       a field once the day has passed, and the pattern Challenges' day grid
       and REUSABLE-PATTERNS §20 both arrive at: every figure leads back to
       the entries behind it. */
    log: (
      /* NO TITLE. The rail heading six pixels above already says "Your log"
         and names what is in it; printing it again is the same sentence
         twice, which is the fault this page's own history is made of. A
         `Card` with no title renders no header at all. */
      <Card band hideInfo>
        {/* THE CALENDAR BESIDE THE LIST, which is where it was asked for:
            *"what is the use of that staying in this low place? If I click on
            it I need to scroll up and again make the changes."* Exactly
            right, and measured — the calendar was the LAST thing in the act
            column, and tapping a cell selected the day in an editor **~900px
            above it**, inside a panel that is itself a 868px scroller. So the
            one gesture the grid exists for ended in a scroll back up.

            Here both halves share `pickDay`, so a tap opens that day in
            `DayWindow` — a dialog over the page. No scrolling in either
            direction, and the calendar is next to the record it indexes
            rather than under a form.

            Two halves, not two cards: they are one question asked two ways —
            the month at a glance, and every day with everything on it. The
            split is a CONTAINER query because this panel's width is decided
            by the page split and by whether the act is open, never by the
            window (`PAGE-SHAPE.md`). Measured with the act open: **579px at
            1280, 678 at 1440, 854 at 1920** — so `@2xl` (672px) stacks the
            1280 tier, where 19rem of calendar plus a gap would leave the list
            250px, and splits everywhere above it. */}
        <div className="grid gap-x-6 gap-y-5 @2xl/page:grid-cols-[19rem_minmax(0,1fr)]">
          {/* STICKY, AND `self-start` IS WHAT MAKES IT POSSIBLE.
              A grid child stretches to its row by default, so this column was
              **858px of box around 290px of calendar** — a 570px hole beside
              a list that is the taller half by design (ten records, each two
              or three lines). `self-start` shrinks the box to its content and
              is the precondition for `sticky`, which then earns the hole
              back: the calendar is an INDEX, so it should still be there when
              you have scrolled to Oct 9 in the list. Same offset token every
              other sticky in the app uses, so it lands under the header
              rather than behind it.
              Sticky only where the two are side by side — stacked, a sticky
              calendar would pin itself over the list it sits above. */}
          <div className="@2xl/page:sticky @2xl/page:top-[calc(var(--header-h,3.5rem)+1rem)] @2xl/page:self-start">
            {/* Each half says what it is. Without the captions this is a
                calendar next to a list with no statement of how they differ —
                and they do differ: the grid is ONE month, the list is every
                day you have ever logged, newest first. */}
            <p className="mb-1.5 text-label font-medium text-fg-1">{prettyMonth(ym)}</p>
            <CycleMonth
              days={days}
              entries={log}
              selected={sel}
              today={today}
              onSelect={pickDay}
            />
          </div>
          <div className="min-w-0">
            <p className="mb-1.5 text-label font-medium text-fg-1">Everything you logged</p>
            <DayLog
              entries={log}
              unit={unit}
              cycleDayOf={cycleDayOf}
              today={today}
              selected={sel}
              /* Opens the day OVER the list rather than sending the reader to
                 the act column. The month still moves, so closing the window
                 leaves the editor on the day you were just looking at rather
                 than somewhere else. */
              onPick={pickDay}
            />
          </div>
        </div>
      </Card>
    ),

    phases: <PhasesCard />,
    food: <FoodCard />,
  }

  /** What the selected group renders, and what the rail counts. Same predicate
   *  for both, so a card that yields nothing can never leave a heading over an
   *  empty grid or a rail row promising a card that is not there. */
  const idsIn = (g: CycleGroup) => CYCLE_CARDS.filter((c) => c.group === g && cards[c.id] && !(phone && c.chart))
  const shown = idsIn(group)

  /**
   * FIRST RUN · the welcome gates the whole page, not a corner of it.
   *
   * Rendered instead of the page, not above it: the promises are about data
   * that has not been collected yet, so showing a log behind them would make
   * the acknowledgement decorative. `PageLayout` still owns the frame — the
   * brief's rule that no page adds its own container.
   *
   * The check is `!==`, not falsy: a user who accepted version 1 must see
   * version 2 when the promises change. That is what the version is for.
   */
  if (data.settings.cycleDisclaimerAck !== CYCLE_DISCLAIMER_VERSION) {
    // zone1, NOT zone2. Zone 2 is this page's act column, so the welcome
    // first rendered in the right-hand rail beside an empty page — the only
    // thing on screen to read, pushed into a sidebar. Zone 1 spans both
    // columns and the component centres itself within it.
    return (
      <PageLayout
        tier={1180}
        zone1={<CycleWelcome onAccept={(v) => setSettings({ cycleDisclaimerAck: v })} />}
      />
    )
  }

  return (
    <PageLayout
      tier={1180}
      /* `actTop` · THE LOG STARTS AT THE TOP, beside zone 1.
         Asked for directly, and it is the layout Nutrition, Fitness, Strength
         and Recovery already use. (Home Workout, which the ask named, is not
         one of them — it drives its act from a bare `useState`, which
         `PAGE-ROLLOUT.md` says never to do. Filed, not fixed here.)

         The note that stood here said actTop "buys nothing", on the grounds
         that `This cycle` measures 1,306px either way. That was true and it
         answered the wrong question: the ask is about WHERE the thing you
         came to do sits, not how tall the page is. With zone 1 spanning both
         columns the editor starts below a full-width band on every visit.
         It is also what turns zone 1 from a wide shallow bar into a block
         (REUSABLE-PATTERNS §22). */
      actTop
      onSplitChange={logCol.onSplitChange}
      actShut={logCol.shut}
      zone1={phone ? (
        /* ON A PHONE, ONE LINE OF WHERE YOU ARE — the day, the phase, the
           countdown — over a thin bar, then the promise. The four-fact box with
           four ⓘ and a month switcher was ~330px above the log; the month
           moves with the day strip now, and the sentence shows only when it
           asks for something (late or due). Owner: "show the data from the
           top, the focus is the data entry". */
        <div className="cells px-4 py-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-title font-bold text-fg-1 tabular-nums">
              {day ?? '—'} <span className="text-body font-medium text-fg-2">{day != null ? `of ~${length ?? 28} days` : 'not started'}</span>
            </span>
            {phase && <Pill color={phase.color} size="micro" className="px-2">{phase.label} · {analysis.current.confidence}</Pill>}
          </div>
          {day != null && (
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-ink-2" role="progressbar" aria-label="Cycle day against your average" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(100, (day / (length ?? 28)) * 100))}>
              <div className="h-full rounded-pill" style={{ width: `${Math.min(100, (day / (length ?? 28)) * 100)}%`, background: cat(phase?.color ?? 'mauve') }} />
            </div>
          )}
          <p className="mt-1 text-label text-fg-2">
            {nextPeriod && untilNext != null
              ? untilNext === 0 ? 'Period due today' : untilNext > 0 ? `Next period in ${untilNext} days · ~${prettyDay(nextPeriod)}` : `${-untilNext} days late`
              : 'Next period needs two logged periods'}
          </p>
          {(step.id === 'late' || step.id === 'due') && (
            <div className="mt-2"><NextStepBlock text={step.text} tone={STEP_TONE[step.id]} icon={STEP_ICON[step.id]} destination="Log a day" onPick={() => logCol.open()} /></div>
          )}
          <CyclePrivacyLine />
        </div>
      ) : (
        /* Not `StatBar`: three of these four are estimates and the phase is a
           coloured pill, and a bar that renders every value in the mono face
           would spell "Luteal · estimate" in the typewriter. The shape is the
           contract's — one row, at most four facts, spanning both columns. */
        /* ONE BLOCK (§22): the sentence, the four facts and the promise are
           one bordered unit rather than a row with a rule under it — which is
           what `actTop` makes possible, since zone 1 is now a 678px column
           instead of the full 1,180px shell. */
        /* ONE BOX · asked for directly: "for the cycles, could you please merge
           them all into one box?", pasted with the summary strip, the
           sentence and the four facts all in the quote. They were two
           bordered things in two different ZONES saying one thing between
           them — orientation — and the strip sat at the top of the review
           where it read as the first panel.

           Order is how it is asked: what to do, which month you are in, where
           you are today, what the record adds up to, and the promise. The
           same move Recovery made (REUSABLE-PATTERNS §22), which also deleted
           its `SummaryStrip` rather than keeping one in each zone. */
        <div className="rounded-card border border-line bg-ink-0 p-3">
        {/* COLOUR IS URGENCY and nothing else — the edge and the glyph, with
            `fg-1` text, because an accent as text on a wash of itself is the
            calibration trap in CLAUDE.md. And it is a BUTTON into the row
            that elaborates it: a sentence about the fertile window with no
            way to reach the fertile-window card is a sentence that sends you
            looking. */}
        <NextStepBlock
          text={step.text}
          tone={STEP_TONE[step.id]}
          icon={STEP_ICON[step.id]}
          /* `late` and `due` point at the LOG, not at a review row: both ask
             for something to be written down, and the thing that writes is
             the act column. Everything else elaborates, so it points at the
             row that elaborates it. */
          destination={step.id === 'late' || step.id === 'due' ? 'Log a day' : GROUP_LABEL[step.group]}
          onPick={step.id === 'late' || step.id === 'due'
            ? () => logCol.open()
            : () => setGroup(step.group)}
        />
        {/* THE MONTH, where the thing it changes is. It was in the app
            header, two zones away from the only controls it affects. */}
        <div className="mb-2 flex items-center gap-1 border-b border-line pb-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="grid h-8 w-8 place-items-center rounded-control text-fg-2 transition-colors hover:bg-ink-2 hover:text-fg-1"
          >
            <Icon as={CaretLeft} size="sm" />
          </button>
          <span className="num min-w-[9ch] text-center text-body text-fg-1">{prettyMonth(ym)}</span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className="grid h-8 w-8 place-items-center rounded-control text-fg-2 transition-colors hover:bg-ink-2 hover:text-fg-1"
          >
            <Icon as={CaretRight} size="sm" />
          </button>
          {!thisMonth && (
            <button
              type="button"
              onClick={() => setMonth(todayISO().slice(0, 7))}
              className="ml-auto text-label text-mauve underline underline-offset-2 hover:text-fg-1"
            >
              Back to today
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
          <Fact label={<>Cycle day<InfoTip tip="cycle-day" onMore={showManual} /></>} value={day != null ? <span className="num text-heading font-medium text-fg-1">{day}</span> : <span className="text-body text-fg-2">not started</span>} />
          {/* The pill now says HOW it knows, not just what it thinks.
              "estimate" is the calendar; "likely" means a temperature shift was
              read in this cycle; "confirmed" means a second sign agreed with it.
              A page that says "Luteal" identically whether it measured anything
              or not is a page that cannot be trusted when it did. */}
          <Fact
            label={<>Phase<InfoTip tip="confidence" onMore={showManual} /></>}
            value={phase
              ? (
                <Pill color={phase.color} size="micro" className="px-2">
                  {phase.label} · {analysis.current.confidence}
                </Pill>
              )
              : <span className="text-body text-fg-2">—</span>}
          />
          <Fact
            label={<>Next period<InfoTip tip="next-period" onMore={showManual} /></>}
            value={nextPeriod
              ? (
                <span className="text-body text-fg-1">
                  {/* THE COUNTDOWN IS THE HEADLINE, in the same weight as the
                      cycle day beside it. "in 10d" was `text-label text-fg-2`
                      — the smallest, quietest thing in the box — and it is
                      the one figure on this page a reader checks daily.
                      Asked for as "next period, show that in highlight… the
                      digits in a big font size so the user can understand
                      what they are going through."

                      The DATE stays small underneath it. A date is a lookup;
                      a countdown is the answer. */}
                  {untilNext != null && (
                    <span className="block">
                      <span className="num text-heading font-medium text-fg-1">
                        {untilNext === 0 ? 'today' : Math.abs(untilNext)}
                      </span>
                      {untilNext !== 0 && (
                        <span className="ml-1 text-label text-fg-2">
                          {untilNext > 0 ? 'days away' : 'days late'}
                        </span>
                      )}
                    </span>
                  )}
                  <span className="text-label text-fg-2">~{prettyDay(nextPeriod)}</span>
                  {/* A RANGE, not a promise. The spread is the personal
                      standard deviation, floored at a day and widened further
                      when the log is irregular — narrowing a prediction the
                      data does not support is the failure mode here. */}
                  {prediction.spread > 0 && (
                    <span className="ml-1 text-label text-fg-2">±{prediction.spread}d</span>
                  )}
                  {prediction.early && <span className="ml-1.5 text-label text-fg-2">· early estimate</span>}
                </span>
              )
              : <span className="text-body text-fg-2">needs two periods</span>}
          />
          <Fact
            label={<>Your average<InfoTip tip="your-average" onMore={showManual} /></>}
            value={length != null
              ? <span className="text-body text-fg-1"><span className="num font-medium">{length}</span> days</span>
              : <span className="text-body text-fg-2">—</span>}
          />
        </div>
        {/* THE THREE TOTALS, which were a `SummaryStrip` at the top of zone
            3. They are orientation, not record — "how much do I have" is the
            same question as "where am I", asked of the whole log instead of
            today — so they belong in this box and not at the head of the
            review, where the strip read as the first panel. */}
        {/* Not on a phone: three totals to read, above the day you came to
            log — the log moved up ~110px without them. */}
        {!phone && <div className="mt-3 border-t border-line pt-3">
          <SummaryStrip items={[
            { label: 'Cycles logged', value: finished.length, empty: finished.length === 0 },
            { label: 'Avg period', value: periodLen != null ? `${periodLen} days` : '—', empty: periodLen == null },
            { label: 'Temp shift', value: shift != null ? `seen · ${shift}°` : 'not yet', empty: shift == null },
          ]} />
        </div>}

        {/* The promise, kept in view. It was made once on a screen the user
            saw before they had any data; this is where it stays true. */}
        <CyclePrivacyLine />
        </div>
      )}
      zone2={logCol.shut ? (
        /* Shut, the act is a 40px rail and the review takes the width back —
           and stacked, `layout.css` lays the same button down into a 44px bar
           rather than a tower of rotated text. The summary names the day it
           would open on, because a shut panel with no summary is a mystery. */
        <ActStrip
          label="Log a day"
          summary={selEntry?.temp != null ? `${prettyDay(sel)} · logged` : prettyDay(sel)}
          onOpen={logCol.open}
        />
      ) : (
        <Card
          band
          title="Log a day"
          /* IT SAYS WHICH MONTH IT IS WRITING TO.
             The month cursor lives in the app header, far from this card, so
             a reader who paged back to August was editing August with nothing
             here saying so — while zone 1 still read "Cycle day 20", because
             that fact is about today and should not move. Naming the month
             here is what makes the two honest together, and it is half of the
             "it still needs to be saved for every month" report: the entries
             were always saved, and nothing said which month you were in. */
          subtitle={phone ? undefined : thisMonth
            ? 'Tap a day, set a temperature, flag what happened, rate the drive'
            : `Writing to ${prettyMonth(ym)} — not this month`}
          hideInfo
          /* THE HINT IS DRAWN, not left in a `title` (§27). A phone cannot
             hover, and an affordance nobody finds is an affordance nobody
             uses — which is how this page shipped with no way to put the
             editor away at all. In `right` rather than wrapped around the
             heading because `Card` already owns the header row and already
             names its own controls after the card. */
          right={
            <div className="flex items-center gap-3">
            {!thisMonth && (
              <button
                type="button"
                onClick={() => setMonth(todayISO().slice(0, 7))}
                className="shrink-0 text-label text-mauve underline underline-offset-2 hover:text-fg-1"
              >
                Back to today
              </button>
            )}
<ActHide what="the log" onHide={logCol.close} />
            </div>
          }
        >
          {/* THE DAY, picked where it is logged: the shared strip, a period dot
              or the temperature under each day. It was the calendar under
              "Your log" in the review — a scroll away from this editor. */}
          {phone && (
            <div className="mb-3">
              <DayStrip value={sel} onChange={(d) => { setMonth(d.slice(0, 7)); setSelected(d) }} today={today} label="Day to log"
                mark={(d) => {
                  const e = log.find((x) => x.date === d)
                  if (e?.flags.includes('period')) return <span style={{ color: cat('red') }}>●<span className="sr-only"> period</span></span>
                  return e?.temp != null ? <>{e.temp}<span className="sr-only"> degrees</span></> : <span aria-hidden>·</span>
                }} />
            </div>
          )}
          <DayEditor
            date={sel}
            entry={selEntry}
            unit={unit}
            cycleDay={cycleDayOf(sel)}
            onTemp={(temp) => setCycle(sel, { temp })}
            onToggleFlag={(f) => toggleFlag(sel, f)}
            onDrive={(drive) => setCycle(sel, { drive })}
          />

          {/* The optional half, folded. The fast path above is unchanged:
              temperature, five flags, drive — the ten-second habit this page
              was built around stays exactly as long. */}
          <DayMore entry={selEntry} onPatch={(patch) => setCycle(sel, patch)} fertilityFirst={goal === 'conceive'} />

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
          {/* WHERE THE OTHER TWO THINGS ARE.
              Asked directly: "where is the history and how can I edit it? How
              it works?" Both exist and neither is reachable from the card you
              are standing in — `Your log` and `Manual` are rail rows in the
              review, and a reader logging a temperature has no reason to look
              there. Two buttons, in the act, where the question is asked.

              Real buttons and not links: they move the rail, which is state
              on this page rather than a destination. */}
          {/* The strip above picks the day on a phone; this says where the days are on a desktop. */}
          {!phone &&           <p className="mt-3 border-t border-line pt-2 text-label text-fg-2">
            {/* "Tap any day below to edit it" went when the calendar did.
                There is nothing below this line to tap any more, and the
                sentence now says where the days ARE — which is the half of
                the original report this paragraph was written for: *"where is
                the history and how can I edit it?"* */}
            <button
              type="button"
              onClick={() => setGroup('log')}
              className="text-mauve underline underline-offset-2 hover:text-fg-1"
            >
              Your log
            </button>{' '}
            has the calendar and every day you logged — tap any day there to edit
            it, in a window. And{' '}
            <button
              type="button"
              onClick={() => setGroup('manual')}
              className="text-mauve underline underline-offset-2 hover:text-fg-1"
            >
              the manual
            </button>{' '}
            says how the page works.
          </p>}

          {/* THE CALENDAR IS NOT HERE, AND THAT IS THE POINT.
              It shipped at the BOTTOM of this column, under the editor, the
              optional panel and the legend — so a tap on a cell selected the
              day in a form **~900px above it**, inside a panel that is itself
              an 868px scroller. Reported exactly: *"what is the use of that
              staying in this low place? If I click on it I need to scroll up
              and again make the changes."*

              It lives beside `Your log` now, where a tap opens that day in
              `DayWindow` — a dialog over the page, so the gesture ends where
              it started. This column keeps what it is for: **today**. The
              editor opens on today and writes to today, and any other day is
              a day you are correcting, which is a review job.

              Measured on the move: this card **938px → 652px** against its
              868px sticky cap, so the act stops scrolling inside a scrolling
              page for the first time since it gained a column. */}
        </Card>
      )}
      zone3={
        <>
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
                /* The count is what the READER meets, not how many entries
                   the registry has: `manual` is one card holding a nine-card
                   deck, and a row saying "1" above a deck saying "1 of 9" is
                   two true figures reading as a contradiction. */
                groups={CYCLE_GROUPS.map((g) => ({
                  id: g,
                  label: GROUP_LABEL[g],
                  count: idsIn(g).reduce((n, c) => n + panelsIn(c), 0),
                }))}
                value={group}
                onChange={(id) => setGroup((id as CycleGroup | null) ?? DEFAULT_GROUP)}
              />
              {/* A SECOND `@container/page`, on the panel rather than on the
                  zone. The outer one is what the rail's own
                  `@4xl/page:grid-cols-[11rem_…]` asks, and it is the width of
                  zone 3 INCLUDING the 11rem rail and the 2rem gap — so a
                  `StatGrid` step resolved against it is asking about a box
                  208px wider than the grid it sizes. Nested containers of the
                  same name resolve to the nearest ancestor, so the steps now
                  measure the panel they are actually laying out. */}
              <div className="@container/page min-w-0">
                <section data-domain={group}>
                  <div className="mb-3 flex flex-wrap items-baseline gap-x-3 border-b border-line pb-1.5">
                    <h2 className="text-heading font-medium text-fg-1">{GROUP_LABEL[group]}</h2>
                    <p className="text-label text-fg-2">{GROUP_BLURB[group]}</p>
                    <span className="num ml-auto text-label text-fg-3">{shown.length}</span>
                  </div>
                  {/* `StatGrid`, because this column's width is decided by
                      the page split and by whether the act is open — never by
                      the window. `CardGrid` asks the viewport, which was wrong
                      twice over: at 1600 its `2xl:grid-cols-3` fired inside a
                      722px split column and resolved to three tracks of
                      **227px**, and the `2xl:grid-cols-2` pinned here to stop
                      that then capped the panel at two tracks forever — so
                      putting the act away bought width nothing spent. COD-247.

                      `steps="pair"`: these are rings, diagrams and short
                      legends, not stat tiles, so the 450px floor would have
                      made the 846px panel a single column — and two is the
                      ceiling because no group here has more than two cards
                      that are not full-width. */}
                  {DECK_GROUPS.includes(group) ? (
                    <CardDeck
                      label={`${GROUP_LABEL[group]} cards`}
                      items={shown.map((c) => ({
                        key: c.id,
                        title: c.title,
                        // Still a `data-card`, because the registry contract
                        // test reads that set back in both directions and a
                        // card that changes how it is laid out must not
                        // change whether it can be found.
                        node: <div data-card={c.id} className="min-w-0">{cards[c.id]}</div>,
                      }))}
                    />
                  ) : (
                    <StatGrid steps="pair">
                      {shown.map((c) => (
                        <div key={c.id} data-card={c.id} className={c.wide ? `min-w-0 ${SPAN_PANEL}` : 'min-w-0'}>{cards[c.id]}</div>
                      ))}
                    </StatGrid>
                  )}
                </section>
              </div>
            </div>
          </div>

          {/* Outside the rail, and deliberately: a medical disclaimer behind a
              row you have to select is a disclaimer most readers never meet. It
              was always visible under the guide shelf and it stays that way. */}
          {/* THE DAY, OVER THE LIST. It hosts `DayEditor` and `DayMore` —
              the act column's own controls — rather than re-declaring them,
              which is the fault this week's Pickleball fix was about. */}
          <DayWindow
            date={windowDay}
            entry={windowDay ? log.find((x) => x.date === windowDay) : undefined}
            unit={unit}
            cycleDay={windowDay ? cycleDayOf(windowDay) : null}
            fertilityFirst={goal === 'conceive'}
            onClose={() => setWindowDay(null)}
            onTemp={(temp) => windowDay && setCycle(windowDay, { temp })}
            onToggleFlag={(fl) => windowDay && toggleFlag(windowDay, fl)}
            onDrive={(drive) => windowDay && setCycle(windowDay, { drive })}
            onPatch={(patch) => windowDay && setCycle(windowDay, patch)}
          />

          <p className="mt-4 inline-flex items-start gap-1.5 rounded-card bg-red/10 p-2 text-label text-fg-2">
            <Icon as={ShieldWarning} size="sm" className="mt-0.5 shrink-0 text-red" /> {CYCLE_DISCLAIMER}
          </p>
        </>
      }
    />
  )
}

/** One zone-1 fact. Local because its value is a node, not a formatted string. */
function Fact({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-caption uppercase tracking-wide text-fg-2">{label}</p>
      <div className="mt-0.5">{value}</div>
    </div>
  )
}
