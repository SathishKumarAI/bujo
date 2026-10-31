import { useState } from 'react'
import { CalendarDot, Minus, Plus, Sparkle, Target, Trash } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Cell, Cells } from '../ui/cells'
import { Sheet } from '../ui/sheet'
import { useConfirm } from '../ConfirmDialog'
import { useJournal } from '../../store'
import { useNav } from '../shell/nav'
import type { ViewId } from '../shell/viewChrome'
import { cat, onRaised } from '../../lib/colors'
import { prettyDay, todayISO } from '../../lib/date'
import { goalFraction, goalMet, goalPace } from '../../lib/goals'
import { notify } from '../../lib/notify'

/** A goal the app derives from another page (habits, minutes, a challenge). */
export interface DerivedGoal {
  label: string
  detail: string
  value: number
  target: number
  color: string
  icon: typeof Target
  to: ViewId
  avoid?: boolean
}

/**
 * GOALS ON A PHONE — your own goals as rows you move, the rest as rows you read.
 *
 * OWNS: the phone drawing. Your custom goals first (the only ones you update
 * by hand): one row each with progress, the pace sentence and − / +; the row
 * opens a sheet for the deadline and a delete that asks. "Add a goal" is a
 * row and a sheet. Below, the goals derived from other pages as compact rows
 * that open their page, under one summary line.
 * DOES NOT OWN: what the derived goals are (`views/Goals.tsx` builds them) or
 * the arithmetic (`lib/goals.ts`).
 *
 * Measured before: the only input sat at y 924 — under fifteen derived bars
 * nobody edits here — as a four-field form.
 */
