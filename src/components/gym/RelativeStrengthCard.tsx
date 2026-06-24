import { Scale } from 'lucide-react'
import { Card, Empty } from '../ui'
import { cat } from '../../lib/colors'
import type { RelativeStrength } from '../../lib/fitness'

/**
 * Relative strength: each PR as a multiple of the latest logged bodyweight, with
 * a strength-standard band. Hidden until a bodyweight is logged. Read-only.
 */
export function RelativeStrengthCard({ rows, unit, setFocusEx }: { rows: RelativeStrength[]; unit: string; setFocusEx: (e: string | null) => void }) {
  const bandColor: Record<string, string> = { Elite: 'mauve', Advanced: 'blue', Intermediate: 'green', Novice: 'yellow', Beginner: 'overlay0' }
  return (
    <Card title="Relative strength" subtitle="Best lift ÷ bodyweight · with strength standard" defer>
      {rows.length === 0 ? (
        <Empty>Log your bodyweight and some PRs to see strength-to-weight ratios.</Empty>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {rows.slice(0, 8).map((r) => (
            <li key={r.exercise}>
              <button
                onClick={() => setFocusEx(r.exercise)}
                className="flex w-full items-center justify-between gap-2 rounded px-1.5 py-1 text-left hover:bg-surface0/50"
                title={`${r.exercise}: ${r.weight}${unit} = ${r.ratio}× bodyweight`}
              >
                <span className="inline-flex min-w-0 items-center gap-1.5 text-subtext1">
                  <Scale size={14} style={{ color: cat('teal') }} /> <span className="truncate">{r.exercise}</span>
                </span>
                <span className="shrink-0 text-overlay0">
                  <span className="font-semibold" style={{ color: cat('text') }}>{r.ratio}×</span>
                  <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: cat(bandColor[r.band] ?? 'overlay0') + '22', color: cat(bandColor[r.band] ?? 'overlay0') }}>{r.band}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
