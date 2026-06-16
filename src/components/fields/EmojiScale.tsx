import { cn } from '../../lib/cn'

/** Faces mapped to a 0–10 value — one tap to rate, no slider drag. */
const FACES: { emoji: string; value: number; label: string }[] = [
  { emoji: '😩', value: 2, label: 'awful' },
  { emoji: '🙁', value: 4, label: 'low' },
  { emoji: '😐', value: 6, label: 'okay' },
  { emoji: '🙂', value: 8, label: 'good' },
  { emoji: '😄', value: 10, label: 'great' },
]

/**
 * Emoji rating row for a 0–10 metric (mood, energy…). One tap sets the value;
 * tapping the selected face again clears it. Pure presentational.
 */
export function EmojiScale({
  value,
  onChange,
  label,
  className,
}: {
  value: number | undefined
  onChange: (v: number | undefined) => void
  label?: string
  className?: string
}) {
  // The active face is the nearest one at or above the current value.
  const active = value == null ? null : FACES.reduce((a, b) => (Math.abs(b.value - value) < Math.abs(a.value - value) ? b : a)).value

  return (
    <div className={cn('inline-flex flex-col gap-0.5', className)}>
      {label && <span className="text-[10px] text-overlay0">{label}</span>}
      <div className="inline-flex gap-1">
        {FACES.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-label={`${label ?? 'Rate'}: ${f.label}`}
            aria-pressed={active === f.value}
            onClick={() => onChange(active === f.value ? undefined : f.value)}
            className={cn(
              'grid h-9 w-9 place-items-center rounded-lg border text-lg transition-transform active:scale-95',
              active === f.value ? 'border-mauve bg-mauve/15 scale-110' : 'border-input opacity-60 hover:opacity-100',
            )}
          >
            {f.emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
