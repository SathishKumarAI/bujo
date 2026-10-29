import { Minus, Plus } from '@/components/icons'
import { Icon } from '@/components/Icon'

/**
 * Big numbers with − / + — Pickleball's scoreboard, generalised (COD-459).
 *
 * OWNS: one card of one or two number halves, each a real input you can type
 * into (tap the number) plus 44px steppers. The look is `styles/phone.css`
 * (`.scoreboard`, `.score-num`, `.round-btn`). Phone-only.
 * DOES NOT OWN: what the numbers mean, units, or limits beyond `min`/`max`.
 *
 * Values are STRINGS, the form convention in this app: '' is "not entered",
 * which a stepper must not turn into 0 until it is pressed.
 */
export interface MeasureHalf {
  key: string
  label: string
  value: string
  onChange: (v: string) => void
  step: number
  min?: number
  max?: number
  /** Unit shown under the number (min, km, kg, reps). */
  unit?: string
  decimals?: number
}

export function MeasureCard({ halves, label }: { halves: MeasureHalf[]; label: string }) {
  return (
    <div className="scoreboard" role="group" aria-label={label} style={halves.length === 1 ? { gridTemplateColumns: '1fr' } : undefined}>
      {halves.map((h, i) => {
        const n = h.value === '' ? 0 : Number(h.value)
        const bump = (d: number) => {
          const next = Math.min(h.max ?? Infinity, Math.max(h.min ?? 0, n + d))
          h.onChange(h.decimals ? next.toFixed(h.decimals) : String(Math.round(next)))
        }
        return [
          i > 0 && <hr key={`rule-${h.key}`} />,
          <div key={h.key} className="flex flex-col items-center gap-1 px-2 py-2.5">
            <span className="text-label font-semibold tracking-wider text-fg-2 uppercase">{h.label}</span>
            <div className="flex w-full items-center justify-between gap-1">
              <button type="button" className="round-btn" onClick={() => bump(-h.step)} aria-label={`Less ${h.label.toLowerCase()}`}><Icon as={Minus} size="md" /></button>
              <input
                className="score-num score-input"
                inputMode={h.decimals ? 'decimal' : 'numeric'}
                value={h.value}
                placeholder="0"
                aria-label={`${h.label}${h.unit ? ` in ${h.unit}` : ''}`}
                onChange={(e) => h.onChange(e.target.value.replace(/[^0-9.]/g, ''))}
              />
              <button type="button" className="round-btn round-btn-primary" onClick={() => bump(h.step)} aria-label={`More ${h.label.toLowerCase()}`}><Icon as={Plus} size="md" /></button>
            </div>
            {h.unit && <span className="text-label text-fg-2">{h.unit}</span>}
          </div>,
        ]
      })}
    </div>
  )
}
