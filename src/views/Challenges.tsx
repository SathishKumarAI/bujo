import { Archive, CaretLeft, CheckCircle, Clock, Plus, Target, Trash, Trophy, Warning, X } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { Card, Input, Segmented } from '../components/ui'
import { Button } from '../components/ui/button'
import { Switch } from '../components/ui/switch'
import { Checkbox } from '../components/ui/checkbox'
import { ActHide, ActStrip, EmptyFrame, NextStepBlock, PageLayout, StatBar, SummaryStrip, useActColumn } from '../components/page'
import { addDays, dayDiff, prettyDay, todayISO } from '../lib/date'
import { cat, onAccent } from '../lib/colors'
import type { Challenge, JournalData } from '../lib/types'
import { fullLabelOf } from '../domain/activities'
import { challengeRuleKey } from '../lib/recordKeys'
import { useConfirm } from '../components/ConfirmDialog'
import { QuietSection } from '../components/CollapsibleSection'
import { notify } from '../lib/notify'
import {
  CHALLENGE_PRESETS, isDayComplete, percentComplete, missedDays,
  streakBeforeToday, completedDays, isFinished, rulesDoneOn, longestStreak, elapsedDay,
  ruleCompletion, nextStep,
} from '../lib/challenges'

/**
 * CHALLENGES · fixed-length disciplines (75 Hard, 90-day, custom), on the
 * three-zone page contract.
 *
 * 1. ORIENT — the focused challenge in four facts. When more than one is
 *    running, a segmented control picks which; it filters all three zones.
 * 2. ACT — today's rules. This is the whole job of the page and it used to be
 *    third on the screen, under the report on having done it.
 * 3. REVIEW — three tiles that add up, then the calendar, then the archive.
 *
 * ── What was deleted, and why ────────────────────────────────────────────────
 *
 * The page used to state its progress five ways with four denominators, from a
 * single screen: `Day 4 of 75`, `5 of 75 days done`, `70 to go`, `7%`,
 * `70 Days left`, `9/75 Elapsed`. Each was correct under its own definition and
 * the page named none of them, so 4, 5, 9 and 70 read as four contradictory
 * counts of the same thing.
 *
 * Now every number on the page belongs to one arithmetic:
 *
 *     days done + days missed + today = the day you are on = `elapsedDay`
 *
 * `progressDay` is gone from the app entirely (it was `streak + 1` on a strict
 * challenge, which is the streak said twice). The strict reset story is told by
 * the streak fact and the pill, which is where it was always legible.
 *
 * Also gone: the progress ring and the progress bar — both restated the percent
 * printed beside them, and the calendar shows the same shape with the dates
 * attached. `Days left` (duration − completed) is gone, because it counted a
 * different thing from `Day n of N` and was the number that made the set read
 * as broken.
 */
