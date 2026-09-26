import { Lifebuoy } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState, type ReactNode } from 'react'
import { useJournal } from '../store'
import { Empty, Input } from '../components/ui'
import { cat, onAccent } from '../lib/colors'
import { todayISO } from '../lib/date'
import { streakStats, urgesByType, moneySaved } from '../lib/streak'
import { streakVsBest, comebackStatus, urgeHourHistogram, peakUrgeHour, relapseWeekdayPattern, peakRelapseWeekday, urgeConversion, paceToRecord, urgeFrequencyTrend, streaksSaved, intensityStats, cleanRollup, timeReclaimed, recordApproach, urgeQuietStretch } from '../lib/urge'
import { lapseCountOn, hasLapseQuantity, lapseByWeekday, peakLapseWeekday, lapseTrend } from '../lib/lapse'
import { PageLayout, SectionRail, StatBar, SummaryStrip } from '../components/page'
import { useStickyState } from '../lib/useStickyState'
import { CardGrid } from '../components/shell/CardGrid'
import { CARDS, GROUPS, GROUP_BLURB, GROUP_LABEL, DEFAULT_GROUP, visibleCards, type Group } from '../lib/recoveryCards'
import {
  StreakRingCard,
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

  const s = data.nofap
  const plans = s.plans ?? []
  const today = todayISO()
  const stats = streakStats(data, today)
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
    ...addictions.map((a) => ({ id: a.id, name: a.name, count: lapseCountOn(a.relapses, today) })),
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
   * Every panel in zone 3, by the id the registry knows it under.
   *
   * A panel whose data cannot support it is `false` here rather than an empty
   * box; the renderer below skips those, so an absent panel never leaves a group
   * heading over nothing — and the rail's count never promises one.
   */
  const all: Record<string, ReactNode> = {
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

  /* A query crosses groups. Finding a panel whose group you do not remember is
     the whole reason the filter exists, so it must not be silently intersected
     with whichever rail row happens to be selected. */
  const filtering = q.trim().length > 0
  const visible = visibleCards(filtering ? null : group, q)
  const show = (id: string) => visible.has(id)
  /** Panels a group would show under the current query — the rail's counts. */
  const countOf = (g: Group) => CARDS.filter((c) => c.group === g && visibleCards(g, q).has(c.id) && all[c.id]).length

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
        zone1={
          <StatBar facts={[
            { label: 'Days clean', value: stats.current },
            { label: 'Personal best', value: stats.best },
            {
              label: 'Next milestone',
              value: nextBenefit ? `${nextBenefit.label} · ${stats.daysToNext}d` : 'All cleared',
              prose: true,
            },
            { label: 'Today', value: relapsedToday ? 'Reset logged' : 'Clean', prose: true },
          ]} />
        }
        zone2={<>
        <StreakRingCard stats={stats} relapsedToday={relapsedToday} startedOn={s.startedOn} />

        {/* Day log · "it happened today", with a number on it.
            Directly under the ring because it is the act this page was missing:
            the quantity-blind version of it already existed three screens down
            as the per-addiction `Reset` button, in zone 3 behind the signature
            chart, which is not where you press anything on a bad day. */}
        <DayTallyCard rows={tallyRows} onStep={logLapseDay} />

        <UrgeSurfingCard />
        <LogResetCard best={stats.best} totalClean={stats.totalClean} />
        </>}
        zone3={<>
        {/* Lifetime totals · the record, not the next action. */}
        {/* **Only the negatives are counted here now.** "Urges resisted" was a
            score, and a score invites you to protect it: the cheapest way to
            keep a win counter climbing is to tap the win button, which is not
            recovery. What stays is what actually happened — days clean, and
            resets. The urge log itself is untouched and still records the
            trigger, the intensity and the HALT check, because that is
            diagnostic data about a hard moment rather than a trophy for it.
            No existing data was deleted; this is what the page shows, not what
            it stores. */}
        <SummaryStrip items={[
          { label: 'Total clean days', value: stats.totalClean, empty: stats.totalClean === 0 },
          { label: 'Resets', value: s.relapses.length, empty: s.relapses.length === 0 },
          { label: 'Urges logged', value: stats.urges, empty: stats.urges === 0 },
        ]} />

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

        {/* ZONE 3 · the four groups the registry names, in its order, one heading
            each — replacing three `CollapsibleSection`s that all shipped shut
            ("Setup", "Deep analytics", "Reference") plus a fourth unfolded
            "Insights & progress" section. Four peers, each answering a different
            question about the same streak, is a table of contents; the folds
            were what was left over, and a chart behind a closed fold is a chart
            that does not exist.

            No "All" row: the four groups do not overlap, and "all of them" is
            the page this replaces. The filter below is how you cross them. */}
        {/* Two divs, and the split is load-bearing: an element cannot query
            itself, so `@container/page` and `@4xl/page:grid-cols-…` on one div
            means the grid never fires. Phone column spelled out, or the chip
            row's min-content sizes the only implicit track and the page scrolls
            sideways. Both in docs/PAGE-SHAPE.md. */}
        <div className="@container/page">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-3 @4xl/page:grid-cols-[11rem_minmax(0,1fr)]">
          <SectionRail
            label="Recovery groups"
            groups={GROUPS.map((g) => ({ id: g, label: GROUP_LABEL[g], count: countOf(g) }))}
            value={filtering ? null : group}
            onChange={(g) => { setGroup((g as Group | null) ?? DEFAULT_GROUP); setQ('') }}
            filtering={filtering}
            onClear={() => setQ('')}
          />
          <div className="min-w-0">
            {/* The panel filter. Twenty panels over four groups, and the query
                someone types is the measure ("money", "hour", "HALT") rather
                than the heading — which is what `words` in the registry is for.
                `min-h-11` because COD-96 counts the controls under 44px on a
                phone and this is not going to be the twenty-fifth. */}
            <Input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter these panels — “money”, “hour”, “HALT”…"
              aria-label="Filter the Recovery panels"
              className="mb-3 min-h-11"
            />
            {visible.size === 0 ? (
              <Empty>Nothing matches “{q}” on this page. Clear the filter, or pick a different group in the rail.</Empty>
            ) : (
              GROUPS.map((g) => {
                const ids = CARDS.filter((c) => c.group === g && show(c.id) && all[c.id])
                if (ids.length === 0) return null
                return (
                  /* `data-domain`, not `data-group` — the same DOM hook Insights
                     uses, so one probe can read both pages. The registry's noun
                     is `group`; this is the shared attribute. */
                  <section key={g} data-domain={g} className="mb-6 last:mb-0">
                    <div className="mb-3 flex flex-wrap items-baseline gap-x-3 border-b border-line pb-1.5">
                      <h2 className="font-display text-heading font-medium text-fg-1">{GROUP_LABEL[g]}</h2>
                      <p className="text-label text-fg-2">{GROUP_BLURB[g]}</p>
                      <span className="num ml-auto text-label text-fg-3">{ids.length}</span>
                    </div>
                    {/* Two columns is the ceiling here, and it is a correction
                        rather than a preference — the same one #288 made on
                        Cycle. `CardGrid` asks the *viewport*, so at 1600 its
                        `2xl:grid-cols-3` fires inside this 722px split column
                        and resolves to three tracks of **227px**: literally the
                        "cards a third of the size" half of the report this pass
                        answers. Two tracks of 350 is what 1440 already gives.
                        `MasonryGrid` is not the alternative — it breaks on its
                        *container* at 768px, so at 722 it silently draws one
                        column. `min-w-0` per cell so a wide chart cannot drag
                        the shared track. */}
                    <CardGrid className="2xl:grid-cols-2">
                      {ids.map((c) => <div key={c.id} data-card={c.id} className="min-w-0">{all[c.id]}</div>)}
                    </CardGrid>
                  </section>
                )
              })
            )}
          </div>
        </div>
        </div>
        </>}
      />
    </>
  )
}
