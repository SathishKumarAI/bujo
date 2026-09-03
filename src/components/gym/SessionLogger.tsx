import { ArrowCounterClockwise, Check, Crosshair, Plus, Stack, X } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import type { Dispatch, SetStateAction } from 'react'
import { Input } from '../ui'
import { Button } from '../ui/button'
import { ExercisePicker } from '../ExercisePicker'
import { VideoLink } from '../VideoLink'
import { splitGlyph } from '../glyphs'
import { cat, onAccent, washStyle } from '../../lib/colors'
import {
  EXERCISE_LIBRARY, PPL_PRESETS, SPLITS, epley1RM, lastSetFor, warmupRamp,
} from '../../lib/fitness'
import type { JournalData, Routine, Split } from '../../lib/types'

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

export interface SetRow {
  exercise: string
  weight: string
  reps: string
  rpe?: string
  kind?: 'warmup' | 'working' | 'drop'
}

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
// 56px number tracks, measured not guessed: the "reps" placeholder is 30px of
// text and the old 44px track minus the input's 24px padding left it 18px —
// it rendered as "re" clipped mid-glyph. Same for RPE (29px in 14px). The
// extra 32px comes out of the picker's 1fr, which has hundreds to spare at sm.
const ROW_GRID =
  'grid grid-cols-4 gap-1 sm:grid-cols-[28px_1fr_56px_56px_56px_36px_28px] sm:gap-2'

/**
 * Where each control sits on the phone's two lines. `sm:*-auto` hands the row
 * back to auto-placement, which fills the seven desktop tracks in DOM order.
 */
const AT = {
  focus: 'col-start-1 row-start-1 sm:col-auto sm:row-auto',
  // The picker's own trigger is 37px tall, so it needs the touch height too.
  // Reached through the wrapper rather than by giving `ExercisePicker` a
  // `className`: its height is this row's decision, not the component's, and
  // it is used elsewhere (the anatomy lookup) where 44 is not wanted.
  picker: 'col-start-2 col-span-3 row-start-1 min-w-0 [&_button]:h-11 sm:col-auto sm:col-span-1 sm:row-auto sm:[&_button]:h-auto',
  weight: 'col-start-1 row-start-2 sm:col-auto sm:row-auto',
  reps: 'col-start-2 row-start-2 sm:col-auto sm:row-auto',
  rpe: 'col-start-3 row-start-2 sm:col-auto sm:row-auto',
  kind: 'col-start-4 row-start-2 sm:col-auto sm:row-auto',
  remove: 'col-start-4 row-start-1 justify-self-end sm:col-auto sm:row-auto',
}

/** 44px on touch, back to the compact desktop size from `sm` up. */
const TOUCH = 'h-11 w-full sm:h-7'

