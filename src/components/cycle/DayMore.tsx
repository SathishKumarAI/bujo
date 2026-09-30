import { cat } from '../../lib/colors'
import { useStickyState } from '../../lib/useStickyState'
import type { CyclePoint } from '../../lib/types'
import { CHIP_FIELDS, SCALE_FIELDS, TAG_FIELDS } from './dayFields'

/**
 * MORE FOR TODAY · the optional half of a day's log.
 *
 * The fast path above this — temperature, five flags, drive — is untouched and
 * stays the whole interaction for anyone who wants it to be. This is collapsed
 * by default and remembers its state, because the cost of the optional fields
 * is not the tapping, it is being *asked*: nine chip groups on screen every
 * morning turns a ten-second habit into a form.
 *
 * Every control writes one field and writes it immediately. There is no save
 * button, matching the rest of the editor — the flags and the temperature have
 * always autosaved, and introducing a save action for half the panel would mean
 * two rules on one card.
 *
 * **Pressing the selected value again clears it.** That is why these are
 * `aria-pressed` buttons rather than a radio group: absent has to stay reachable,
 * because absent means "not logged" and is a different fact from every value on
 * offer. A radio group can only express that with a sixth "none" button, which
 * then reads as an answer.
 */
export function DayMore({ entry, onPatch, fertilityFirst = false }: {
  entry: CyclePoint | undefined
  onPatch: (patch: Partial<CyclePoint>) => void
  /**
   * Trying-to-conceive mode puts the fertility signs at the top and opens the
   * panel by default — see Stage 6. Ordering, not gating: every field stays
   * available in both modes.
   */
  fertilityFirst?: boolean
}) {
  const [open, setOpen] = useStickyState<'1' | '0'>('cycle.more', fertilityFirst ? '1' : '0', ['1', '0'])
  const isOpen = open === '1'

  const flags = entry?.flags ?? []
  const chips = fertilityFirst
    ? [...CHIP_FIELDS].sort((a, b) => rank(a.key) - rank(b.key))
    : CHIP_FIELDS

  return (
    <div className="mt-3 border-t border-line pt-2">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setOpen(isOpen ? '0' : '1')}
        className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-label text-fg-2 hover:text-fg-1"
      >
        <span>
          <span className="font-medium text-fg-1">More for today</span>
          {!isOpen && summary(entry) && <span className="ml-2">{summary(entry)}</span>}
        </span>
        <span aria-hidden>{isOpen ? '▾' : '▸'}</span>
      </button>

      {isOpen && (
        <div className="collapse-in mt-2 space-y-3">
          {chips.map((f) => {
            // Flow is meaningless on a day with no bleeding, and an empty
            // "light / medium / heavy" row on day 14 invites answering it.
            if (f.onlyWithFlag && !flags.includes(f.onlyWithFlag)) return null
            const current = entry?.[f.key]
            return (
              <fieldset key={f.key} className="border-0 p-0">
                <legend className="mb-1 text-label text-fg-2">{f.label}</legend>
                <div className="flex flex-wrap gap-1.5">
                  {f.options.map((o) => {
                    const on = current === o.value
                    return (
                      <button
                        key={o.value}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onPatch({ [f.key]: on ? undefined : o.value })}
                        className="min-h-11 rounded-control px-2.5 py-1 text-label"
                        style={{
                          background: on ? cat('surface2') : cat('surface0'),
                          color: on ? cat('text') : cat('subtext0'),
                        }}
                      >
                        {o.label}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            )
          })}

          {SCALE_FIELDS.map((f) => {
            const current = entry?.[f.key]
            return (
              <fieldset key={f.key} className="border-0 p-0">
                <legend className="mb-1 text-label text-fg-2">
                  <span className="font-medium text-fg-1">{f.label}</span> · 1 {f.low} … 5 {f.high}
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const on = current === n
                    return (
                      <button
                        key={n}
                        type="button"
                        aria-pressed={on}
                        aria-label={`${f.label} ${n} of 5`}
                        onClick={() => onPatch({ [f.key]: on ? undefined : n })}
                        className="num min-h-11 min-w-11 rounded-control px-2 py-1 text-label"
                        style={{
                          background: on ? cat('surface2') : cat('surface0'),
                          color: on ? cat('text') : cat('subtext0'),
                        }}
                      >
                        {n}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            )
          })}

          {TAG_FIELDS.map((f) => {
            const current = (entry?.[f.key] as string[] | undefined) ?? []
            return (
              <fieldset key={f.key} className="border-0 p-0">
                <legend className="mb-1 text-label text-fg-2">{f.label}</legend>
                <div className="flex flex-wrap gap-1.5">
                  {f.options.map((o) => {
                    const on = current.includes(o)
                    return (
                      <button
                        key={o}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onPatch({
                          // `undefined` rather than `[]` when the last tag comes
                          // off: an empty array persists as "asked and answered
                          // with nothing", which is not what happened.
                          [f.key]: on
                            ? (current.filter((x) => x !== o).length ? current.filter((x) => x !== o) : undefined)
                            : [...current, o],
                        })}
                        className="min-h-11 rounded-control px-2.5 py-1 text-label"
                        style={{
                          background: on ? cat('surface2') : cat('surface0'),
                          color: on ? cat('text') : cat('subtext0'),
                        }}
                      >
                        {o}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            )
          })}

          {/* DISTURBED · the one control here that changes a calculation.
              It is last because it is about the reading above, not about the
              day, and it is worded as the reasons rather than as the word
              "disturbed", which means nothing on its own at 7am. */}
          <label className="flex min-h-11 cursor-pointer items-start gap-2 border-t border-line pt-2 text-label text-fg-2">
            <input
              type="checkbox"
              checked={entry?.tempDisturbed ?? false}
              onChange={(e) => onPatch({ tempDisturbed: e.target.checked || undefined })}
              className="mt-0.5 size-4 shrink-0"
            />
            <span>
              <span className="text-fg-1">Temperature not reliable today</span> — illness, alcohol,
              travel, a short night, or taken much later than usual. Left out of ovulation detection.
            </span>
          </label>
        </div>
      )}
    </div>
  )
}

/** Fertility signs first in conceive mode; the rest keep their order. */
function rank(key: string): number {
  const order = ['mucus', 'lh', 'intimacy', 'flow']
  const i = order.indexOf(key)
  return i === -1 ? 99 : i
}

/**
 * What is already recorded, for the collapsed row — so folding the panel hides
 * the controls without hiding the answers.
 */
function summary(entry: CyclePoint | undefined): string {
  if (!entry) return ''
  const parts: string[] = []
  if (entry.flow) parts.push(entry.flow.replace('-', ' '))
  if (entry.mucus) parts.push(entry.mucus)
  if (entry.lh && entry.lh !== 'not-taken') parts.push(`LH ${entry.lh}`)
  if (entry.mood != null) parts.push(`mood ${entry.mood}`)
  if (entry.energy != null) parts.push(`energy ${entry.energy}`)
  const tagCount = (entry.symptoms?.length ?? 0) + (entry.cravings?.length ?? 0) + (entry.moodTags?.length ?? 0)
  if (tagCount) parts.push(`${tagCount} tag${tagCount === 1 ? '' : 's'}`)
  if (entry.tempDisturbed) parts.push('temp flagged')
  return parts.join(' · ')
}
