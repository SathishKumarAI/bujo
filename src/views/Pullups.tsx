import { useStickyState } from '../lib/useStickyState'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowCounterClockwise } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../store'
import { Card, Input, Segmented, Textarea } from '../components/ui'
import { Button } from '../components/ui/button'
import { ChipPick, DayPick, Stepper, type ChipTone } from '../components/ui/quickpick'
import { ProgramTracker } from '../components/program'
import { VideoLink } from '../components/VideoLink'
import {
  PageLayout, StatBar, SummaryStrip, CalendarHeatmap, EmptyFrame, SectionRail,
} from '../components/page'
import { onRaised } from '../lib/colors'
import { addDays, dayDiff, prettyDay, todayISO } from '../lib/date'
import type { Workout } from '../lib/types'
import {
  pullupAbility, ladder, pyramid, repScheme, setLines, repsOf, bestSet,
  PULLUP_ABILITY, PULLUP_WORKOUTS, PULLUP_PROGRESSIONS, PULLUP_FORM,
  PULLUP_PRINCIPLES, PULLUP_EQUIPMENT, PULLUP_METHODS, type PullupMethod,
} from '../lib/pullups'
import { ShowMore } from '../components/ShowMore'
import { useCappedList, type CappedList } from '../lib/useCappedList'

/**
 * PULL-UPS · the training manual, and the place a pull-up session is recorded.
 *
 * A Body tab, not a Fitness companion. The rule `shell/sections.ts` states is
 * "does the target hold anything the Fitness activity form does not", and this
 * holds the six-week program tracker, the ability calculator, the rep-scheme
 * builder and the whole guide — none of which a duration field can carry. It
 * was reachable only by selecting Pull-ups on the Fitness activity picker and
 * then finding a link, which is the same shape of hole Strength and Pickleball
 * were in.
 *
 * On the three-zone contract:
 * - ORIENT  · what to pull today, and what is left in the week.
 * - ACT     · the session recorder. One card, alone in the right-hand column.
 * - REVIEW  · one rail, eight panels, one at a time. See `Review`.
 *
 * The manual is reference and the contract says there is no zone 4, so it is
 * not a page of its own — this page *is* the manual, and a guide split from the
 * log it teaches you to fill in is a guide nobody opens. It shares the review
 * zone's rail with the history, the calendar and the program, because they are
 * peers in the sense that matters: you want one of them and you know which.
 *
 * Both rendering gates grade the panel the rail opens on, so a number quoted
 * for this page describes `history` and nothing else (COD-237). Drive the rail
 * per panel when you measure it.
 *
 * A session is stored as a plain `Workout` with `activity: 'pullups'` — the
 * scheme is written out one `Pull-up 1xN @ 0kg` line per set, so the existing
 * strength analytics, CSV export and search read it without knowing this page
 * exists. See `lib/pullups.ts` `setLines` for why one line per set.
 */
export function Pullups() {
  const { data, addWorkout, removeWorkout } = useJournal()
  const today = todayISO()

  const sessions = useMemo(
    () => data.workouts.filter((w) => w.activity === 'pullups').sort((a, b) => (a.date < b.date ? 1 : -1)),
    [data.workouts],
  )

  // Your max is the biggest set you have logged — a fact, not a field you have
  // to remember to update. The input below overrides it for "what if", and
  // deliberately does not persist: a typed number that outlived the session
  // would quietly outrank the real one.
  const logged = useMemo(() => bestSet(sessions), [sessions])
  const [maxInput, setMaxInput] = useState('')
  const max = maxInput === '' ? logged : Number(maxInput) || 0
  const ability = pullupAbility(max)

  const weekReps = sessions
    .filter((s) => { const d = dayDiff(s.date, today); return d >= 0 && d < 7 })
    .reduce((a, s) => a + repsOf(s.sets), 0)
  const last = sessions[0]

  const facts = [
    { label: 'Training set', value: `${ability.trainingSet} rep${ability.trainingSet === 1 ? '' : 's'}` },
    { label: 'This week', value: `${weekReps} reps` },
    { label: 'Weekly target', value: ability.weekly, prose: true },
    {
      label: 'Last session',
      value: last ? `${repsOf(last.sets)} reps · ${prettyDay(last.date)}` : 'None yet',
      prose: true,
    },
  ]

  const totalReps = sessions.reduce((a, s) => a + repsOf(s.sets), 0)
  // Was `slice(0, 12)` with no affordance — row 13 was unreachable, and
  // nothing on screen said so (COD-303).
  const history = useCappedList(sessions)

  const heat = useMemo(
    () => sessions.map((s) => ({ date: s.date, value: repsOf(s.sets) })),
    [sessions],
  )

  return (
    <PageLayout
      tier={1180}
      zone1={<StatBar facts={facts} />}
      zone2={<LogSessionCard defaultTop={ability.trainingSet} onSave={addWorkout} last={last} />}
      zone3={
        <Review
          sessions={sessions}
          history={history}
          heat={heat}
          totalReps={totalReps}
          best={logged}
          max={max}
          maxInput={maxInput}
          onMax={setMaxInput}
          onRemove={removeWorkout}
        />
      }
    />
  )
}

