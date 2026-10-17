import { ChipPick } from '../ui/quickpick'
import { CommitField } from '../CommitField'
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
              nothing to say so.

              THE NAMES ARE ALWAYS DRAWN, and that is a fix. They used to be
              `summary(entry) || 'flow · mucus · LH · cravings · a note'` — the
              hint showed only on a day with NOTHING on it, so the moment you
              logged a mood it was replaced by "mood 3" and the other eight
              fields became unfindable again. Asked exactly that way: *"where
              else can I mark it as sticky, creamy? I'm not able to
              understand"* — mucus is in here, and on a day with any value the
              word "mucus" appeared nowhere on the page.

              So: the fields always, and what you filled in underneath. The
              second line costs ~18px on a day that has values and is the
              answer to the only question anyone asked about this control. */}
          {/* THE TITLE NAMES THE FIELDS, and that is the second fix here.
              The first put the field names in the small grey hint beside the
              title and the question came back unchanged — *"how can I mark
              it? I'm unable to see it"* — because "Mood, energy & symptoms"
              is what the eye reads, and mucus is not in it. A hint under a
              heading that does not mention the thing is a hint nobody
              connects to the thing.

              So mucus and LH are IN the heading, and the rest is the hint.
              `MarkKey` in `FlagLegend` names this control by the same words,
              because the key that advertises `∴ creamy` has to say where
              `creamy` is set.

              THE HEADING'S ORDER IS THE PANEL'S ORDER. Writing mucus first
              read better and would have been a lie: the groups render mood,
              energy, tags, cravings, symptoms, mucus, LH, intimacy — mood
              and energy lead on an earlier measured decision ("burying them
              under four fertility fields is what made them unfindable"), and
              a heading that promises a different order sends the reader to
              the top of a panel whose first control is not the one named. Two
              readers wanted opposite things first; naming both in the heading
              is what serves them, not reordering for the louder one. */}
          <span className="text-body font-medium text-fg-1">Mood, energy, mucus, LH &amp; more</span>
          <span className="ml-2 text-label text-fg-2">
            {isOpen ? 'tap to close' : 'tap to add · flow · cravings · symptoms · a note'}
          </span>
          {!isOpen && summary(entry) && (
            <span className="mt-0.5 block text-label text-fg-1">{summary(entry)}</span>
          )}
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

          {/* IN WORDS · the escape hatch from nine closed lists.
              `CyclePoint.note` has been in the type since the page shipped and
              `lib/captureLanding.ts` already READS it into journal search —
              nothing ever wrote it, so the Cycle page offered 53 tick controls
              and no way to say a sentence. A started medication, a doctor's
              visit, a cramp unlike the others: none of those is a chip, and a
              closed list that cannot be escaped turns them into nothing.

              Below the chips rather than above, because the chips are the fast
              path and this is the exception; `CommitField` so a sentence is one
              journal write and not one per character. */}
          <label className="block border-t border-line pt-3">
            <span className="mb-1.5 block text-label text-fg-2">
              <span className="font-medium text-fg-1">Note</span> · anything the chips cannot say
            </span>
            <CommitField
              key={entry?.date ?? 'none'}
              rows={2}
              value={entry?.note ?? ''}
              onCommit={(v) => onPatch({ note: v.trim() || undefined })}
              placeholder="Started a new pill, cramps worse than usual, doctor on Friday…"
              label="Note for this day"
              className="w-full"
            />
          </label>

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
  // The note's PRESENCE, not its text: this line is one row in a collapsed
  // header and a sentence would push everything else off it. Without it a
  // written note is invisible until the fold is opened again, which is the
  // "a chart behind a closed fold is a chart that does not exist" rule in
  // docs/PAGE-SHAPE.md applied to a field you typed yourself.
  if (entry.note?.trim()) parts.push('noted')
  return parts.join(' · ')
}
