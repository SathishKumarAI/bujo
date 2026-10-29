import { ArrowsClockwise, CalendarDot, Gauge, Plus, Target, Trophy } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { Card, Textarea } from '../components/ui'
import { Button } from '../components/ui/button'
import { ActHide, ActStrip, PageLayout, StatBar, useActColumn, NextStepBlock } from '../components/page'
import { todayISO, addDays, prettyDay } from '../lib/date'
import { pickleTotals, recentThenFrequent, nextStep } from '../lib/pickleball'
import { PickleballReview } from '../components/pickleball/Review'
import { SessionFields } from '../components/pickleball/SessionFields'
import { blankSession, sessionPatch } from '../components/pickleball/sessionDraft'
import { TodayDrill } from '../components/pickleball/TodayDrill'
import { PB_PANELS, panelsFor } from '../components/pickleball/panels'
import { useDevice } from '../components/shell/device'
import { FieldGroup } from '../components/ui/FieldGroup'
import { useStickyState } from '../lib/useStickyState'
import { notify } from '../lib/notify'

/**
 * PICKLEBALL - log a session, then read what the sessions add up to.
 *
 * On the three-zone contract (`docs/PAGE-SHAPE.md`), and on the same shell as
 * Home Workout and Pull-ups, because a person who has learnt one of them has
 * learnt all three:
 *
 * - ORIENT - one sentence saying what to do next (`nextStep`), four totals, and
 *   the week against the weekly goal. Facts that change the next thirty
 *   seconds; everything all-time is in zone 3 and belongs there.
 * - ACT    - log a session. One primary button, in a sticky column.
 * - REVIEW - `components/pickleball/Review.tsx`: one bar, five panels.
 *
 * It was `shell/Page` with a hand-rolled 1.6fr/1fr split, the history list and
 * a practice card beside the form, and the record on a 13rem side rail below
 * all of it. That is three different layout decisions on one page and none of
 * them shared with any other page in the app.
 *
 * The form stays here rather than in `components/pickleball/`: it is the act,
 * it is what `PageLayout` puts in the sticky column, and a form that is lifted
 * out of its view ends up with a dozen callbacks for props.
 */
/**
 * `blankOf` is a FUNCTION, not a constant.
 *
 * It was `const blank = { date: todayISO(), ... }` evaluated once when the
 * module loaded - so the default date was whatever day the tab was opened.
 * Leave the app open overnight and every session logs to yesterday, and the
 * field resets to yesterday after each save.
 *
 * The form holds its numbers as STRINGS, because an empty field is `''` and
 * not `0` - a distinction this file depends on (`gamesWon: ''` must not log a
 * 0-0 session). `Stepper` and `ChipPick` speak numbers, so this is the seam.
 */
/* The draft shape and the fields that edit it moved to
   `components/pickleball/SessionFields.tsx`, so the history editor can render
   the SAME form instead of a five-field subset of it — COD-348. */
const blankOf = blankSession

