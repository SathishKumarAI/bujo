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
 * the month. The temperature field and the five flag chips are the whole
 * interaction this page has.
 *
 * `onAccent(fill)`, not `cat('crust')`, for the pressed chip's text — the
 * light-on-saturated neutral differs per theme and `crust` is near-white in
 * the light ones, which is the trap CLAUDE.md records. Both branches of the
 * ternary are a decision: the unpressed chip uses `subtext0`, because
 * `overlay0` on a neutral fill measures 2.57:1.
 */
export function DayEditor({ date, entry, unit, onTemp, onToggleFlag }: {
  date: string
  entry: CyclePoint | undefined
  /** 'F' or 'C'. */
  unit: string
  onTemp: (temp: number | undefined) => void
  onToggleFlag: (flag: string) => void
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
    </div>
  )
}
