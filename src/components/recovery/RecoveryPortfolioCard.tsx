import { ListNumbers } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card } from '../ui'
import { cat } from '../../lib/colors'
import type { addictionPortfolio } from '../../lib/urge'

type Portfolio = ReturnType<typeof addictionPortfolio>

/** Multi-addiction overview (#408) · whole recovery portfolio ranked by current streak. */
export function RecoveryPortfolioCard({ portfolio }: { portfolio: Portfolio }) {
  return (
    <Card title={<span className="inline-flex items-center gap-2"><Icon as={ListNumbers} size="md" className="text-mauve" /> Recovery portfolio</span>} subtitle="Every streak you’re holding, ranked by current run" help="An at-a-glance ranking of everything you’re quitting — your main streak plus each tracked addiction — by days clean now, with best and reset counts. See your whole recovery in one place.">
      <ul className="space-y-1.5">
        {portfolio.map((p, i) => (
          <li key={p.id} className="flex items-center gap-3 rounded-card border border-line bg-ink-0 px-3 py-2 text-body">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-pill text-caption font-medium" style={{ background: i === 0 ? cat('mauve') + '22' : cat('surface0'), color: i === 0 ? cat('mauve') : cat('overlay1') }}>{i + 1}</span>
            <span className="min-w-0 flex-1 truncate font-medium text-fg-1">{p.name}</span>
            <span className="shrink-0 tabular-nums" style={{ color: p.resetToday ? cat('red') : cat('mauve') }}><span className="font-medium">{p.current}</span>d</span>
            <span className="hidden shrink-0 text-label text-fg-2 sm:inline">best {p.best}d</span>
            <span className="hidden shrink-0 text-label text-fg-2 sm:inline">{p.totalClean}d total</span>
            <span className="shrink-0 text-label text-fg-2">{p.resets} reset{p.resets === 1 ? '' : 's'}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
