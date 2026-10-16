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
import { discreetly } from '../../lib/discreet'

/**
 * Per-addiction streaks (BUJO-199) · each tracked as its own streak + best.
 *
 * ── One CARD per thing, not one card of rows ──────────────────────────────
 *
 * Reported as *"for different habit tracking I want you to show different
 * things — doomscrolling is a separate thing, porn masturbation is a separate
 * thing"*, and the markup was the opposite of that: every tracked habit was a
 * 54px `<li>` inside a single card called "Per-addiction streaks", sharing one
 * heading, one border and one subtitle. The data model has had a real streak
 * per addiction since BUJO-199 — its own `startedOn`, `best`, `relapses` and
 * `costPerDay` — and the page was rendering all of them as a list of rows
 * under someone else's title.
 *
 * Each now gets its own panel with its own figures, laid out side by side, so
 * nicotine and doomscrolling look like the two different problems they are.
 * The main streak is the hero in zone 1 and is the third of them.
 *
 * The add form stays ONCE, at the end — it is the only part of this that is
 * about the set rather than about a member of it.
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
  const label = discreetly(data.settings)

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
        /* Side by side from 30rem of the PANEL, not of the window — this card
           sits in a review column whose width is decided by the page split and
           by whether the act is open, so a viewport query would be the
           `sm:`-inside-the-act trap one zone over. The container is declared
           on the wrapper, because an element cannot query itself. */
        <ul className="@container/streaks grid grid-cols-1 gap-2 @min-[30rem]/streaks:grid-cols-2">
          {addictions.map((a) => {
            const st = addictionStats(a, today)
            const reset = a.relapses.some((r) => r.date === today)
            const aSaved = moneySaved(st.totalClean, a.costPerDay)
            return (
              <li key={a.id} className="group rounded-card border border-line bg-ink-2 px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <Icon as={Flame} size="sm" style={{ color: reset ? cat('red') : cat('peach') }} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    {/* `flex-wrap`, found by the clip gate the moment the
                        demo seed first put an addiction on this page: three
                        items shared one 54px line on a phone and the name
                        lost, showing "Nicotin". The row has always been
                        able to do this; nothing had ever rendered it with
                        data. */}
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="truncate font-medium text-fg-1">{label(a.name)}</span>
                      {/* `fg-2`, not `fg-3`. The quietest neutral at 10px on
                          `ink-2` measured **3.88 mocha · 4.49 latte · 3.78 neon
                          · 3.81 vscode** — four of five under the floor, caught
                          by `a11y:panels` on the row it had just been added to.
                          Second instance today after Cycle's day column, and
                          the same rule: `fg-3` is for a size that is not text
                          anyone reads. */}
                      {a.unit && <span className="text-micro text-fg-2">{a.unit}</span>}
                    </div>
                    {/* THE NUMBER LEADS, the way it does on the main streak.
                        A row that opened with the name and buried "4 days
                        clean" in a sentence made every tracked thing look the
                        same from a distance, which is the whole complaint. */}
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="num text-heading font-medium" style={{ color: onRaised(reset ? 'red' : 'mauve') }}>{st.current}</span>
                      <span className="text-label text-fg-2">day{st.current === 1 ? '' : 's'} clean</span>
                      <span className="text-label text-fg-2">· best {st.best}d</span>
                      {st.relapseCount > 0 && <span className="text-label text-fg-2">· {st.relapseCount} reset{st.relapseCount === 1 ? '' : 's'}</span>}
                      {a.costPerDay && aSaved > 0 && <span className="text-label" style={{ color: onRaised('green') }}>· {currency}{aSaved.toLocaleString()} saved</span>}
                    </div>
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
