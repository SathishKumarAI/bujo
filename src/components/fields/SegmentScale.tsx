import { useId } from 'react'
import { cat } from '../../lib/colors'
import { cn } from '../../lib/cn'

/**
 * SEGMENT SCALE · eleven dots, 0–10, one tap.
 *
 * Replaces `<input type="range">` for ratings. The slider had one flaw that no
 * amount of styling fixes: a range input has no null. Unrated and rated-0 are
 * the same pixel, so the control lied about the most common state a wellbeing
 * field is in — empty. (The slider mitigated this by parking unset at the
 * midpoint and dimming, which trades a wrong reading for a confusing one.)
 *
 * Here, unanswered is a row of hollow dots and a value slot reading `—`. It is
 * not a value that happens to look different; there is no filled dot at all.
 *
 * Implemented as a `radiogroup`, because that is what it is. Arrow keys move
 * between dots, which is the behaviour the slider provided and the reason not
 * to hand-roll eleven buttons with no relationship to each other.
 *
 * Targets are 44px tall (WCAG 2.5.5) with the visible dot smaller and centred —
 * the tappable box does the work, the dot does the looking. At 11 across a
 * 320px phone each column is ~29px wide, so the row is the one place the guide
 * is met vertically and by spacing rather than by a square.
 */
export function SegmentScale({
  label,
  value,
  onChange,
  color = 'mauve',
  hint,
  max = 10,
}: {
  label: string
  value: number | undefined
  onChange: (v: number) => void
  color?: string
  hint?: string
  max?: number
}) {
  const reactId = useId()
  const unset = value == null
  const accent = cat(color)
  const dots = Array.from({ length: max + 1 }, (_, i) => i)

  /**
   * `aria-labelledby` is a **space-separated list of IDs**, so
   * `id={`scale-${label}`}` was fatal for any label containing a space:
   * "Focus / flow" resolved as three IDREFs — `scale-Focus`, `/`, `flow` —
   * none of which exist, leaving the radiogroup with no accessible name at
   * all. The per-dot `aria-label` saved the individual radios, not the group.
   *
   * `useId` also fixes the second half: Focus renders this scale from the log
   * form AND again from a history row being edited, which minted **duplicate
   * IDs in one document**.
   */
  const scaleId = `${reactId}-label`

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-body">
        <span id={scaleId} className="text-fg-1">{label}</span>
        <span className="rounded px-1.5 font-mono tabular-nums" style={{ color: unset ? undefined : accent }}>
          {value ?? '—'}
        </span>
      </div>
      <div
        role="radiogroup"
        aria-labelledby={scaleId}
        className="flex w-full items-center justify-between"
      >
        {dots.map((n) => {
          const on = !unset && n <= value
          const exact = value === n
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={exact}
              aria-label={`${label} ${n} of ${max}`}
              // Roving tab stop: the group is one stop, arrows move inside it.
              // Unset has no checked dot, so 0 takes the stop — otherwise the
              // whole control is unreachable from the keyboard until it is used.
              tabIndex={exact || (unset && n === 0) ? 0 : -1}
              onKeyDown={(e) => {
                const delta = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0
                if (!delta) return
                e.preventDefault()
                const next = Math.min(max, Math.max(0, (value ?? 0) + delta))
                onChange(next)
                const group = e.currentTarget.parentElement
                ;(group?.children[next] as HTMLElement | undefined)?.focus()
              }}
              onClick={() => onChange(n)}
              className={cn(
                'grid min-h-11 flex-1 place-items-center rounded-control',
                'focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none',
              )}
            >
              <span
                aria-hidden
                className="block size-3 rounded-pill border transition-colors"
                style={{
                  borderColor: on ? accent : cat('surface1'),
                  background: on ? accent : 'transparent',
                  // The dot you actually picked is the wide one, so a filled
                  // run of eight still says "eight", not "somewhere up there".
                  boxShadow: exact ? `0 0 0 3px ${accent}33` : undefined,
                }}
              />
            </button>
          )
        })}
      </div>
      {hint && <p className="mt-0.5 text-label text-fg-2">{hint}</p>}
    </div>
  )
}
