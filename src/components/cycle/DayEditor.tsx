import { ChipPick } from '../ui/quickpick'
import { Input } from '../ui'
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
export function DayEditor({ date, entry, unit, onTemp, onToggleFlag, onDrive }: {
  date: string
  entry: CyclePoint | undefined
  /** 'F' or 'C'. */
  unit: string
  onTemp: (temp: number | undefined) => void
  onToggleFlag: (flag: string) => void
  /** `undefined` clears the rating — an unrated day is not a day rated 1. */
  onDrive: (drive: number | undefined) => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const flags = entry?.flags ?? []

  return (
    <div className="rounded-card bg-ink-2 p-3">
      <p className="mb-3 flex items-baseline gap-2 text-body font-medium text-fg-1">
        {prettyDay(date)}
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
      <label className="block">
        <span className="text-label text-fg-2">Waking temperature</span>
        <span className="mt-1 flex items-center gap-2">
          <Input
            type="number"
            step="0.1"
            inputMode="decimal"
            value={entry?.temp ?? ''}
            onChange={(e) => onTemp(e.target.value ? Number(e.target.value) : undefined)}
            placeholder="—"
            aria-label={`Waking temperature on ${prettyDay(date)}, degrees ${unit}`}
            className="num w-28 py-1.5 text-heading"
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
