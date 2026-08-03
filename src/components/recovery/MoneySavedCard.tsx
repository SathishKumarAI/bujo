import { PiggyBank } from '@/components/icons'
import { Icon } from '@/components/Icon'
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
    <Card hideInfo title={<span className="inline-flex items-center gap-2"><Icon as={PiggyBank} size="md" className="text-green" /> Money saved</span>} subtitle="What staying clean kept in your pocket">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-display font-medium leading-none" style={{ color: cat('green') }}>{currency}{savedMoney.toLocaleString()}</div>
          <div className="mt-1 text-caption uppercase tracking-wide text-fg-2">saved</div>
        </div>
        <p className="flex-1 text-body text-fg-2">
          {costPerDay
            ? <>Across <strong>{totalClean}</strong> clean day{totalClean === 1 ? '' : 's'} at {currency}{costPerDay}/day.</>
            : <>Set a daily cost to see what you’ve saved across <strong>{totalClean}</strong> clean day{totalClean === 1 ? '' : 's'}.</>}
        </p>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <label htmlFor="streak-cost" className="text-body text-fg-1">Cost per day</label>
        <span className="text-fg-1">{currency}</span>
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
