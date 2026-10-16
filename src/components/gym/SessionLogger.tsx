import { ArrowCounterClockwise, Check, Crosshair, Plus, Stack, Timer, X } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import type { Dispatch, SetStateAction } from 'react'
import { Input } from '../ui'
import { Button } from '../ui/button'
import { ExercisePicker } from '../ExercisePicker'
import { VideoLink } from '../VideoLink'
import { cat, onAccent, onRaised, washStyle } from '../../lib/colors'
import {
  EXERCISE_LIBRARY, PPL_PRESETS, SPLITS, epley1RM, lastSetFor, warmupRamp,
} from '../../lib/fitness'
import type { JournalData, Split } from '../../lib/types'
import { newSetRow, type SetRow } from './setRow'
import { restFor, restLabel, sessionMinutes } from '../../lib/rest'
import { DayPick } from '../ui/quickpick'
import { addDays, todayISO } from '../../lib/date'

/**
 * Zone 2 · the act. One row per set: what, how heavy, how many, how hard.
 *
 * Lifted out of `views/Gym.tsx` unchanged — same markup, same handlers — when
 * the page moved onto the three-zone contract. The view was 724 lines and this
 * was 150 of them, which is the reason the act was hard to find in the file as
 * well as on the screen.
 *
 * It owns no state. `rows` and `split` live in the view because Finish, Save
 * routine and the muscle map all read them, and a logger that owned its rows
 * would have to hand them back up on every keystroke.
 */

/**
 * The set-row grid, spelled once — the header and every row must agree.
 *
 * **One line on desktop, two on a phone**, and the second line is what makes
 * the touch targets legal (COD-92). Seven controls across 324px means every
 * one of them is 24–28px wide; the accessibility floor is 44. Fighting for
 * width had already been tried and lost: the seven desktop tracks plus gaps
 * came to 326px in a 324px column, which put the **remove button at x=387 in
 * a 390 viewport** — off screen, with nothing able to scroll to it, and
 * `document.body.scrollWidth` still reading 390 because the clip happens at an
 * ancestor. Neither `npm run a11y` nor `clipped-text` can see that. Trimming
 * the tracks to fit made the targets *smaller*, which was the right call
 * against off-screen and the wrong one against a thumb.
 *
 * A second line buys the height instead of fighting for the width, which is
 * exactly what `ui/button.tsx` says to do: it refuses to grow `icon-sm` to 44
 * globally because 338 pairs of small buttons sit under 16px apart and would
 * start overlapping. "Spacing decisions per cluster, not a sweep over the
 * primitive" — this is the cluster.
 *
 *   phone      [ ⊕ ][ exercise ............ ][ ✕ ]
 *              [ kg ][ reps ][ RPE ][ set ]
 *   sm and up  [ ⊕ ][ exercise ][ kg ][ reps ][ RPE ][ set ][ ✕ ]
 *
 * The children stay in desktop order in the DOM — the phone line break is
 * done with explicit `col-start`/`row-start`, reset to `auto` at `sm`. Doing
 * it with two wrapper divs and `sm:contents` reads better and cannot work:
 * flattening them would hand the desktop grid its children in the order
 * focus, picker, remove, weight… and drop the remove button into track 3.
 */
/*
  THE BREAKPOINT IS THE ACT COLUMN'S WIDTH, NOT THE WINDOW'S.

  This row read `sm:` — a VIEWPORT query — while it lives in a column whose
  width is decided by the page split. At a 1440 viewport the act column is
  **416px**, so `sm` was true and the row drew its seven desktop tracks inside
  416px: 28 + 56 + 56 + 56 + 36 + 28 of fixed track plus six 8px gaps is 308,
  leaving the exercise picker **108px**, and each number input 56px minus its
  own ~24px of padding — 32px of text box for a 30px "reps" placeholder. It
  rendered as `lb`, `re`, `RP`. Reported exactly that way: "reps, RPE, they are
  not quite visible".

  The comment this replaces said the extra width "comes out of the picker's
  1fr, which has hundreds to spare at sm". It does not: at `sm` the COLUMN is
  416px, not the window. That is the `CardGrid`/`MasonryGrid` trap in CLAUDE.md
  — a viewport query standing in for a container one — and it is why the fix is
  a container query rather than wider tracks.

  `@container/act` is declared on a wrapper below (an element cannot query
  itself). 30rem = 480px, chosen from the arithmetic: the one-line layout needs
  308px of track plus a picker that can show an exercise name (~170px).

  | container | layout | act column at |
  |---|---|---|
  | < 30rem | two lines, 44px targets | 390 phone · 416 (1440 desktop) |
  | ≥ 30rem | one line, seven tracks | 512 (1920) · 512 (2560) |
*/
const ROW_GRID =
  'grid grid-cols-4 gap-1 @min-[30rem]/act:grid-cols-[28px_1fr_56px_56px_56px_36px_28px] @min-[30rem]/act:gap-2'

