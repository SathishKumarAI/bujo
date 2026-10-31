import { CaretRight } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { ChipPick } from '../ui/quickpick'
import { Sheet } from '../ui/sheet'
import { useDevice } from '../shell/device'
import { CommitField } from '../CommitField'
import { useStickyState } from '../../lib/useStickyState'
import type { CyclePoint } from '../../lib/types'
import { CHIP_FIELDS, FIELD_SECTIONS, SCALE_FIELDS, TAG_FIELDS } from './dayFields'

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
  // A phone opens these in a bottom sheet (the optional half, as on every
  // phone page) — never remembered open, or the page would load under a sheet.
  const phone = useDevice() === 'mobile'
  const [sheet, setSheet] = useState(false)
  const isOpen = phone ? sheet : open === '1'

  const flags = entry?.flags ?? []
  const chips = CHIP_FIELDS
  /* Trying-to-conceive mode puts the cycle signs first — the SECTION moves,
     not the fields within it, which is what makes the reordering legible
     instead of a shuffle. */
  const sections = fertilityFirst
    ? [...FIELD_SECTIONS].sort((a, b) => (a.id === 'signs' ? -1 : b.id === 'signs' ? 1 : 0))
    : FIELD_SECTIONS

  return (
    <div className="mt-3 border-t border-line pt-2">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => (phone ? setSheet(true) : setOpen(isOpen ? '0' : '1'))}
        className="flex min-h-11 w-full items-center gap-3 text-left"
      >
        {/* THE SAME CARET AS THE ROW UNDER IT, on the same side. These two
            disclosures sit eight pixels apart and had different glyphs on
            opposite edges — a `▸` text character on the right here, a rotating
            `CaretRight` icon on the left there. Two controls that do the same
            thing and look like two different things is the "just created
            website" tell in miniature; `caret-turn` is the app's own rotation
            and this row now uses it. */}
        <span className="caret-turn caret-turn-quarter inline-flex shrink-0 text-fg-2" data-open={isOpen}>
          <Icon as={CaretRight} size="sm" />
        </span>

        {/* ONE LINE, and it stays one: a title that does not shrink, a muted
            value pushed right that TRUNCATES, and the caret. It rendered as
            three lines before — the title, a hint listing five field names,
            and the summary under it — which is what "looking like a just
            created website" is made of. A row with a name on the left and its
            state on the right is the shape every settings list in every SaaS
            uses, and it is one line by construction.

            The field names left the hint because the title already carries
            the two people ask for, and the rest are named by their own
            legends once the panel is open. */}
        {/* "energy" came out of the title to buy the summary its width: with
            it the row needed 123px of summary in 114px and `npm run clipped`
            stayed red. Mood, mucus and LH are the three that were actually
            asked for by name, and energy sits beside mood in the panel and in
            the summary, so it is the one word that costs nothing to drop. */}
        <span className="shrink-0 text-body font-medium text-fg-1">Mood, mucus, LH &amp; more</span>
        <span className="ml-auto min-w-0 truncate text-label text-fg-2">
          {isOpen && !phone ? 'tap to close' : (summary(entry) || 'tap to add')}
        </span>

      </button>

      {isOpen && (() => {
        const body = (
        <div className={phone ? 'space-y-5' : 'collapse-in mt-3 space-y-5'}>
          {/* THREE QUESTIONS, NOT NINE FIELDS.
              Nine chip groups at one weight with nothing between them is
              ~900px of flat stack in a 424px column — a list you scan rather
              than read, and reported as exactly that. The sections come from
              `dayFields.ts` so the grouping is data rather than a heading
              typed in here, and `fertilityFirst` reorders the SECTIONS now
              instead of the fields inside them: the same intent, in a shape
              the reader can see. */}
          {sections.map((sec) => {
            const scales = SCALE_FIELDS.filter((f) => f.section === sec.id)
            const tags = TAG_FIELDS.filter((f) => f.section === sec.id)
            const picks = chips.filter((f) => f.section === sec.id
              && !(f.onlyWithFlag && !flags.includes(f.onlyWithFlag)))
            if (scales.length + tags.length + picks.length === 0) return null
            return (
              <section key={sec.id} className="space-y-4">
                {/* A quiet rule and a quiet word: the groups under it carry
                    their own `<legend>`s, so this heading has to sit BELOW
                    them in weight or the panel gains a second competing
                    hierarchy. */}
                <h4 className="border-b border-line pb-1 text-caption uppercase tracking-wide text-fg-2">
                  {sec.title}
                </h4>

                {scales.map((f) => (
                  <ChipPick
                    key={f.key}
                    label={f.label}
                    /* The endpoints move out of the legend and under the
                       track, where they label the ends they describe. The
                       legend is the group's NAME again rather than a
                       sentence. */
                    scale={{ low: `1 ${f.low}`, high: `5 ${f.high}`, words: f.words }}
                    tone="teal"
                    value={entry?.[f.key] ?? null}
                    onChange={(v) => onPatch({ [f.key]: entry?.[f.key] === v ? undefined : v })}
                    options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))}
                  />
                ))}

                {tags.map((f) => {
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
                        // `undefined` rather than `[]` when the last tag comes
                        // off: an empty array persists as "asked and answered
                        // with nothing".
                        onPatch({ [f.key]: next.length ? next : undefined })
                      }}
                      options={f.options.map((o) => ({ value: o, label: o }))}
                    />
                  )
                })}

                {picks.map((f) => {
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
              </section>
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
        )
        return phone
          ? <Sheet open={sheet} onOpenChange={setSheet} title="Mood, mucus, LH & more" description="All optional — saved as you tap">{body}</Sheet>
          : body
      })()}
    </div>
  )
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
  /* CAPPED AT TWO NAMES AND A COUNT, because the row is one line.
     The full join is "mood 3 · energy 3 · sticky · 1 tag · temp flagged" —
     **265px of text in a 114px slot**, which `npm run clipped` caught the
     moment this row stopped wrapping. Truncating it would have hidden three
     of the five things a reader logged, and `data-clip-ok` would have been me
     silencing a true finding rather than fixing it.
     So the summary fits the space instead: what it is for is "is there
     anything on this day, roughly what", and two names plus a remainder
     answers that in a width that always fits. The detail is one press away,
     which is the whole point of the row. */
  if (parts.length <= 2) return parts.join(' · ')
  return `${parts.slice(0, 2).join(' · ')} · +${parts.length - 2}`
}
