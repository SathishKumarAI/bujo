import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis } from 'recharts'
import { Card, Empty } from '../ui'
import { cat } from '../../lib/colors'
import type { CategoryVolume } from '../../lib/fitness'

/**
 * Push/Pull/Legs/Core volume radar: this week's working-set volume by movement
 * category, so imbalances jump out as a lopsided shape. Read-only — derived via
 * volumeByCategory.
 */
export function MovementRadar({ data, unit }: { data: CategoryVolume[]; unit: string }) {
  const total = data.reduce((s, c) => s + c.volume, 0)
  return (
    <Card title="Movement balance" subtitle="Weekly volume by push / pull / legs / core" defer>
      {total === 0 ? (
        <Empty>Log some working sets this week to see your movement balance.</Empty>
      ) : (
        <>
          <div className="h-56" role="img" aria-label={`Radar chart of weekly working-set volume by movement category (${unit}): ${data.map((c) => `${c.category} ${c.volume}`).join(', ')}`}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <PolarGrid stroke={cat('surface0')} />
                <PolarAngleAxis dataKey="category" tick={{ fill: cat('subtext0'), fontSize: 12 }} />
                <Radar dataKey="volume" stroke={cat('mauve')} fill={cat('mauve')} fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-overlay0">
            {data.map((c) => (
              <span key={c.category}>{c.category} <span className="text-subtext1">{c.volume.toLocaleString()}{unit}</span></span>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}