/**
 * Where each control sits on the phone's two lines. `sm:*-auto` hands the row
 * back to auto-placement, which fills the seven desktop tracks in DOM order.
 */
const AT = {
  focus: 'col-start-1 row-start-1 @min-[30rem]/act:col-auto @min-[30rem]/act:row-auto',
  // The picker's own trigger is 37px tall, so it needs the touch height too.
  // Reached through the wrapper rather than by giving `ExercisePicker` a
  // `className`: its height is this row's decision, not the component's, and
  // it is used elsewhere (the anatomy lookup) where 44 is not wanted.
  picker: 'col-start-2 col-span-3 row-start-1 min-w-0 [&_button]:h-11 @min-[30rem]/act:col-auto @min-[30rem]/act:col-span-1 @min-[30rem]/act:row-auto @min-[30rem]/act:[&_button]:h-auto',
  weight: 'col-start-1 row-start-2 @min-[30rem]/act:col-auto @min-[30rem]/act:row-auto',
  reps: 'col-start-2 row-start-2 @min-[30rem]/act:col-auto @min-[30rem]/act:row-auto',
  rpe: 'col-start-3 row-start-2 @min-[30rem]/act:col-auto @min-[30rem]/act:row-auto',
  kind: 'col-start-4 row-start-2 @min-[30rem]/act:col-auto @min-[30rem]/act:row-auto',
  remove: 'col-start-4 row-start-1 justify-self-end @min-[30rem]/act:col-auto @min-[30rem]/act:row-auto',
}

/** 44px while the row is two lines, compact once it is one. */
const TOUCH = 'h-11 w-full @min-[30rem]/act:h-7'

