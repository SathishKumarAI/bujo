import { useEffect, useState } from 'react'
import { ArrowsClockwise, Gauge, Plus, Target, Trophy } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../store'
import { notify } from '../lib/notify'
import { prettyDay, todayISO, dayDiff } from '../lib/date'
import { Button } from '../components/ui/button'
import {ActHide, 
  ActStrip, ActivityForm, NextStepBlock, PageLayout, StatBar, useActColumn,
  draftOf, emptyDraft, workoutOf, draftIsEmpty, type ActivityDraft,
} from '../components/page'
import { fullLabelOf, isActivityKey, LOGGABLE_MODES, MODE_COPY, modeOf, modeSegments, OWN_PAGE, type Mode } from '../domain/activities'
import { readDeepLink } from '../lib/deepLink'
import { useNav } from '../components/shell/nav'
import { VIEW_CHROME, type ViewId } from '../components/shell/viewChrome'
import { sessionsInMode } from '../domain/sessions'
import { weeklyActiveMinutes } from '../lib/fitness'
import { cadence, nextStep } from '../lib/fitnessReview'
import { FITNESS_PANELS } from '../components/fitness/panels'
import { FitnessReview } from '../components/fitness/Review'
import { useStickyState } from '../lib/useStickyState'
import { useDevice } from '../components/shell/device'
import { FitnessPhone } from '../components/fitness/phone/FitnessPhone'
import { DayStrip } from '../components/ui/dayStrip'

/**
 * FITNESS · log a cardio session or a game, then read what they add up to.
 *
 * On the three-zone contract (`docs/PAGE-SHAPE.md`), and on the same shell as
 * Pickleball, Pull-ups and Home Workout, because a person who has learnt one of
 * them has learnt all four:
 *
 * - ORIENT — one bordered block: the sentence saying what to do next, and four
 *   facts about this week. Everything all-time is in zone 3.
 * - ACT    — the log form, the page's only primary button, in a column you can
 *   put away.
 * - REVIEW — `components/fitness/Review.tsx`: one bar, four rows.
 *
 * **Every fact re-reads on mode change.** Cardio measures minutes against the
 * weekly target; sport counts games, because a game is bounded by a scoreboard
 * and a "you owe 40 minutes" nag about one would be nonsense. A mode switch
 * that only moved a highlight was the bug the first pass over this page
 * existed to remove, and the keyed records below are what keep a third mode
 * from being a ternary at every fact.
 *
 * **Two modes, not three.** `strength` was a segment here and is a Body tab —
 * the same record, logged twice, and the one logged here could not hold what
 * the Strength page's own logger produces (per-set rows, a split, PR
 * detection, a rest timer). `LOGGABLE_MODES` is the list this page offers;
 * `MODES` is still every shape a `Workout` can have, which is why the edit
 * dialog opens a push day with its sets field intact and why `?activity=pullups`
 * redirects to Strength rather than landing on a toggle that cannot hold it.
 *
 * What used to be in zone 3 and is not any more: a flat stack of a History
 * section and an "Analytics" heading over three tiles and a heatmap — **553px
 * of record under a 705px form**, with no way to ask the record a question.
 * The four rows are in `components/fitness/panels.ts`; the aggregates behind
 * them are `lib/fitnessReview.ts`, which did not exist because every one of
 * `lib/fitness.ts`'s 900 lines is about lifting.
 */
