import { Check } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Seg } from '../ui/seg'
import { Cells, ControlCell } from '../ui/cells'
import { CommitField } from '../CommitField'
import type { CyclePoint } from '../../lib/types'
import { CHIP_FIELDS, SCALE_FIELDS, TAG_FIELDS, type FieldSection } from './dayFields'

/**
 * MORE FOR TODAY ON A PHONE — the same fields as `DayMore`, drawn as iOS
 * Settings groups inside its sheet.
 *
 * OWNS: the phone drawing. A 1–5 scale is ONE row (name left, segments
 * right; the words are in each segment's name, not two anchor lines under
 * it); tags are pills at their own width (the sheet's chip rule stretched
 * them four to a line, "bigger appetite" as a full-width slab); a sign with
 * one answer is a segmented row (one tap); the temperature
 * flag is one checkbox row.
 * DOES NOT OWN: the fields or their order (`dayFields.ts`), or the write
 * (`onPatch`, from `DayMore`). A field added there shows up here for free —
 * except a new KIND of field, which needs a branch in both files.
 *
 * Measured before (390px, demo): 1,277px of sheet in a 671px scroll box.
 */
export function DayMorePhone({ entry, onPatch, sections }: {
  entry: CyclePoint | undefined
  onPatch: (patch: Partial<CyclePoint>) => void
  sections: { id: FieldSection; title: string }[]
}) {
  const flags = entry?.flags ?? []
  return (
    <div className="flex flex-col gap-5">
      {sections.map((sec) => {
        const scales = SCALE_FIELDS.filter((f) => f.section === sec.id)
        const tags = TAG_FIELDS.filter((f) => f.section === sec.id)
        const picks = CHIP_FIELDS.filter((f) => f.section === sec.id
          && !(f.onlyWithFlag && !flags.includes(f.onlyWithFlag)))
        if (scales.length + tags.length + picks.length === 0) return null
        return (
          <Cells key={sec.id} title={sec.title}>
            {scales.map((f) => (
              <div key={f.key} className="cell gap-3">
                <span className="w-16 shrink-0 text-body text-fg-1">{f.label}</span>
                {/* `allowNone`: a day's mood starts empty, so a second tap
                    is an undo, not a confirmation (the trap on `Seg`). */}
                <Seg
                  label={`${f.label}, 1 ${f.low} to 5 ${f.high}`}
                  className="min-w-0 flex-1"
                  value={entry?.[f.key] ?? null}
                  onChange={(v) => onPatch({ [f.key]: v ?? undefined })}
                  options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n), name: `${n} ${f.words[n - 1]}` }))}
                  allowNone
                />
              </div>
            ))}

            {tags.map((f) => {
              const current = (entry?.[f.key] as string[] | undefined) ?? []
              return (
                <ControlCell key={f.key} label={f.label} hint={current.length ? `${current.length} picked` : undefined}>
                  <div role="group" aria-label={f.label} className="flex flex-wrap gap-1.5" style={{ ['--tone' as string]: 'var(--color-peach)' }}>
                    {f.options.map((o) => (
                      <button key={o} type="button" className="chip-toggle" aria-pressed={current.includes(o)}
                        onClick={() => {
                          const next = current.includes(o) ? current.filter((x) => x !== o) : [...current, o]
                          // `undefined`, not `[]`: an empty array reads as "asked, answered nothing".
                          onPatch({ [f.key]: next.length ? next : undefined })
                        }}>
                        <Icon as={Check} size="sm" />{o}
                      </button>
                    ))}
                  </div>
                </ControlCell>
              )
            })}

            {/* A sign with one answer is a segmented row: ONE tap. A native
                select was two (open, pick) and its list was reported slow to
                appear — "a better product kind of thing". Second tap clears:
                the day starts with nothing logged. */}
            {picks.map((f) => (
              <ControlCell key={f.key} label={f.label}>
                <Seg label={f.label} value={entry?.[f.key] ?? null}
                  onChange={(v) => onPatch({ [f.key]: v ?? undefined })}
                  options={f.options} allowNone />
              </ControlCell>
            ))}
          </Cells>
        )
      })}

      <Cells title="Anything else">
        <div className="cell">
          <CommitField
            key={entry?.date ?? 'none'}
            rows={2}
            value={entry?.note ?? ''}
            onCommit={(v) => onPatch({ note: v.trim() || undefined })}
            placeholder="A new pill, worse cramps, doctor Friday…"
            label="Note for this day"
            className="w-full"
          />
        </div>
        <label className="cell gap-3">
          <span className="min-w-0 flex-1">
            <span className="block text-body text-fg-1">Temperature unreliable</span>
            <span className="block text-label text-fg-2">Ill, drinks, travel — kept out of ovulation</span>
          </span>
          <input type="checkbox" checked={entry?.tempDisturbed ?? false}
            onChange={(e) => onPatch({ tempDisturbed: e.target.checked || undefined })} className="size-5 shrink-0" />
        </label>
      </Cells>
    </div>
  )
}
