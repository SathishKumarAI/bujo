import { Wind } from 'lucide-react'
import { Card } from '../ui'
import { cat } from '../../lib/colors'
import { prettyDay } from '../../lib/date'
import type { urgeQuietStretch } from '../../lib/urge'

type Quiet = ReturnType<typeof urgeQuietStretch>

/** Urge-quiet stretch · days since even a craving worth logging showed up. */
export function CalmStretchCard({ quiet }: { quiet: Quiet }) {
  return (
    <Card title={<span className="inline-flex items-center gap-2"><Wind size={16} className="text-sky" /> Calm stretch</span>} subtitle="Days since your last logged urge" help="Not just clean days — days without even a craving worth logging. A growing number here is the quiet that follows the storm: the brain settling and the urges thinning out.">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-4xl font-extrabold leading-none" style={{ color: cat('sky') }}>{quiet.days}</div>
          <div className="mt-1 text-[11px] uppercase tracking-wide text-overlay0">day{quiet.days === 1 ? '' : 's'} quiet</div>
        </div>
        <p className="flex-1 text-sm text-subtext0">No urge logged since <strong style={{ color: cat('sky') }}>{quiet.lastDate && prettyDay(quiet.lastDate)}</strong>. The cravings are getting quieter · this is the work paying off.</p>
      </div>
    </Card>
  )
}
