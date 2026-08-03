import { cat } from '../../lib/colors'

/**
 * An 0–10 rating as eleven tappable dots.
 *
 * This replaces `<input type="range">`, which could not say "unanswered". A
 * range input has to sit somewhere, and somewhere is the left edge — so a day
 * you never rated looked exactly like a day you rated 0, which for mood is the
 * difference between "I didn't say" and "the worst it gets". The value slot
 * showed `0` for both.
 *
 * Unanswered renders every dot hollow and the value slot as `—`. There is no
 * position that means "nothing", because nothing is not a position.
 *
 * Dots are 44px targets on the cross-axis via the padded hit area — the visible
 * dot is small, the thing you tap is not.
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
  const accent = cat(color)
  const answered = value != null

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-body">
        <span className="text-fg-1">{label}</span>
        <span className="font-mono tabular-nums" style={{ color: answered ? accent : cat('overlay1') }}>
          {answered ? value : '—'}
        </span>
      </div>
      <div role="group" aria-label={label} className="flex items-center justify-between gap-0.5">
        {Array.from({ length: max + 1 }, (_, i) => {
          const on = answered && i <= value
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              aria-label={`${label} ${i}`}
              aria-pressed={answered && i === value}
              title={String(i)}
              className="grid min-h-[44px] flex-1 place-items-center rounded-control transition-colors hover:bg-secondary/40"
            >
              <span
                className="block h-3 w-3 rounded-pill border transition-colors"
                style={{
                  borderColor: on ? accent : cat('surface2'),
                  background: on ? accent : 'transparent',
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
