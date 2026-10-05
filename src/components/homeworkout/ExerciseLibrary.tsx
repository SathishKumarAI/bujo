import { useState } from 'react'
import { MagnifyingGlass, Plus } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card, Pill } from '../ui'
import { Button } from '../ui/button'
import { ChipPick } from '../ui/quickpick'
import { VideoLink } from '../VideoLink'
import { EmptyFrame } from '../page'
import { muscleNames } from '../../lib/muscles'
import {
  EQUIPMENT_LABEL, EQUIPMENT_ORDER, FAMILY_LABEL,
  filterExercises, musclesOf, progressionChain, searchUrl,
  type Difficulty, type Equipment, type HomeExercise, type Muscle,
} from '../../lib/homeExercises'

const MUSCLES: Muscle[] = ['chest', 'shoulders', 'arms', 'back', 'core', 'glutes', 'legs', 'cardio', 'full body']
const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced']

/**
 * ZONE 3 · the catalogue. Reference content, after the act and the history.
 *
 * Three facets rather than one. The old row offered only muscle, which answers
 * "what do I want to train" and never "what can I train with what is in this
 * room" — and that second question is the whole premise of a home workout. All
 * three go through `filterExercises`, which intersects them, so adding a fourth
 * facet is one argument rather than a fourth `.filter()` in this file.
 *
 * `ChipPick` rather than hand-rolled chips: it already carries the pill radius,
 * the `bg-ink-2` rest fill, the per-tone selected state, `active:scale-95` and
 * a real `<fieldset>`/`<legend>` — and three new panels shipping inline
 * `cat('surface0')` chips instead is a trap this repo has already written down.
 *
 * Each tile opens to the coaching: the ordered cues, the one mistake, the
 * muscles (read from `lib/exerciseMuscles.ts` through `musclesOf`, never a
 * field of our own), and the easier/harder chain the movement sits in.
 */
export function ExerciseLibrary({ onAdd }: { onAdd: (ex: HomeExercise) => void }) {
  const [muscle, setMuscle] = useState<Muscle | null>(null)
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const rows = filterExercises({ muscle, equipment, difficulty })
  const anyFilter = muscle != null || equipment != null || difficulty != null

  /** A chip row where tapping the selected value clears it. */
  const toggle = <T,>(cur: T | null, set: (v: T | null) => void) => (v: T) => set(cur === v ? null : v)

  return (
    <Card band title="Exercise library" subtitle={`${rows.length} of ${filterExercises({}).length} movements · tap one for the cues and a form demo`} collapsible defaultCollapsed>
      <div className="space-y-3">
        <ChipPick label="Muscle" value={muscle} onChange={toggle(muscle, setMuscle)} options={MUSCLES.map((m) => ({ value: m, label: m }))} className="capitalize" />
        <ChipPick label="What you have" tone="teal" value={equipment} onChange={toggle(equipment, setEquipment)} options={EQUIPMENT_ORDER.map((e) => ({ value: e, label: EQUIPMENT_LABEL[e] }))} />
        <ChipPick label="Difficulty" tone="peach" value={difficulty} onChange={toggle(difficulty, setDifficulty)} options={DIFFICULTIES.map((d) => ({ value: d, label: d }))} className="capitalize"
          after={anyFilter ? <Button variant="ghost" size="sm" onClick={() => { setMuscle(null); setEquipment(null); setDifficulty(null) }}>Clear</Button> : undefined} />
      </div>

      {rows.length === 0 ? (
        <div className="mt-3"><EmptyFrame>Nothing matches all three filters. Clear one.</EmptyFrame></div>
      ) : (
        /* `sm:grid-cols-2` with the phone column spelled out — a grid with no
           base `grid-template-columns` gets one implicit `auto` track sized to
           its widest item's min-content, which is how a card's neighbours get
           dragged off the right edge of a 390px viewport. */
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
          {rows.map((ex) => (
            <Tile key={ex.id} ex={ex} open={openId === ex.id} onToggle={() => setOpenId(openId === ex.id ? null : ex.id)} onAdd={onAdd} />
          ))}
        </div>
      )}
    </Card>
  )
}

function Tile({ ex, open, onToggle, onAdd }: { ex: HomeExercise; open: boolean; onToggle: () => void; onAdd: (ex: HomeExercise) => void }) {
  const work = musclesOf(ex)
  const chain = progressionChain(ex.id)

  return (
    <div className="min-w-0 rounded-card bg-ink-2 p-3">
      <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-body font-medium text-fg-1">{ex.name}</span>
        <Pill tone="muted" size="micro" className="ml-auto px-2">{EQUIPMENT_LABEL[ex.equipment]}</Pill>
        <Pill tone="muted" size="micro" className="px-2 capitalize">{ex.difficulty}</Pill>
      </div>
      <p className="text-label text-fg-2">{ex.how}</p>

      {/* `flex-wrap` on the cluster itself. `Card` can cap its own slots but
          cannot wrap markup it does not own, so an over-wide child here would
          just leave by a different edge. */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <button onClick={onToggle} aria-expanded={open} className="text-label text-fg-2 hover:text-fg-1">
          {open ? 'Hide' : 'How to'}
          <span className="caret-turn caret-turn-quarter ml-1 inline-block text-micro" data-open={open}>▸</span>
        </button>
        <VideoLink name={ex.name} yt={ex.yt} />
        <Button variant="secondary" size="sm" onClick={() => onAdd(ex)} className="ml-auto text-fg-1 hover:border-mauve">
          <Icon as={Plus} size="sm" /> {ex.reps}
        </Button>
      </div>

      {open && (
        <div className="collapse-in mt-3 space-y-2 border-t border-line pt-2 text-label text-fg-2">
          <ol className="list-inside list-decimal space-y-1">
            {ex.cues.map((c) => <li key={c}>{c}</li>)}
          </ol>
          <p><span className="text-fg-1">Most common mistake · </span>{ex.mistake}</p>
          {work && (
            <p>
              <span className="text-fg-1">Muscles · </span>
              {muscleNames(work.primary).join(', ')}
              {work.secondary.length > 0 && <> <span className="text-fg-2">(also {muscleNames(work.secondary).join(', ')})</span></>}
            </p>
          )}
          {chain.length > 1 && (
            <p>
              <span className="text-fg-1">Easier → harder · </span>
              {chain.map((c, i) => (
                <span key={c.id}>
                  {i > 0 && ' → '}
                  <span className={c.id === ex.id ? 'text-fg-1' : undefined}>{c.name}</span>
                </span>
              ))}
            </p>
          )}
          <p className="text-fg-2">{FAMILY_LABEL[ex.family]} · read the family manual below for the set-up and how to progress.</p>
          <a href={searchUrl(ex)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">
            <Icon as={MagnifyingGlass} size="sm" /> More {ex.name} videos
          </a>
        </div>
      )}
    </div>
  )
}
