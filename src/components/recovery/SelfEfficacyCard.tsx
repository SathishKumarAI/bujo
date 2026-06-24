import { ShieldCheck, X, HandMetal } from 'lucide-react'
import { Card, StatTile } from '../ui'
import { cat } from '../../lib/colors'
import type { urgeConversion } from '../../lib/urge'

type Conversion = ReturnType<typeof urgeConversion>

/** Urge-to-relapse conversion (#76) · self-efficacy win-rate from the urge log. */
export function SelfEfficacyCard({ conversion }: { conversion: Conversion }) {
  return (
    <Card title="Self-efficacy" subtitle={`${conversion.resistRate}% of urge moments ended in a win, not a reset`} help="Every logged urge you surfed is a win; every reset is the rare miss. This is how often, when an urge showed up, you chose your streak — a direct measure of growing self-control.">
      <div className="grid grid-cols-3 gap-3">
        <StatTile compact label="Resisted" value={conversion.resisted} color="green" icon={<ShieldCheck size={14} />} />
        <StatTile compact label="Resets" value={conversion.relapses} color="red" icon={<X size={14} />} />
        <StatTile compact label="Win rate" value={`${conversion.resistRate}%`} color="teal" icon={<HandMetal size={14} />} />
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full" style={{ background: cat('red') + '33' }}>
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${conversion.resistRate}%`, background: cat('green') }} />
      </div>
      <p className="mt-2 text-xs text-overlay0">Each resisted urge is a streak you protected. Keep the green bar climbing.</p>
    </Card>
  )
}