/**
 * The ability panel's calculator · max strict pull-ups → set, schemes, volume.
 *
 * It was a zone-2 card sitting above the log form, and it is not an act: you
 * read it, and what you do with it is type a different number to see what the
 * table would say. It also stated the same five rows the `PULLUP_ABILITY` table
 * two inches below it states for every group, so the page said "training set 3"
 * three times — once in zone 1, once here, once in the table.
 *
 * Now it is the head of the `ability` panel, directly above that table, which
 * is the one place where "your row" and "every row" belong together. Zone 2 is
 * the log form alone, and the act column is the narrow right-hand one
 * (`layout.css` places `.zone-act` at `grid-column: 2`), so the 722px review
 * column is where the table had room to begin with.
 */
function TrainingSetCalc({
  max, maxInput, onMax, logged,
}: {
  max: number
  maxInput: string
  onMax: (v: string) => void
  logged: number
}) {
  const a = pullupAbility(max)
  const set = a.trainingSet
  return (
    <div className="mb-4 rounded-card border border-line bg-ink-1 p-3">
      <label className="mb-3 flex items-center justify-between gap-3 text-body text-fg-1">
        Max strict pull-ups
        <Input
          type="number"
          min={0}
          inputMode="numeric"
          value={maxInput}
          placeholder={String(logged)}
          onChange={(e) => onMax(e.target.value)}
          className="num w-20 py-1 text-right"
        />
      </label>
      <div className="space-y-1.5 text-body">
        <Row label="Training set"><span style={{ color: onRaised('mauve') }}>{set} rep{set === 1 ? '' : 's'}/set</span></Row>
        <Row label="Ladder"><span className="num text-fg-1">{ladder(set).join(', ')}</span></Row>
        <Row label="Pyramid"><span className="num text-fg-1">{pyramid(set).join(', ')}</span></Row>
        {/* Daily only. The weekly target is a zone-1 fact, and printing it
            twice on one screen is how a page comes to have nothing quiet on
            it. The ability-ladder panel carries both for every group. */}
        <Row label="Daily volume" divide><span className="text-fg-1">{a.daily}</span></Row>
      </div>
      {logged === 0 && maxInput === '' && (
        <p className="mt-3 text-label text-fg-2">
          Nothing logged yet, so this reads as a beginner. Type your max above, or log a set and it takes the number from your history.
        </p>
      )}
    </div>
  )
}

