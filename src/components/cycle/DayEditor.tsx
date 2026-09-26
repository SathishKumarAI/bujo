import { Input } from '../ui'
import { cat, onAccent } from '../../lib/colors'
import { prettyDay } from '../../lib/date'
import type { CyclePoint } from '../../lib/types'
import { glossaryTerm } from '../../lib/glossary'
import { FLAGS, FLAG_COLOR } from './flags'

/**
 * The one place on the page that writes. Zone 2 of the contract.
 *
 * One editor for the selected day, never thirty copies of the controls down
 * the month. The temperature field, the five flag chips and the drive rating are
 * the whole interaction this page has.
 *
 * `onAccent(fill)`, not `cat('crust')`, for the pressed chip's text — the
 * light-on-saturated neutral differs per theme and `crust` is near-white in
 * the light ones, which is the trap CLAUDE.md records. Both branches of the
 * ternary are a decision: the unpressed chip uses `subtext0`, because
 * `overlay0` on a neutral fill measures 2.57:1.
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
      <p className="mb-2 text-body font-medium text-fg-1">
        {prettyDay(date)}
        {date === today && <span className="ml-2 text-label font-normal text-fg-2">today</span>}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="number"
          step="0.1"
          value={entry?.temp ?? ''}
          onChange={(e) => onTemp(e.target.value ? Number(e.target.value) : undefined)}
          placeholder={`°${unit}`}
          aria-label={`Basal temperature on ${prettyDay(date)} (°${unit})`}
          className="w-24 py-1"
        />
        {/* The chip cannot carry an ⓘ: it is already a button, and a button
            inside a button is invalid markup and unusable with a keyboard. So the
            expansion rides on the chip's own accessible name instead — "pms"
            announces as "PMS — Premenstrual syndrome" — and the full definition
            lives one tap away in the phase legend and in Help's glossary. All
            three read `src/data/glossary.json`; none of them holds its own copy.
            A flag with no glossary entry keeps its bare name rather than
            inventing one. */}
        {FLAGS.map((f) => {
          const on = flags.includes(f)
          const fill = cat(FLAG_COLOR[f])
          const meaning = glossaryTerm(f)
          const name = meaning ? `${meaning.term} — ${meaning.expansion}` : f
          return (
            <button
              key={f}
              onClick={() => onToggleFlag(f)}
              aria-pressed={on}
              aria-label={name}
              title={name}
              className="rounded-control px-2 py-1 text-label"
              style={{
                background: on ? fill : cat('surface0'),
                color: on ? onAccent(fill) : cat('subtext0'),
              }}
            >
              {f}
            </button>
          )
        })}
      </div>

      {/* DRIVE · its own labelled row, not a sixth chip.
          It is a *scale* and the flags are booleans, so mixing them into one
          wrapping row would have five numbers reading as five more things that
          are either on or off. A `<fieldset>` because that is what five mutually
          exclusive controls are, and `aria-pressed` for the same reason the flags
          use it — the pressed one is the current value and pressing it again
          clears it, which a radio group cannot do without a sixth "none" button.
          `flex-wrap` at the call site, because `Card` cannot wrap markup it does
          not own and this row plus its legend is 250px on a 324px phone column. */}
      <fieldset className="mt-3 border-0 p-0">
        {/* Both halves are `fg-2`, and the dimmer `fg-3` is the bug that was
            here first: that tier is calibrated against the *page and card*
            surfaces (6.55:1 mocha, 4.74:1 latte) and this legend sits on the
            editor's raised `bg-ink-2`, where it measured **4.18:1** — caught by
            `npm run a11y` as a serious color-contrast at desktop and phone. The
            ground moved, so the text tier moves with it; the fix is never to
            keep a token that is dim in the wrong place. */}
        <legend className="mb-1.5 text-label text-fg-2">
          <span className="font-medium text-fg-1">Drive</span> · 1 none … 5 high, optional
        </legend>
        <div className="flex flex-wrap items-center gap-2">
          {DRIVE_SCALE.map((n) => {
            const on = entry?.drive === n
            const fill = cat('pink')
            return (
              <button
                key={n}
                onClick={() => onDrive(on ? undefined : n)}
                aria-pressed={on}
                aria-label={`Drive ${n} of 5${on ? ' — press again to clear' : ''}`}
                /* 44px wide, wider than the flag chips beside it: a numeral is
                   one character and would otherwise be the smallest target on
                   the page, and COD-96 is already open about 24 controls under
                   the 44px floor. Five of these plus gaps is 252px, inside the
                   324px phone column. */
                className="num min-w-11 rounded-control px-2 py-1.5 text-label"
                style={{
                  background: on ? fill : cat('surface0'),
                  color: on ? onAccent(fill) : cat('subtext0'),
                }}
              >
                {n}
              </button>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}

/** 1–5, the same self-rating scale the urge log already uses. */
const DRIVE_SCALE = [1, 2, 3, 4, 5] as const
