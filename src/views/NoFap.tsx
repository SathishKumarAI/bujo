import { useMemo } from 'react'
import { ArrowCounterClockwise, Clock, Flame, Heart, Lifebuoy, Target, Trophy, Warning } from '@/components/icons'
import { useDevice } from '../components/shell/device'
import { useState, type ReactNode } from 'react'
import { useJournal } from '../store'
import { todayISO } from '../lib/date'
import { streakStats, urgesByType, moneySaved } from '../lib/streak'
import { streakVsBest, comebackStatus, urgeHourHistogram, peakUrgeHour, relapseWeekdayPattern, peakRelapseWeekday, urgeConversion, paceToRecord, urgeFrequencyTrend, streaksSaved, intensityStats, cleanRollup, timeReclaimed, recordApproach, urgeQuietStretch, urgesLabelled, urgeLabelCoverage } from '../lib/urge'
import { lapseCountOn, hasLapseQuantity, lapseByWeekday, peakLapseWeekday, lapseTrend, lapseProfile } from '../lib/lapse'
import { ActHide, ActStrip, NextStepBlock, PageLayout, StatBar, useActColumn } from '../components/page'
import { useStickyState } from '../lib/useStickyState'
import { GROUPS, GROUP_LABEL, DEFAULT_GROUP, type Group } from '../lib/recoveryCards'
import { feedbackLedger } from '../lib/recoveryFeedback'
import { recoveryStep } from '../lib/recoveryStep'
import { RecoveryReview } from '../components/recovery/Review'
import { RecoveryPhone } from '../components/recovery/RecoveryPhone'
import { CopingChapter, LapseTruthCard } from '../components/recovery/CopingChapter'
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
  LogCard,
  UrgeHistoryCard,
  BreathingCard,
  ResetCostCard,
  CommitmentCard,
  TriggerPlansCard,
  TechniquesBlock,
  LadderBlock,
  ResetHistoryBlock,
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
  // A phone logs, a desktop reads: it gets `RecoveryPhone`, returned below
  // after every hook.
  const phone = useDevice() === 'mobile'

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
    urgehistory: <UrgeHistoryCard />,
    coping: <CopingChapter />,
    breathing: <BreathingCard />,
    lapse: <LapseTruthCard />,
    resetcost: <ResetCostCard current={stats.current} best={stats.best} totalClean={stats.totalClean} />,

    urgetrend: urgeTrend.total > 0 && <UrgeTrendCard urgeTrend={urgeTrend} relapses={s.relapses} />,
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


  // A phone gets its own drawing (`RecoveryPhone`): a scoreboard, the urge as
  // one card with I held / I gave in in a dock, today's counts as rows. The
  // urge draft is shared with the desktop form (`useUrgeDraft`).
  if (phone) {
    return (
      <RecoveryPhone
        current={stats.current}
        best={stats.best}
        totalClean={stats.totalClean}
        urges={stats.urges}
        sentence={step.text}
        tally={tallyRows}
        onStep={logLapseDay}
        resetForm={<LogResetCard best={stats.best} totalClean={stats.totalClean} bare />}
        review={<RecoveryReview group={group} onGroup={setGroup} q={q} onQ={setQ} cards={all} />}
      />
    )
  }

  return (
    <>
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
        /*
          `actTop` · THE ACT STARTS BESIDE ZONE 1, NOT UNDER IT.

          Asked for as "I want it to shrink to the left side, and move the log
          an urge or reset to the top" — which is one change, not two. Without
          it zone 1 spans the full 1,180px shell and the act begins below it,
          so the hero is a wide strip and "Log an urge or a reset" is a scroll
          down on every visit. With it, zone 1 takes only the review column's
          width (the shrink) and the act column runs from the top of the page
          (the move).

          The same layout Nutrition, Fitness and Strength already use, and the
          reason `layout.css` carries the `auto 1fr` row fix — `min-content
          auto` left a 96px dead gap under the orient block, measured across
          five variants.
        */
        actTop
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
              /* THE FACTS COME BACK INTO THE CARD.

                 They were moved out to the review when zone 1 spanned the
                 full 1,180px shell and the pair read as two separate bands.
                 `actTop` made zone 1 a 678px left-hand column, and at that
                 width the ring and its three figures are one object — asked
                 for as "get them all in one place, like only one card".

                 Still not a duplication: zone 1 prints the run and the next
                 milestone, and these are the three it does NOT print. The
                 review's `SummaryStrip` is gone with them, so nothing says
                 any of this twice. */
              aside={
                <div className="mt-3 border-t border-line pt-2.5">
                  <StatBar facts={[
                    { label: 'Personal best', value: `${stats.best}d` },
                    /* "Total clean" — four facts in a 324px StatBar gave this
                       label 63px of the 72 it needs, and the clip gate caught
                       it the moment the facts came back into the card. The
                       value is a day count and the card is about days; the
                       word was the part carrying no information. */
                    { label: 'Total clean', value: stats.totalClean },
                    { label: 'Resets', value: s.relapses.length },
                    { label: 'Urges logged', value: stats.urges },
                  ]} />
                </div>
              }
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
        {/* THE HEADING IS A HEADING AGAIN, and the way out is `ActHide`.
            It was the title ITSELF — a whole-width button painting "Tap to
            hide" — which solved discoverability (the comment it replaces is
            right that a heading secretly acting as a button is a feature
            nobody finds) and solved it differently from the four other
            shapes the same gesture had across nine pages. `ActHide` keeps
            the painted word and the caret, and makes the control the same
            object everywhere. */}
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-heading font-medium text-fg-1">Log an urge or a reset</h2>
          <ActHide what="the log" onHide={logCol.close} />
        </div>

        {/* THREE ACTS, ONE CARD, ONE AT A TIME.

            It was three stacked cards — an urge form with ~20 chips, a day
            tally with four streaks, and a reset form — all open, all the
            time, three borders and three headings deep. Reported by pasting
            the whole column back: "this be included in one card, and I don't
            want to scroll this much".

            They are three different acts rather than three parts of one, and
            in the moment they are mutually exclusive. `LogCard` keeps the
            frequent one (an urge) as the default, which is the ordering the
            previous pass measured and argued for — the other two simply stop
            costing a scroll to get past. */}
        <LogCard
          urge={<UrgeSurfingCard bare />}
          tally={<DayTallyCard rows={tallyRows} onStep={logLapseDay} bare />}
          reset={<LogResetCard best={stats.best} totalClean={stats.totalClean} bare />}
        />
        </>)}
        zone3={
          <RecoveryReview
            group={group}
            onGroup={setGroup}
            q={q}
            onQ={setQ}
            cards={all}
            signature={<>
            {/* The record's figures are in zone 1's card, beside the ring —
                one object, not a band under another band. */}
        {/* THE SUMMARY STRIP IS GONE, and it went for the reason the hero
            moved: it printed `Total clean days`, `Resets` and `Urges logged`
            two inches under a zone-1 block that now prints the same three.
            Moving the ring up without taking this out would have traded one
            duplication for another — which is what the first attempt did, and
            the page grew by 185px for it.

            The three facts live in zone 1, beside the ring, where they are the
            context for the number rather than a second copy of it. */}

        {/* THE SIGNATURE BAND IS GONE, and it went because it was a second
            drawing of a chart already on the page.

            "Urges logged vs resets" sat above the rail on every row, and it
            drew `urgeTrend.weeks` — the exact series `UrgeTrendCard` draws,
            over the same eight weeks. Reported as "move it somewhere else,
            it's a waste of space here"; moving a near-copy would have kept
            the duplication and just relocated it. Its one extra signal, a
            marker on weeks containing a reset, is now a `ReferenceDot` on
            that card, under Patterns › The urges. */}

            </>}
          />
        }
      />
    </>
  )
}
