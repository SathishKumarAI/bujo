import { useState } from 'react'
import { MagnifyingGlass, Plus } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Pill } from '../ui'
import { onRaised } from '../../lib/colors'
import { Button } from '../ui/button'
import { ChipPick } from '../ui/quickpick'
import { VideoLink } from '../VideoLink'
import { EmptyFrame, PanelGrid, PanelCard } from '../page'
import { ShowMore } from '../ShowMore'
import { useCappedList } from '../../lib/useCappedList'
import { muscleNames } from '../../lib/muscles'
import {
  EQUIPMENT_LABEL, EQUIPMENT_ORDER, FAMILY_LABEL, FAMILY_ORDER, FAMILY_SHORT,
  filterExercises, musclesOf, progressionChain, searchUrl,
  type Difficulty, type Equipment, type Family, type HomeExercise, type Muscle,
} from '../../lib/homeExercises'
import { FamilyChapter } from './Manual'

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
  const [family, setFamily] = useState<Family | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const rows = filterExercises({ muscle, equipment, difficulty, family })
  /* Twelve, not three: this is a catalogue you browse, not a history you
     glance at, so the cap is there to stop 83 tiles from being the panel's
     default height rather than to hide the list. Measured on the built bundle:
     all 83 is **7.28 desktop screens and 16.06 on a phone**, against 1.89 for
     the worst panel on the Pull-ups bar. The affordance carries the total, so
     a filtered list of twelve cannot be mistaken for "that is all there is". */
  const shown = useCappedList(rows, 12)
  const anyFilter = muscle != null || equipment != null || difficulty != null || family != null

  /** A chip row where tapping the selected value clears it. */
  const toggle = <T,>(cur: T | null, set: (v: T | null) => void) => (v: T) => set(cur === v ? null : v)

  return (
    /* No `Card` and no fold any more. The bar in `Review.tsx` draws the heading
       for this panel, and a second titled box inside a panel is the duplicate
       chrome the page-shape contract exists to remove. The fold had to go
       regardless: `npm run a11y` walks the RENDERED page, so an 83-movement
       catalogue that shipped collapsed was 83 tiles no gate had ever scanned. */
    <>
      <div className="space-y-3">
        {/* `H push`, not `Horizontal push` — nine full labels is a chip row
            that wraps to three lines in the review column and four on a phone.
            `name` keeps the full label as the ACCESSIBLE name and `hint` puts
            it in the hover title, so nothing is lost by shortening what is
            drawn. Order pairs the pushes and then the pulls; see
            `FAMILY_ORDER`. */}
        <ChipPick label="Movement" tone="brand" value={family} onChange={toggle(family, setFamily)}
          options={FAMILY_ORDER.map((f) => ({ value: f, label: FAMILY_SHORT[f], name: FAMILY_LABEL[f], hint: FAMILY_LABEL[f] }))}
          hint="Picking one also opens that family's chapter of the manual" />
        <ChipPick label="Muscle" value={muscle} onChange={toggle(muscle, setMuscle)} options={MUSCLES.map((m) => ({ value: m, label: m }))} className="capitalize" />
        <ChipPick label="What you have" tone="teal" value={equipment} onChange={toggle(equipment, setEquipment)} options={EQUIPMENT_ORDER.map((e) => ({ value: e, label: EQUIPMENT_LABEL[e] }))} />
        <ChipPick label="Difficulty" tone="peach" value={difficulty} onChange={toggle(difficulty, setDifficulty)} options={DIFFICULTIES.map((d) => ({ value: d, label: d }))} className="capitalize"
          after={anyFilter ? <Button variant="ghost" size="sm" onClick={() => { setMuscle(null); setEquipment(null); setDifficulty(null); setFamily(null) }}>Clear</Button> : undefined} />
      </div>

      {/* The family chapter, where you are standing when you want it. It used to
          be one of twelve rows in a rail at the very bottom of the page, a
          navigation away from the movements it describes — and `chapterFor()`
          had no call site at all. */}
      {family && (
        <div className="mt-4 rounded-card bg-ink-2 p-3">
          <FamilyChapter family={family} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-label text-fg-2">
          <span className="num">{rows.length}</span> of <span className="num">{filterExercises({}).length}</span> movements · tap one for the cues and a form demo
        </p>
        <ShowMore list={shown} />
      </div>

      {rows.length === 0 ? (
        <div className="mt-3"><EmptyFrame>Nothing matches every filter. Clear one.</EmptyFrame></div>
      ) : (
        /* `PanelGrid`, which is the same two-column grid with the phone column
           spelled out — and it breaks on the CONTAINER rather than the
           viewport, which is the correct question inside a review column. The
           tiles were the last thing on this page still drawing their own box. */
        <div className="mt-4">
          <PanelGrid>
            {shown.shown.map((ex) => (
              <Tile key={ex.id} ex={ex} open={openId === ex.id} onToggle={() => setOpenId(openId === ex.id ? null : ex.id)} onAdd={onAdd} />
            ))}
          </PanelGrid>
        </div>
      )}
    </>
  )
}

function Tile({ ex, open, onToggle, onAdd }: { ex: HomeExercise; open: boolean; onToggle: () => void; onAdd: (ex: HomeExercise) => void }) {
  const work = musclesOf(ex)
  const chain = progressionChain(ex.id)

  return (
    /* The shared card, like every other named item on this page. It was the one
       `bg-ink-2` box with no border left on the view, which is what made the
       Movements panel read as a different design from the four beside it. */
    <PanelCard
      title={ex.name}
      right={
        <span className="flex flex-wrap items-center gap-1">
          <Pill tone="muted" size="micro" className="px-2">{EQUIPMENT_LABEL[ex.equipment]}</Pill>
          <Pill tone="muted" size="micro" className="px-2 capitalize">{ex.difficulty}</Pill>
        </span>
      }
    >
      <p className="text-label text-fg-2">{ex.how}</p>

      {/* `flex-wrap` on the cluster itself. `Card` can cap its own slots but
          cannot wrap markup it does not own, so an over-wide child here would
          just leave by a different edge. */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        {/* `shrink-0 whitespace-nowrap` because the caret is an inline span
            INSIDE the button: in the flex row it shrank to 41px against a
            43px content width, which is `clipped-text.mjs`'s own predicate —
            a control showing less than it holds. Two pixels, caught by
            running that check rather than by looking at it. */}
        <button onClick={onToggle} aria-expanded={open} className="shrink-0 whitespace-nowrap text-label text-fg-2 hover:text-fg-1">
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
          <p className="text-fg-2">{FAMILY_LABEL[ex.family]} · pick that family above for its chapter.</p>
          {/* `onRaised('blue')`, not the inherited anchor colour. `@layer base`
              gives every `a` `var(--color-blue)` — the RAW palette value — and
              this one sits on `bg-ink-2`, the raised rung. On vscode that
              measured **3.74:1**, found by `npm run a11y` after a hand-driven
              axe sweep over the same tiles had already passed. Exactly the
              `VideoLink` defect one token over, which is the tell that the base
              anchor rule has this shape everywhere an inline link sits on a
              raised panel. Filed; fixed here. */}
          <a href={searchUrl(ex)} target="_blank" rel="noreferrer" style={{ color: onRaised('blue') }} className="inline-flex items-center gap-1">
            <Icon as={MagnifyingGlass} size="sm" /> More {ex.name} videos
          </a>
        </div>
      )}
    </PanelCard>
  )
}
