import { useEffect, useRef } from 'react'
import { Icon } from '@/components/Icon'
import { asks, kindsFor, labelOf, optionsFor, type Mode } from '../../../domain/activities'
import { glyphOf } from './phoneHelpers'
import type { ActivityDraft } from '../../page/draft'
import type { DistanceUnit } from '../../../lib/types'
import { Cells, ControlCell, FieldCell } from '../../ui/cells'
import { MeasureCard } from '../../ui/measure'


const EFFORT_WORD = ['', 'Very easy', 'Easy', 'Easy', 'Moderate', 'Moderate', 'Solid', 'Hard', 'Hard', 'Very hard', 'All out']

/**
 * A Fitness session's fields, drawn for a phone (COD-459).
 *
 * OWNS: the phone rendering — `main` is what every session has (which
 * activity, how long, how far, how hard), `more` is what only some do (the
 * kind, calories, notes).
 * DOES NOT OWN: the draft (`components/page/draft.ts`) or which fields an
 * activity asks for — `asks()` and `kindsFor()` decide, exactly as the
 * desktop's `ActivityForm` does, so a phone cannot offer a field the registry
 * does not.
 */
export function ActivityFieldsPhone({ part, mode, draft, onChange, unit }: {
  part: 'main' | 'more'
  mode: Mode
  draft: ActivityDraft
  onChange: (p: Partial<ActivityDraft>) => void
  unit: DistanceUnit
}) {
  const a = draft.activity
  /* The chosen tile scrolls into view: a carried-over "Walk" is fifth in the
     row and sat half off the right edge on first paint. */
  const row = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = row.current?.querySelector<HTMLElement>('[aria-checked="true"]')
    const r = row.current
    if (el && r) r.scrollTo({ left: el.offsetLeft - r.clientWidth / 2 + el.clientWidth / 2 })
  }, [a])
  if (part === 'main') {
    const halves = [
      asks(a, 'durationMin') && { key: 'min', label: 'Minutes', value: draft.duration, onChange: (duration: string) => onChange({ duration }), step: 5, max: 600, unit: 'min' },
      asks(a, 'distanceKm') && { key: 'dist', label: 'Distance', value: draft.distance, onChange: (distance: string) => onChange({ distance }), step: 0.5, max: 500, unit, decimals: 1 },
    ].filter(Boolean) as Parameters<typeof MeasureCard>[0]['halves']
    return (
      <>
        <div ref={row} role="radiogroup" aria-label="Activity" className="picker-row">
          {optionsFor(mode, a).map(([key, act]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={key === a}
              className="pick-tile"
              onClick={() => onChange({ activity: key, subActivity: '' })}
            >
              <Icon as={glyphOf(key)} size="lg" />
              {act.label}
            </button>
          ))}
        </div>
        {halves.length > 0 && <MeasureCard label={`${labelOf(a)} measurements`} halves={halves} />}
        <label className="flex items-center gap-3">
          <span className="flex w-[4.5rem] shrink-0 flex-col">
            <span className="text-body font-medium text-fg-1">Effort</span>
            <span className="text-label text-fg-2">{draft.rpe === '' ? 'Slide' : EFFORT_WORD[Number(draft.rpe)]}</span>
          </span>
          <input
            type="range" min={1} max={10}
            value={draft.rpe === '' ? 5 : Number(draft.rpe)}
            onChange={(e) => onChange({ rpe: e.target.value })}
            aria-valuetext={draft.rpe === '' ? 'Not set' : `${draft.rpe} of 10, ${EFFORT_WORD[Number(draft.rpe)]}`}
            className="effort min-w-0 flex-1"
            data-unset={draft.rpe === '' || undefined}
          />
          <span className="num w-8 shrink-0 text-right text-title font-bold text-fg-1">{draft.rpe === '' ? '–' : draft.rpe}</span>
        </label>
      </>
    )
  }

  const kinds = kindsFor(a)
  return (
    <div className="flex flex-col gap-5">
      <Cells title="Details">
        {kinds.length > 0 && (
          <ControlCell label={`${labelOf(a)} type`} hint="Optional">
            {/* Starts empty (the carried-over draft drops the kind), so a
                second tap clearing it is safe — the `Seg` trap is only for a
                value that ARRIVES selected. */}
            <div role="radiogroup" aria-label={`${labelOf(a)} type`} className="flex flex-wrap gap-1.5">
              {kinds.map((k) => (
                <button key={k} type="button" role="radio" aria-checked={draft.subActivity === k} className="chip-toggle" style={{ ['--tone' as string]: 'var(--color-brand)' }}
                  onClick={() => onChange({ subActivity: draft.subActivity === k ? '' : k })}>{k}</button>
              ))}
            </div>
          </ControlCell>
        )}
        <FieldCell label="Calories" type="number" inputMode="numeric" value={draft.calories} onChange={(calories) => onChange({ calories })} placeholder="Optional" />
      </Cells>
      <Cells title="Notes">
        <div className="cell"><textarea value={draft.notes} onChange={(e) => onChange({ notes: e.target.value })} placeholder="How did it feel?" rows={3} aria-label="Notes" className="cell-textarea" /></div>
      </Cells>
    </div>
  )
}