export function Challenges() {
  const { data, addChallenge } = useJournal()
  const [creating, setCreating] = useState(false)
  const [focusId, setFocusId] = useState<string | null>(null)
  /**
   * WHICH DAY THE CALENDAR IS SHOWING, and the bug it closes.
   *
   * `challengeNotes` had exactly one reader — `RuleNote`, rendered for `today`
   * and for no other day — so a note written this morning ("Ran 5k with Sam")
   * could never be read back, corrected or removed. That is
   * `docs/USER-CONTROL.md`'s rule that add without edit is a bug, in the same
   * shape as Home Workout's history, and `lib/demo.ts` had been seeding 14
   * notes across 7 days that nothing on the page could show.
   *
   * Not sticky: it is one visit's "what did I do on day 43", not a preference.
   */
  const [picked, setPicked] = useState<string | null>(null)
  const all = data.challenges ?? []
  const active = all.filter((c) => !c.archived)
  const archived = all.filter((c) => c.archived)

  // Fall back to the first active challenge rather than trusting the stored id:
  // the focused one can be archived or deleted out from under this state, and a
  // dangling id would render an empty page with no way back.
  const focused = active.find((c) => c.id === focusId) ?? active[0]
  /* THE ONE PAGE WITH A LOGGING ZONE 2 AND NO WAY TO PUT IT AWAY.
     Every other act column in the app collapses to a 41px strip when the page
     stacks; this one rendered its day card at full height above the review —
     **642px at 390** — because it never adopted `useActColumn`. Same hook,
     same strip, same shell-driven default as Cycle, Fitness, Gym, Nutrition,
     Pickleball and (now) Pull-ups and Home workout.

     It does NOT collapse while `creating`, or with no challenge yet: a form
     you just opened must stay open, and the empty state's zone 2 is the
     page's primary action rather than a record of anything. A strip over
     "Start a challenge" would put the only thing to do behind a tap. */
  const logCol = useActColumn('challenges')
  const today = todayISO()

  return (
    <PageLayout
      tier={1180}
      zone1={focused && (() => {
        /* THE SENTENCE, then the facts. `docs/PAGE-ROLLOUT.md` step 6, and
           this was the last page without one: zone 1 said `Today 3 of 5
           rules · Day 9 of 75 · Streak 2 · Complete 8%` — four true figures,
           none of which tells you that the rule you keep dropping is the
           water one.

           COLOUR IS URGENCY and nothing else, in the edge and the glyph, with
           `fg-1` text — the accent-on-wash calibration trap in CLAUDE.md.

           Only `weak` is a button, because only `weak` has somewhere to go:
           it is about the rule-by-rule panel, and clearing the picked day is
           what shows it. The rest are paragraphs, which is what
           `NextStepBlock` renders without an `onPick` — a sentence that looks
           pressable and is not is worse than one that does nothing. */
        const step = nextStep(data, focused, today)
        const tone = { 'not-started': 'teal', finished: 'green', reset: 'peach', left: 'mauve', weak: 'yellow', done: 'green' }[step.id]
        const StepIcon = { 'not-started': Clock, finished: Trophy, reset: Warning, left: Target, weak: Warning, done: CheckCircle }[step.id]
        return (
          <div>
            <NextStepBlock
              text={step.text}
              tone={tone}
              icon={StepIcon}
              destination={step.toRules ? 'Rule by rule' : undefined}
              onPick={step.toRules ? () => setPicked(null) : undefined}
            />
            <StatBar
              mode={active.length > 1 ? focused.id : undefined}
              onModeChange={active.length > 1 ? setFocusId : undefined}
              segments={active.length > 1 ? active.map((c) => ({ value: c.id, label: c.name })) : undefined}
              facts={orientFacts(data, focused, today)}
            />
          </div>
        )
      })()}
      onSplitChange={logCol.onSplitChange}
      actShut={logCol.shut && !!focused && !creating}
      zone2={
        logCol.shut && focused && !creating ? (
          <ActStrip
            label="Today"
            summary={`${focused.name} · ${rulesDoneOn(data, focused.id, today).length} of ${focused.rules.length} ticked`}
            onOpen={logCol.open}
          />
        ) : creating ? (
          <Card band hideInfo title="New challenge" right={
            <Button variant="ghost" size="icon-sm" onClick={() => setCreating(false)} aria-label="Cancel new challenge">
              <Icon as={X} size="sm" />
            </Button>
          }>
            <NewChallengeForm onCreate={(c) => { addChallenge(c); setCreating(false) }} />
          </Card>
        ) : focused ? (
          <TodayCard challenge={focused} onShut={logCol.close} />
        ) : (
          <Card band hideInfo title="Start a challenge" subtitle="75 Hard, 90-day, or your own rules">
            <p className="mb-3 text-body text-fg-2">
              A challenge is a fixed number of days and a short list of rules you tick off each one.
            </p>
            <Button variant="primary" size="lg" className="w-full" onClick={() => setCreating(true)}>
              <Icon as={Plus} size="sm" /> New challenge
            </Button>
          </Card>
        )
      }
      zone3={<>
        <SummaryStrip items={reviewTiles(data, focused, today)} />

        {focused ? (
          /* THE REVIEW IS TWO COLUMNS, because it was one 262px calendar in a
             678px column at 1440 and in a **1,062px** column at 1920 — 61% and
             75% of the zone was nothing at all, and the only interactive thing
             in it was the New-challenge button.

             `@container/review` on a WRAPPER, and the split queried against it:
             an element cannot query itself, and the zone's width is decided by
             the page split rather than by the window, so a `lg:` here would be
             the wrong question twice over. 38rem is the real threshold — a
             262px calendar, a 16px gap and a panel with ~320px to be readable
             in. */
          <div className="@container/review">
            <div className="grid items-start gap-4 @min-[38rem]/review:grid-cols-[auto_minmax(0,1fr)]">
              <ChallengeCalendar challenge={focused} today={today} picked={picked} onPick={setPicked} />
              <DayPanel challenge={focused} today={today} picked={picked} onClear={() => setPicked(null)} />
            </div>
          </div>
        ) : (
          <EmptyFrame>Your day grid fills in here once a challenge is running.</EmptyFrame>
        )}

        {focused && !creating && (
          <div className="border-t border-line pt-3">
            <Button variant="ghost" size="sm" onClick={() => setCreating(true)}>
              <Icon as={Plus} size="sm" /> New challenge
            </Button>
          </div>
        )}

        {archived.length > 0 && (
          <QuietSection
            title={<>Completed &amp; archived</>}
            subtitle={`${archived.length} past challenge${archived.length === 1 ? '' : 's'}`}
          >
            <ul className="space-y-2 text-body">
              {archived.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-card bg-ink-2 px-3 py-2">
                  <span className="text-fg-1">
                    <Icon as={Trophy} size="sm" className="mr-1 inline text-fg-2" />{c.name} · {c.durationDays} days
                  </span>
                  <span className="text-label text-fg-2">{completedDays(data, c, today)} days done</span>
                </li>
              ))}
            </ul>
          </QuietSection>
        )}
      </>}
    />
  )
}

