import { useState } from 'react'
import { useJournal } from '../../store'
import { Card, Input, Pill } from '../ui'
import { Button } from '../ui/button'

/**
 * Trigger plans · if-then for each addiction's trigger points.
 *
 * The `urge-presets` datalist it lists against is owned by the urge-surfing
 * card in zone 2 — one `<datalist id="urge-presets">` for the page, referenced
 * from here by id. Worth knowing before moving either: an `id` reference across
 * two zones is the kind of link a file split breaks silently.
 */
export function TriggerPlansCard() {
  const { data, addTriggerPlan, removeTriggerPlan } = useJournal()
  const [plan, setPlan] = useState({ addiction: '', trigger: '', coping: '' })
  const plans = data.nofap.plans ?? []

  function savePlan() {
    if (!plan.addiction.trim() || !plan.trigger.trim()) return
    addTriggerPlan({ addiction: plan.addiction.trim(), trigger: plan.trigger.trim(), coping: plan.coping.trim() || undefined })
    setPlan({ addiction: '', trigger: '', coping: '' })
  }

  return (
    <Card band hideInfo title="Trigger plans" subtitle="Name each addiction’s trigger point + your if-then response">
      <div className="grid gap-2 rounded-card bg-ink-2 p-3 sm:grid-cols-2">
        <Input value={plan.addiction} onChange={(e) => setPlan({ ...plan, addiction: e.target.value })} placeholder="Addiction (e.g. Smoking)" list="urge-presets" aria-label="Addiction" />
        <Input value={plan.trigger} onChange={(e) => setPlan({ ...plan, trigger: e.target.value })} placeholder="Trigger point (e.g. after meals)" aria-label="Trigger point" />
        <Input value={plan.coping} onChange={(e) => setPlan({ ...plan, coping: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && savePlan()} placeholder="Then I will… (e.g. chew gum, walk 10 min)" aria-label="Coping response" className="sm:col-span-2" />
        <Button variant="secondary" onClick={savePlan} className="sm:col-span-2">Add trigger plan</Button>
      </div>
      {plans.length > 0 && (
        <ul className="mt-3 space-y-2">
          {plans.map((pl) => (
            <li key={pl.id} className="group rounded-card bg-ink-2 p-2.5 text-body">
              <div className="flex items-center gap-2">
                <Pill color="mauve" size="caption">{pl.addiction}</Pill>
                <span className="text-fg-1"><span className="text-fg-2">when</span> {pl.trigger}</span>
                <Button variant="ghost" size="icon-sm" onClick={() => removeTriggerPlan(pl.id)} aria-label="Remove plan" className="ml-auto text-fg-2 reveal hover:text-red">×</Button>
              </div>
              {pl.coping && <p className="mt-0.5 text-label text-fg-2"><span className="text-teal">→ then</span> {pl.coping}</p>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
