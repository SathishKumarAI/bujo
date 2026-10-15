import { useStickyState } from '../lib/useStickyState'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
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

  /**
   * TWO facts, not four. The contract's test is whether a fact changes what you
   * do in the next thirty seconds, and the two that were dropped failed it by
   * being said better somewhere else on the same screen:
   *
   * - *Weekly target* was a bare range (`75–150 progression reps`) with nothing
   *   to compare it against, while the `ability` panel states daily AND weekly
   *   for every group. It is now the denominator of the fact beside it, which
   *   is what a target is for — and that fact gets a track, so the week reads
   *   without being parsed.
   * - *Last session* is the first row of the log form, next to the button that
   *   repeats it (`20 reps · Wed, Oct 14`). On an empty journal both read
   *   `None yet` / `0 reps`, so half of zone 1 was a bar of absences.
   */
  const weeklyFloor = Number(ability.weekly.match(/\d+/)?.[0]) || null

  const facts = [
    { label: 'Training set', value: `${ability.trainingSet} rep${ability.trainingSet === 1 ? '' : 's'}/set` },
    {
      label: 'This week',
      value: `${weekReps} of ${ability.weekly}`,
      amount: weekReps,
      of: weeklyFloor,
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
 * The `formats` panel · fourteen session structures, laid out rather than
 * listed.
 *
 * It was fourteen `<li>`s of four grey paragraphs each — name, a
 * `'High volume · moderate intensity · 10–20 min'` string, the execution line,
 * and an `RX: … · Scale: …` run-on — which is the longest panel on the page at
 * **1.91 desktop screens and 3.68 on a phone** and the hardest to use, because
 * choosing a format means comparing three ratings across fourteen items and
 * every one of them read as the same paragraph.
 *
 * Same facts, given a shape:
 *
 * - **The duration sits beside the name**, right-aligned, because "how long
 *   have I got" is the first question asked of this list and it was the third
 *   clause of a sentence.
 * - **Volume and intensity are tags**, so the eye can run down one column and
 *   compare them. They are `PullupWorkout` fields now, not a string this view
 *   splits — see the interface for why.
 * - **RX and Scale are a labelled pair**, one per line, rather than a sentence
 *   with two colons in it. `RX` is the prescription and `Scale` is the way in;
 *   on a card that someone reads *because* they cannot yet do the prescribed
 *   version, those two lines are the point.
 *
 * Two columns, on a **container** query, and that is load-bearing. The review
 * column is 678px while the window is 1440, so `CardGrid`'s viewport `md:` and
 * `2xl:` steps would give three columns of 210px inside it; `MasonryGrid`
 * breaks at `@3xl` (768px) and would silently do nothing at all. `@lg` is
 * 512px, which this column clears and a phone does not. Both failures are
 * written up in CLAUDE.md, from either side.
 */
/**
 * Solo first, otherwise the authored order.
 *
 * `sort` is stable in every engine this ships to, so the eleven solo formats keep
 * the order `lib/pullups.ts` lists them in and the three partner ones fall to
 * the end in theirs. Sorting here rather than in the data module because the
 * data's order is editorial — Ladders and Pyramids lead because they are what
 * the guide teaches first — and this is one panel's view of it.
 */
const SOLO_FIRST = [...PULLUP_WORKOUTS].sort(
  (a, b) => Number(a.needs === 'partner') - Number(b.needs === 'partner'))

function Formats() {
  return (
    <PanelGrid>
      {SOLO_FIRST.map((w) => (
        <PanelCard key={w.name} title={w.name} right={<span className="num text-label text-fg-2">{w.minutes}</span>}>
          <div className="mb-2 flex flex-wrap gap-1">
            <Tag>{w.volume} volume</Tag>
            <Tag>{w.intensity} intensity</Tag>
            {/* Only the ones that need someone else are tagged. Tagging all
                fourteen would put a label on every card and distinguish
                nothing, which is the point of the sort doing half the work. */}
            {w.needs === 'partner' && <Tag>Needs a partner</Tag>}
          </div>
          <p className="text-label text-fg-2">{w.how}</p>
          <DefList rows={[['RX', w.rx], ['Scale', w.scale]]} />
        </PanelCard>
      ))}
    </PanelGrid>
  )
}

/**
 * ── The five reference panels share three pieces ──────────────────────────
 *
 * Form, Principles, Formats, Progressions and Equipment were five different
 * answers to the same question — two used `border-t` separated `<li>`s, one
 * used `space-y-3` bare `<div>`s, one put its two facts in a run-on sentence
 * with two colons in it, and one wrote its name and body as
 * `<strong>Name:</strong> body`. They hold the same shape of thing: a named
 * item, an optional figure beside the name, and a short body. One card, used
 * five times, is also what makes the two-column grid safe to apply once.
 */
function PanelGrid({ children }: { children: React.ReactNode }) {
  /*
    `@lg` = 512px of CONTAINER. The review column is 678px while the window is
    1440, so `CardGrid`'s viewport `md:`/`2xl:` steps would put three 210px
    columns in it, and `MasonryGrid` breaks at `@3xl` (768px) and would do
    nothing at all here. Both failures are in CLAUDE.md, from opposite sides.
    The container is `@container/page`, declared by `Review` above.
  */
  return <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 @lg/page:grid-cols-2">{children}</ul>
}

function PanelCard({
  title, right, titleColor, children,
}: {
  title: string
  /** A figure that belongs beside the name — a duration, a video link, an index. */
  right?: React.ReactNode
  /** An inline accent for the title only; `PULLUP_PRINCIPLES` carries one each. */
  titleColor?: string
  children: React.ReactNode
}) {
  return (
    <li className="flex flex-col rounded-card border border-line bg-ink-1 p-3">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <h3 className="text-body font-medium text-fg-1" style={titleColor ? { color: titleColor } : undefined}>{title}</h3>
        {right && <span className="shrink-0">{right}</span>}
      </div>
      {children}
    </li>
  )
}

/** Term and detail, aligned down the card. A `<dl>` because that is what two
 *  labelled facts are, and a grid because the default flow puts the detail on
 *  its own line and loses the column. */
function DefList({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="mt-2 grid grid-cols-[2.9rem_minmax(0,1fr)] gap-x-2 gap-y-0.5 border-t border-line pt-2 text-label">
      {rows.map(([term, detail]) => (
        <Fragment key={term}>
          <dt className="text-fg-2">{term}</dt>
          <dd className="text-fg-1">{detail}</dd>
        </Fragment>
      ))}
    </dl>
  )
}

/** A rating, as a quiet pill. No accent: fourteen cards of coloured tags is the
 *  six-colour stats row DESIGN.md argues against, and neither rating is a
 *  warning — they are both just facts about the session. */
function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-pill bg-ink-2 px-2 py-0.5 text-label text-fg-2">{children}</span>
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
 * The default panel is the program's current day — see `PU_PANELS` for the
 * whole ordering argument. The act column is always there on the right, so
 * logging never depends on which panel is open.
 *
 * ── A bar, not a side rail ────────────────────────────────────────────────
 *
 * `railAt="never"`, so the eight panels are a chip row across the top of the
 * panel at every width — the same control a phone already got, kept on the
 * desktop. A side rail spends the gutter and shows every group at once, which
 * is worth 192px plus a 32px gap when the groups are twenty-four analytics
 * cards; for eight it reads as a second sidebar beside the app's own, and it
 * takes the width from a column that has a calendar and a 14-row table in it.
 *
 * Worth knowing what was tried first, because the default is a trap here:
 * `SectionRail` defaults to `@4xl` (896px) and **zone 3 at the 1180 tier is
 * 722px**, so a rail placed there can never reach its own breakpoint and ships
 * its phone strip on a desktop by accident. `2xl` makes the side rail actually
 * appear — measured at 192px, vertical, with the panel at 678px — and that is
 * the version this replaces.
 *
 * No "All" row: the panels do not overlap, and all eight at once is the page
 * this replaces.
 */
/**
 * Ordered for someone about to train, not for someone reading about training.
 *
 * The first order here was History, Program, Form, Principles, Training set,
 * Formats, Progressions, Equipment — which is roughly the order the sections
 * happened to be written in, and it opens the page on what you have already
 * done. The bar is read left to right and the leftmost row is the default, so
 * that order decides whether arriving means *doing something* or *reading
 * about it*.
 *
 * Doing first, in the order the questions actually arrive:
 *
 * 1. **Today** — the program's current day, with its boxes to tick. The one
 *    panel that answers "what am I doing right now" with a specific answer.
 * 2. **Formats** — the menu, for a session off-program.
 * 3. **Training set** — the numbers for whichever you picked.
 * 4. **Form** — the cues, which are read *while* doing it.
 *
 * Then the record, then the reference:
 *
 * 5. **History** · 6. **Progressions** · 7. **Principles** · 8. **Equipment**
 *
 * Progressions sits with the reference rather than with the acts even though
 * it is a set of exercises, because it is the answer to "I cannot do one yet"
 * — a question you ask once and then work from for weeks.
 */
const PU_PANELS = [
  { id: 'program', label: 'Today', blurb: 'Starting From Zero · your current day' },
  { id: 'formats', label: 'Formats', blurb: `${PULLUP_WORKOUTS.length} session structures, solo first` },
  { id: 'ability', label: 'Training set', blurb: 'Your max → set, schemes, volume' },
  { id: 'form', label: 'Form', blurb: 'Set-up & execution' },
  { id: 'history', label: 'History', blurb: 'Sessions, volume and the calendar' },
  { id: 'progressions', label: 'Progressions', blurb: 'Building toward a first strict rep' },
  { id: 'principles', label: 'Principles', blurb: 'How the program is meant to be run' },
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
    'pullups.chapter', 'program', PU_PANELS.map((c) => c.id),
  )
  const current = PU_PANELS.find((c) => c.id === chapter) ?? PU_PANELS[0]

  return (
    <section>
      {/* Container on the outer div, grid on the inner: an element cannot
          query itself. Phone column spelled out, or the chip row's
          min-content sizes the only implicit track and the page scrolls
          sideways. Both in docs/PAGE-SHAPE.md. */}
      <div className="@container/page">
      {/* One column: the bar is a row of the grid, not a column of it. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-y-3">
        <SectionRail
          label="Pull-up sections"
          railAt="never"
          groups={PU_PANELS.map((c) => ({ id: c.id, label: c.label }))}
          value={chapter}
          onChange={(id: string | null) => setChapter(id ?? 'program')}
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
          {chapter === 'form' && (
            <PanelGrid>
              {PULLUP_FORM.map((f, i) => (
                <PanelCard key={f.phase} title={f.phase} right={<span className="num text-label text-fg-2">{i + 1}</span>}>
                  <ul className="space-y-1 text-label text-fg-2">
                    {f.cues.map((c) => <li key={c} className="pl-3 -indent-3">· {c}</li>)}
                  </ul>
                </PanelCard>
              ))}
            </PanelGrid>
          )}
          {chapter === 'principles' && (
            <PanelGrid>
              {PULLUP_PRINCIPLES.map((p) => (
                /* The per-principle accent stays, and moves from a run-on
                   `<strong>Name:</strong> body` to the card's title — same
                   colour, same meaning, and the body is no longer a sentence
                   that starts with a colon. */
                <PanelCard key={p.name} title={p.name} titleColor={onRaised(p.color)}>
                  <p className="text-label text-fg-2">{p.body}</p>
                </PanelCard>
              ))}
            </PanelGrid>
          )}
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
          {chapter === 'formats' && <Formats />}
          {chapter === 'progressions' && (
            <PanelGrid>
              {PULLUP_PROGRESSIONS.map((p) => (
                <PanelCard key={p.name} title={p.name} right={<VideoLink name={p.name} size="sm" />}>
                  <DefList rows={[['Why', p.why], ['How', p.how]]} />
                </PanelCard>
              ))}
            </PanelGrid>
          )}
          {chapter === 'equipment' && (
            <PanelGrid>
              {PULLUP_EQUIPMENT.map((e) => (
                <PanelCard key={e.item} title={e.item}>
                  <p className="text-label text-fg-2">{e.spec}</p>
                  {e.url && (
                    <a href={e.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-label text-blue underline">
                      Suppliers for {e.item}
                    </a>
                  )}
                </PanelCard>
              ))}
            </PanelGrid>
          )}
        </div>
      </div>
      </div>
    </section>
  )
}
