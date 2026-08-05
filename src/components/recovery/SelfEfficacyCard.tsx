import { HandFist, ShieldCheck, X } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card, StatTile } from '../ui'
import { cat } from '../../lib/colors'
import type { urgeConversion } from '../../lib/urge'

type Conversion = ReturnType<typeof urgeConversion>

/** Urge-to-relapse conversion (#76) · self-efficacy win-rate from the urge log. */
export function SelfEfficacyCard({ conversion }: { conversion: Conversion }) {
  return (
    <Card hideInfo title="Self-efficacy" subtitle={`${conversion.resistRate}% of urge moments ended in a win, not a reset`}>
      <div className="grid grid-cols-3 gap-3">
        <StatTile compact label="Resisted" value={conversion.resisted} color="green" icon={<Icon as={ShieldCheck} size="sm" />} />
        <StatTile compact label="Resets" value={conversion.relapses} color="red" icon={<Icon as={X} size="sm" />} />
        <StatTile compact label="Win rate" value={`${conversion.resistRate}%`} color="teal" icon={<Icon as={HandFist} size="sm" />} />
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-pill" style={{ background: cat('red') + '33' }}>
        <div className="h-full rounded-pill transition-[width] duration-500" style={{ width: `${conversion.resistRate}%`, background: cat('green') }} />
      </div>
      <p className="mt-2 text-label text-fg-2">Each resisted urge is a streak you protected. Keep the green bar climbing.</p>
    </Card>
  )
}
