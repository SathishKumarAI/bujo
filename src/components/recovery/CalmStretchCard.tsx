import { Wind } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card } from '../ui'
import { cat } from '../../lib/colors'
import { prettyDay } from '../../lib/date'
import type { urgeQuietStretch } from '../../lib/urge'

type Quiet = ReturnType<typeof urgeQuietStretch>

/** Urge-quiet stretch · days since even a craving worth logging showed up. */
export function CalmStretchCard({ quiet }: { quiet: Quiet }) {
  return (
    <Card title={<span className="inline-flex items-center gap-2"><Icon as={Wind} size="md" className="text-sky" /> Calm stretch</span>} subtitle="Days since your last logged urge" help="Not just clean days — days without even a craving worth logging. A growing number here is the quiet that follows the storm: the brain settling and the urges thinning out.">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-display font-medium leading-none" style={{ color: cat('sky') }}>{quiet.days}</div>
          <div className="mt-1 text-caption uppercase tracking-wide text-fg-2">day{quiet.days === 1 ? '' : 's'} quiet</div>
        </div>
        <p className="flex-1 text-body text-fg-2">No urge logged since <strong style={{ color: cat('sky') }}>{quiet.lastDate && prettyDay(quiet.lastDate)}</strong>. The cravings are getting quieter · this is the work paying off.</p>
      </div>
    </Card>
  )
}