/**
 * The three counts that partition the elapsed window, so the strip is an
 * arithmetic rather than a pile: done + missed + (today, if still open) is the
 * day you are on. `Days left` used to sit here as duration − completed, which
 * counts from a different origin and is why the old set never added up.
 */
function reviewTiles(data: JournalData, c: Challenge | undefined, today: string) {
  if (!c) {
    return [
      { label: 'Days done', value: 0, empty: true },
      { label: 'Days missed', value: 0, empty: true },
      { label: 'Best streak', value: 0, empty: true },
    ]
  }
  return [
    { label: 'Days done', value: completedDays(data, c, today) },
    { label: 'Days missed', value: missedDays(data, c, today) },
    { label: 'Best streak', value: longestStreak(data, c, today) },
  ]
}

/** Zone 1. Four facts, each of which changes what you do in the next minute. */
function orientFacts(data: JournalData, c: Challenge, today: string) {
  const notStarted = dayDiff(c.startDate, today) < 0
  const finished = isFinished(data, c, today)
  const done = rulesDoneOn(data, c.id, today)
  const streak = streakBeforeToday(data, c, today) + (isDayComplete(data, c, today) ? 1 : 0)
  return [
    {
      label: 'Today',
      value: notStarted ? 'Not started' : finished ? 'Complete' : `${done.length} of ${c.rules.length} rules`,
      prose: notStarted || finished,
    },
    { label: 'Day', value: `${elapsedDay(c, today)} of ${c.durationDays}` },
    { label: 'Streak', value: streak },
    { label: 'Complete', value: `${percentComplete(data, c, today)}%` },
  ]
}

