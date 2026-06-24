import { ListOrdered } from 'lucide-react'
import { Card } from '../ui'
import { cat } from '../../lib/colors'
import type { addictionPortfolio } from '../../lib/urge'

type Portfolio = ReturnType<typeof addictionPortfolio>

/** Multi-addiction overview (#408) · whole recovery portfolio ranked by current streak. */
export function RecoveryPortfolioCard({ portfolio }: { portfolio: Portfolio }) {
  return (
    <Card title={<span className="inline-flex items-center gap-2"><ListOrdered size={16} className="text-mauve" /> Recovery portfolio</span>} subtitle="Every streak you’re holding · ranked by current run" help="An at-a-glance ranking of everything you’re quitting — your main streak plus each tracked addiction — by days clean now, with best and reset counts. See your whole recovery in one place.">
      <ul className="space-y-1.5">
        {portfolio.map((p, i) => (
          <li key={p.id} className="flex items-center gap-3 rounded-lg border border-surface0 bg-base px-3 py-2 text-sm">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold" style={{ background: i === 0 ? cat('mauve') + '22' : cat('surface0'), color: i === 0 ? cat('mauve') : cat('overlay1') }}>{i + 1}</span>
            <span className="min-w-0 flex-1 truncate font-medium text-text">{p.name}</span>
            <span className="shrink-0 tabular-nums" style={{ color: p.resetToday ? cat('red') : cat('mauve') }}><span className="font-semibold">{p.current}</span>d</span>
            <span className="hidden shrink-0 text-xs text-overlay0 sm:inline">best {p.best}d</span>
            <span className="hidden shrink-0 text-xs text-overlay0 sm:inline">{p.totalClean}d total</span>
            <span className="shrink-0 text-xs text-overlay0">{p.resets} reset{p.resets === 1 ? '' : 's'}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