export function GoalsPhone({ goals, summary }: { goals: DerivedGoal[]; summary: string }) {
  const { data, addCustomGoal, updateCustomGoal, removeCustomGoal } = useJournal()
  const navigate = useNav()
  const confirm = useConfirm()
  const today = todayISO()
  const custom = data.customGoals ?? []
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const [form, setForm] = useState({ label: '', target: '', unit: '' })
  const editing = custom.find((g) => g.id === open)

  function add() {
    const label = form.label.trim(); const target = Number(form.target)
    if (!label || !target || target <= 0) { notify.info('A goal needs a name and a target', 'The target has to be more than zero.'); return }
    addCustomGoal({ label, target, value: 0, unit: form.unit.trim() || undefined, color: 'mauve' })
    setForm({ label: '', target: '', unit: '' })
    setAdding(false)
  }

  return (
    <div className="flex flex-col gap-4 pb-2">
      <h1 className="sr-only">Goals</h1>

      <Cells title="Your goals" aside={custom.length ? `${custom.filter((g) => g.value >= g.target).length} of ${custom.length} done` : undefined}>
        {custom.map((g) => {
          const reached = g.value >= g.target
          const pace = goalPace(g.value, g.target, g.createdAt, g.due, today)
          const unit = g.unit ? ` ${g.unit}` : ''
          return (
            <div key={g.id} className="cell cell-stack gap-1.5">
              <div className="flex items-center gap-2">
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setOpen(g.id)}>
                  <span className="sr-only">Edit </span>
                  <span className="block truncate text-body font-medium text-fg-1">{g.label}</span>
                  <span className="block truncate text-label" style={{ color: pace?.pastDue && !reached ? onRaised('red') : undefined }}>
                    <span className={pace?.pastDue && !reached ? '' : 'text-fg-2'}>
                      {reached ? 'Done' : pace ? pace.pastDue ? `Past due · ${pace.remaining}${unit} short` : `${pace.perDayNeeded}${unit}/day to finish by ${prettyDay(g.due!)}` : 'No deadline'}
                    </span>
                  </span>
                </button>
                <button type="button" className="round-btn" disabled={g.value <= 0} aria-label={`One less on ${g.label}`} onClick={() => updateCustomGoal(g.id, { value: Math.max(0, g.value - 1) })}><Icon as={Minus} size="sm" /></button>
                <output className="min-w-[3.5rem] text-center text-body font-semibold tabular-nums" style={{ color: reached ? onRaised('green') : undefined }}>{Math.min(g.value, g.target)}/{g.target}</output>
                <button type="button" className="round-btn" aria-label={`One more on ${g.label}`} onClick={() => updateCustomGoal(g.id, { value: g.value + 1 })}><Icon as={Plus} size="sm" /></button>
              </div>
              <div className="h-1.5 overflow-hidden rounded-pill bg-ink-2" aria-hidden>
                <div className="h-full rounded-pill" style={{ width: `${Math.min(100, (g.value / g.target) * 100)}%`, background: cat(reached ? 'green' : 'mauve') }} />
              </div>
            </div>
          )
        })}
        <Cell icon={Sparkle} title="Add a goal" subtitle="Save $500, drink 8 glasses — anything you count" onPress={() => setAdding(true)} />
      </Cells>

      {goals.length > 0 && (
        <Cells title="From your pages" aside={summary}>
          {goals.map((g, i) => {
            const ok = goalMet(g.value, g.target, g.avoid)
            const reached = !g.avoid && ok
            const bar = g.avoid ? (ok ? g.color : 'red') : ok ? 'green' : g.color
            return (
              <button key={i} type="button" className="cell cell-stack gap-1" onClick={() => navigate(g.to)}>
                <span className="flex items-center gap-2">
                  <Icon as={g.icon} size="sm" style={{ color: onRaised(g.color) }} />
                  <span className="min-w-0 flex-1 truncate text-body text-fg-1">{g.label} <span className="text-label text-fg-2">{g.detail}</span></span>
                  <span className="shrink-0 text-body tabular-nums" style={{ color: reached ? onRaised('green') : undefined }}>{g.value}/{g.target}{reached ? ' ✓' : ''}</span>
                </span>
                <span className="block h-1.5 overflow-hidden rounded-pill bg-ink-2" aria-hidden>
                  <span className="block h-full rounded-pill" style={{ width: `${Math.round(goalFraction(g.value, g.target) * 100)}%`, background: cat(bar) }} />
                </span>
              </button>
            )
          })}
        </Cells>
      )}

      <Sheet open={adding} onOpenChange={setAdding} title="Add a goal" description="Anything you count — you move it with − and +">
        <div className="flex flex-col gap-3">
          <Cells>
            <label className="cell">
              <span className="w-20 text-body text-fg-1">Goal</span>
              <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Save $500" className="cell-input cell-input-left flex-1" />
            </label>
            <label className="cell">
              <span className="w-20 text-body text-fg-1">Target</span>
              <input type="number" inputMode="decimal" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} placeholder="500" className="cell-input cell-input-left flex-1" />
            </label>
            <label className="cell">
              <span className="w-20 text-body text-fg-1">Unit</span>
              <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="optional — $, glasses" className="cell-input cell-input-left flex-1" />
            </label>
          </Cells>
          <button type="button" className="cta cta-compact self-end" onClick={add}><Icon as={Plus} size="md" />Add goal</button>
        </div>
      </Sheet>

      <Sheet open={!!editing} onOpenChange={(o) => { if (!o) setOpen(null) }} title={editing?.label ?? 'Goal'} description={editing ? `${editing.value}/${editing.target}${editing.unit ? ` ${editing.unit}` : ''}` : undefined}>
        {editing && (
          <Cells>
            <label className="cell">
              <Icon as={CalendarDot} size="sm" className="text-fg-2" />
              <span className="flex-1 text-body text-fg-1">Deadline</span>
              <input type="date" value={editing.due ?? ''} onChange={(e) => updateCustomGoal(editing.id, { due: e.target.value || undefined })}
                aria-label={`Deadline for ${editing.label}`} className="cell-input" />
            </label>
            <Cell icon={Trash} tone="red" title="Delete goal" chevron={false} onPress={async () => {
              if (await confirm({ title: `Delete “${editing.label}”?`, description: `Its progress (${editing.value}/${editing.target}) goes with it.`, confirmLabel: 'Delete goal', destructive: true })) {
                removeCustomGoal(editing.id); setOpen(null)
              }
            }} />
          </Cells>
        )}
      </Sheet>
    </div>
  )
}
