import { useMemo } from 'react'
import { ArrowCounterClockwise, CaretRight, Clock, Flame, Heart, Lifebuoy, Target, Trophy, Warning } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState, type ReactNode } from 'react'
import { useJournal } from '../store'
import { cat, onAccent } from '../lib/colors'
import { todayISO } from '../lib/date'
import { streakStats, urgesByType, moneySaved } from '../lib/streak'
import { streakVsBest, comebackStatus, urgeHourHistogram, peakUrgeHour, relapseWeekdayPattern, peakRelapseWeekday, urgeConversion, paceToRecord, urgeFrequencyTrend, streaksSaved, intensityStats, cleanRollup, timeReclaimed, recordApproach, urgeQuietStretch, urgesLabelled, urgeLabelCoverage } from '../lib/urge'
import { lapseCountOn, hasLapseQuantity, lapseByWeekday, peakLapseWeekday, lapseTrend, lapseProfile } from '../lib/lapse'
import { ActStrip, NextStepBlock, PageLayout, SummaryStrip, useActColumn } from '../components/page'
import { useStickyState } from '../lib/useStickyState'
import { GROUPS, GROUP_LABEL, DEFAULT_GROUP, type Group } from '../lib/recoveryCards'
import { feedbackLedger } from '../lib/recoveryFeedback'
import { recoveryStep } from '../lib/recoveryStep'
import { RecoveryReview } from '../components/recovery/Review'
import {
  StreakRingCard,
  FeedbackLedgerCard,
  UrgeSurfingCard,
  LogResetCard,
  StreakVsBestCard,
  SelfEfficacyCard,
  StreaksSavedCard,
  TimeReclaimedCard,
  MoneySavedCard,
  CalmStretchCard,
  UrgeTrendCard,
  UrgeIntensityCard,
  CleanRollupCard,
  HighRiskHoursCard,
  RiskiestDaysCard,
  TriggerPatternsCard,
  DayTallyCard,
  LapseCountCard,
  AddictionBreakdownCard,
  UrgeMixCard,
  AddictionStreaksCard,
  CommitmentCard,
  TriggerPlansCard,
  TechniquesBlock,
  LadderBlock,
  ResetHistoryBlock,
  PairedSparkline,
  SosOverlay,
  type DayTallyRow,
} from '../components/recovery'

/**
 * Streak (abstinence) hub · a progress-ring hero to the next milestone, the two
 * logging acts, and a review zone whose twenty panels are reached through a rail
 * instead of scrolled past. Private, local-only.
 *
 * **Zone 3 was three folds and all three shipped shut** — "Setup", "Deep
 * analytics", "Reference". `npm run space -- nofap` measured **1.9 shipped
 * against 4.8 open** on desktop and 4.8 against 8.2 on a phone: nearly three
 * screens of content on a page that was not showing it, which is what the report
 * "the right-hand side looks like it's not modernised" was describing.
 * `lib/recoveryCards.ts` is the registry now and the rail renders from it, so the
 * four groups the reader is offered and the four groups the page has are the same
 * four words. `views/NoFap.test.tsx` asserts that in both directions.
 *
 * What is NOT here any more: every panel body, and both zone-2 forms. They live
 * in `components/recovery/` — see its README for the change → file table. This
 * file derives the numbers, owns the rail state, and wires the three zones. It
 * was **929 lines**; the ceiling in `CLAUDE.md` is 500 and the target ~300.
 */