export function SessionLogger({
  data, split, setSplit, rows, setRows, setRow, addRow, onLoadRoutine,
  focusEx, setFocusEx, recentExercises, unit, defaultBar, warmStep, onFinish,
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
}) {
  const routines: Routine[] = data.routines
  // Live tally — sets completed and total volume, so the act reports on itself
  // rather than waiting for Finish to say anything.
  const done = rows.filter((r) => r.weight.trim() && r.reps.trim())
  const vol = Math.round(done.reduce((s, r) => s + Number(r.weight) * Number(r.reps), 0))

  return (
    <>
      <div className="mb-3 flex flex-wrap gap-2">
        {SPLITS.filter((s) => s.id !== 'other').map((s) => {
          const Icon = splitGlyph(s.id)
          return (
            <button
              key={s.id}
              onClick={() => setSplit(s.id)}
              aria-pressed={split === s.id}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-none px-3 py-1.5 text-body"
              style={{
                background: split === s.id ? cat(s.color) : cat('surface0'),
                color: split === s.id ? onAccent(cat(s.color)) : cat('subtext1'),
              }}
            >
              <AppIcon as={Icon} size="sm" /> {s.label}
            </button>
          )
        })}
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-label text-fg-2">Quick-load:</span>
        {PPL_PRESETS.map((p) => (
          <button key={p.name} onClick={() => onLoadRoutine(p.exercises, p.split)} className="text-label text-mauve hover:underline">
            {p.name}
          </button>
        ))}
        {routines.map((r) => (
          <button key={r.id} onClick={() => onLoadRoutine(r.exercises, r.split)} className="text-label text-sapphire hover:underline">
            {r.name}
          </button>
        ))}
      </div>

      <datalist id="exercise-library">
        {EXERCISE_LIBRARY.map((e) => <option key={e} value={e} />)}
      </datalist>

      <div className="space-y-2">
        {/* Desktop only. A header row cannot label a two-line row without
            repeating itself, and on a phone every field already names itself
            through its placeholder — which is why RPE's is now the word and
            not an em dash. The "Wt"/"Set" phone abbreviations this replaces
            existed to fit tracks that no longer exist. */}
        <div className={`${ROW_GRID} hidden text-label text-fg-2 sm:grid`}>
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
            <div key={i} className={`-ml-2 rounded-none border-l-2 pl-2 transition-colors ${complete ? 'border-green bg-green/5' : 'border-transparent'}`}>
              <div className={`${ROW_GRID} items-center`}>
                <button
                  onClick={() => setFocusEx(focused ? null : row.exercise.trim() || null)}
                  disabled={!row.exercise.trim()}
                  aria-label="Focus muscle map on this exercise"
                  aria-pressed={focused}
                  title="Show this exercise on the muscle map"
                  className={`${AT.focus} ${TOUCH} grid place-items-center rounded-none disabled:opacity-30 sm:w-7`}
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
                <Input type="number" value={row.weight} onChange={(e) => setRow(i, { weight: e.target.value })} placeholder={unit} aria-label="Weight" className={`${AT.weight} h-11 py-1.5 sm:h-auto`} />
                <Input type="number" value={row.reps} onChange={(e) => setRow(i, { reps: e.target.value })} placeholder="reps" aria-label="Reps" className={`${AT.reps} h-11 py-1.5 sm:h-auto`} />
                <Input type="number" value={row.rpe ?? ''} onChange={(e) => setRow(i, { rpe: e.target.value })} placeholder="RPE" aria-label="RPE, effort 1 to 10" title="RPE · effort 1–10" className={`${AT.rpe} h-11 py-1.5 sm:h-auto`} />
                <button onClick={() => setRow(i, { kind: nextKind })} title={kindMeta.title} aria-label={`Set type: ${kindMeta.title}`} className={`${AT.kind} ${TOUCH} grid place-items-center rounded-none text-label font-medium sm:w-8`} style={{ background: cat('surface0'), color: cat(kindMeta.color) }}>{kindMeta.label}</button>
                <Button variant="ghost" size="icon-sm" onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))} aria-label="Remove row" className={`${AT.remove} h-11 w-11 text-fg-2 hover:text-red sm:h-7 sm:w-7`}><AppIcon as={X} size="sm" /></Button>
              </div>
              {(prev || oneRM || row.exercise.trim()) && (
                <div className="mt-0.5 flex sm:ml-9 items-center gap-3 text-micro text-fg-2">
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
                  {oneRM && <span style={{ color: cat('mauve') }}>1RM ~{oneRM}{unit}</span>}
                  {complete && <span className="inline-flex items-center gap-0.5" style={{ color: cat('green') }}><AppIcon as={Check} size="sm" /> logged</span>}
                  {row.exercise.trim() && <VideoLink name={row.exercise.trim()} size="sm" className="text-micro" />}
                </div>
              )}
              {/* Auto warm-up ramp · bar/40/60/80% of a working weight. Tap a rung to insert it as a warm-up set. */}
              {kind === 'working' && (() => {
                const ramp = warmupRamp(Number(row.weight) || 0, defaultBar, warmStep)
                if (!ramp.length) return null
                return (
                  <div className="mt-1 flex sm:ml-9 flex-wrap items-center gap-1.5 text-micro text-fg-2">
                    <span className="inline-flex items-center gap-1" title="Auto warm-up ramp to this working weight">
                      <AppIcon as={Stack} size="sm" style={{ color: cat('blue') }} /> Warm-up:
                    </span>
                    {ramp.map((r, ri) => (
                      <button
                        key={ri}
                        type="button"
                        onClick={() =>
                          setRows((rs) => {
                            const next = [...rs]
                            next.splice(i, 0, { exercise: row.exercise, weight: String(r.weight), reps: '', kind: 'warmup' })
                            return next
                          })
                        }
                        title={`Add ${r.weight}${unit} warm-up set`}
                        className="rounded-none px-2 py-0.5 transition-colors hover:text-fg-1"
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
        <div className="mt-2 flex items-center gap-2 text-label">
          <span className="inline-flex items-center gap-1 font-medium" style={{ color: cat('green') }}><AppIcon as={Check} size="sm" /> {done.length} set{done.length === 1 ? '' : 's'}</span>
          <span className="text-fg-2">·</span>
          <span className="text-fg-1">{vol.toLocaleString()}{unit} volume</span>
        </div>
      )}

      {/* The page's single primary button. Everything beside it is secondary —
          "Add set" and "Save routine" are not why anyone opened this page. */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={onFinish} className="press-3d">Finish session</Button>
        <Button variant="secondary" onClick={() => addRow()} className="press-3d inline-flex items-center gap-1.5 rounded-none">
          <AppIcon as={Plus} size="sm" /> Add set
        </Button>
      </div>
    </>
  )
}
