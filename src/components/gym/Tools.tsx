import { useState } from 'react'
import { Plus, Video, X } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import { Card, Empty, Input, Pill } from '../ui'
import { Button } from '../ui/button'
import { StatGrid } from '../page'
import { MuscleMap } from '../MuscleMap'
import { BodyView3D } from './BodyView3D'
import { CoachSessions } from './CoachSessions'
import { ExerciseDB } from '../ExerciseDB'
import { ExercisePicker } from '../ExercisePicker'
import { splitGlyph } from '../glyphs'
import { muscleNames } from '../../lib/muscles'
import { exerciseInfo } from '../../lib/exerciseInfo'
import { onRaised } from '../../lib/colors'
import { EXERCISE_LIBRARY, musclesForExercise, platesPerSide, barExceedsTarget, splitMeta } from '../../lib/fitness'
import { Barbell as BarbellViz } from '../PlateStack'
import type { Routine, Split } from '../../lib/types'

/**
 * LOOK UP & TOOLS · the five things you consult WHILE building a session.
 *
 * WHAT THIS FILE OWNS: the anatomy lookup, the plate calculator, saved
 * routines, and the two library panels beside them.
 * WHAT IT DOES NOT OWN: the logger, the record, or which row is on screen.
 *
 * ── Why these are a rail row and not a fold in the act column ─────────────
 *
 * They were a `QuietSection` under the logger, which is the third address
 * they have had: the review zone's bottom (~4,700px down a phone), then zone 2
 * behind a fold, now a row on the bar. Reported as *"past push day, load this,
 * rest timer, look up tools, exercise anatomy, plate calculator, coach
 * sessions, exercise database — could you move them into the manual? It is
 * wasting scrolling"*, and the measurement agrees: with that fold open the act
 * column was **3001px** at 1440 and 2998px above the record on a phone.
 *
 * The argument for keeping them in zone 2 was that they are used during the
 * act. That argument survives the move intact, because **zone 3 is BESIDE zone
 * 2, not below it**: on a desktop the anatomy map and the logger are on screen
 * together, which the fold never allowed — you had to expand it, scroll, and
 * then scroll back to the row you were filling in. On a phone the zones stack
 * and it is one tap on the bar instead of a fold plus a scroll.
 *
 * **The rest timer did NOT move.** It is the one thing here used between sets
 * rather than between decisions, it is 80px, and a timer you have to navigate
 * to is a timer you do not start. It sits directly under the logger now that
 * the last-session card has gone.
 *
 * **`LastSessionCard` is gone from the act**, and its job is better done where
 * the sessions already are: every card in the Sessions row carries **Load**,
 * so you can reload any session rather than only the most recent one of the
 * selected split.
 */
export function GymTools({
  focusEx, setFocusEx, focusLabel, split, activeMuscles, recentExercises, addRow,
  routines, onRemoveRoutine, onLoadRoutine, unit,
}: {
  focusEx: string | null
  setFocusEx: (e: string | null) => void
  focusLabel: string
  split: Split
  activeMuscles: number[]
  recentExercises: string[]
  addRow: (exercise?: string) => void
  routines: Routine[]
  onRemoveRoutine: (id: string) => void
  onLoadRoutine: (exercises: string[], split: Split) => void
  unit: string
}) {
  return (
    <StatGrid>
      <AnatomyCard
        focusEx={focusEx}
        setFocusEx={setFocusEx}
        focusLabel={focusLabel}
        split={split}
        activeMuscles={activeMuscles}
        recentExercises={recentExercises}
        addRow={addRow}
      />
      <PlateCalculator key={unit} unit={unit} />
      <SavedRoutines routines={routines} onRemove={onRemoveRoutine} onLoad={onLoadRoutine} />
      {/* Beside Saved routines on purpose: same verb, same object. */}
      <CoachSessions onLoad={onLoadRoutine} />
      <Card band collapsible title="Exercise database" subtitle="Search wger’s library, tap a card to view it, then add to your session">
        <ExerciseDB onPick={(name) => { addRow(name); setFocusEx(name) }} />
      </Card>
    </StatGrid>
  )
}

