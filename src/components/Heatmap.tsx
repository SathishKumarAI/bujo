import type { HeatCell } from '../lib/viz'
import { cat } from '../lib/colors'
import { prettyDay } from '../lib/date'

const LEVEL_BG = ['surface0', 'mauve', 'mauve', 'mauve', 'mauve'] as const
const LEVEL_OPACITY = [1, 0.35, 0.55, 0.8, 1]

/** GitHub-style activity grid. Columns are weeks, rows are weekdays. */
export function Heatmap({ cols, colorFor }: { cols: HeatCell[][]; colorFor?: (c: HeatCell) => string }) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px]">
        {cols.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-[3px]">
            {col.map((cell) => (
              <span
                key={cell.date}
                title={`${prettyDay(cell.date)} · ${cell.count} item${cell.count === 1 ? '' : 's'}`}
                className="h-[11px] w-[11px] rounded-[2px]"
                style={
                  colorFor
                    ? { background: colorFor(cell) }
                    : { background: cat(LEVEL_BG[cell.level]), opacity: LEVEL_OPACITY[cell.level] }
                }
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs text-overlay0">
        <span>less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className="h-[11px] w-[11px] rounded-[2px]" style={{ background: cat(LEVEL_BG[l]), opacity: LEVEL_OPACITY[l] }} />
        ))}
        <span>more</span>
      </div>
    </div>
  )
}
