import { ChipPick } from '../ui/quickpick'
import { InfoTip } from './InfoTip'
import { prettyDay } from '../../lib/date'
import type { CyclePoint } from '../../lib/types'
import { glossaryTerm } from '../../lib/glossary'
import { FLAGS, FLAG_COLOR } from './flags'

/**
 * The one place on the page that writes. Zone 2 of the contract.
 *
 * One editor for the selected day, never thirty copies of the controls down
 * the month. A temperature, five flags and a drive rating are the whole
 * interaction this page has.
 *
 * ── The three things that were wrong with it ─────────────────────────────
 *
 * Reported as *"these inputs are really bad and they're looking too ugly"*,
 * and there were three distinct faults under that.
 *
 * **1 · The temperature had no label and no unit.** It was a `w-24` number
 * box whose only unit was a `°F` PLACEHOLDER — which disappears the moment a
 * number is typed, so the field showed `97.95` of nothing. It is the single
 * most important input on this page (every chart, the shift, the coverline
 * and the phase confidence are built from it) and it was the one control
 * presented as a stray form field.
 *
 * **2 · The five flags were hand-rolled**, with inline `cat()` fills and an
 * `onAccent()` foreground — the "hand-rolling a control the app already has"
 * trap in CLAUDE.md, which this very file's Drive comment cites for the row
 * directly below it. `ChipPick` already carries the pill radius, the per-tone
 * selected state, the `active:scale-95` press, a real `<fieldset>`/`<legend>`
 * and draw-short/announce-long naming. The row needed `mauve` and `maroon`,
 * which is why it was forked in the first place; those are in the primitive
 * now rather than re-solved here.
 *
 * **3 · A number input and five toggles shared one unlabelled `flex-wrap`
 * row.** Two different kinds of control, no legend on either, wrapping into
 * each other at narrow widths. They are two questions and they read as one
 * pile.
 *
 * ── What the hue still means ─────────────────────────────────────────────
 *
 * The flag's colour is its identity across four surfaces, so it survives the
 * move: `options[].tone` carries it per chip. What changes is the idiom — a
 * solid fill with a computed neutral becomes the app's calibrated
 * border-plus-wash, which is the one `ChipPick` solves for every theme.
 */