export function SessionLogger({
  data, split, setSplit, rows, setRows, setRow, addRow, onLoadRoutine,
  focusEx, setFocusEx, recentExercises, unit, defaultBar, warmStep, onFinish,
  date, setDate, onRest,
}: {
  data: JournalData
  split: Split
  setSplit: (s: Split) => void
  rows: SetRow[]
  setRows: Dispatch<SetStateAction<SetRow[]>>
  setRow: (i: number, patch: Partial<SetRow>) => void
  addRow: (exercise?: string) => void
  onLoadRoutine: (exercises: string[], split: Split) => void
  focusEx: string | null
  setFocusEx: (e: string | null) => void
  recentExercises: string[]
  unit: string
  defaultBar: number
  warmStep: number
  onFinish: () => void
  /** The day the session is filed under. Gym had no date control at all. */
  date: string
  setDate: (d: string) => void
  /**
   * Start the rest for one set.
   *
   * The timer lives in the view because it has to survive this row being
   * edited, deleted or reordered — a countdown mounted inside the row it
   * belongs to would restart every time you typed a rep into it.
   */
  onRest: (exercise: string, seconds: number) => void
}) {
  /* The standard day for the split that is selected — the only preset worth
     offering, because the reader has already said which day this is. */
  const preset = PPL_PRESETS.find((p) => p.split === split)
  const splitLabel = SPLITS.find((x) => x.id === split)?.label ?? 'session'
  // Live tally — sets completed and total volume, so the act reports on itself
  // rather than waiting for Finish to say anything.
  const done = rows.filter((r) => r.weight.trim() && r.reps.trim())
  const vol = Math.round(done.reduce((s, r) => s + Number(r.weight) * Number(r.reps), 0))
  /* Work plus rest over the sets that have reps — see `lib/rest.ts`. */
  const estimate = sessionMinutes(rows, data.settings)

  return (
    /* `@container/act` — the set row's breakpoint asks about THIS box, which
       is the act column, not the window. An element cannot query itself, so
       the container is declared here and the grid lives on the rows inside. */
    <div className="@container/act">
      {/* A session you did yesterday and are logging now. `finish()` used to
          hardcode `todayISO()`, which made this the one workout form in the
          app where a back-dated session was impossible. */}
      <div className="mb-3">
        <DayPick value={date} onChange={setDate} today={todayISO()} yesterday={addDays(todayISO(), -1)} />
      </div>
      {/* ONE LINE, MEASURED. Six chips with a glyph and `px-3` came to ~494px
          of controls in a **416px** act column, so the row wrapped to two —
          and with the quick-load row above it that was four lines of chrome
          before the first set. The glyph goes (the fill already identifies the
          split, and `splitGlyph` still appears on every history card), the
          padding tightens, and "Full body" DRAWS as "Full" while announcing in
          full: 392px in 416. Re-measure this when a label changes — the margin
          is 24px, and a pinned geometry comment with no date on it is how the
          pull-up Rounds row came to be wrong. */}
      <div className="mb-3 flex flex-wrap gap-2">
        {SPLITS.filter((s) => s.id !== 'other').map((s) => (
          <button
            key={s.id}
            onClick={() => setSplit(s.id)}
            aria-pressed={split === s.id}
            aria-label={`${s.label} day`}
            title={`${s.label} day`}
            className="inline-flex min-h-11 items-center rounded-pill px-2.5 py-1.5 text-body"
            style={{
              background: split === s.id ? cat(s.color) : cat('surface0'),
              color: split === s.id ? onAccent(cat(s.color)) : cat('subtext1'),
            }}
          >
            {s.label === 'Full body' ? 'Full' : s.label}
          </button>
        ))}
      </div>

      {/* ONE LINE, AND ONLY WHEN IT CAN DO NO HARM.

          This was a second row — `Quick-load: Push Day · Pull Day · Leg Day ·
          My Push` — under the split chips, and reported as a duplicate,
          correctly: `PPL_PRESETS` are named after the splits, so "Push" and
          "Push Day" sat eight pixels apart doing different things. The chip
          CLASSIFIES the session and is safe to press at any time; the preset
          REPLACES every row you have typed. Two verbs that look like one
          control is the shape the page contract calls out.

          So the presets are now one contextual line that appears only while
          the list is empty — there is nothing to overwrite, the split is
          already chosen, and the offer is for the split you chose rather than
          a menu of three. Your own saved routines and the coach's sessions
          moved out to the **Load** row on the review bar, which is where a
          library of prescriptions belongs; this keeps the one-tap start for
          the standard day. */}
      {preset && rows.every((r) => !r.exercise.trim()) && (
        <button
          type="button"
          onClick={() => onLoadRoutine(preset.exercises, preset.split)}
          className="mb-2 inline-flex items-center gap-1.5 text-label text-mauve hover:underline"
        >
          <AppIcon as={Stack} size="sm" /> Load the standard {splitLabel} day · {preset.exercises.length} exercises
        </button>
      )}

      <datalist id="exercise-library">
        {EXERCISE_LIBRARY.map((e) => <option key={e} value={e} />)}
      </datalist>

      <div className="space-y-2">
        {/* Desktop only. A header row cannot label a two-line row without
            repeating itself, and on a phone every field already names itself
            through its placeholder — which is why RPE's is now the word and
            not an em dash. The "Wt"/"Set" phone abbreviations this replaces
            existed to fit tracks that no longer exist. */}
        <div className={`${ROW_GRID} hidden text-label text-fg-2 @min-[30rem]/act:grid`}>
          <span /><span>Exercise</span><span>Weight</span><span>Reps</span><span>RPE</span><span>Type</span><span />
        </div>
        {rows.map((row, i) => {
          const focused = !!row.exercise.trim() && focusEx === row.exercise
          const prev = row.exercise.trim() ? lastSetFor(data, row.exercise) : null
          const oneRM = row.weight && row.reps ? epley1RM(Number(row.weight), Number(row.reps)) : null
          const kind = row.kind ?? 'working'
          const kindMeta = { working: { label: '•', color: 'mauve', title: 'Working set' }, warmup: { label: 'W', color: 'blue', title: 'Warm-up' }, drop: { label: 'D', color: 'maroon', title: 'Drop set' } }[kind]
          const nextKind = { working: 'warmup', warmup: 'drop', drop: 'working' }[kind] as SetRow['kind']
          // Strong-style "completed set" · a filled weight+reps row reads as done (green accent).
          const complete = !!(row.weight.trim() && row.reps.trim())
          return (
            <div key={row.id} className={`-ml-2 rounded-control border-l-2 pl-2 transition-colors ${complete ? 'border-green bg-green/5' : 'border-transparent'}`}>
              <div className={`${ROW_GRID} items-center`}>
                <button
                  onClick={() => setFocusEx(focused ? null : row.exercise.trim() || null)}
                  disabled={!row.exercise.trim()}
                  aria-label="Focus muscle map on this exercise"
                  aria-pressed={focused}
                  title="Show this exercise on the muscle map"
                  className={`${AT.focus} ${TOUCH} grid place-items-center rounded-control disabled:opacity-30 @min-[30rem]/act:w-7`}
                  style={{ background: focused ? cat('mauve') : cat('surface0'), color: focused ? onAccent(cat('mauve')) : cat('subtext0') }}
                >
                  <AppIcon as={Crosshair} size="sm" />
                </button>
                {/* Wrapped rather than given a className: `ExercisePicker` owns
                    its own positioning root for the popup, and the grid item
                    has to be the thing that is placed. */}
                <div className={AT.picker}>
                  <ExercisePicker
                    value={row.exercise}
                    onPick={(name) => setRow(i, { exercise: name })}
                    library={EXERCISE_LIBRARY}
                    recents={recentExercises}
                  />
                </div>
                <Input type="number" value={row.weight} onChange={(e) => setRow(i, { weight: e.target.value })} placeholder={unit} aria-label="Weight" className={`${AT.weight} h-11 py-1.5 @min-[30rem]/act:h-auto`} />
                <Input type="number" value={row.reps} onChange={(e) => setRow(i, { reps: e.target.value })} placeholder="reps" aria-label="Reps" className={`${AT.reps} h-11 py-1.5 @min-[30rem]/act:h-auto`} />
                <Input type="number" value={row.rpe ?? ''} onChange={(e) => setRow(i, { rpe: e.target.value })} placeholder="RPE" aria-label="RPE, effort 1 to 10" title="RPE · effort 1–10" className={`${AT.rpe} h-11 py-1.5 @min-[30rem]/act:h-auto`} />
                <button onClick={() => setRow(i, { kind: nextKind })} title={kindMeta.title} aria-label={`Set type: ${kindMeta.title}`} className={`${AT.kind} ${TOUCH} grid place-items-center rounded-control text-label font-medium @min-[30rem]/act:w-8`} style={{ background: cat('surface0'), color: onRaised(kindMeta.color) }}>{kindMeta.label}</button>
                <Button variant="ghost" size="icon-sm" onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))} aria-label="Remove row" className={`${AT.remove} h-11 w-11 text-fg-2 hover:text-red @min-[30rem]/act:h-7 @min-[30rem]/act:w-7`}><AppIcon as={X} size="sm" /></Button>
              </div>
              {(prev || oneRM || row.exercise.trim()) && (
                <div className="mt-0.5 flex items-center gap-3 text-micro text-fg-2 @min-[30rem]/act:ml-9">
                  {prev && (
                    <button
                      type="button"
                      onClick={() => setRow(i, { weight: String(prev.weight ?? ''), reps: String(prev.reps ?? '') })}
                      title="Repeat last set, fill weight & reps"
                      className="inline-flex items-center gap-1 hover:text-mauve"
                    >
                      <AppIcon as={ArrowCounterClockwise} size="sm" /> last: {prev.weight}{unit}×{prev.reps}
                    </button>
                  )}
                  {oneRM && <span style={{ color: onRaised('mauve') }}>1RM ~{oneRM}{unit}</span>}
                  {complete && <span className="inline-flex items-center gap-0.5" style={{ color: onRaised('green') }}><AppIcon as={Check} size="sm" /> logged</span>}
                  {/* ONE CONTROL, NOT TWO. It starts the rest this set is due,
                      and the duration is not edited here — the timer's own
                      `+30s` writes back to the exercise, which is where the
                      change is felt. A second control per row for a number you
                      change once per exercise would cost 44px on every row. */}
                  {row.exercise.trim() && (
                    <button
                      type="button"
                      onClick={() => onRest(row.exercise.trim(), restFor({ exercise: row.exercise, reps: row.reps, kind: row.kind }, data.settings))}
                      title={`Rest ${restLabel(restFor({ exercise: row.exercise, reps: row.reps, kind: row.kind }, data.settings))} after this set`}
                      aria-label={`Start the rest after ${row.exercise.trim()}`}
                      className="inline-flex items-center gap-1 hover:text-fg-1"
                    >
                      <AppIcon as={Timer} size="sm" /> {restLabel(restFor({ exercise: row.exercise, reps: row.reps, kind: row.kind }, data.settings))}
                    </button>
                  )}
                  {row.exercise.trim() && <VideoLink name={row.exercise.trim()} size="sm" className="text-micro" />}
                </div>
              )}
              {/* Auto warm-up ramp · bar/40/60/80% of a working weight. Tap a rung to insert it as a warm-up set. */}
              {kind === 'working' && (() => {
                const ramp = warmupRamp(Number(row.weight) || 0, defaultBar, warmStep)
                if (!ramp.length) return null
                return (
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-micro text-fg-2 @min-[30rem]/act:ml-9">
                    <span className="inline-flex items-center gap-1" title="Auto warm-up ramp to this working weight">
                      <AppIcon as={Stack} size="sm" style={{ color: onRaised('blue') }} /> Warm-up:
                    </span>
                    {ramp.map((r, ri) => (
                      <button
                        key={ri}
                        type="button"
                        onClick={() =>
                          setRows((rs) => {
                            const next = [...rs]
                            next.splice(i, 0, newSetRow({ exercise: row.exercise, weight: String(r.weight), kind: 'warmup' }))
                            return next
                          })
                        }
                        title={`Add ${r.weight}${unit} warm-up set`}
                        className="rounded-pill px-2 py-0.5 transition-colors hover:text-fg-1"
                        style={washStyle('blue')}
                      >
                        {r.pct === 0 ? 'bar' : `${r.pct}%`} · {r.weight}{unit}
                      </button>
                    ))}
                  </div>
                )
              })()}
            </div>
          )
        })}
      </div>

      {done.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-label">
          <span className="inline-flex items-center gap-1 font-medium" style={{ color: onRaised('green') }}><AppIcon as={Check} size="sm" /> {done.length} set{done.length === 1 ? '' : 's'}</span>
          <span className="text-fg-2">·</span>
          <span className="text-fg-1">{vol.toLocaleString()}{unit} volume</span>
          {/* WILL THIS FIT IN THE HOUR I HAVE? Asked for directly, and it is
              the one number a session's cost comes down to: the reps are three
              seconds each and the rest is whatever each exercise is set to, so
              the estimate moves as you build the session rather than being a
              thing you work out afterwards. The rest after the last set is not
              counted — you are not resting after you leave. */}
          {estimate.minutes > 0 && (
            <>
              <span className="text-fg-2">·</span>
              <span className="inline-flex items-center gap-1 text-fg-1" title={`${estimate.workMin} min under load, ${estimate.restMin} min resting`}>
                <AppIcon as={Timer} size="sm" style={{ color: onRaised('blue') }} /> ≈ {estimate.minutes} min
              </span>
            </>
          )}
        </div>
      )}

      {/* The page's single primary button. Everything beside it is secondary —
          "Add set" and "Save routine" are not why anyone opened this page. */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={onFinish} className="press-3d">Finish session</Button>
        <Button variant="secondary" onClick={() => addRow()} className="press-3d inline-flex items-center gap-1.5">
          <AppIcon as={Plus} size="sm" /> Add set
        </Button>
      </div>
    </div>
  )
}