export function Pickleball() {
  const { data, addPickleball } = useJournal()
  const today = todayISO()
  const [f, setF] = useState(blankOf)
  const set = (p: Partial<ReturnType<typeof blankOf>>) => setF((c) => ({ ...c, ...p }))

  const all = pickleTotals(data)
  const week = pickleTotals(data, 7, today)
  const sessions = [...(data.pickleball ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1))
  const goal = data.settings.pickleballGoalGames ?? 0
  // The one sentence at the top of the page. See `nextStep`'s docstring for the
  // priority order; it is total, so there is no empty state to design here.
  const step = nextStep(data, today)
  /* Which review panel is open. Sticky, because the folds it replaced were —
     and owned here, not in the review, so the sentence above can open the
     panel that answers it. */
  const [panel, setPanel] = useStickyState<string>(
    'pickleball.group', 'sessions', PB_PANELS.map((p) => p.id),
  )
  /* The act column's fold, the same way Home Workout and Pull-ups hold it:
     shut, the page grid turns zone 2 into a 40px rail and hands its width to
     the review. The shell owns the geometry, the page owns the state — which
     is the half this branch had back to front, with a second mechanism in
     `PageLayout` that did the same job under a different name. */
  /* The act column's open/shut, including the stacked default — see
     `useActColumn` for the three measurements that decided it. */
  const logCol = useActColumn('pickleball')
  /* ON A PHONE THE LOG IS THE PAGE — see the early return below. */
  const phone = useDevice() === 'mobile'
  const phonePanels = panelsFor(phone)

  /**
   * The log form's Partner and Location chips.
   *
   * Same two stat tables the analytics below already use, capped at six so the
   * chip row does not become the form. They are sorted by games played, so the
   * person you play every week is the first chip rather than the alphabetically
   * luckiest.
   */
  /* Ordered by **last used, then most used** — not by games played, which
     is what `partnerStats`/`venueStats` sort by and which put the court you
     played at last night below one you stopped going to in June. Recency is
     the stronger signal for what you are about to type.

     `sessions` and not the stats arrays: `recentThenFrequent` reads its
     input in order, and `partnerStats`/`venueStats` have already collapsed
     and re-sorted it, so the recency is gone by then. `sessions` is sorted
     newest-first where it is built above.

     No `useMemo`: it is one pass over a list of sessions, and `sessions` is
     a fresh array every render, so a memo keyed on it would recompute every
     time anyway while costing a dependency to keep honest. */
  const allPartners = recentThenFrequent(sessions.map((x) => x.partner))
  const allVenues = recentThenFrequent(sessions.map((x) => x.location))
  /* ONE CHIP, THEN THE FIELD — asked for as "show only one partner name and
     add a name, or else you can choose from the name".
     
     Four chips plus a field is five controls for one answer, and in a 416px
     act column they wrapped to two lines each for Partner and Location. The
     one chip is who you played with last, which is the answer most of the
     time; everything else is in the field's own dropdown (`list=`), which is
     a real list of every name you have logged and still takes a new one. */
  const recentPartners = allPartners.slice(0, 1)
  const recentVenues = allVenues.slice(0, 1)
  const yesterday = addDays(todayISO(), -1)

  function log() {
    // A session with a duration and no score is a real session — the sport's
    // one required field is `durationMin`, and the voice path files exactly
    // that. Requiring a score here was the same bug the parser had, in the
    // form: you could not hand-log "played for 40 minutes, didn't keep score".
    if (!f.gamesWon && !f.gamesLost && !f.durationMin) { notify.info('Nothing to log yet', 'A session needs a score or how long you played.'); return }
    addPickleball(sessionPatch(f) as Parameters<typeof addPickleball>[0])
    setF(blankOf())
  }
  function repeatLast() {
    const last = sessions[0]
    if (last) setF({ ...blankOf(), date: today, format: last.format, durationMin: String(last.durationMin ?? ''), partner: last.partner ?? '', location: last.location ?? '', level: last.level ?? '', scoring: last.scoring ?? '' })
  }

  const atAGlance = (
    /* ONE BLOCK, NOT THREE THINGS THAT HAPPEN TO BE ADJACENT.

       Asked for directly: *"combine this drill and the stats on the top bar so
       they have only one single space"*. The sentence, the totals and today's
       drill are the same question — what about today — and they were a row, a
       bar and then a strip at the top of the record, where the strip read as
       the first panel and ran into the Sessions heading below it.

       `@container/orient` so the drill can ask how wide THIS block is rather
       than how wide the window is: the block is the full shell with the log
       hidden and the same width with it open, because zone 1 spans both
       columns. */
    <div className="@container/orient rounded-card border border-line bg-ink-0 p-3">
      {/* THE SENTENCE, ABOVE THE NUMBERS.

          Four totals are four true things that change nothing about today. The
          one that does — an event on Saturday, a goal two games short, eleven
          days of silence — was spread across three cards in the review zone,
          behind a rail row you had to pick first. `nextStep` is the priority
          list (lib/pickleball.ts), and it always returns a sentence so this
          never renders as a hole.

          COLOUR MEANS URGENCY HERE AND NOTHING ELSE — peach has a date on it,
          yellow is a habit going quiet, teal is a goal you set, mauve is
          something to aim at. The accent stays in the left edge and the icon;
          the text is `fg-1`. Putting an accent on a wash of itself is the
          calibration trap in CLAUDE.md, and this row would have been the
          twenty-first call site of it.

          It is a BUTTON when the detail exists, and a paragraph when it does
          not: the rail groups are the detail, and a row that looks pressable
          and does nothing is worse than a row that does not. */}
      {(() => {
        const tone = { first: 'mauve', event: 'peach', goal: 'teal', lapse: 'yellow', milestone: 'mauve' }[step.id]
        const StepIcon = { first: Plus, event: CalendarDot, goal: Target, lapse: Gauge, milestone: Trophy }[step.id]
        return (
          <NextStepBlock
            text={step.text}
            tone={tone}
            icon={StepIcon}
            destination={step.group ? PB_PANELS.find((g) => g.id === step.group)?.label : undefined}
            onPick={step.group && phonePanels.some((g) => g.id === step.group) ? () => setPanel(step.group!) : undefined}
          />
        )
      })()}
      {/* ONE BAR, NOT A CARD.

          This was a titled card wrapping four `StatTile`s, a "this week"
          sentence, a goal field and a progress bar — 259px on desktop and 308px
          on a phone to say four numbers. `StatBar` is what the rest of the app
          uses for exactly this (thirteen views; Pickleball was never one of
          them) and it is capped at 64px with hairline dividers.

          The four facts are the four that were here. The weekly goal stays,
          because it is the one line that changes what you do today, but as a
          single row under the bar rather than a card section of its own. */}
      {/* THE GOAL FIELD MOVED OUT OF ZONE 1, to the Sessions panel.

          The orient zone was three rows for two facts: the sentence, the bar,
          and then a near-empty line holding one progress pip and a number
          field. A control you touch about once a month does not earn a row
          above the fold — the STATE of it does, and that is the fourth fact
          below ("3 of 12 games · 67% won"). The field itself now sits under
          the history list, which is where you are standing when you decide
          whether twelve was the right number. Measured: orient 175px → 126. */}
      {/* FOUR FACTS, AND THE FOURTH IS THIS WEEK.

          It was Sessions / Games / Win % / Day streak, with a row under it
          repeating "This week 0 games of 12 - 0% won" and carrying the goal
          field: two rows and 173px of orient zone, where the fourth fact was a
          day streak that reads 0 for anybody who plays twice a week - which is
          most people, and is not a problem.

          `StatBar` gives every fact an equal share of the row, so a one-digit
          value leaves ~230px of nothing beside it. The fix is not to squeeze
          the bar, it is to SPEND the cell: the week against the goal is the one
          line here that changes what you do today, so it takes the fourth slot
          as prose and the row under it shrinks to the control that sets it.
          Nothing is lost - the streak has its own card in Performance. */}
      <StatBar
        facts={[
          { label: 'Sessions', value: all.sessions },
          { label: 'Games', value: all.games },
          { label: 'Win %', value: `${all.winPct}%` },
          {
            label: 'This week',
            value: goal > 0
              ? `${week.games} of ${goal} games · ${week.winPct}% won${week.games >= goal ? ' ✓' : ''}`
              : `${week.games} games · ${week.winPct}% won`,
            prose: true,
          },
        ]}
      />
      <TodayDrill />
    </div>
  )

  /* ON A PHONE THE LOG IS THE PAGE, and it is the first thing on it.

     Asked for directly: a phone is for logging, and "all the input should be
     taken only in one screen" — one scrolling form. Before this the phone got
     the desktop's order with the act column SHUT (`useActColumn` closes it
     whenever the page stacks): the form was not on the page at all, and once
     opened it started 723px down, under the sentence, the four totals and the
     drill. So a phone gets its own order — the log as zone 1, no act column,
     and the summary after it, ahead of the record (which `panels.ts` trims to
     the panels you write to). Hooks are all above; the desktop return below is
     untouched.

     The form: no card frame, iOS inset groups on the page ground
     (`FieldGroup`, `styles/phone.css`), every field open, one full-width
     button at the end. Same `SessionFields`, same `log()`. */
  if (phone) {
    return (
      <PageLayout
        tier={1180}
        zone1={(
          /* THE PHONE LOG: no card frame, iOS inset groups on the page ground
             (`FieldGroup`, `styles/phone.css`), every field open and one
             full-width button at the end. Same `SessionFields`, same `log()`. */
          <section aria-label="Log a session" className="ios-form flex flex-col gap-5">
            <div className="flex items-center justify-between gap-2 px-1">
              <h2 className="text-title font-semibold text-fg-1">Log a session</h2>
              {sessions.length > 0 && (
                <Button variant="secondary" onClick={repeatLast} className="press-3d inline-flex items-center gap-1"><Icon as={ArrowsClockwise} size="sm" /> Repeat last</Button>
              )}
            </div>
            <SessionFields
              f={f}
              set={set}
              recentPartners={recentPartners}
              allPartners={allPartners}
              recentVenues={recentVenues}
              allVenues={allVenues}
              yesterday={yesterday}
            />
            <FieldGroup title="Notes">
              <Textarea value={f.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="How did it go?" rows={3} aria-label="Notes" />
            </FieldGroup>
            <Button variant="primary" size="lg" onClick={log} className="press-3d h-12 w-full text-heading font-semibold">Log session</Button>
          </section>
        )}
        zone3={<>{atAGlance}<PickleballReview panel={panel} onPanel={setPanel} /></>}
      />
    )
  }

  return (
    <PageLayout
      /* Still 1180. The 1440 tier was tried here and bought **nothing
         measurable**: with the rail open the shell is bounded by the window,
         not by the tier — 1110px at a 1440 viewport and 1590 at 1920 on either
         setting. A tier that changes no number is a claim the layout does not
         make. */
      tier={1180}
      zone1={atAGlance}
      actTop
      onSplitChange={logCol.onSplitChange}
      actShut={logCol.shut}
      zone2={logCol.shut ? (
        <ActStrip
          label="Log a session"
          summary={sessions.length ? `${sessions.length} logged · last ${prettyDay(sessions[0].date)}` : 'Nothing logged yet'}
          onOpen={logCol.open}
        />
      ) : (
        <Card band title="Log a session" right={
          <span className="flex items-center gap-1.5">
            {sessions.length > 0 && (
              <Button variant="secondary" onClick={repeatLast} className="press-3d inline-flex items-center gap-1"><Icon as={ArrowsClockwise} size="sm" /> Repeat last</Button>
            )}
            {/* Shutting it lives in the card header, which is where Home
                Workout and Pull-ups put theirs — the strip that comes back is
                the way in, so the way out belongs on the thing itself. */}
            <ActHide what="the log" onHide={logCol.close} />
          </span>
        }>
          {/* TAP, DON'T TYPE.

              This was fourteen controls of which twelve were free text or a bare
              number input — the most-used form in the app asking you to type "60"
              and "3.5" after every game. Converted to the `quickpick` primitives
              (#241) on the same reasoning as the rest of that pass: the answer is
              nearly always one of a handful, and a keyboard on a phone at the side
              of a court is the worst possible input device.

              Partner and Location read their chips from `partnerStats` and
              `venueStats`, which are already computed on this page for the
              analytics below and are **sorted by how often you play** — so the
              chips are your actual partners and courts, in the order you use
              them, rather than a list somebody invented. Both keep a free-text
              field beside them for the first time and the one-off.

              Points for/against stay typed on purpose: they are arbitrary numbers
              in 0–21 with no common values, so chips would be a list of twenty-two
              and a Stepper would be eleven taps. A control is only an improvement
              if it is fewer actions than typing. */}
          <SessionFields
            f={f}
            set={set}
            recentPartners={recentPartners}
            allPartners={allPartners}
            recentVenues={recentVenues}
            allVenues={allVenues}
            yesterday={yesterday}
          />
          <Textarea value={f.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="How did it go?" rows={2} className="mt-3" />
          <Button variant="secondary" onClick={log} className="press-3d mt-3 w-full">Log session</Button>
        </Card>
      )}
      zone3={<PickleballReview panel={panel} onPanel={setPanel} />}
    />
  )
}
