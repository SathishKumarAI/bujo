import { Drop, ForkKnife, PencilSimple } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../../store'
import { Card, Pill, Slider } from '../ui'
import { Button } from '../ui/button'
import { morningComplete } from '../../lib/daySurface'

/**
 * The morning check-in: four ratings and what broke the fast.
 *
 * Lifted out of `Today.tsx` rather than copied, because it appears on more than
 * one surface and two copies of a form is two places for it to drift.
 *
 * Once all four ratings are answered it collapses to a read-only summary with
 * an edit affordance. Re-showing four empty-looking sliders to someone who has
 * already answered them is the app asking the same question twice — and a
 * slider parked at the left reads as "0" whether you meant zero or never
 * touched it, so the summary is also the clearer statement of what you said.
 */
export function WellbeingCard({ date }: { date: string }) {
  const { data, setMetric } = useJournal()
  const metric = data.metrics.find((m) => m.date === date)
  const done = morningComplete(metric)
  const [editing, setEditing] = useState(false)

  if (done && !editing) {
    return (
      <Card
        title="Wellbeing"
        subtitle="Logged for today"
        right={
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
            <Icon as={PencilSimple} size="sm" /> Edit
          </Button>
        }
      >
        <div className="flex flex-wrap gap-2">
          <Pill color="green">Mood {metric!.mood}</Pill>
          <Pill color="red">Stress {metric!.stress}</Pill>
          <Pill color="blue">Sleep {metric!.sleep}h</Pill>
          <Pill color="peach">Energy {metric!.energy}</Pill>
          {metric!.fastBreak && (
            <Pill color="mauve">
              <Icon as={metric!.fastBreak === 'food' ? ForkKnife : Drop} size="sm" />
              {metric!.fastBreak === 'food' ? 'Food' : 'Drink'} first
            </Pill>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card title="Wellbeing" subtitle="Rate today 0–10">
      <div className="space-y-4">
        <Slider label="Mood" value={metric?.mood} onChange={(v) => setMetric(date, { mood: v })} color="green" hint="0 low · 10 great" />
        <Slider label="Stress" value={metric?.stress} onChange={(v) => setMetric(date, { stress: v })} color="red" hint="0 calm · 10 high" />
        <Slider label="Sleep (hrs)" value={metric?.sleep} onChange={(v) => setMetric(date, { sleep: v })} color="blue" />
        <Slider label="Energy" value={metric?.energy} onChange={(v) => setMetric(date, { energy: v })} color="peach" hint="0 drained · 10 energized" />
      </div>
      <div className="mt-4 border-t border-line pt-3">
        <p className="mb-2 text-body text-fg-1">First meal</p>
        {/* These record a choice, so the selected one gets the accent wash
            rather than the accent fill — a filled pill here read as the
            screen's primary action, which it never was. */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            aria-pressed={metric?.fastBreak === 'food'}
            onClick={() => setMetric(date, { fastBreak: metric?.fastBreak === 'food' ? undefined : 'food' })}
            className={`press-3d inline-flex min-h-11 items-center gap-1.5 rounded-control ${metric?.fastBreak === 'food' ? 'bg-brand-wash font-medium text-brand' : ''}`}
          >
            <Icon as={ForkKnife} size="sm" /> Food
          </Button>
          <Button
            variant="ghost"
            aria-pressed={metric?.fastBreak === 'drink'}
            onClick={() => setMetric(date, { fastBreak: metric?.fastBreak === 'drink' ? undefined : 'drink' })}
            className={`press-3d inline-flex min-h-11 items-center gap-1.5 rounded-control ${metric?.fastBreak === 'drink' ? 'bg-brand-wash font-medium text-brand' : ''}`}
          >
            <Icon as={Drop} size="sm" /> Drink
          </Button>
        </div>
      </div>
      {editing && (
        <div className="mt-3 flex justify-end border-t border-line pt-3">
          <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Done</Button>
        </div>
      )}
    </Card>
  )
}
