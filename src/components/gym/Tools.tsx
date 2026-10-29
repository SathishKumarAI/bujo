import { Plus, Video, X } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import { Card, Empty, Pill } from '../ui'
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
import { EXERCISE_LIBRARY, musclesForExercise, splitMeta } from '../../lib/fitness'
import type { Routine, Split } from '../../lib/types'
import { videoUrl } from '../../lib/video'

/**
 * THE TWO REVIEW ROWS THAT ARE NOT ABOUT THE RECORD · Load and Lookup.
 *
 * WHAT THIS FILE OWNS: the anatomy lookup, saved routines, and the two library
 * panels beside them.
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
 * **Two rows, not one bucket called Tools.** Asked for as "take the coach
 * sessions to something, add as a new thing, and the plate calculator again as
 * a new thing — or think where you can put it". Sorted by the question each
 * panel answers: **Load** is "put a prescription in today's logger" (saved
 * routines, the coach's 29 — one verb, two sources), **Lookup** is "what is
 * this lift" (the muscle map from the muscles out, wger's catalogue from the
 * other side).
 *
 * **The plate calculator is in neither**, because it is not a lookup: you use
 * it standing at the rack with a target weight, between sets, which is what
 * the rest timer beside it is for. It went to zone 2 and now seeds its target
 * from the heaviest weight in the open session.
 *
 * **The rest timer did not move either**, for the same reason, and it is 80px:
 * a timer you have to navigate to is a timer you do not start.
 *
 * **`LastSessionCard` is gone from the act**, and its job is better done where
 * the sessions already are: every card in the Sessions row carries **Load**,
 * so you can reload any session rather than only the most recent one of the
 * selected split.
 */
/** The **Load** row · one verb, two sources of a prescription. */
export function GymLoad({ routines, onRemoveRoutine, onLoadRoutine }: {
  routines: Routine[]
  onRemoveRoutine: (id: string) => void
  onLoadRoutine: (exercises: string[], split: Split) => void
}) {
  return (
    <StatGrid>
      <SavedRoutines routines={routines} onRemove={onRemoveRoutine} onLoad={onLoadRoutine} />
      {/* Beside Saved routines on purpose: same verb, same object. */}
      <CoachSessions onLoad={onLoadRoutine} />
    </StatGrid>
  )
}

/** The **Lookup** row · what a lift hits, from the muscles out and the catalogue in. */
export function GymLookup({
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
              href={videoUrl(focusEx)}
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