/** Anatomy lookup — the muscle map plus a picker to point it at any lift. */
function AnatomyCard({
  focusEx, setFocusEx, focusLabel, split, activeMuscles, recentExercises, addRow,
}: {
  focusEx: string | null
  setFocusEx: (e: string | null) => void
  focusLabel: string
  split: Split
  activeMuscles: number[]
  recentExercises: string[]
  addRow: (exercise?: string) => void
}) {
  return (
    <Card
      band
      title={focusEx ? focusEx : 'Exercise anatomy'}
      subtitle={
        focusEx
          ? 'Muscles worked by this exercise'
          : <span>Showing your <span style={{ color: onRaised(splitMeta(split).color) }}>{focusLabel}</span> · or look one up</span>
      }
      right={focusEx && <Button variant="secondary" onClick={() => setFocusEx(null)} className="press-3d inline-flex items-center gap-1.5"><AppIcon as={X} size="sm" /> Clear</Button>}
    >
      <div className="mb-3 space-y-2">
        <ExercisePicker
          value={focusEx ?? ''}
          onPick={(name) => setFocusEx(name || null)}
          library={EXERCISE_LIBRARY}
          recents={recentExercises}
        />
        <div className="flex flex-wrap items-center gap-2">
          {focusEx && musclesForExercise(focusEx).length > 0 && (
            <Button variant="secondary" onClick={() => { addRow(focusEx) }} className="press-3d inline-flex items-center gap-1.5">
              <AppIcon as={Plus} size="sm" /> Add to session
            </Button>
          )}
          {focusEx && (
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(focusEx + ' exercise form')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-body text-red hover:underline"
            >
              <AppIcon as={Video} size="md" /> YouTube
            </a>
          )}
        </div>
      </div>

      <MuscleMap muscles={activeMuscles} />

      {/* The 3D view sits BESIDE the wger art, not instead of it. That art is
          the anatomical reference; this is the one that moves and shows when
          each muscle is doing the work. Only rendered with an exercise in
          focus — a mannequin with nothing highlighted is decoration. */}
      {focusEx && <BodyView3D exercise={focusEx} />}

      {focusEx && exerciseInfo(focusEx) && (
        <div className="mt-3 space-y-1 rounded-card bg-ink-2 p-2.5 text-label">
          <p className="text-fg-2"><span className="font-medium text-green">Cue:</span> {exerciseInfo(focusEx)!.cue}</p>
          <p className="text-fg-2"><span className="font-medium text-peach">Watch:</span> {exerciseInfo(focusEx)!.watch}</p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {activeMuscles.length === 0 ? (
          <span className="text-label text-fg-2">Type an exercise, pick a split, or tap a set row’s target.</span>
        ) : (
          muscleNames(activeMuscles).map((m) => (
            <Pill key={m} color={splitMeta(split).color} className="px-2.5">
              {m}
            </Pill>
          ))
        )}
      </div>
    </Card>
  )
}

/** Greedy plate-loading helper: target weight → a loaded, animated barbell. */
function PlateCalculator({ unit }: { unit: string }) {
  const [target, setTarget] = useState('100')
  const [bar, setBar] = useState(unit === 'lb' ? '45' : '20')
  // Plate denominations differ by unit (kg gym plates vs lb).
  const denoms = unit === 'lb' ? [45, 35, 25, 10, 5, 2.5] : [25, 20, 15, 10, 5, 2.5, 1.25]
  // One stepper click = the smallest plate on each side, the smallest change a
  // real bar can make. Thumb-sized, because this is used standing at a rack.
  const step = denoms[denoms.length - 1] * 2
  const plates = platesPerSide(Number(target) || 0, Number(bar) || 0, denoms)
  const loadable = plates.reduce((a, p) => a + p, 0) * 2 + (Number(bar) || 0)
  const barOverTarget = barExceedsTarget(Number(target) || 0, Number(bar) || 0)
  const bump = (d: number) => setTarget(String(Math.max(0, (Number(target) || 0) + d)))
  return (
    <Card band title="Plate calculator" subtitle="What to load on the bar">
      {/* One row, always: Target's stepper trio plus Bar come to ~230px, and
          the act column never goes below 324. `max-w-*`, not `w-*` — Input's
          base `w-full` wins the width fight against a bare `w-24`, which is
          why these two stacked full-width before. */}
      <div className="mb-3 flex items-end gap-3">
        <label className="block text-body text-fg-1">
          Target ({unit})
          <span className="mt-1 flex items-center gap-1">
            <Button variant="secondary" size="icon-sm" onClick={() => bump(-step)} aria-label={`Target down ${step} ${unit}`} className="h-9 w-9 shrink-0">−</Button>
            {/* Inline widths, not utilities: `.zone-act :is(input)` (0-1-1)
                out-specifies any single-class width, which is how two earlier
                attempts (`w-24`, `max-w-20`) silently lost. */}
            <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} aria-label={`Target weight (${unit})`} className="text-center" style={{ width: 84 }} />
            <Button variant="secondary" size="icon-sm" onClick={() => bump(step)} aria-label={`Target up ${step} ${unit}`} className="h-9 w-9 shrink-0">+</Button>
          </span>
        </label>
        <label className="block text-body text-fg-1">Bar ({unit})<Input type="number" value={bar} onChange={(e) => setBar(e.target.value)} className="mt-1 text-center" style={{ width: 72 }} /></label>
      </div>
      {barOverTarget ? (
        <p className="text-body text-yellow">Bar alone ({bar} {unit}) already exceeds target ({target} {unit}) — use a lighter bar.</p>
      ) : (
        <>
          <BarbellViz plates={plates} unit={unit} bar={Number(bar) || 0} />
          {/* The sentence to read off at the rack. Keyed so a change re-enters —
              the number moves with the discs. */}
          <p key={loadable} className="collapse-in mt-2 text-body text-fg-1">
            {plates.length === 0
              ? 'Just the bar, no plates needed.'
              : <>Per side: <span className="font-medium">{plates.join(' · ')}</span> = {loadable} {unit} loaded</>}
            {plates.length > 0 && loadable !== Number(target) && <span className="ml-1 text-yellow">(closest loadable to {target})</span>}
          </p>
        </>
      )}
    </Card>
  )
}

function SavedRoutines({ routines, onRemove, onLoad }: { routines: Routine[]; onRemove: (id: string) => void; onLoad: (exs: string[], split: Split) => void }) {
  return (
    <Card band title="Saved routines" subtitle="Load one into today's session">
      {routines.length === 0 ? (
        <Empty>Build a session and “Save this as a routine”. PPL presets are quick-loadable.</Empty>
      ) : (
        <ul className="space-y-1 text-body">
          {routines.map((r) => {
            const m = splitMeta(r.split)
            const Icon = splitGlyph(r.split)
            return (
              <li key={r.id} className="group flex items-center justify-between">
                <button onClick={() => onLoad(r.exercises, r.split)} className="inline-flex items-center gap-1.5 text-left text-fg-1 hover:text-fg-1" title="Load into session">
                  <AppIcon as={Icon} size="sm" style={{ color: onRaised(m.color) }} /> {r.name}
                  <span className="ml-1 text-fg-2">{r.exercises.length} exercises</span>
                </button>
                <Button variant="ghost" size="icon-sm" onClick={() => onRemove(r.id)} aria-label="Delete routine" className="text-fg-2 reveal hover:text-red">×</Button>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