export function Fitness() {
  const { data, addWorkout } = useJournal()
  // Arriving with `?activity=` (including via a retired /pullups-style link)
  // preselects that activity and takes the mode from it — never the other way
  // round, because the activity is the fact and the mode is derived from it.
  const nav = useNav()
  const linked = readDeepLink().activity
  /* A LINK FOR AN ACTIVITY THAT HAS ITS OWN LOGGER GOES THERE.
     Two cases, one rule. A strength activity would land on a toggle that
     cannot represent its mode at all; a pickleball link would land on a
     duration-and-notes form while the page that records a score is one tab
     away (`OWN_PAGE`). Both are "this page cannot hold what the link asked
     for", so both redirect rather than silently preselecting something else —
     and `OWN_PAGE` is the list, not a growing chain of activity literals. */
  const linkedKey = linked && isActivityKey(linked) ? linked : null
  const dest = linkedKey == null ? null
    : OWN_PAGE[linkedKey] ?? (modeOf(linkedKey) === 'strength' ? 'gym' : null)
  /* Resolved against `VIEW_CHROME`, which is the one list of real view ids,
     rather than cast. `OWN_PAGE` lives in `domain/` and cannot import a UI
     type without pointing the imports upward, so the narrowing happens here —
     and a typo in it then redirects NOWHERE instead of to a dead view.
     `activities.test.ts` asserts every value is a real id for the same reason:
     this repo has been bitten three times by a hand-written id list resolved
     against another source. */
  const elsewhere = dest && dest in VIEW_CHROME ? (dest as ViewId) : null
  useEffect(() => { if (elsewhere) nav(elsewhere) }, [elsewhere, nav])
  const initialActivity = elsewhere ? null : linkedKey
  // `useStickyState` reads localStorage FIRST, so passing the linked mode as its
  // default did nothing once a mode had ever been chosen: arriving on
  // `?view=fitness&activity=run` left the toggle on the stored `sport` while the
  // draft took `run`. The activity `<select>` then held a value absent from its
  // own option list, which a browser renders as the *first* option — the form
  // said "Pickleball", carried `run`, and would have logged one as the other.
  // The link wins until the user picks a mode by hand, which clears it.
  const [stickyMode, setStickyMode] = useStickyState<Mode>('fitness.mode', 'cardio', LOGGABLE_MODES)
  const [linkMode, setLinkMode] = useState<Mode | null>(initialActivity ? modeOf(initialActivity) : null)
  const mode = linkMode ?? stickyMode
  const [draft, setDraft] = useState<ActivityDraft>(() => {
    const base = emptyDraft(initialActivity ? modeOf(initialActivity) : mode)
    return initialActivity ? { ...base, activity: initialActivity } : base
  })

  const unit = data.settings.distanceUnit
  const today = todayISO()
  const patch = (p: Partial<ActivityDraft>) => setDraft((cur) => ({ ...cur, ...p }))

  // Switching mode resets the activity to that mode's first entry — an
  // activity from the other mode would render the wrong fields.
  function switchMode(next: Mode) {
    setLinkMode(null)
    setStickyMode(next)
    setDraft((cur) => ({ ...emptyDraft(next), date: cur.date }))
  }

  const sessions = sessionsInMode(data, mode).sort((a, b) => (a.date < b.date ? 1 : -1))

  /* Which review row is open. Sticky, and owned HERE rather than in the review,
     so the sentence above can open the row that answers it. */
  const [panel, setPanel] = useStickyState<string>(
    'fitness.group', 'sessions', FITNESS_PANELS.map((p) => p.id),
  )
  /* The act column's open/shut, including the stacked default — see
     `useActColumn` for the three measurements that decided it. */
  const logCol = useActColumn('fitness')
  const phone = useDevice() === 'mobile'

  // ── Zone 1 facts, all of which re-read on mode change ─────────────────────
  const goal = data.settings.fitnessGoalMin ?? 150
  const minutes = weeklyActiveMinutes(data)
  const thisWeekSessions = sessions.filter((s) => {
    const d = dayDiff(s.date, today)
    return d >= 0 && d < 7
  }).length
  const last = sessions[0]
  const pace = cadence(sessions, 8, today)
  const step = nextStep(sessions, { mode, goalMin: goal, weekMinutes: minutes, today })

  // Keyed off the mode rather than branched on it, so the two are impossible to
  // let drift apart and a third mode would be one more entry, not one more
  // ternary at every fact.
  const WEEK: Record<Mode, string> = {
    cardio: `${minutes} / ${goal} min`,
    strength: `${thisWeekSessions} ${thisWeekSessions === 1 ? 'session' : 'sessions'}`,
    // A game is counted, not measured against a minutes target — you play when
    // there is a game, and a "you owe 40 minutes" nag would be nonsense.
    sport: thisWeekSessions === 1 ? '1 game' : `${thisWeekSessions} games`,
  }
  // ── The one fact on this page that has a target ──────────────────────────
  //
  // Only cardio measures against a goal. Strength counts sessions and sport
  // counts games — neither has a denominator, so neither gets a track, and
  // inventing one would draw a scale that does not exist.
  //
  // `amount`/`of` rather than parsing `WEEK[mode]`: the string is already a
  // formatted answer and re-deriving numbers out of it would be a second
  // source of truth for the same fact.
  const weekRange: Partial<Record<Mode, { amount: number; of: number }>> = {
    cardio: { amount: minutes, of: goal },
  }

  /**
   * THE LABEL SAYS WHOSE MINUTES THESE ARE.
   *
   * `weeklyActiveMinutes` counts EVERY activity — lifting and pickleball
   * included — because that is what `fitnessGoalMin` means in Goals and in
   * `lib/coach.ts`, and a 150-minute week is not a cardio-only idea. Labelled
   * "This week" beside a Cardio/Sport toggle it reads as this mode's minutes,
   * and the Volume card one zone down was then drawing **123m** for the same
   * seven days the bar called **578**. Keyed like `WEEK` rather than
   * ternaried, so a third mode is one more entry.
   */
  const WEEK_LABEL: Record<Mode, string> = {
    cardio: 'All training',
    strength: MODE_COPY.strength.weekLabel,
    sport: MODE_COPY.sport.weekLabel,
  }

  /* THREE FACTS, NOT FOUR — and the dropped one is `StatBar`'s own example of
     what does not belong here ("sessions all-time does not [change the next
     thirty seconds]"). Measured: zone 1 is 678px wide under `actTop`, and four
     facts beside the mode toggle gave each ~85px, so "578 / 150 min" rendered
     as "578 / 150 …". The count is in the sentence above and in the Volume
     strip, both of which say it in full. */
  const facts = [
    {
      label: WEEK_LABEL[mode],
      value: WEEK[mode],
      ...weekRange[mode],
      // Green once the target is met, so beating it reads as beating it. Below
      // target the track stays the brand hue rather than turning red: you are
      // mid-week, not failing.
      tone: mode === 'cardio' && minutes >= goal ? ('green' as const) : ('mauve' as const),
    },
    /* The cadence, or an honest dash. `cadence` returns null under four
       training days, because three gaps is the fewest that has a middle — and
       a figure that compares two windows with no coverage floor is how a lapse
       got reported as three green improvements (CLAUDE.md). */
    { label: 'Cadence', value: pace.avgGap != null ? `every ${pace.avgGap}d` : '—', onClick: () => setPanel('volume') },
    { label: 'Last', value: last ? `${fullLabelOf(last.activity, last.subActivity)} · ${prettyDay(last.date)}` : 'None yet', prose: true },
  ]

  function submit() {
    // Was unguarded, so an untouched form wrote an empty workout that then
    // counted as a session you did. And the guard SAYS so: a button that
    // silently does nothing is indistinguishable from a broken one, which is
    // how every other failing guard in this app behaved.
    if (draftIsEmpty(draft)) {
      notify.info('Nothing to log yet', 'Add a duration, a distance or some sets first.')
      return
    }
    addWorkout(workoutOf(draft, unit))
    // Stays on the strip's day, so the chip just logged to stays chosen.
    setDraft({ ...emptyDraft(mode), date: draft.date })
  }

  function repeatLast() {
    if (!last) return
    setDraft({ ...draftOf(last, unit), date: draft.date, rpe: '', notes: '' })
  }

  /* THE DAY TO LOG, one picker on both devices (owner, 2026-11-01: "show the
     calendar on all possible pages"). Each chip says the minutes logged that
     day in THIS mode — the sessions the page is about, not every activity. */
  const markDay = (d: string) => {
    const min = sessions.filter((s) => s.date === d).reduce((n, s) => n + (s.durationMin ?? 0), 0)
    const n = sessions.filter((s) => s.date === d).length
    return min ? <>{min}<span className="sr-only"> minutes</span></> : n ? <><span aria-hidden>✓</span><span className="sr-only">logged</span></> : null
  }

  const orient = (
    /* ONE BLOCK, NOT A BAR WITH THINGS ABOVE AND BELOW IT.

       The sentence, the toggle and the four facts are one question — what about
       this week — and `@container/orient` lets anything inside ask how wide
       THIS block is rather than how wide the window is. Same shape as
       Pickleball's, which is the page this one is being brought level with. */
    <div className="@container/orient rounded-card border border-line bg-ink-0 p-3">
      {/* THE SENTENCE, ABOVE THE NUMBERS.
          Four true facts change nothing about today; the thing that does — a
          target four minutes short, eleven days of silence — was nowhere on
          this page at all. `nextStep` is the priority list
          (`lib/fitnessReview.ts`) and it is total, so this never renders as a
          hole.

          COLOUR MEANS URGENCY HERE AND NOTHING ELSE, in the left edge and the
          icon, with `fg-1` text. An accent as text on a wash of itself is the
          calibration trap in CLAUDE.md.

          A BUTTON when a row holds the detail, a paragraph when none does: a
          row that looks pressable and does nothing is worse than a row that
          does not. */}
      {(() => {
        const tone = { first: 'mauve', lapse: 'yellow', goal: 'teal', today: 'green', milestone: 'mauve' }[step.id]
        const StepIcon = { first: Plus, lapse: Gauge, goal: Target, today: Trophy, milestone: Trophy }[step.id]
        return (
          <NextStepBlock
            text={step.text}
            tone={tone}
            icon={StepIcon}
            destination={step.group ? FITNESS_PANELS.find((g) => g.id === step.group)?.label : undefined}
            onPick={step.group ? () => setPanel(step.group!) : undefined}
          />
        )
      })()}
      <StatBar
        mode={mode}
        onModeChange={switchMode}
        segments={modeSegments()}
        facts={facts}
      />
    </div>
  )

  /* A PHONE GETS ITS OWN PAGE (COD-459): the log first, the week as three
     numbers, recent sessions as rows — no charts. Every hook is above this
     line; the desktop return below is unchanged. */
  if (phone) return <FitnessPhone key={mode} mode={mode} onMode={switchMode} sessions={sessions} unit={unit} day={draft.date} onDay={(d) => patch({ date: d })} mark={markDay} />

  return (
    <PageLayout
      tier={1180}
      zone1={orient}
      /* `actTop`, because zone 1 is a BLOCK rather than four numbers: at full
         width it is a wide shallow band with the thing you came to do pushed
         below it. Read on the left, act on the right, both from the top. */
      actTop
      onSplitChange={logCol.onSplitChange}
      actShut={logCol.shut}
      zone2={logCol.shut ? (
        <ActStrip
          label={mode === 'sport' ? 'Log a game' : 'Log a session'}
          summary={sessions.length ? `${sessions.length} logged · last ${prettyDay(sessions[0].date)}` : 'Nothing logged yet'}
          onOpen={logCol.open}
        />
      ) : (
        <ActivityForm
          mode={mode}
          draft={draft}
          onChange={patch}
          onSubmit={submit}
          unit={unit}
          submitLabel={mode === 'sport' ? 'Log game' : 'Log session'}
          day={<DayStrip value={draft.date} onChange={(d) => patch({ date: d })} today={today} label="Day to log" mark={markDay} />}
          right={
            <span className="flex items-center gap-1.5">
              {last && (
                <Button variant="ghost" onClick={repeatLast} className="inline-flex items-center gap-1 text-label">
                  <Icon as={ArrowsClockwise} size="sm" /> Repeat last
                </Button>
              )}
              {/* Shutting it lives on the form's own header, which is where
                  Pickleball, Home Workout and Pull-ups put theirs — the strip
                  that comes back is the way in, so the way out belongs on the
                  thing itself. */}
              <ActHide what="the log" onHide={logCol.close} />
            </span>
          }
        />
      )}
      zone3={
        <FitnessReview
          sessions={sessions}
          mode={mode}
          unit={unit}
          panel={panel}
          onPanel={setPanel}
        />
      }
    />
  )
}

/**
 * The contextual-door map is **gone**, and its last entry is the reason.
 *
 * It was written when Pull-ups, Pickleball, Strength tools and Coaching had
 * been collapsed OFF the tab row and lived only behind an activity. Each was
 * promoted back to a Body tab in turn, and `COMPANION` shrank to one entry:
 * Home workout, kept because that page genuinely had no tab.
 *
 * That entry had been dead for some time and nothing could say so. It was
 * keyed on the activity `homeWorkout`, which is `mode: 'strength'`; when
 * Fitness's strength segment was deleted, `LOGGABLE_MODES` dropped strength,
 * the activity stopped being selectable, and a link conditional on selecting
 * it stopped being renderable. The invariant test guarding this map asks
 * whether a companion points at something already tabbed — a good question
 * that cannot catch a companion pointing at something nobody can reach.
 *
 * Home workout is a Body tab now, so the map is empty and empty is deletable.
 * The lesson worth keeping: a link gated on state another module owns needs a
 * test that it can still *render*, not only that it is not redundant.
 */