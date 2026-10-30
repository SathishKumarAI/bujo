import { useState, type ReactNode } from 'react'
import { ArrowCounterClockwise, HandFist, Minus, Plus, SlidersHorizontal, CaretDown } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Cell, Cells } from '../ui/cells'
import { Seg } from '../ui/seg'
import { Sheet } from '../ui/sheet'
import { useJournal } from '../../store'
import { cat, onRaised } from '../../lib/colors'
import { HALT_STATES, type HaltState } from '../../lib/streak'
import { LONELY_KINDS } from '../../lib/recoveryFeedback'
import { formatAmount, unitOf } from '../../lib/addictionUnits'
import { frequentUrges, type FrequentUrge } from '../../lib/frequentUrges'
import { TECHNIQUES, useUrgeDraft } from './useUrgeDraft'
import type { DayTallyRow } from './DayTallyCard'

/**
 * RECOVERY ON A PHONE — Nutrition's "Your usual", for urges.
 *
 * OWNS: the phone drawing. One line of where you are (days clean against
 * your best); then your frequent urges as rows (`lib/frequentUrges.ts`:
 * tracked first, then what you log most, then presets), each with **Held**
 * and **Gave in** — one tap logs it; "Something else" for a new one; what
 * helped and HALT in an optional sheet; today's count per tracked thing as
 * rows with − / +; a reset behind one row; the read-only review below.
 * DOES NOT OWN: the urge write (`useUrgeDraft`, shared with the desktop's
 * `UrgeSurfingCard`), the reset form or the review (handed in).
 *
 * Owner asks, 2026-10-30: "give me options like frequent options, just like
 * nutrition … not use [the strength]" and "the top one … redundant, taking a
 * lot of space; the focus is the data entry". So no intensity on a phone (an
 * urge stores none rather than a default) and the scoreboard is one line.
 */
