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
 * Two steps, because the desktop track list does not fit a phone. In the act
 * column at 390px the container is 324px and the seven desktop tracks plus
 * their gaps come to 326: the row overflowed by 2px, which put the **remove
 * button at x=387 in a 390 viewport** — outside the screen, with nothing able
 * to scroll to it, and `document.body.scrollWidth` still reading 390 because
 * the clip happens at an ancestor. Neither `npm run a11y` nor `clipped-text`
 * can see that (the button shows everything it holds and its own box is fine);
 * it is the failure `STATUS.md` describes, found by measuring control rects.
 *
 * The squeeze also collapsed `1fr` to **50px**, so the exercise picker — the
 * widest thing a set row has to say — was the narrowest control in the row.
 * The phone step trims the six fixed tracks and the gap, which buys `1fr`
 * 122px instead.
 */
const ROW_GRID =
  'grid grid-cols-[24px_1fr_40px_34px_30px_26px_24px] gap-1 sm:grid-cols-[28px_1fr_52px_44px_40px_36px_28px] sm:gap-2'

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
        <div className={`${ROW_GRID} text-label text-fg-2`}>
          {/* Two of these headers are wider than the phone track they label —
              "Weight" wants 44px in 40, "Type" 29 in 26 — and the tracks cannot
              grow: they were trimmed to 324px precisely so the remove button
              stays on screen (see ROW_GRID). So the *word* gives way, not the
              column. `npm run clipped` was red on `phone · gym` for both. */}
          <span /><span>Exercise</span>
          <span><span className="sm:hidden">Wt</span><span className="hidden sm:inline">Weight</span></span>
          <span>Reps</span><span>RPE</span>
          <span><span className="sm:hidden">Set</span><span className="hidden sm:inline">Type</span></span>
          <span />
        </div>
        {rows.map((row, i) => {
          const focused = !!row.exercise.trim() && focusEx === row.exercise
          const prev = row.exercise.trim() ? lastSetFor(data, row.exercise) : null
          const oneRM = row.weight && row.reps ? epley1RM(Number(row.weight), Number(row.reps)) : null
          const kind = row.kind ?? 'working'
          const kindMeta = { working: { label: '•', color: 'mauve', title: 'Working set' }, warmup: { label: 'W', color: 'blue', title: 'Warm-up' }, drop: { label: 'D', color: 'peach', title: 'Drop set' } }[kind]
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
                  className="grid h-7 w-7 place-items-center rounded-none disabled:opacity-30"
                  style={{ background: focused ? cat('mauve') : cat('surface0'), color: focused ? onAccent(cat('mauve')) : cat('subtext0') }}
                >
                  <AppIcon as={Crosshair} size="sm" />
                </button>
                <ExercisePicker
                  value={row.exercise}
                  onPick={(name) => setRow(i, { exercise: name })}
                  library={EXERCISE_LIBRARY}
                  recents={recentExercises}
                />
                <Input type="number" value={row.weight} onChange={(e) => setRow(i, { weight: e.target.value })} placeholder={unit} aria-label="Weight" className="py-1.5" />
                <Input type="number" value={row.reps} onChange={(e) => setRow(i, { reps: e.target.value })} placeholder="reps" aria-label="Reps" className="py-1.5" />
                <Input type="number" value={row.rpe ?? ''} onChange={(e) => setRow(i, { rpe: e.target.value })} placeholder="—" aria-label="RPE" className="py-1.5" />
                <button onClick={() => setRow(i, { kind: nextKind })} title={kindMeta.title} aria-label={`Set type: ${kindMeta.title}`} className="grid h-7 w-8 place-items-center rounded-none text-label font-medium" style={{ background: cat('surface0'), color: cat(kindMeta.color) }}>{kindMeta.label}</button>
                <Button variant="ghost" size="icon-sm" onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))} aria-label="Remove row" className="text-fg-2 hover:text-red"><AppIcon as={X} size="sm" /></Button>
              </div>
              {(prev || oneRM || row.exercise.trim()) && (
                <div className="mt-0.5 ml-9 flex items-center gap-3 text-micro text-fg-2">
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
                  <div className="mt-1 ml-9 flex flex-wrap items-center gap-1.5 text-micro text-fg-2">
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