/** Zone 2 · the act. Tick today's rules; nothing else. */
function TodayCard({ challenge: c, onShut }: {
  challenge: Challenge
  /* Put the column away. Every other act column in the app can be shut from
     inside it; without this the strip is reachable once and never again,
     which `docs/USER-CONTROL.md` calls an affordance with no way back. */
  onShut?: () => void
}) {
  const confirm = useConfirm()
  const { data, updateChallenge, removeChallenge } = useJournal()
  const today = todayISO()
  const done = rulesDoneOn(data, c.id, today)
  const finished = isFinished(data, c, today)
  const notStarted = dayDiff(c.startDate, today) < 0

  return (
    <Card band hideInfo
      title={
        <span className="flex flex-wrap items-center gap-2">
          {c.name}
          {/* Neutral, not red. The contract spends a page's one accent on the
              primary button; a status pill that fills with a hue competes with
              it. The six words carry the stake on their own — which is why the
              copy is unchanged. */}
          {c.strict && (
            <span className="rounded-pill border border-line px-2 py-0.5 text-micro font-medium text-fg-2">
              strict · resets on a miss
            </span>
          )}
        </span>
      }
      subtitle={notStarted ? `Starts ${c.startDate}` : finished ? 'Finished' : `${done.length} of ${c.rules.length} done`}
      right={
        <div className="flex items-center gap-1">
          {onShut && <ActHide what="today" onHide={onShut} />}
          <Button variant="ghost" size="icon-sm" onClick={() => updateChallenge(c.id, { archived: true })} aria-label="Archive challenge" title="Archive">
            <Icon as={Archive} size="sm" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Delete challenge" className="text-danger-text"
            onClick={async () => {
              if (await confirm({
                title: `Delete the “${c.name}” challenge?`,
                description: 'Its progress log and streak are deleted with it. This cannot be undone.',
                confirmLabel: 'Delete challenge', destructive: true,
              })) removeChallenge(c.id)
            }}>
            <Icon as={Trash} size="sm" />
          </Button>
        </div>
      }
    >
      {finished ? (
        <p className="flex items-center gap-1.5 rounded-card border border-line bg-ink-2 px-3 py-2 text-body text-fg-1">
          <Icon as={Trophy} size="sm" /> {c.durationDays} days done. Archive it to close it out.
        </p>
      ) : notStarted ? (
        <p className="text-body text-fg-2">Nothing to tick yet · day 1 is {c.startDate}.</p>
      ) : c.rules.length === 0 ? (
        <p className="text-body text-fg-2">This challenge has no rules, so every day counts as done.</p>
      ) : (
        <RuleChecklist challenge={c} day={today} />
      )}
    </Card>
  )
}

/**
 * A DAY'S RULES, TICKABLE, FOR ANY DAY — not only today.
 *
 * It was inside `TodayCard` and hard-wired to `today`, which is the whole
 * reason a past day's notes could not be read: `toggleChallengeRule` and
 * `setChallengeRuleNote` have always taken a `day` argument, and the store has
 * always been able to correct any of the seventy-five. The capability was
 * there and the affordance was not — the same finding `docs/USER-CONTROL.md`
 * was written after Home Workout shipped a history whose only control deleted
 * on the first click.
 */
