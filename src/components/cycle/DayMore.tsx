import { ChipPick } from '../ui/quickpick'
import { useStickyState } from '../../lib/useStickyState'
import type { CyclePoint } from '../../lib/types'
import { CHIP_FIELDS, SCALE_FIELDS, TAG_FIELDS } from './dayFields'

/**
 * MORE FOR TODAY · the optional half of a day's log.
 *
 * The fast path above this — temperature, five flags, drive — is untouched and
 * stays the whole interaction for anyone who wants it to be. This is collapsed
 * by default and remembers its state, because the cost of the optional fields
 * is not the tapping, it is being *asked*: nine groups on screen every morning
 * turns a ten-second habit into a form.
 *
 * **Every group is `ChipPick`, the app's own control.** The first version of
 * this file hand-rolled its chips with inline `cat('surface0')` backgrounds,
 * which is how a new panel ends up looking like an unstyled form next to the
 * rest of the page: `ChipPick` already carries the pill radius, the `bg-ink-2`
 * rest fill, the per-tone selected state, the `active:scale-95` press and the
 * real `<fieldset>`/`<legend>`. Restyling a copy to match it would have been
 * two things to keep in step, which DESIGN.md's whole argument is against.
 *
 * `ChipPick` calls `onChange` with the value that was pressed; pressing the
 * selected one again clears it here, because absent means "not logged" and has
 * to stay reachable — a day with no mucus recorded is not a dry day.
 */
export function DayMore({ entry, onPatch, fertilityFirst = false }: {
  entry: CyclePoint | undefined
  onPatch: (patch: Partial<CyclePoint>) => void
  /**
   * Trying-to-conceive mode puts the fertility signs at the top and opens the
   * panel by default — Stage 6. Ordering, not gating: every field stays
   * available in both modes.
   */
  fertilityFirst?: boolean
}) {
  const [open, setOpen] = useStickyState<'1' | '0'>('cycle.more', fertilityFirst ? '1' : '0', ['1', '0'])
  const isOpen = open === '1'

  const flags = entry?.flags ?? []
  const chips = fertilityFirst ? [...CHIP_FIELDS].sort((a, b) => rank(a.key) - rank(b.key)) : CHIP_FIELDS

  return (
    <div className="mt-3 border-t border-line pt-2">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setOpen(isOpen ? '0' : '1')}
        className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
      >
        <span className="min-w-0">
          {/* The label NAMES the fields, because "More" alone is a fold nobody
              opens — the first version said only "More for today" and the most
              asked-for thing on this page (mood and energy) was behind it with
              nothing to say so. */}
          <span className="text-body font-medium text-fg-1">Mood, energy &amp; symptoms</span>
          <span className="ml-2 text-label text-fg-2">
            {isOpen ? 'tap to close' : summary(entry) || 'flow · mucus · LH · cravings'}
          </span>
        </span>
        <span aria-hidden className="shrink-0 text-fg-2">{isOpen ? '▾' : '▸'}</span>
      </button>

      {isOpen && (
        <div className="collapse-in mt-3 space-y-4">
          {/* Mood and energy lead. They are the two people come looking for,
              and burying them under four fertility fields is what made them
              unfindable. */}
          {SCALE_FIELDS.map((f) => (
            <ChipPick
              key={f.key}
              label={`${f.label} · 1 ${f.low} … 5 ${f.high}`}
              tone="teal"
              value={entry?.[f.key] ?? null}
              onChange={(v) => onPatch({ [f.key]: entry?.[f.key] === v ? undefined : v })}
              options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))}
            />
          ))}

          {TAG_FIELDS.map((f) => {
            const current = (entry?.[f.key] as string[] | undefined) ?? []
            return (
              <ChipPick
                key={f.key}
                label={f.label}
                tone="peach"
                multi
                value={current}
                onChange={(v) => {
                  const next = current.includes(v) ? current.filter((x) => x !== v) : [...current, v]
                  // `undefined` rather than `[]` when the last tag comes off: an
                  // empty array persists as "asked and answered with nothing".
                  onPatch({ [f.key]: next.length ? next : undefined })
                }}
                options={f.options.map((o) => ({ value: o, label: o }))}
              />
            )
          })}

          {chips.map((f) => {
            // Flow is meaningless on a day with no bleeding, and an empty
            // "light / medium / heavy" row on day 14 invites answering it.
            if (f.onlyWithFlag && !flags.includes(f.onlyWithFlag)) return null
            const current = entry?.[f.key]
            return (
              <ChipPick
                key={f.key}
                label={f.label}
                value={current ?? null}
                onChange={(v) => onPatch({ [f.key]: current === v ? undefined : v })}
                options={f.options}
              />
            )
          })}

          {/* DISTURBED · the one control here that changes a calculation. Last,
              because it is about the reading above rather than about the day,
              and worded as the reasons rather than as "disturbed", which means
              nothing on its own at 7am. */}
          <label className="flex min-h-11 cursor-pointer items-start gap-2 border-t border-line pt-3 text-label text-fg-2">
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

/** What is already recorded, so folding hides the controls and not the answers. */
function summary(entry: CyclePoint | undefined): string {
  if (!entry) return ''
  const parts: string[] = []
  if (entry.mood != null) parts.push(`mood ${entry.mood}`)
  if (entry.energy != null) parts.push(`energy ${entry.energy}`)
  if (entry.flow) parts.push(entry.flow.replace('-', ' '))
  if (entry.mucus) parts.push(entry.mucus)
  if (entry.lh && entry.lh !== 'not-taken') parts.push(`LH ${entry.lh}`)
  const tags = (entry.symptoms?.length ?? 0) + (entry.cravings?.length ?? 0) + (entry.moodTags?.length ?? 0)
  if (tags) parts.push(`${tags} tag${tags === 1 ? '' : 's'}`)
  if (entry.tempDisturbed) parts.push('temp flagged')
  return parts.join(' · ')
}
