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

  /**
   * The hint carries both end-anchors in one string ("0 low · 10 great"), and
   * a line of its own under every scale. Split, it becomes the two words at
   * the ends of the track where they belong — which is one fewer text line per
   * scale, and three fewer in the wellbeing card. Anything that does not split
   * cleanly in two is left exactly as it was, below the track.
   */
  const parts = hint?.split('·').map((t) => t.trim().replace(/^\d+\s*/, '')) ?? []
  const anchors = parts.length === 2 ? parts : null

  return (
    <div>
      {/* The scale is capped, not stretched.
          Full-column width put each of the eleven segments at ~70px and threw
          the two anchor words 800px apart, which reads as a stretched bar
          rather than a rating. Capped, the segments are chunky, the run is
          legible at a glance and the anchors sit close enough to read as a
          pair. */}
      <div className="max-w-[26rem]">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span id={scaleId} className="text-body text-fg-1">{label}</span>
        {/* The value is the thing you are setting, so it is the biggest thing
            in the row rather than a footnote beside the label. Unset stays a
            quiet em dash — the null state this control exists to tell the
            truth about. */}
        <span
          className="num text-heading leading-none tabular-nums transition-colors"
          style={{ color: unset ? cat('overlay0') : accent }}
        >
          {value ?? '—'}
        </span>
      </div>
      <div
        role="radiogroup"
        aria-labelledby={scaleId}
        className="flex w-full items-center gap-[2px]"
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
                'group/seg grid min-h-11 flex-1 place-items-center rounded-[3px]',
                'focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none',
              )}
            >
              {/* ONE TRACK, NOT ELEVEN DOTS.
                  Twelve-pixel dots adrift in 44px targets read as scattered
                  punctuation rather than a scale, and the filled run — the
                  thing the control is actually saying — was a dotted line you
                  had to count. Segments that nearly touch make the run a solid
                  bar you read at a glance, while the 44px target above them is
                  untouched: the box does the tapping, this does the looking.
                  The picked segment stands taller so an eight still reads as
                  "eight", not "somewhere up there". */}
              <span
                aria-hidden
                className={cn(
                  'block w-full rounded-[3px] transition-all duration-150',
                  exact ? 'h-3.5' : 'h-2',
                  'group-hover/seg:h-3.5 motion-reduce:transition-none',
                )}
                style={{
                  background: on ? accent : cat('surface1'),
                  opacity: on ? (exact ? 1 : 0.85) : 1,
                  boxShadow: exact ? `0 0 0 2px ${accent}33` : undefined,
                }}
              />
            </button>
          )
        })}
      </div>
      {anchors ? (
        <div className="mt-1 flex justify-between text-micro text-fg-3">
          <span>{anchors[0]}</span>
          <span>{anchors[1]}</span>
        </div>
      ) : (
        hint && <p className="mt-0.5 text-label text-fg-2">{hint}</p>
      )}
      </div>
    </div>
  )
}
