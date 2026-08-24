import { Check } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Band, BandRow, Eyebrow } from '../mod'
import { principleById, MINDSET_MAX_FOCUS } from '../../lib/mindset'
import type { MindsetFocus } from '../../lib/types'

/**
 * The act zone: one column per focus slot, each holding its principle and the
 * personal cue you actually use.
 *
 * Owns the slot row and everything in a slot. Does not own what happens to the
 * data — every action is a callback to the view.
 *
 * **The row never wraps.** Equal `flex-1 basis-0` children, not an `auto-fit`
 * grid: the handoff records an earlier build where the slots wrapped and left a
 * dead half-row under them. Cells get narrow on a phone, which is the correct
 * failure — three visible slots is the whole point of the section.
 *
 * Slot count is `max(MINDSET_MAX_FOCUS, focus.length)`. A journal written before
 * the cap existed can hold four or five, and hiding one behind a constant would
 * make a principle unclearable — visible over tidy.
 */
export function FocusSlots({
  focus,
  practiceLog,
  today,
  onNote,
  onRemove,
  onTogglePractice,
}: {
  focus: MindsetFocus[]
  practiceLog: Record<string, string[]>
  today: string
  onNote: (focusId: string, note: string) => void
  onRemove: (focusId: string) => void
  onTogglePractice: (principleId: string) => void
}) {
  const count = Math.max(MINDSET_MAX_FOCUS, focus.length)
  const slots = Array.from({ length: count }, (_, i) => focus[i])

  return (
    <Band className="py-6">
      <div className="mb-3.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-display text-heading font-medium text-fg-1">Focus slots</h2>
        <Eyebrow className="tracking-[0.1em]">
          {focus.length} of {count} in use
        </Eyebrow>
      </div>
      <BandRow wrap={false} className="items-stretch border-t-2 border-line">
        {slots.map((f, i) => {
          const p = f ? principleById(f.principleId) : undefined
          const practisedToday = !!f && (practiceLog[f.principleId] ?? []).includes(today)
          return (
            <div
              key={f?.id ?? `empty-${i}`}
              className="flex min-w-0 flex-1 basis-0 flex-col gap-2 border-line pt-3 pr-5 pb-1 [&:not(:last-child)]:border-r"
            >
              <div className="flex items-baseline gap-2.5">
                <Eyebrow className="text-fg-3">Slot {i + 1}</Eyebrow>
                {f && (
                  <button
                    onClick={() => onRemove(f.id)}
                    className="ml-auto text-label text-fg-2 hover:text-brand-text"
                  >
                    Clear
                  </button>
                )}
              </div>

              {f && p ? (
                <>
                  <h3 className="font-display text-body leading-snug font-medium text-balance text-fg-1">{p.title}</h3>
                  {/* Borderless but for a bottom rule: a boxed input would be the
                      only rounded object on the page and would read as a form
                      rather than as a line you write on. */}
                  <textarea
                    value={f.note ?? ''}
                    onChange={(e) => onNote(f.id, e.target.value)}
                    placeholder="Add a cue"
                    rows={2}
                    aria-label={`Your cue for ${p.title}`}
                    className="min-h-11 w-full resize-none border-0 border-b border-line bg-transparent py-1 text-label text-fg-2 placeholder:text-fg-3 focus-visible:border-brand focus-visible:outline-none"
                  />
                  <button
                    onClick={() => onTogglePractice(f.principleId)}
                    aria-pressed={practisedToday}
                    className={`mt-1 mb-2 inline-flex items-center gap-1.5 self-start text-label ${
                      practisedToday ? 'text-brand-text' : 'text-fg-2 hover:text-fg-1'
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`grid size-4 shrink-0 place-items-center border ${
                        practisedToday ? 'border-brand bg-brand-wash text-brand-text' : 'border-line'
                      }`}
                    >
                      {practisedToday && <Icon as={Check} size="sm" className="size-3" />}
                    </span>
                    {practisedToday ? 'Practised today' : 'Mark practised'}
                  </button>
                </>
              ) : (
                <p className="pb-3 text-label text-fg-3">Open — pick one below</p>
              )}
            </div>
          )
        })}
      </BandRow>
    </Band>
  )
}
