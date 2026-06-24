import { PiggyBank } from 'lucide-react'
import { Card, Input } from '../ui'
import { cat } from '../../lib/colors'

/**
 * Money saved (#123) · clean days × cost/day, with an editable per-day rate.
 * The cost value + setter come from the parent (store-backed) to preserve flow.
 */
export function MoneySavedCard({
  currency,
  costPerDay,
  savedMoney,
  totalClean,
  onCostChange,
}: {
  currency: string
  costPerDay: number | undefined
  savedMoney: number
  totalClean: number
  onCostChange: (v: number | undefined) => void
}) {
  return (
    <Card title={<span className="inline-flex items-center gap-2"><PiggyBank size={16} className="text-green" /> Money saved</span>} subtitle="What staying clean kept in your pocket" help="Set what the habit used to cost you per day; this multiplies it across your lifetime clean days. A concrete tally of money you didn't spend.">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-4xl font-extrabold leading-none" style={{ color: cat('green') }}>{currency}{savedMoney.toLocaleString()}</div>
          <div className="mt-1 text-[11px] uppercase tracking-wide text-overlay0">saved</div>
        </div>
        <p className="flex-1 text-sm text-subtext0">
          {costPerDay
            ? <>Across <strong>{totalClean}</strong> clean day{totalClean === 1 ? '' : 's'} at {currency}{costPerDay}/day.</>
            : <>Set a daily cost to see what you’ve saved across <strong>{totalClean}</strong> clean day{totalClean === 1 ? '' : 's'}.</>}
        </p>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <label htmlFor="streak-cost" className="text-sm text-subtext1">Cost per day</label>
        <span className="text-subtext1">{currency}</span>
        <Input
          id="streak-cost"
          type="number"
          min={0}
          step="0.5"
          value={costPerDay ?? ''}
          onChange={(e) => onCostChange(e.target.value === '' ? undefined : Number(e.target.value))}
          placeholder="0"
          className="w-24"
          aria-label="Cost per day for the main streak"
        />
      </div>
    </Card>
  )
}