function Row({ label, children, divide = false }: { label: string; children: React.ReactNode; divide?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${divide ? 'border-t border-line pt-1.5' : ''}`}>
      <span className="text-fg-2">{label}</span>
      {children}
    </div>
  )
}

/**
 * rpe is jargon. These are the words people actually use for the same scale,
 * and the colour is the scale rather than decoration — green through to red,
 * in the one row on the page whose options are ordered by severity.
 *
 * `Med`, not `Moderate`: the row shares the 424px act column with Duration, so
 * each has about 204px, and `Moderate` alone is 76px of it. The full word is
 * the chip's `aria-label` and the first word of its tooltip, so nothing is
 * lost to a screen reader or to a hover — only to the 8px of pill padding that
 * was costing the row a second line.
 */
const EFFORT: { value: number; label: string; name: string; hint: string; tone: ChipTone }[] = [
  { value: 6, label: 'Easy', name: 'Easy', tone: 'green', hint: 'Easy · RPE 6 — could have done many more' },
  { value: 7.5, label: 'Med', name: 'Moderate', tone: 'yellow', hint: 'Moderate · RPE 7.5 — three or four left in the tank' },
  { value: 9, label: 'Hard', name: 'Hard', tone: 'peach', hint: 'Hard · RPE 9 — one more, maybe' },
  { value: 10, label: 'Max', name: 'Max', tone: 'red', hint: 'Max · RPE 10 — nothing left' },
]

/**
 * LOG A SESSION · one tap for the usual case, typing only when it differs.
 *
 * It was seven controls, four of them empty number boxes — top set, rounds,
 * duration, effort — so the most common session in the app ("the same as last
 * time") cost four numeric keyboards on a phone. The values are not arbitrary:
 * rounds are 2–5, effort is a four-point scale, a session is 10–30 minutes.
 * A free-text box for a value with four likely answers is the most expensive
 * control on the page, and it was the default for all of them.
 *
 * What changed, in order of how much time it saves:
 *
 * 1. **Repeat last** — one tap writes the previous session on today's date.
 *    The thing people do most often had no path at all.
 * 2. **The top set is a stepper**, pre-filled with the recommendation, so the
 *    default case is *zero* interactions rather than "type the number already
 *    printed above you in grey".
 * 3. **Effort is words.** "rpe" is jargon, and an unlabelled 1–10 box is a
 *    question most people skip — which is why it was almost always empty.
 * 4. **Rounds and duration are chips** with a typed escape hatch.
 * 5. **The date is Today / Yesterday**, picker behind them.
 *
 * The rep-scheme readout was already here and was the quietest thing on the
 * card. It is the only element that tells you a ladder to 4 and a straight 4×4
 * are different sessions, so it is now the loudest.
 */
function LogSessionCard({
  defaultTop, onSave, last,
}: {
  defaultTop: number
  onSave: (w: Parameters<ReturnType<typeof useJournal>['addWorkout']>[0]) => void
  /** The previous session, for Repeat last. Absent on a fresh journal. */
  last?: Workout
}) {
  const today = todayISO()
  const [date, setDate] = useState(today)
  const [method, setMethod] = useState<PullupMethod>('straight')
  const [top, setTop] = useState<number | undefined>(undefined)
  const [rounds, setRounds] = useState<number | undefined>(3)
  const [duration, setDuration] = useState<number | undefined>(undefined)
  const [rpe, setRpe] = useState<number | undefined>(undefined)
  const [notes, setNotes] = useState('')
  const [justLogged, setJustLogged] = useState<string | null>(null)

  const topN = top ?? defaultTop
  const flash = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(flash.current), [])
  const reps = repScheme(method, topN, rounds ?? 0)
  const total = reps.reduce((a, r) => a + r, 0)
  const hint = PULLUP_METHODS.find((m) => m.value === method)?.hint ?? ''

  function done(msg: string) {
    setJustLogged(msg)
    // Held and cleared, same as SmartInput's blur timer (COD-269). An unheld
    // 2600ms timer calling setState outlives the view if you log a set and
    // navigate away inside those 2.6 seconds — invisible in the app, because
    // React 18 swallows the update, but in a test it fires after the
    // environment is torn down and fails the whole run as an unhandled
    // `window is not defined` with every test passing.
    clearTimeout(flash.current)
    flash.current = setTimeout(() => setJustLogged(null), 2600)
  }

  function save() {
    if (reps.length === 0) return
    onSave({
      date,
      activity: 'pullups',
      durationMin: duration,
      rpe,
      sets: setLines(reps),
      notes: notes.trim(),
    })
    // Reset what describes THIS session; keep method and rounds, which are how
    // you train rather than what you did once.
    setTop(undefined)
    setDuration(undefined)
    setRpe(undefined)
    setNotes('')
    setDate(today)
    done(`${total} reps in ${reps.length} sets`)
  }

  /** The previous session again, on today. The most common log, as one tap. */
  function repeatLast() {
    if (!last) return
    onSave({
      date: today,
      activity: 'pullups',
      durationMin: last.durationMin,
      rpe: last.rpe,
      sets: last.sets ?? [],
      notes: '',
    })
    done(`Repeated ${repsOf(last.sets)} reps`)
  }

  return (
    <Card band title="Log a pull-up session" subtitle={hint}>
      <div className="space-y-4">
        {last && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={repeatLast} className="group/rep inline-flex items-center gap-1.5">
              <Icon as={ArrowCounterClockwise} size="sm" className="transition-transform duration-300 group-hover/rep:-rotate-180" />
              Repeat last
            </Button>
            <span className="min-w-0 truncate text-label text-fg-2">
              {repsOf(last.sets)} reps · {prettyDay(last.date)}
            </span>
          </div>
        )}

        <DayPick value={date} onChange={setDate} today={today} yesterday={addDays(today, -1)} />

        <div>
          <span className="mb-1.5 block text-body text-fg-1" id="pullup-method">Method</span>
          <div aria-labelledby="pullup-method">
            <Segmented
              value={method}
              onChange={setMethod}
              options={PULLUP_METHODS.map((m) => ({ value: m.value, label: m.label }))}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Stepper
            label="Top set"
            value={top}
            onChange={setTop}
            min={1}
            max={50}
            suffix="reps"
            placeholder={String(defaultTop)}
            hint={top === undefined ? `Using your training set, ${defaultTop}` : undefined}
          />
          <ChipPick
            label={method === 'emom' ? 'Minutes' : 'Rounds'}
            value={rounds ?? null}
            onChange={setRounds}
            // Five chips plus the escape hatch is exactly one row in the
            // act column; six wrapped the input onto a line of its own, which
            // reads as a broken control rather than an overflow.
            options={[2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))}
            after={
              <input
                type="number"
                min={1}
                max={60}
                inputMode="numeric"
                aria-label={method === 'emom' ? 'Minutes, another number' : 'Rounds, another number'}
                value={rounds !== undefined && rounds > 5 ? rounds : ''}
                placeholder="…"
                onChange={(e) => setRounds(e.target.value === '' ? undefined : Number(e.target.value))}
                className="w-14 rounded-pill border border-line-strong bg-ink-2 px-2 py-1.5 text-center text-label tabular-nums text-fg-1 placeholder:text-fg-3"
              />
            }
          />
        </div>

        {/* The scheme, spelled out. A ladder to 4 and a straight 4×4 both read
            as "4" in the form and are different sessions; showing the reps is
            what makes the difference visible before it is stored. It used to be
            grey 11px under the inputs — the one element that answers "what am I
            about to save", set as the quietest thing on the card. */}
        <output
          aria-live="polite"
          className="block rounded-card border border-brand/30 bg-brand-wash/40 px-3 py-2.5 text-center transition-colors duration-200"
        >
          {reps.length === 0 ? (
            <span className="text-body text-fg-2">Pick a top set and rounds to see the scheme.</span>
          ) : (
            <>
              <span className="num block text-heading font-medium text-fg-1">{reps.join(' · ')}</span>
              <span className="text-label text-fg-2">{total} reps in {reps.length} set{reps.length === 1 ? '' : 's'}</span>
            </>
          )}
        </output>

        {/*
          Effort and Duration, side by side, one line each.

          NOT the `sm:grid-cols-2` the pair above uses. The act column is the
          narrow one — 416px at a 1440 viewport — so equal halves are 184px,
          and measured there the effort row is 216px and the duration row
          207px: both wrapped to two lines, which is the shape that reads as a
          broken control rather than an overflow. `flex` lets each take its own
          width instead. The card's inner width at a 1440 viewport is **384px**
          — not the column's 416 — and the two rows plus the gap come to
          **378px** of it, one line each; on a 324px phone column they stack to
          a line apiece rather than four separate rows. The margin is 6px, so
          a fifth duration preset or a longer effort word costs a second line.

          That is also why Duration offers 10/20/30 and not 10/15/20/30 — the
          fourth chip is the 20px that did not fit, and 15 is a keystroke away
          in the escape input beside it.

          `1fr auto`, not `flex`: under flex both fieldsets take an `auto`
          basis and the longer hint under Effort claimed the width, leaving its
          own chip row 209px for 211px of chips. The duration column is the
          `auto` track because it is the fixed one — three chips and an escape
          input — and Effort takes what is left.
        */}
        <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[1fr_auto]">
          <ChipPick
            dense
            label="Effort"
            value={rpe ?? null}
            onChange={setRpe}
            options={EFFORT.map((e) => ({ value: e.value, label: e.label, name: e.name, hint: e.hint, tone: e.tone }))}
            hint="Optional · the last set"
          />

          {/* `min` in the legend, so the chips can be bare numbers. Four `15m`
              chips plus the escape input do not fit 204px; four `15`s do. */}
          <ChipPick
            dense
            // `shrink-0`: a flex item with a wrapping row inside it will give
            // up width before the row wraps, and the row wrapping is the thing
            // being prevented.
            className="shrink-0"
            label="Duration · min"
            value={duration ?? null}
            onChange={setDuration}
            options={[10, 20, 30].map((n) => ({ value: n, label: String(n), name: `${n} minutes` }))}
            hint="Optional."
            after={
              <input
                type="number"
                min={1}
                max={300}
                inputMode="numeric"
                aria-label="Duration in minutes, another number"
                value={duration !== undefined && ![10, 20, 30].includes(duration) ? duration : ''}
                placeholder="…"
                onChange={(e) => setDuration(e.target.value === '' ? undefined : Number(e.target.value))}
                className="w-10 rounded-pill border border-line-strong bg-ink-2 px-2 py-1 text-center text-label tabular-nums text-fg-1 placeholder:text-fg-3"
              />
            }
          />
        </div>

        <label className="block text-body text-fg-1">
          Notes
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Grip, how the last set felt…" className="mt-1" />
        </label>

        <Button onClick={save} disabled={reps.length === 0} className="w-full">Log session</Button>

        {/* Says what was written, where the button is — the receipt bar lives at
            the other end of the screen, and a form that empties itself with no
            word is indistinguishable from one that lost your input. */}
        <p aria-live="polite" className={`text-center text-label transition-opacity duration-300 ${justLogged ? 'opacity-100' : 'opacity-0'}`} style={{ color: onRaised('green') }}>
          {justLogged ? `Logged · ${justLogged}` : ' '}
        </p>
      </div>
    </Card>
  )
}
/**
 * Zone 3 · the whole review zone as one rail, eight panels, one at a time.
 *
 * ── Why the history and the calendar moved in here ─────────────────────────
 *
 * The rail already held the six manual chapters, and above it sat three more
 * peer sections stacked: the program tracker, the history list and an
 * "Analytics" section holding the summary strip and the heatmap. Measured as
 * shipped, at `?demo=1`: **1885px / 2.09 desktop screens and 3490px / 4.14 on
 * a phone**, of which the review zone was `859 + 47 + 375 + 385` — four
 * headings, and the rail's own table of contents was the last of them.
 *
 * That is the page the rail was introduced to fix, re-grown one section at a
 * time outside it. A rail is a table of contents for *peers*, and a session
 * list, a heatmap and a chapter about grip are peers in exactly the sense that
 * matters here: you want one of them, you know which, and you do not want to
 * scroll past the other seven to reach it. So there is now one navigation in
 * the review zone and nothing stacked beside it.
 *
 * History is the default panel, not Form. The page's act is logging a session;
 * what you look at immediately afterwards is the thing you just added to.
 * Form was the right default while this rail held only reference.
 *
 * ── `railAt="2xl"`, and the grid breakpoint that must match it ─────────────
 *
 * `SectionRail` defaults to `@4xl` (896px) and **zone 3 at the 1180 tier is
 * 722px**, so this call site could never reach it: the rail has been rendering
 * its phone chip strip on desktop since it shipped, which is the exact case
 * the component's `railAt` prop was added for. Eight rows made it visible —
 * six chips fitted the 722px box and eight do not.
 *
 * No "All" row: the panels do not overlap, and all eight at once is the page
 * this replaces.
 */
const PU_PANELS = [
  { id: 'history', label: 'History', blurb: 'Sessions, volume and the calendar' },
  { id: 'program', label: 'Program', blurb: 'Starting From Zero, week by week' },
  { id: 'form', label: 'Form', blurb: 'Set-up & execution' },
  { id: 'principles', label: 'Principles', blurb: 'How the program is meant to be run' },
  { id: 'ability', label: 'Training set', blurb: 'Your max → set, schemes, volume' },
  { id: 'formats', label: 'Workout formats', blurb: `${PULLUP_WORKOUTS.length} session structures` },
  { id: 'progressions', label: 'Progressions', blurb: 'Building toward a first strict rep' },
  { id: 'equipment', label: 'Equipment', blurb: 'Bar heights and what is worth buying' },
] as const

function Review({
  sessions, history, heat, totalReps, best, max, maxInput, onMax, onRemove,
}: {
  sessions: Workout[]
  history: CappedList<Workout>
  heat: { date: string; value: number }[]
  totalReps: number
  best: number
  max: number
  maxInput: string
  onMax: (v: string) => void
  onRemove: (id: string) => void
}) {
  const [chapter, setChapter] = useStickyState<string>(
    'pullups.chapter', 'history', PU_PANELS.map((c) => c.id),
  )
  const current = PU_PANELS.find((c) => c.id === chapter) ?? PU_PANELS[0]

  return (
    <section>
      {/* Container on the outer div, grid on the inner: an element cannot
          query itself. Phone column spelled out, or the chip row's
          min-content sizes the only implicit track and the page scrolls
          sideways. Both in docs/PAGE-SHAPE.md. */}
      <div className="@container/page">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-3 @2xl/page:grid-cols-[12rem_minmax(0,1fr)]">
        <SectionRail
          label="Pull-up sections"
          railAt="2xl"
          groups={PU_PANELS.map((c) => ({ id: c.id, label: c.label }))}
          value={chapter}
          onChange={(id: string | null) => setChapter(id ?? 'history')}
        />
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-baseline gap-x-3 border-b border-line pb-1.5">
            <h2 className="text-heading font-medium text-fg-1">{current.label}</h2>
            <p className="text-label text-fg-2">{current.blurb}</p>
            {chapter === 'history' && <span className="ml-auto"><ShowMore list={history} /></span>}
          </div>
          {chapter === 'history' && (<>
        <SummaryStrip items={[
          { label: 'Sessions', value: sessions.length, empty: sessions.length === 0 },
          { label: 'Total reps', value: totalReps, empty: sessions.length === 0 },
          { label: 'Best set', value: best, empty: best === 0 },
        ]} />
        {/* Same stranded grid as Fitness — measured at 188px in a 708px
            column — and the same fix. See `DayGrid`'s `fluid`. */}
        <div className="mt-3">
          <CalendarHeatmap ranges storageKey="pullups" fluid data={heat} unit="reps" label="Pull-up reps per day" />
        </div>
        {sessions.length === 0 ? (
          <div className="mt-3"><EmptyFrame>Log a session and it appears here, newest first.</EmptyFrame></div>
        ) : (
          <ul className="mt-3">
            {history.shown.map((w) => (
              <li key={w.id} className="group flex items-center justify-between gap-2 border-b border-line py-2 last:border-b-0">
                <span className="flex min-w-0 flex-1 items-baseline gap-2">
                  <span className="truncate font-medium text-fg-1">{w.notes.split('\n')[0] || 'Pull-ups'}</span>
                  <span className="shrink-0 text-label text-fg-2">{prettyDay(w.date)}</span>
                </span>
                <span className="num flex shrink-0 items-center gap-2 text-label text-fg-2">
                  <span>{repsOf(w.sets)} reps</span>
                  {w.durationMin != null && <span>{w.durationMin}m</span>}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onRemove(w.id)}
                    aria-label={`Delete pull-up session on ${prettyDay(w.date)}`}
                    className="text-fg-2 reveal hover:text-red"
                  >×</Button>
                </span>
              </li>
            ))}
          </ul>
        )}
          </>)}
          {/* The programme was a peer section above the rail. It is 859px and 47
              controls — the largest single thing on the page, and nothing you
              need while logging today's set. */}
          {chapter === 'program' && <ProgramTracker only="pullup-zero" />}
          {chapter === 'form' && (<>
        <div className="space-y-3">
          {PULLUP_FORM.map((f) => (
            <div key={f.phase}>
              <p className="text-body text-fg-1">{f.phase}</p>
              <ul className="mt-1 space-y-1 text-label text-fg-2">
                {f.cues.map((c) => <li key={c}>· {c}</li>)}
              </ul>
            </div>
          ))}
        </div>
          </>)}
          {chapter === 'principles' && (<>
        <ul className="space-y-2 text-label text-fg-2">
          {PULLUP_PRINCIPLES.map((p) => (
            <li key={p.name}>
              <strong style={{ color: onRaised(p.color) }}>{p.name}:</strong> {p.body}
            </li>
          ))}
        </ul>
          </>)}
          {chapter === 'ability' && (<>
        <TrainingSetCalc max={max} maxInput={maxInput} onMax={onMax} logged={best} />
        <table className="w-full text-left text-label">
          <caption className="sr-only">Ability group by max strict pull-ups, with the training set and daily and weekly volume targets for each.</caption>
          <thead>
            <tr className="text-fg-2">
              <th scope="col" className="py-1 pr-2 font-normal">Group</th>
              <th scope="col" className="py-1 pr-2 font-normal">Max</th>
              <th scope="col" className="py-1 pr-2 font-normal">Set</th>
              <th scope="col" className="py-1 pr-2 font-normal">Daily</th>
              <th scope="col" className="py-1 font-normal">Weekly</th>
            </tr>
          </thead>
          <tbody>
            {PULLUP_ABILITY.map((a) => (
              <tr key={a.group} className="border-t border-line">
                <th scope="row" className="py-1 pr-2 text-left font-normal text-fg-1">{a.group}</th>
                <td className="num py-1 pr-2 text-fg-2">{a.range}</td>
                <td className="num py-1 pr-2" style={{ color: onRaised('mauve') }}>{a.trainingSet}</td>
                <td className="py-1 pr-2 text-fg-2">{a.daily}</td>
                <td className="py-1 text-fg-2">{a.weekly}</td>
              </tr>
            ))}
          </tbody>
        </table>
          </>)}
          {chapter === 'formats' && (<>
        <ul className="space-y-2 text-label text-fg-2">
          {PULLUP_WORKOUTS.map((w) => (
            <li key={w.name} className="border-t border-line pt-2 first:border-t-0 first:pt-0">
              <p className="text-body text-fg-1">{w.name}</p>
              <p>{w.profile}</p>
              <p className="mt-1">{w.how}</p>
              <p className="mt-1">
                <span className="text-green">RX:</span> {w.rx} · <span className="text-blue">Scale:</span> {w.scale}
              </p>
            </li>
          ))}
        </ul>
          </>)}
          {chapter === 'progressions' && (<>
        <ul className="space-y-2 text-label text-fg-2">
          {PULLUP_PROGRESSIONS.map((p) => (
            <li key={p.name} className="border-t border-line pt-2 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-body text-fg-1">{p.name}</span>
                <VideoLink name={p.name} size="sm" />
              </div>
              <p><strong>Why:</strong> {p.why}</p>
              <p className="mt-1"><strong>How:</strong> {p.how}</p>
            </li>
          ))}
        </ul>
          </>)}
          {chapter === 'equipment' && (<>
        <ul className="space-y-2 text-label text-fg-2">
          {PULLUP_EQUIPMENT.map((e) => (
            <li key={e.item} className="border-t border-line pt-2 first:border-t-0 first:pt-0">
              <span className="text-body text-fg-1">{e.item}</span>
              <p>{e.spec}</p>
              {e.url && (
                <a href={e.url} target="_blank" rel="noreferrer" className="text-blue hover:underline">
                  {e.item} · suppliers
                </a>
              )}
            </li>
          ))}
        </ul>
          </>)}
        </div>
      </div>
      </div>
    </section>
  )
}