export function DayEditor({ date, entry, unit, cycleDay, onMore, framed = true, onTemp, onToggleFlag, onDrive }: {
  date: string
  entry: CyclePoint | undefined
  /** 'F' or 'C'. */
  unit: string
  /**
   * 1-based cycle day for `date`, or null before the first period.
   *
   * It used to be printed on all 31 rows of the month list, which is where
   * the density that list died of came from. "The 18th" is a calendar fact
   * and "day 20" is the one that means something here — but only for the day
   * you are looking at, so it is drawn once, beside that day's own name.
   */
  cycleDay?: number | null
  /** Open the manual at a section — the ⓘ beside the flag row and the drive
   *  scale. See `DayMore`'s own note: these keys existed and nothing read
   *  them. The flag row's points at the section the legend became. */
  onMore?: (section: string) => void
  /**
   * Draw the panel's own fill and padding.
   *
   * True in the act column, where this sits in a card beside other things and
   * needs separating from them. False in `DayWindow`, where it is the whole
   * left column of a dialog — a grey slab inside a white sheet is a box drawn
   * for no reason.
   */
  framed?: boolean
  onTemp: (temp: number | undefined) => void
  onToggleFlag: (flag: string) => void
  /** `undefined` clears the rating — an unrated day is not a day rated 1. */
  onDrive: (drive: number | undefined) => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const flags = entry?.flags ?? []

  return (
    /* NO FILL INSIDE THE WINDOW. The slab exists to separate the editor from
       the card it shares with the legend and the calendar — and in the act
       column that is still true. In the dialog the editor IS the content, so
       a grey panel inside a white one is a box for the sake of a box. */
    <div className={framed ? 'rounded-card bg-ink-2 p-3' : ''}>
      <p className="mb-3 flex flex-wrap items-baseline gap-x-2 text-body font-medium text-fg-1">
        {prettyDay(date)}
        {cycleDay != null && (
          <span className="num text-label font-normal text-fg-2">day {cycleDay}</span>
        )}
        {date === today && (
          /* A quiet pill rather than a grey word: "today" is a state of the
             thing being edited, and the rest of this app draws a state as a
             pill. */
          <span className="rounded-pill border border-line px-2 py-0.5 text-micro font-normal text-fg-2">today</span>
        )}
      </p>

      {/* THE TEMPERATURE, LABELLED, WITH THE UNIT ALWAYS DRAWN.
          The unit lives beside the field, not inside it as a placeholder that
          vanishes on the first keystroke. `text-heading` and `num` because
          this is the page's primary measurement and it was rendering at the
          same weight as a chip's caption. */}
      {/* THE MEASUREMENT, DRAWN AS ONE.
          Every derivation on this page is built from this number — the shift,
          the coverline, the phase confidence, the whole Patterns group — and
          it rendered as a `w-28` number box with a spinner, at the weight of
          a caption, indistinguishable from a quantity field anywhere else in
          the app.

          A rule underneath instead of a box around it: you are writing in a
          journal, not filling in a form, and the rule is also what tells you
          where the cursor is — it goes `brand` on focus. The spinners go with
          the box (`appearance-none`): a basal temperature is typed, and two
          4px arrows that step by 0.1 are a target nobody can hit and a
          precision nobody wants. */}
      <label className="mt-3 block">
        <span className="text-caption uppercase tracking-wide text-fg-2">Waking temperature</span>
        <span className="mt-0.5 flex w-fit items-baseline gap-1.5 border-b-2 border-edge pb-0.5 focus-within:border-brand">
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            value={entry?.temp ?? ''}
            onChange={(e) => onTemp(e.target.value ? Number(e.target.value) : undefined)}
            placeholder="—"
            aria-label={`Waking temperature on ${prettyDay(date)}, degrees ${unit}`}
            /* `leading-none` is the load-bearing one, and it took three
               wrong guesses to find because the failure reads as a width.
               `npm run clipped` said *"37px shown of 39px (5 chars)"* and
               `findOverflowingFields` measures **scrollHeight against
               clientHeight** — a HEIGHT, on a field whose value is five
               characters. The display step carries a 1.15 line-height, so a
               32px glyph needs a 37px line box inside a 37px content box and
               overflows it by two pixels. Widening the field could never fix
               it.

               Two corollaries kept: `w-28` and not `w-[6ch]`, because
               Tailwind v4 emitted **no CSS at all** for the arbitrary `ch`
               width — exit 0, no warning, so the field sat at the browser's
               default and two separate widenings changed nothing. The tell is
               a tweak to a number having no effect, and the check is grepping
               the built CSS for the class, which came back empty. 7rem holds
               the five characters every value here has (`97.84`, `36.58`). */
            className="num w-28 appearance-none leading-none border-0 bg-transparent p-0 text-display font-medium tracking-tight text-fg-1 outline-none placeholder:text-fg-3 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="num text-body text-fg-2">°{unit}</span>
        </span>
      </label>

      {/* THE FLAGS, as the app's own chip row.
          `multi` because several are true at once — a day can be a period day
          with cramps — and `aria-pressed` already says "toggle". The `name`
          carries the glossary expansion, so "pms" announces as "PMS —
          Premenstrual syndrome"; the chip cannot carry an ⓘ, because a button
          inside a button is invalid markup and unusable with a keyboard. A
          flag with no glossary entry keeps its bare name rather than
          inventing one. */}
      <ChipPick
        className="mt-3"
        label="What happened"
        info={<InfoTip tip="flags" onMore={onMore} />}
        /* `dense`, and the measurement with its limit stated.
           At the default `px-3` the five chips span **402px** against a
           360px row at 1440, so they wrapped 4 + 1 — a single orphan chip,
           which reads as a mistake rather than as a row. Dense is **362px**
           and fits that row exactly.
           It does NOT fix the phone: the same 362px against a 300px column
           still wraps 4 + 1, and five words of these lengths cannot be made
           to fit 300px without shortening the words, which are the data. A
           prop to control the split would be a control invented for one
           cosmetic case. The desktop orphan is gone; the phone one is known
           and left. */
        dense
        multi
        value={flags}
        onChange={onToggleFlag}
        options={FLAGS.map((f) => {
          const meaning = glossaryTerm(f)
          return {
            value: f,
            label: f,
            tone: FLAG_COLOR[f],
            name: meaning ? `${meaning.term} — ${meaning.expansion}` : undefined,
          }
        })}
      />

      {/* DRIVE · the same segmented track as Mood and Energy.
          It is a SCALE and the flags are booleans, so it is its own row: five
          numbers inside the flag row would read as five more things that are
          either on or off. */}
      <ChipPick
        className="mt-3"
        label="Drive"
        info={<InfoTip tip="drive" onMore={onMore} />}
        tone="peach"
        value={entry?.drive ?? null}
        onChange={(n) => onDrive(entry?.drive === n ? undefined : n)}
        scale={{ low: '1 none', high: '5 high', words: DRIVE_WORDS }}
        hint="Optional — press the current number again to clear it"
        options={DRIVE_SCALE.map((n) => ({ value: n, label: String(n) }))}
      />
    </div>
  )
}

/** 1–5, the same self-rating scale the urge log already uses. */
const DRIVE_SCALE = [1, 2, 3, 4, 5] as const
/** What each step means, so "3" is not a rank with nothing attached. */
const DRIVE_WORDS = ['none', 'low', 'some', 'strong', 'high']
