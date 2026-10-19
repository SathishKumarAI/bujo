import { CaretRight } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { ChipPick, Switch } from '../ui/quickpick'
import { InfoTip } from './InfoTip'
import { CommitField } from '../CommitField'
import { useStickyState } from '../../lib/useStickyState'
import type { CyclePoint } from '../../lib/types'
import { CHIP_FIELDS, FIELD_SECTIONS, SCALE_FIELDS, TAG_FIELDS, daySummary } from './dayFields'

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
export function DayMore({ entry, onPatch, fertilityFirst = false, embedded = false, onMore }: {
  entry: CyclePoint | undefined
  onPatch: (patch: Partial<CyclePoint>) => void
  /**
   * The host is already a disclosure, so do not be a second one.
   *
   * This panel used to live in the act column, where a fold was the only way
   * to keep a 2,187px form out of an 868px sticky panel. It lives in
   * `DayWindow` now — a dialog you opened on purpose — and a fold inside a
   * dialog is a door behind a door. Embedded it drops the header and lays its
   * three sections out as a CONTAINER grid, because a dialog can be 900px
   * wide and the stack only existed to survive 416.
   */
  embedded?: boolean
  /**
   * Open the manual at a section — what every field's ⓘ does.
   *
   * `dayFields.ts` has carried a `help` key on `flow`, `cervical mucus`,
   * `LH test`, `cravings` and `mood` since it was written, `lib/cycleHelp.ts`
   * has an entry for every one of them with a `more:` target, and **nothing
   * rendered any of it** — `InfoTip` appeared on exactly four facts in zone 1
   * and nowhere else. A dead field is found by grepping the FIELD, not the
   * module: `dayFields.ts` was imported, rendered and plainly alive the whole
   * time, with five of its keys reaching no caller. Asked for directly:
   * *"whenever someone tries, give an information icon on top of the inputs
   * in the log, and if I click on it show them the guide or manual."*
   */
  onMore?: (section: string) => void
  /**
   * Trying-to-conceive mode puts the fertility signs at the top and opens the
   * panel by default — Stage 6. Ordering, not gating: every field stays
   * available in both modes.
   */
  fertilityFirst?: boolean
}) {
  const [open, setOpen] = useStickyState<'1' | '0'>('cycle.more', fertilityFirst ? '1' : '0', ['1', '0'])
  const isOpen = embedded || open === '1'

  const flags = entry?.flags ?? []
  const chips = CHIP_FIELDS
  /* Trying-to-conceive mode puts the cycle signs first — the SECTION moves,
     not the fields within it, which is what makes the reordering legible
     instead of a shuffle. */
  const sections = fertilityFirst
    ? [...FIELD_SECTIONS].sort((a, b) => (a.id === 'signs' ? -1 : b.id === 'signs' ? 1 : 0))
    : FIELD_SECTIONS

  return (
    <div className={embedded ? '' : 'mt-3 border-t border-line pt-2'}>
      {!embedded && (
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setOpen(isOpen ? '0' : '1')}
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
          {isOpen ? 'tap to close' : (daySummary(entry) || 'tap to add')}
        </span>

      </button>
      )}

      {isOpen && (
        /* A VIEWPORT breakpoint, which is the same exception `DayWindow`'s
           own width takes and for the same reason: this panel is only ever
           `embedded` inside a dialog, and a dialog is sized by the window
           rather than by a page split. A container query here would need a
           container declared on an ancestor inside the dialog, which is one
           more thing to get silently wrong — and CLAUDE.md's standing trap is
           that a query against a missing container matches at NO width and
           says nothing about it. */
        <div className={embedded
          ? 'grid gap-x-7 gap-y-6 lg:grid-cols-2'
          : 'collapse-in mt-3 space-y-5'}>
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
                    info={f.help ? <InfoTip tip={f.help} onMore={onMore} /> : undefined}
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
                      info={f.help ? <InfoTip tip={f.help} onMore={onMore} /> : undefined}
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
                      info={f.help ? <InfoTip tip={f.help} onMore={onMore} /> : undefined}
                      value={current ?? null}
                      onChange={(v) => onPatch({ [f.key]: current === v ? undefined : v })}
                      /* A RAIL, because these are ordered and were not drawn
                         that way. `flow` runs light → very heavy, `mucus` runs
                         dry → egg-white and `lh` runs not-taken → peak —
                         `dayFields.ts` says so in its own docstring and then
                         rendered all three as rows of identical pills, which
                         hid the one that matters: the mucus progression IS
                         the fertile ramp, and seeing where you are along it
                         is the whole reason the field exists.
                         `low`/`high` go unused — a named scale carries its
                         words on its own stops. */
                      scale={f.ordered
                        ? { low: f.options[0].label, high: f.options[f.options.length - 1].label }
                        : undefined}
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
          {/* A SWITCH, not a checkbox. This is the only control on the panel
              that changes a CALCULATION rather than recording the day — the
              reading is dropped from ovulation detection — and it shipped as
              the smallest, least considered thing on the card, a bare
              checkbox under eleven chip groups. A switch is the one shape in
              this vocabulary that reads as "this changes how the app
              behaves". */}
          <Switch
            checked={entry?.tempDisturbed ?? false}
            onChange={(next) => onPatch({ tempDisturbed: next || undefined })}
            label="Temperature not reliable today"
            hint="illness, alcohol, travel, a short night, or taken much later than usual. Left out of ovulation detection."
          />
        </div>
      )}
    </div>
  )
}