export function NoFap() {
  const { data, logLapseDay, setStreakCost } = useJournal()
  const currency = data.settings.currencySymbol || '$'
  const [sosOpen, setSosOpen] = useState(false)
  const [hoursPerDay, setHoursPerDay] = useState(1) // #344 reclaimed-time rate (view-local)
  const [q, setQ] = useState('')
  /* Sticky, because the three folds this replaces each carried a `stickyKey`
     (`recovery.setup`, `recovery.analytics`, `recovery.reference`) — dropping
     the persistence would be a regression dressed as a redesign. One key now
     instead of three, because the rail is single-select where three folds were
     three independent booleans. */
  const [group, setGroup] = useStickyState<Group>('recovery.group', DEFAULT_GROUP, GROUPS)
  /*
    STACKED, THE ACT STARTS SHUT (§23).

    Measured on this page at `?demo=1`: the act column is **2,822px on a 390px
    phone** — a ring, an urge form, a day tally and a reset form — against a
    2,019px review, and the page came to **5,116px / 6.06 screens**. Below the
    split that column is the whole width of the page, so the record is six
    screens down and the rail that reaches it is below *that*.

    Wide it stays open, where it is a column beside the review and open is
    right. The sticky key means a choice, once made, holds.
  */
  const logCol = useActColumn('recovery')

  const s = data.nofap
  const plans = s.plans ?? []
  const today = todayISO()
  const stats = streakStats(data, today)
  /** The one sentence zone 1 opens with. Total — see `lib/recoveryStep.ts`. */
  const step = recoveryStep(data, today)
  /** Both sides of each addiction, signed. See lib/recoveryFeedback.ts. */
  const ledger = useMemo(() => feedbackLedger(data), [data])
  const vsBest = streakVsBest(stats.current, stats.best)
  const comeback = comebackStatus(s.relapses, s.startedOn, today)
  const byType = urgesByType(data)
  const relapsedToday = s.relapses.some((r) => r.date === today)
  const nextBenefit = stats.next
  // #114 high-risk hour heatmap · #263 weekday relapse pattern · #76 conversion · #298 pace
  const hourHist = urgeHourHistogram(s.urgeLog ?? [])
  const peakHour = peakUrgeHour(s.urgeLog ?? [])
  const weekdayPattern = relapseWeekdayPattern(s.relapses)
  const peakWeekday = peakRelapseWeekday(s.relapses)
  const conversion = urgeConversion(s.urgeLog ?? [], s.relapses, s.urgesResisted ?? 0)
  const pace = paceToRecord(stats.current, stats.best, today)
  // #348 urge frequency trend · #334 streaks saved · #74 intensity · #322 clean rollup
  const urgeTrend = urgeFrequencyTrend(s.urgeLog ?? [], 8, today)
  const saved = streaksSaved(s.urgeLog ?? [], s.urgesResisted ?? 0, today)
  const intensity9 = intensityStats(s.urgeLog ?? [])
  const rollup = cleanRollup(s.relapses, s.startedOn, today)
  // #344 time reclaimed · #321 record-approach · urge-quiet stretch
  const reclaimed = timeReclaimed(stats.totalClean, hoursPerDay)
  const approach = recordApproach(stats.current, stats.best)
  const quiet = urgeQuietStretch(s.urgeLog ?? [], today)
  const APPROACH_COPY: Record<typeof approach.tier, { color: string; text: string } | null> = {
    record: null, far: null,
    near: { color: 'peach', text: `Closing in · ${approach.daysToBeat} day${approach.daysToBeat === 1 ? '' : 's'} from your all-time best. Hold the line.` },
    close: { color: 'peach', text: `So close · just ${approach.daysToBeat} day${approach.daysToBeat === 1 ? '' : 's'} from a new personal record. Don't trade it away now.` },
    edge: { color: 'red', text: `One day from your record. Whatever the urge offers, it isn't worth your best streak ever. Ride it out.` },
  }
  const approachCopy = APPROACH_COPY[approach.tier]
  // #123 money saved · clean days × the primary streak's cost/day
  const savedMoney = moneySaved(stats.totalClean, s.costPerDay)
  // Day log · one tally row per tracked thing, "how many times today".
  const addictions = s.addictions ?? []
  const tallyRows: DayTallyRow[] = [
    { id: null, name: 'Main streak', count: lapseCountOn(s.relapses, today) },
    ...addictions.map((a) => ({ id: a.id, name: a.name, count: lapseCountOn(a.relapses, today), unit: a.unit })),
  ]
  /**
   * Only the streaks where a quantity was actually recorded get a "how many"
   * card. A streak whose every lapse day is a bare `count ?? 1` would draw
   * seven bars of 1 — a picture of the default value, not of anything the user
   * did — and `hasLapseQuantity` is the one gate that keeps it off the page.
   * `flatMap` rather than `filter`, so `peak` narrows instead of being asserted.
   */
  const countedStreaks = [
    // Keyed by id, not name: nothing stops an addiction being called "Main
    // streak", and two cards under one React key is a silent render bug.
    { key: 'primary', name: 'Main streak', relapses: s.relapses },
    ...addictions.map((a) => ({ key: a.id, name: a.name, relapses: a.relapses })),
  ].flatMap((t) => {
    const peak = hasLapseQuantity(t.relapses) ? peakLapseWeekday(t.relapses) : undefined
    return peak
      ? [{ key: t.key, name: t.name, peak, byWeekday: lapseByWeekday(t.relapses), trend: lapseTrend(t.relapses, 8, today) }]
      : []
  })

  /**
   * "How much · on what days · at what times", per tracked addiction.
   *
   * One row per entry in `s.addictions` — NOT the primary streak, which has no
   * name for the urge log to match and is already what every pooled card on
   * this page measures. The three questions were each answered pooled before
   * this, or not at all, and a pooled weekday peak is the average of two
   * different problems.
   *
   * The clock is the **urge** log filtered by label, because `Relapse` has a
   * date and no time — `urgesLabelled` is the only join `types.ts` offers and
   * `coverage` is the denominator the card prints. See COD-251.
   */
  const urgeLog = s.urgeLog ?? []
  const labelCoverage = urgeLabelCoverage(urgeLog, addictions.map((a) => a.name))
  const breakdowns = addictions.map((a) => {
    const mine = urgesLabelled(urgeLog, a.name)
    return {
      key: a.id,
      profile: lapseProfile(a.name, a.relapses, today),
      hourHist: urgeHourHistogram(mine),
      peakHour: peakUrgeHour(mine),
      urges: mine.length,
    }
  })

  /**
   * Every panel in zone 3, by the id the registry knows it under.
   *
   * A panel whose data cannot support it is `false` here rather than an empty
   * box; the renderer below skips those, so an absent panel never leaves a group
   * heading over nothing — and the rail's count never promises one.
   */
  const all: Record<string, ReactNode> = {
    feedback: <FeedbackLedgerCard ledger={ledger} />,
    streakvsbest: <StreakVsBestCard vsBest={vsBest} comeback={comeback} pace={pace} approachCopy={approachCopy} />,
    selfefficacy: conversion.total > 0 && <SelfEfficacyCard conversion={conversion} />,
    streakssaved: saved.saved > 0 && <StreaksSavedCard saved={saved} />,
    timereclaimed: stats.totalClean > 0 && (
      <TimeReclaimedCard reclaimed={reclaimed} totalClean={stats.totalClean} hoursPerDay={hoursPerDay} onHoursPerDayChange={setHoursPerDay} />
    ),
    moneysaved: <MoneySavedCard currency={currency} costPerDay={s.costPerDay} savedMoney={savedMoney} totalClean={stats.totalClean} onCostChange={setStreakCost} />,
    calmstretch: !quiet.empty && quiet.days >= 1 && <CalmStretchCard quiet={quiet} />,
    addictions: <AddictionStreaksCard />,

    urgetrend: urgeTrend.total > 0 && <UrgeTrendCard urgeTrend={urgeTrend} />,
    intensity: intensity9.rated > 0 && <UrgeIntensityCard intensity9={intensity9} />,
    cleanrollup: rollup.totalWeeks > 0 && <CleanRollupCard rollup={rollup} />,
    riskhours: peakHour && <HighRiskHoursCard hourHist={hourHist} peakHour={peakHour} />,
    riskdays: peakWeekday && <RiskiestDaysCard weekdayPattern={weekdayPattern} peakWeekday={peakWeekday} />,
    /* "How many", beside "how often" · the same weekday chart answering a
       different question, so they read as one pair rather than two variants.
       One registry id for the whole set: how many counted streaks there are is
       the user's data, not the registry's. */
    lapsecounts: countedStreaks.length > 0 && (
      <>{countedStreaks.map((t) => (
        <LapseCountCard key={t.key} name={t.name} byWeekday={t.byWeekday} peak={t.peak} trend={t.trend} />
      ))}</>
    ),
    /* Each tracked addiction on its own, answering all three questions. Gated
       on there being one: with no separate addiction the page's pooled cards
       already are the per-addiction view, and a heading over nothing is the
       failure mode of grouping. */
    addictionbreakdown: breakdowns.length > 0 && (
      <>{breakdowns.map((b) => (
        <AddictionBreakdownCard key={b.key} profile={b.profile} hourHist={b.hourHist} peakHour={b.peakHour} urges={b.urges} coverage={labelCoverage} />
      ))}</>
    ),
    triggers: stats.topTriggers.length > 0 && (
      <TriggerPatternsCard topTriggers={stats.topTriggers} relapseCount={stats.relapseCount} avgGap={stats.avgGap} />
    ),
    urgemix: byType.length > 0 && <UrgeMixCard byType={byType} />,

    commitment: <CommitmentCard />,
    triggerplans: <TriggerPlansCard />,

    techniques: <TechniquesBlock plans={plans} next={nextBenefit} daysToNext={stats.daysToNext} />,
    ladder: <LadderBlock current={stats.current} next={nextBenefit} />,
    resets: <ResetHistoryBlock relapses={s.relapses} />,
  }


  return (
    <>
      {/* Panic / SOS · floating button + full-screen ride-it-out overlay.
          Outside the zones on purpose: it is a fixed-position lifeline that has
          to be reachable from anywhere on the page, which is exactly the case
          the three-zone rule is not about. */}
      <button onClick={() => setSosOpen(true)} aria-label="Panic, open urge SOS"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-pill px-4 py-3 text-body font-medium shadow-lg transition-transform hover:scale-105"
        style={{ background: cat('red'), color: onAccent(cat('red')), boxShadow: `0 6px 24px ${cat('red')}55` }}>
        <Icon as={Lifebuoy} size="md" /> SOS
      </button>
      {sosOpen && <SosOverlay plans={plans} onClose={() => setSosOpen(false)} />}

      <PageLayout
        /* **1180 and split, measured against Insights' 1440 + `stacked`.**
           The obvious reading of "make it look like Insights" is to copy its
           tier, and with the rail in place the wide stacked layout does deliver
           the width: the rail goes vertical (176px + a 1110px pane), the cards
           go 350px → 545px, the summary strip 235 → 434. It also takes the page
           from **1.7 screens to 3.3** (1181px → 2399px), because `stacked`
           turns `max(act, review)` into `act + review` and this page's act zone
           is **1296px** — a ring, a day tally and two forms. Insights can stack
           because its act zone is a 291px search box.

           So the Insights result does not generalise to a page with a real act
           zone, and `docs/PAGE-WORKFLOW.md`'s "stacking does not work" entry
           survives the rail. The cost is that zone 3 is 722px, under
           `MasonryGrid`'s `@3xl` container step — which is exactly why the pane
           below uses `CardGrid`. */
        tier={1180}
        onSplitChange={logCol.onSplitChange}
        actShut={logCol.shut}
        zone1={
          /* ONE BLOCK: the sentence, then the four facts.

             Zone 1 was the `StatBar` alone — **53px of four figures** on the
             page with the most to say. "47 days clean" and "personal best 61"
             are two numbers a reader has to subtract before either means
             anything, and the subtraction IS the headline: *you are fourteen
             days from your record*. Every other page on this contract already
             had its sentence; `docs/PAGE-ROLLOUT.md` listed Recovery's as
             missing and it stayed missing through the rail pass.

             COLOUR MEANS URGENCY and nothing else — in the left edge and the
             icon, with `fg-1` text, because an accent as text on a wash of
             itself is the calibration trap in CLAUDE.md.

             It is a BUTTON into the rail row that elaborates it: a sentence
             about when urges land, with no way to reach the card about when
             urges land, is a sentence that sends you looking. */
          <div className="rounded-card border border-line bg-ink-0 p-3">
            {(() => {
              const tone = {
                first: 'mauve', reset: 'peach', edge: 'red', close: 'peach',
                record: 'green', quiet: 'green', resisting: 'teal', steady: 'teal',
              }[step.id]
              const StepIcon = {
                first: Lifebuoy, reset: ArrowCounterClockwise, edge: Warning, close: Target,
                record: Trophy, quiet: Heart, resisting: Clock, steady: Flame,
              }[step.id]
              return (
                <NextStepBlock
                  text={step.text}
                  tone={tone}
                  icon={StepIcon}
                  destination={GROUP_LABEL[step.group]}
                  onPick={() => { setGroup(step.group); setQ('') }}
                />
              )
            })()}
            {/* THE RING LIVES HERE NOW, not in zone 2.

                It and the `StatBar` under it were saying the same three things
                — days clean, personal best, next milestone — once as a 160px
                hero in the act column and once as a row of figures at the top
                of the page, in two different zones. Reported as "get them all
                into one card on the left side, I need to waste the space", and
                the duplication is exactly why the space was being wasted.

                `bare`, because this block is already a card. */}
            <StreakRingCard
              stats={stats}
              relapsedToday={relapsedToday}
              startedOn={s.startedOn}
              bare
            />
          </div>
        }
        zone2={logCol.shut ? (
          <ActStrip
            label="Log an urge or a reset"
            summary={relapsedToday ? 'Reset logged today' : `${stats.current} days clean`}
            onOpen={logCol.open}
          />
        ) : (<>
        {/* THE TITLE IS THE TOGGLE, and it says so (§27). A heading that is
            secretly a button is a feature nobody finds, and the `title` it
            would otherwise rely on does not exist on a phone. */}
        <h2 className="text-heading font-medium text-fg-1">
          <button
            type="button"
            onClick={logCol.close}
            aria-expanded
            title="Hide the log — the review takes the width"
            className="group flex w-full items-center justify-between gap-2 text-left transition-colors hover:text-fg-2"
          >
            Log an urge or a reset{' '}
            <span className="inline-flex shrink-0 items-center gap-1 text-label font-normal text-fg-2 group-hover:text-fg-1">
              Tap to hide
              <Icon as={CaretRight} size="sm" />
            </span>
          </button>
        </h2>

        {/* ZONE 2 IS ORDERED BY HOW OFTEN THE ACT HAPPENS, not by how bad it is.
            `PRODUCT.md` ranks capture as the product, and on this page the
            frequent capture is "I felt an urge and rode it out" — many times a
            day during a streak. A lapse tally and a reset are rare by
            definition. Urge surfing was third, and its submit sat under its own
            four field groups, so the most-repeated act on the page was the one
            furthest from the top: **y 1613 in an 844px phone viewport**, and
            1130px inside a 760px scrollport at 1440.

            The cost, stated: `DayTallyCard` moves down by the height of the
            urge card. It is one tap either way and it is still the second thing
            in the column; the alternative — keeping the tally first and
            accepting that the frequent act needs a scroll — is the arrangement
            the report was about. */}
        <UrgeSurfingCard />

        {/* Day log · "it happened today", with a number on it.
            Second, not third: the quantity-blind version of it used to live
            three screens down as the per-addiction `Reset` button, in zone 3
            behind the signature chart, which is not where you press anything on
            a bad day. */}
        <DayTallyCard rows={tallyRows} onStep={logLapseDay} />

        <LogResetCard best={stats.best} totalClean={stats.totalClean} />
        </>)}
        zone3={
          <RecoveryReview
            group={group}
            onGroup={setGroup}
            q={q}
            onQ={setQ}
            cards={all}
            signature={<>
            {/* THE RECORD, IN THE REVIEW — out of the top bar.

                These four were in zone 1 beside the ring, which made the top
                bar **227px desktop and 461px on a phone** before a word of the
                record. They are not orientation: "what do I do now" is the
                sentence and "how long" is the ring, and `Personal best`,
                `Total clean days`, `Resets` and `Urges logged` are all things
                you read ABOUT the record rather than to decide anything. They
                are not a duplicate here either, which is what they were before
                the ring moved up — zone 1 no longer prints any of them. */}
            <SummaryStrip items={[
              { label: 'Personal best', value: stats.best, suffix: 'd', empty: stats.best === 0 },
              { label: 'Total clean days', value: stats.totalClean, empty: stats.totalClean === 0 },
              { label: 'Resets', value: s.relapses.length, empty: s.relapses.length === 0 },
              { label: 'Urges logged', value: stats.urges, empty: stats.urges === 0 },
            ]} />
        {/* THE SUMMARY STRIP IS GONE, and it went for the reason the hero
            moved: it printed `Total clean days`, `Resets` and `Urges logged`
            two inches under a zone-1 block that now prints the same three.
            Moving the ring up without taking this out would have traded one
            duplication for another — which is what the first attempt did, and
            the page grew by 185px for it.

            The three facts live in zone 1, beside the ring, where they are the
            context for the number rather than a second copy of it. */}

        {/* SIGNATURE VISUAL · urges resisted against resets, week by week.
            Above the rail and outside the registry, so it is on screen whichever
            group is selected — `docs/PAGE-SHAPE.md`: "Summary, the signature
            visual, then the list".

            The brief specified a paired sleep + soreness sparkline here, on the
            assumption that Recovery meant physical recovery. In this app it is
            abstinence recovery, and there is no soreness field in the data model
            at all — so the pairing that would have been invented is replaced by
            the correlation this page actually exists to reveal: whether
            resisting urges is holding the resets down. */}
        <section>
          <h2 className="mb-1 border-b border-line pb-1 text-label text-fg-2">Urges logged vs resets</h2>
          <PairedSparkline weeks={urgeTrend.weeks} relapses={s.relapses} />
        </section>

            </>}
          />
        }
      />
    </>
  )
}