function RuleChecklist({ challenge: c, day }: { challenge: Challenge; day: string }) {
  const { data, toggleChallengeRule } = useJournal()
  const done = rulesDoneOn(data, c.id, day)
  return (
    <ul className="space-y-1.5">
      {c.rules.map((rule, i) => {
        const ruleDone = done.includes(i)
        return (
          <li key={i}>
            {/* A checkbox, not a switch. Ticking a rule records that a thing
                happened on a date; a switch says a setting is on from now
                until you change it. `min-h-11` because the whole row is the
                target (WCAG 2.5.5) — the 20px box is the mark, not the hit
                area. */}
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-card bg-ink-2 px-3 py-2 text-body">
              <Checkbox checked={ruleDone} onCheckedChange={() => toggleChallengeRule(c.id, day, i)} />
              <span className={ruleDone ? 'text-fg-2 line-through' : 'text-fg-1'}>{rule}</span>
            </label>
            {/* A rule used to be a string and a tick, which says a day counted
                and nothing about what happened. 75 Hard asks for "Two 45-min
                workouts (1 outdoor)" — you could mark it done and never record
                WHICH two, or which was the outdoor one. Reported exactly that
                way: "what kind of workout should I enter in here?"

                Only on a ticked rule. An empty box under every unticked rule
                is four fields of clutter on a card whose job is a four-second
                daily tick, and there is nothing to describe until the thing
                has happened. */}
            {ruleDone && <RuleNote challengeId={c.id} day={day} index={i} />}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * ZONE 3's SECOND COLUMN · what the calendar is pointing at.
 *
 * WHAT THIS OWNS: the answer to "what did I do on day 43", and the standing
 * answer when no day is picked.
 * WHAT IT DOES NOT OWN: ticking today — that is zone 2, the act.
 *
 * ── With no day picked ───────────────────────────────────────────────────
 *
 * Rule by rule, over the elapsed window. The page could say how many days
 * were complete and never WHICH rule broke them, so "I keep missing a day"
 * had no answer on the screen — and on a 75-day challenge there is almost
 * always one rule costing the rest. It shares its origin with `completedDays`
 * and `missedDays`, so the figures here can be read against `Day n of N`
 * without a second arithmetic; `lib/challenges.test.ts` pins that.
 *
 * This is the standing content rather than a "pick a day" placeholder on
 * purpose: a column that is empty until you interact with something else is
 * the 75% of dead width this split was opened to spend.
 *
 * ── With a day picked ────────────────────────────────────────────────────
 *
 * That day's rules, tickable, with their notes — the same `RuleChecklist` the
 * act renders, because correcting day 43 and ticking today are one operation
 * with a different argument.
 *
 * A future day gets a sentence instead of checkboxes. "You have not done it
 * yet" and "you missed it" are different claims, and a tickable box on a day
 * that has not happened invites the first to be recorded as the second.
 */
function DayPanel({ challenge: c, today, picked, onClear }: {
  challenge: Challenge
  today: string
  picked: string | null
  onClear: () => void
}) {
  const { data } = useJournal()

  if (!picked) {
    const rows = ruleCompletion(data, c, today)
    return (
      /* `data-day-panel` names what the column is showing — "rules" or the
         ISO day. A test that merely looked for a rule's text would match the
         act column's copy of it and pass with this panel missing entirely,
         which is the scan-that-matches-the-wrong-thing trap. */
      <div data-day-panel="rules">
      <Card band hideInfo title="Rule by rule" subtitle="Across the days so far — tap any day for what you did">
        {rows.length === 0 ? (
          <p className="text-body text-fg-2">This challenge has no rules, so every day counts as done.</p>
        ) : (
          <ul className="space-y-1.5">
            {rows.map((r) => (
              <li key={r.index} className="flex items-baseline justify-between gap-3 rounded-card bg-ink-2 px-3 py-2">
                <span className="min-w-0 text-body text-fg-1">{r.rule}</span>
                {/* The count, not a percentage: on a 9-day window "67%" is
                    three significant figures over a sample of nine, and the
                    denominator is the thing that makes it honest. */}
                <span className="shrink-0 text-label text-fg-2">
                  <span className="num text-fg-1">{r.done}</span> of {r.of}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      </div>
    )
  }

  const n = dayDiff(c.startDate, picked) + 1
  const ahead = dayDiff(picked, today) < 0
  const complete = isDayComplete(data, c, picked)
  const state = complete ? 'every rule ticked' : ahead ? 'still to come' : picked === today ? 'open — today' : 'not completed'

  return (
    <div data-day-panel={picked}>
    <Card
      band
      hideInfo
      title={`Day ${n} · ${prettyDay(picked)}`}
      subtitle={state}
      right={
        <Button variant="ghost" size="sm" onClick={onClear} aria-label="Back to rule by rule">
          <Icon as={CaretLeft} size="sm" /> Back
        </Button>
      }
    >
      {ahead ? (
        <p className="text-body text-fg-2">Day {n} has not happened yet.</p>
      ) : c.rules.length === 0 ? (
        <p className="text-body text-fg-2">This challenge has no rules, so every day counts as done.</p>
      ) : (
        <RuleChecklist challenge={c} day={picked} />
      )}
    </Card>
    </div>
  )
}

/**
 * What a rule actually was, on a day.
 *
 * Free text, with the day's logged workouts offered as one-tap fills. The fills
 * are the point: a 45-minute workout rule and the workout you logged this
 * morning were two records of one event with nothing joining them, and the
 * cheapest honest join is to let the user put the session's own name in the
 * note rather than invent a schema relation and a matching heuristic. Pressing
 * a chip is the user asserting the link, which is the one thing a heuristic
 * cannot do correctly.
 *
 * Saved on blur rather than per keystroke: this writes to the journal, and the
 * journal is what every sync target debounces on.
 */
function RuleNote({ challengeId, day, index }: { challengeId: string; day: string; index: number }) {
  const { data, setChallengeRuleNote } = useJournal()
  const saved = data.challengeNotes?.[challengeRuleKey(challengeId, day, index)] ?? ''
  const [text, setText] = useState(saved)
  // The saved value is the source of truth when it changes underneath (a sync
  // pull, another device); the local state exists only so typing is not a
  // journal write per character.
  const [seen, setSeen] = useState(saved)
  if (saved !== seen) { setSeen(saved); setText(saved) }
  const todaysWorkouts = (data.workouts ?? []).filter((w) => w.date === day)
  return (
    <div className="mt-1 ml-3 space-y-1">
      <label className="block">
        <span className="sr-only">What was it?</span>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => setChallengeRuleNote(challengeId, day, index, text)}
          placeholder="What was it? (optional)"
          className="text-body"
        />
      </label>
      {todaysWorkouts.length > 0 && text.trim() === '' && (
        <div className="flex flex-wrap items-center gap-1">
          {/* "today" only when it IS today. The note editor now opens on any
              of the seventy-five days, and a Day-6 panel offering "Logged
              today" above two sessions from October 13th is a label making a
              claim about a date it is not on. */}
          <span className="text-micro text-fg-2">{day === todayISO() ? 'Logged today:' : 'Logged that day:'}</span>
          {todaysWorkouts.map((w) => {
            // `fullLabelOf`, so the chip carries the sub-activity too — "Run ·
            // Intervals" rather than "Run", which is exactly the detail this
            // whole change is about not losing.
            const label = [fullLabelOf(w.activity, w.subActivity), w.durationMin ? `${w.durationMin} min` : null]
              .filter(Boolean)
              .join(' · ')
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => { setText(label); setChallengeRuleNote(challengeId, day, index, label) }}
                className="rounded-pill bg-ink-2 px-2 py-1 text-micro text-fg-1 hover:bg-ink-3 active:scale-95"
              >
                {label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Zone 3's signature visual · one numbered cell per day of the challenge.
 *
 * Not `CalendarHeatmap`/`DayGrid`: those are week-columned trailing windows and
 * carry no text in a cell. A challenge is a sequence from day 1 to day N and
 * the day *number* is the thing people count in — "I'm on day 43" — so the
 * numbers stay and the grid runs in challenge order, not calendar order.
 *
 * Each cell carries its state as hidden text as well as colour. The old grid
 * put it in a `title` only, which is skipped outright on touch and by several
 * screen-reader pairings — the state was conveyed by colour alone.
 *
 * Always renders, including before the start date: an empty grid says "this is
 * where your 75 days will be", which is worth more than the space it costs.
 */
function ChallengeCalendar({ challenge: c, today, picked, onPick }: {
  challenge: Challenge
  today: string
  picked: string | null
  onPick: (day: string) => void
}) {
  const { data } = useJournal()
  return (
    // `w-fit`, so the heading and the legend sit over the grid rather than at
    // the far edge of a 700px review column. The grid is ~290px wide and the
    // column is not; justifying to the column put the legend a third of a
    // screen away from the colours it names.
    <div className="w-fit">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="text-label font-medium text-fg-1">Calendar</p>
        <div className="flex items-center gap-3 text-micro text-fg-2" aria-hidden="true">
          <span className="inline-flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: cat('mauve') }} /> done</span>
          <span className="inline-flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: cat('red') + '22' }} /> missed</span>
          <span className="inline-flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-[2px] border" style={{ borderColor: cat('mauve') }} /> today</span>
        </div>
      </div>
      <ul className="grid w-fit grid-cols-7 gap-1">
        {Array.from({ length: c.durationDays }).map((_, i) => {
          const d = addDays(c.startDate, i)
          const complete = isDayComplete(data, c, d)
          const isToday = d === today
          const past = dayDiff(d, today) > 0
          const state = complete ? 'done' : isToday ? 'today' : past ? 'missed' : 'to come'
          // Missed used to be `surface0` — visually identical to `mantle`'s
          // to-come cells, so the one state a strict challenge exists to
          // surface was the one the grid could not show. The 13% red wash is
          // the app's calibrated accent-on-wash idiom (see CLAUDE.md: '22',
          // never '33'), with the day number in the accent itself.
          const bg = complete ? cat('mauve') : isToday ? 'transparent' : past ? cat('red') + '22' : cat('mantle')
          const isPicked = d === picked
          return (
            <li key={d}>
              {/* A BUTTON, not a cell. Seventy-five of these reached nothing —
                  `docs/PAGE-ROLLOUT.md` step 7 is that every grouped figure
                  opens the rows behind it, and this grid had no implementation
                  of it at all, which is also why the day's notes were
                  unreadable.

                  No `aria-label`: the painted number plus the `sr-only` state
                  already name it, and a label that replaced them would have to
                  contain the drawn text anyway (`label-content-name-mismatch`).
                  `aria-pressed` carries the selection, because the ring around
                  a picked day is colour alone.

                  34px, not the old 28px: seven of these plus gaps is 286px,
                  which still fits a 390px phone, and the day number is the
                  thing people count in — "I'm on day 43" — so it should be
                  readable at a glance rather than a 10px tick. */}
              <button
                type="button"
                onClick={() => onPick(d)}
                aria-pressed={isPicked}
                className="grid h-[34px] w-[34px] place-items-center rounded-[2px] text-label transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring active:scale-95"
                style={{
                  background: bg,
                  border: isPicked
                    ? `2px solid ${cat('text')}`
                    : isToday ? `1.5px solid ${cat('mauve')}` : `1px solid ${cat('surface0')}`,
                  color: complete ? onAccent(cat('mauve')) : !isToday && past ? cat('red') : cat('subtext0'),
                }}
              >
                {i + 1}
                <span className="sr-only">{` · day ${i + 1}, ${d}, ${state}`}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function NewChallengeForm({ onCreate }: { onCreate: (c: Omit<Challenge, 'id'>) => void }) {
  const [presetName, setPresetName] = useState(CHALLENGE_PRESETS[0].name)
  const preset = CHALLENGE_PRESETS.find((p) => p.name === presetName)!
  const [name, setName] = useState(preset.name)
  const [duration, setDuration] = useState(String(preset.durationDays))
  const [strict, setStrict] = useState(preset.strict)
  const [rules, setRules] = useState(preset.rules.join('\n'))
  const [startDate, setStartDate] = useState(todayISO())

  function choosePreset(pn: string) {
    const p = CHALLENGE_PRESETS.find((x) => x.name === pn)!
    setPresetName(pn)
    setName(p.name === 'Custom' ? '' : p.name)
    setDuration(String(p.durationDays))
    setStrict(p.strict)
    setRules(p.rules.join('\n'))
  }

  function submit() {
    const ruleList = rules.split('\n').map((r) => r.trim()).filter(Boolean)
    if (!name.trim() || ruleList.length === 0 || !Number(duration)) {
      notify.info('A challenge needs three things', 'A name, a number of days, and at least one rule.')
      return
    }
    onCreate({ name: name.trim(), durationDays: Number(duration), startDate, rules: ruleList, strict })
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-label text-fg-2">Preset</p>
        <Segmented
          value={presetName}
          onChange={choosePreset}
          options={CHALLENGE_PRESETS.map((p) => ({ value: p.name, label: p.name }))}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-body text-fg-1">Name<Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My challenge" className="mt-1" /></label>
        <label className="block text-body text-fg-1">Days<Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1" /></label>
        <label className="block text-body text-fg-1">Start<Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" /></label>
      </div>
      <label className="block text-body text-fg-1">
        Daily rules (one per line)
        <textarea
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          rows={4}
          placeholder={'Two 45-min workouts\nDrink water\nRead 10 pages'}
          className="mt-1 w-full rounded-control border border-ctl-ring bg-ink-2 px-3 py-2 text-body text-fg-1 placeholder:text-fg-2 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        />
      </label>
      <label className="flex cursor-pointer items-center justify-between text-body text-fg-1">
        <span>Strict · missing a day resets to day 1 (the 75 Hard rule)</span>
        <Switch checked={strict} onCheckedChange={setStrict} />
      </label>
      <Button variant="primary" size="lg" onClick={submit} className="w-full">Start challenge</Button>
    </div>
  )
}
