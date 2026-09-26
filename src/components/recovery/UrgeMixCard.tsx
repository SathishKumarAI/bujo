import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card } from '../ui'
import { cat, onRaised } from '../../lib/colors'
import type { urgesByType } from '../../lib/streak'

type ByType = ReturnType<typeof urgesByType>

/**
 * Ten accents, one per urge type by index.
 *
 * **COD-116 is open against this palette**: `sky` and `sapphire` are dE 5.7
 * apart in latte, so two adjacent bars can read as one colour. Moved here from
 * `views/NoFap.tsx` unchanged — this card is its only consumer, which is the
 * finding that makes the ticket cheap to fix — and deliberately not re-picked
 * in a restructure, because a colour decision quietly folded into a file move
 * is exactly the kind of change nobody can review.
 */
const URGE_COLORS = ['mauve', 'teal', 'peach', 'sky', 'green', 'pink', 'yellow', 'lavender', 'sapphire', 'flamingo']

/** Urges by addiction · what you resist most, as a horizontal bar chart. */
export function UrgeMixCard({ byType }: { byType: ByType }) {
  return (
    <Card band hideInfo title="Urges by addiction" subtitle="What you resist most" enlargeable>
      <div className="h-52 w-full" role="img" aria-label={`Bar chart of urges resisted by type: ${byType.map((b) => `${b.count} ${b.type}`).join(', ')}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byType} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 4 }}>
            <CartesianGrid stroke={cat('surface0')} horizontal={false} />
            <XAxis type="number" allowDecimals={false} stroke={cat('overlay0')} fontSize={11} />
            <YAxis type="category" dataKey="type" width={84} stroke={cat('overlay0')} fontSize={11} />
            <Tooltip contentStyle={{ background: cat('mantle'), border: `1px solid ${cat('surface0')}`, borderRadius: 8, color: onRaised('text') }} cursor={{ fill: cat('surface0') }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {byType.map((_, i) => <Cell key={i} fill={cat(URGE_COLORS[i % URGE_COLORS.length])} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
