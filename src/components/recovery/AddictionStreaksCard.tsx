import { Flame } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../../store'
import { Card, Empty, Input } from '../ui'
import { Button } from '../ui/button'
import { cat, onRaised } from '../../lib/colors'
import { todayISO } from '../../lib/date'
import { addictionStats, moneySaved, ADDICTION_PRESETS } from '../../lib/streak'
import { useConfirm } from '../ConfirmDialog'

/**
 * Per-addiction streaks (BUJO-199) · each tracked as its own streak + best.
 *
 * Reads the store directly rather than taking seven callbacks: it owns four
 * mutations (add, remove, reset, set cost) and one text field, none of which
 * `views/NoFap.tsx` has any other use for. Fifty-six components in this app do
 * the same; the presentational cards beside this one take derived data because
 * they have no actions, not because reading the store here would be wrong.
 */
export function AddictionStreaksCard() {
  const confirm = useConfirm()
  const { data, addAddiction, removeAddiction, relapseAddiction, setAddictionCost } = useJournal()
  const [newAddiction, setNewAddiction] = useState('')
  const currency = data.settings.currencySymbol || '$'
  const today = todayISO()
  const addictions = data.nofap.addictions ?? []

  return (
    <Card band hideInfo title="Per-addiction streaks" subtitle="Track each habit separately, its own counter, best & resets">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input value={newAddiction} onChange={(e) => setNewAddiction(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { addAddiction(newAddiction); setNewAddiction('') } }} placeholder="Add an addiction (e.g. Sugar)" list="addiction-presets" aria-label="New addiction name" className="min-w-[10rem] flex-1" />
        <datalist id="addiction-presets">{ADDICTION_PRESETS.map((a) => <option key={a} value={a} />)}</datalist>
        <Button variant="secondary" onClick={() => { addAddiction(newAddiction); setNewAddiction('') }}>Add</Button>
      </div>
      {addictions.length === 0 ? (
        <Empty>No separate addictions yet · add one to track it on its own streak.</Empty>
      ) : (
        <ul className="space-y-2">
          {addictions.map((a) => {
            const st = addictionStats(a, today)
            const reset = a.relapses.some((r) => r.date === today)
            const aSaved = moneySaved(st.totalClean, a.costPerDay)
            return (
              <li key={a.id} className="group rounded-card bg-ink-2 px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <Icon as={Flame} size="md" style={{ color: reset ? cat('red') : cat('peach') }} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    {/* `flex-wrap`, found by the clip gate the moment the
                        demo seed first put an addiction on this page: three
                        items shared one 54px line on a phone and the name
                        lost, showing "Nicotin". The row has always been
                        able to do this; nothing had ever rendered it with
                        data. */}
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="truncate font-medium text-fg-1">{a.name}</span>
                      <span className="text-label text-fg-2">best {st.best}d</span>
                      {a.costPerDay && aSaved > 0 && <span className="text-label" style={{ color: onRaised('green') }}>{currency}{aSaved.toLocaleString()} saved</span>}
                    </div>
                    <span className="text-body text-fg-1"><span className="font-medium" style={{ color: onRaised('mauve') }}>{st.current}</span> day{st.current === 1 ? '' : 's'} clean{st.relapseCount ? ` · ${st.relapseCount} reset${st.relapseCount === 1 ? '' : 's'}` : ''}</span>
                  </div>
                  {/* `text-red` on `bg-ink-2` measured **4.14:1** on vscode
                      — a serious axe failure that had never fired, because
                      until the demo seeded an addiction this button did not
                      render. `onRaised('red')` lifts the accent against
                      both grounds to 4.6, the way the rest of this file
                      already does it.
                      `text-label` came off with it and nothing moved:
                      tailwind-merge puts a custom font-size and a custom
                      text-colour in the same group, so `text-red` had been
                      swallowing it and the button rendered at body size all
                      along (axe reported 15px, not 11px). */}
                  <Button variant="ghost" onClick={async () => { if (await confirm({
                    title: `Reset the ${a.name} streak?`,
                    description: 'Your current streak goes back to zero. Your total clean days and best streak are kept.',
                    confirmLabel: 'Reset streak', destructive: true,
                  })) relapseAddiction(a.id, { date: today, trigger: '', note: '' }) }} className="h-auto shrink-0 p-0" style={{ color: onRaised('red') }}>Reset</Button>
                  <Button variant="ghost" size="icon-sm" onClick={async () => { if (await confirm({
                    title: `Stop tracking ${a.name}?`,
                    description: 'Its streak and full reset history are deleted. This cannot be undone.',
                    confirmLabel: 'Stop tracking', destructive: true,
                  })) removeAddiction(a.id) }} aria-label={`Remove ${a.name}`} className="shrink-0 text-fg-2 reveal hover:text-red">×</Button>
                </div>
                {/* #123 per-addiction cost/day → money saved */}
                <div className="mt-2 flex items-center gap-2 pl-7 text-label text-fg-2">
                  <span>{currency}/day</span>
                  <Input
                    type="number"
                    min={0}
                    step="0.5"
                    value={a.costPerDay ?? ''}
                    onChange={(e) => setAddictionCost(a.id, e.target.value === '' ? undefined : Number(e.target.value))}
                    placeholder="0"
                    className="w-20 !py-1 text-label"
                    aria-label={`Cost per day for ${a.name}`}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