export function RecoveryPhone({ current, best, tally, onStep, resetForm, review }: {
  current: number
  best: number
  tally: DayTallyRow[]
  onStep: (id: string | null, step: number) => void
  resetForm: ReactNode
  review: ReactNode
}) {
  const { data } = useJournal()
  const d = useUrgeDraft()
  const [more, setMore] = useState(false)
  const [other, setOther] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [name, setName] = useState('')
  const frequent = frequentUrges(data)
  const extras = (d.technique ? 1 : 0) + d.halt.length
  const pct = best > 0 ? Math.min(100, (current / best) * 100) : 100
  const toggleHalt = (id: HaltState) => d.setHalt(d.halt.includes(id) ? d.halt.filter((x) => x !== id) : [...d.halt, id])
  const log = (outcome: 'resisted' | 'followed', u: Pick<FrequentUrge, 'name' | 'addictionId'>) => d.logUrge(outcome, u)

  return (
    <div className="flex flex-col gap-4 pb-2">
      <h1 className="sr-only">Recovery</h1>

      {/* WHERE YOU ARE, in one line: the run and the record it is chasing. */}
      <section aria-label="Your streak" className="cells px-4 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-title font-bold text-fg-1 tabular-nums">{current} <span className="text-body font-medium text-fg-2">{current === 1 ? 'day' : 'days'} clean</span></span>
          <span className="text-label text-fg-2">best {best}{current < best && ` · ${best - current} to go`}</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-ink-2" role="progressbar" aria-label="Days clean against your best" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
          <div className="h-full rounded-pill bg-green" style={{ width: `${pct}%` }} />
        </div>
      </section>

      {/* THE URGE, ONE TAP: a row each for what you usually log. */}
      <section aria-label="Log an urge" className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-heading font-semibold text-fg-1">Log an urge</h2>
          <button type="button" className="inline-flex min-h-11 items-center gap-1.5 text-label font-semibold" style={{ color: 'var(--color-brand-text)' }}
            onClick={() => setMore(true)} aria-label={`Details${extras ? ` · ${extras}` : ''}: what helped and HALT, for the next urge`}>
            <Icon as={SlidersHorizontal} size="sm" />Details{extras ? ` · ${extras}` : ''}
          </button>
        </div>
        <div className="cells">
          {frequent.map((u) => (
            <div key={u.name} className="cell gap-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body font-medium text-fg-1">{d.label(u.name)}</span>
                <span className="block truncate text-label text-fg-2">
                  {u.held + u.gaveIn ? `held ${u.held} · gave in ${u.gaveIn} · 30 days` : u.addictionId ? 'Tracked' : 'Not logged yet'}
                </span>
              </span>
              <button type="button" className="urge-gave" aria-label={`${d.label(u.name)}: Gave in`} onClick={() => log('followed', u)}>Gave in</button>
              <button type="button" className="urge-held" aria-label={`${d.label(u.name)}: Held`} onClick={() => log('resisted', u)}><Icon as={HandFist} size="sm" />Held</button>
            </div>
          ))}
          <button type="button" className="cell" onClick={() => setOther(true)}>
            <span className="flex-1 text-body text-fg-2">Something else…</span>
            <Icon as={Plus} size="sm" className="text-fg-2" />
          </button>
        </div>
      </section>

      {/* TODAY, per tracked thing: one row, minus and plus, in its own unit. */}
      <Cells title="Today" aside="if it happened">
        {tally.map((r) => {
          const u = unitOf(r.unit)
          return (
            <div key={r.id ?? 'primary'} className="cell">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body font-medium text-fg-1">{r.id ? d.label(r.name) : r.name}</span>
                <span className="block text-label" style={{ color: onRaised(r.count > 0 ? 'red' : 'green') }}>
                  {r.count > 0 ? `${formatAmount(r.count, r.unit)} today` : 'Clean today'}
                </span>
              </span>
              {r.count > 0 && (
                <button type="button" className="round-btn" aria-label={`Less ${r.name} today`} onClick={() => onStep(r.id, -u.step)}><Icon as={Minus} size="sm" /></button>
              )}
              <button type="button" className="round-btn" aria-label={`More ${r.name} today, ${formatAmount(u.step, r.unit)}`} onClick={() => onStep(r.id, u.step)}><Icon as={Plus} size="sm" /></button>
            </div>
          )
        })}
      </Cells>

      <Cells>
        <Cell icon={ArrowCounterClockwise} tone="red" title="Log a reset" subtitle={`Restarts the count · best ${best}d kept`} onPress={() => setResetting(true)} />
      </Cells>

      {review}

      <Sheet open={other} onOpenChange={setOther} title="Something else" description="It joins your list once you log it">
        <div className="flex flex-col gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name it" aria-label="What the urge was for"
            className="min-h-11 rounded-[0.75rem] bg-ink-2 px-3 text-body text-fg-1" />
          <div className="flex gap-2">
            {(['followed', 'resisted'] as const).map((o) => (
              <button key={o} type="button" disabled={!name.trim()} className={o === 'resisted' ? 'urge-held flex-1' : 'urge-gave flex-1'}
                onClick={() => { log(o, { name: name.trim() }); setName(''); setOther(false) }}>
                {o === 'resisted' ? <><Icon as={HandFist} size="sm" />Held</> : 'Gave in'}
              </button>
            ))}
          </div>
        </div>
      </Sheet>

      <Sheet open={more} onOpenChange={setMore} title="Details" description="Optional · added to the next urge you log">
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1 px-1 text-label text-fg-2">What helped</p>
            {/* Starts empty, so a second tap clearing it is safe. */}
            <Seg label="What helped" allowNone value={d.technique ?? null} onChange={(v) => d.setTechnique(v ?? undefined)}
              options={TECHNIQUES.map((t) => ({ value: t.id, label: t.label.replace(' 10 min', '').replace(' check', ''), name: t.label }))} />
          </div>
          <div>
            <p className="mb-1 px-1 text-label text-fg-2">HALT · tap any that fit</p>
            <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="HALT check">
              {HALT_STATES.map((h) => {
                const on = d.halt.includes(h.id)
                return (
                  <button key={h.id} type="button" aria-pressed={on} onClick={() => toggleHalt(h.id)}
                    className="min-h-11 rounded-[0.75rem] text-label font-medium"
                    style={on ? { background: `${cat('peach')}22`, boxShadow: `inset 0 0 0 1.5px ${cat('peach')}`, color: 'var(--color-fg-1)' } : { background: 'var(--color-ink-2)', color: 'var(--color-fg-2)' }}>
                    {h.label}
                  </button>
                )
              })}
            </div>
          </div>
          {d.halt.includes('lonely') && (
            <label className="select-pill">
              <span className="sr-only">What kind of lonely?</span>
              <select value={d.lonelyKind} onChange={(e) => d.setLonelyKind(e.target.value)}>
                <option value="">What kind of lonely?</option>
                {LONELY_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select>
              <Icon as={CaretDown} size="sm" className="pointer-events-none text-fg-2" />
            </label>
          )}
        </div>
      </Sheet>

      <Sheet open={resetting} onOpenChange={setResetting} title="Log a reset" description="Reflect, learn, restart the counter">
        {resetForm}
      </Sheet>
    </div>
  )
}
