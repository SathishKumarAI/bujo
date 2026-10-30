import { useState, type ReactNode } from 'react'
import { ArrowCounterClockwise, CaretDown, HandFist, Minus, Plus, SlidersHorizontal } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Cell, Cells } from '../ui/cells'
import { Seg } from '../ui/seg'
import { Sheet } from '../ui/sheet'
import { cat, onRaised } from '../../lib/colors'
import { URGE_PRESETS, HALT_STATES, type HaltState } from '../../lib/streak'
import { LONELY_KINDS } from '../../lib/recoveryFeedback'
import { formatAmount, unitOf } from '../../lib/addictionUnits'
import { INTENSITY_WORD, TECHNIQUES, useUrgeDraft } from './useUrgeDraft'
import type { DayTallyRow } from './DayTallyCard'

const OTHER = '__other__'

/**
 * RECOVERY ON A PHONE — Pickleball's quick log and Program's rows.
 *
 * OWNS: the phone drawing. A scoreboard (days clean big, against your best);
 * the urge as one card — what it was for in a native select, how strong as a
 * segmented row — with "I held" and "I gave in" in the dock and everything
 * optional (what helped, HALT, which kind of lonely, your own words) in a
 * sheet; today's count per tracked thing as rows with − / +; a reset behind
 * one row and a sheet; the read-only review below.
 * DOES NOT OWN: the urge draft or its write (`useUrgeDraft`, shared with the
 * desktop's `UrgeSurfingCard`), the reset form or the review (handed in).
 *
 * Measured before: 2,124px at 390 — the urge form alone was about twenty-five
 * chips in four rows, and the two outcome buttons sat above all of them.
 * Owner ask, 2026-10-30: "work on this as for the pickleball and program".
 */
export function RecoveryPhone({ current, best, totalClean, urges, sentence, tally, onStep, resetForm, review }: {
  current: number
  best: number
  totalClean: number
  urges: number
  /** Zone 1's one sentence (`recoveryStep`). */
  sentence: string
  tally: DayTallyRow[]
  onStep: (id: string | null, step: number) => void
  resetForm: ReactNode
  review: ReactNode
}) {
  const d = useUrgeDraft()
  const [more, setMore] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [typing, setTyping] = useState(false)
  const presets = URGE_PRESETS.filter((u) => !d.addictions.some((a) => a.name.toLowerCase() === u.toLowerCase()))
  const known = d.addictions.some((a) => a.name === d.urge) || presets.includes(d.urge)
  const extras = (d.technique ? 1 : 0) + d.halt.length
  const pct = best > 0 ? Math.min(100, (current / best) * 100) : 100

  function pick(v: string) {
    if (v === OTHER) { setTyping(true); d.setUrge(''); d.setAddictionId(''); return }
    setTyping(false)
    const own = d.addictions.find((a) => a.name === v)
    d.setUrge(v)
    d.setAddictionId(own ? own.id : '')
  }
  function log(outcome: 'resisted' | 'followed') { d.logUrge(outcome); setTyping(false) }
  const toggleHalt = (id: HaltState) => d.setHalt(d.halt.includes(id) ? d.halt.filter((x) => x !== id) : [...d.halt, id])

  return (
    <div className="flex flex-col gap-4 pb-2">
      <h1 className="sr-only">Recovery</h1>

      {/* THE SCOREBOARD: the run, against the record it is chasing. */}
      <section aria-label="Your streak" className="cells px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className="score-num text-fg-1">{current}</span>
          <span className="text-label text-fg-2">{current === 1 ? 'day' : 'days'} clean · best {best}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-pill bg-ink-2" role="progressbar" aria-label="Days clean against your best" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
          <div className="h-full rounded-pill bg-green transition-[width]" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1.5 text-label text-fg-2">{sentence}</p>
        <div className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-3">
          {([['Best', `${best}d`], ['Total clean', `${totalClean}d`], ['Urges', urges]] as const).map(([k, v]) => (
            <div key={k}>
              <span className="block text-label text-fg-2">{k}</span>
              <span className="block text-heading font-semibold text-fg-1 tabular-nums">{v}</span>
            </div>
          ))}
        </div>
      </section>

      {/* THE URGE, ONE CARD: what for, how strong. The two endings are in the dock. */}
      <section aria-label="Feeling an urge?" className="flex flex-col gap-2">
        <h2 className="px-1 text-heading font-semibold text-fg-1">Feeling an urge?</h2>
        <div className="cells flex flex-col gap-3 px-4 py-3">
          <label className="select-pill">
            <span className="sr-only">What was the urge for?</span>
            <select value={typing ? OTHER : known ? d.urge : ''} onChange={(e) => pick(e.target.value)}>
              <option value="" disabled>What is it for?</option>
              {d.addictions.length > 0 && (
                <optgroup label="You track">
                  {d.addictions.map((a) => <option key={a.id} value={a.name}>{d.label(a.name)}</option>)}
                </optgroup>
              )}
              <optgroup label={d.addictions.length ? 'Others' : 'Urges'}>
                {presets.map((u) => <option key={u} value={u}>{d.label(u)}</option>)}
              </optgroup>
              <option value={OTHER}>Something else…</option>
            </select>
            <Icon as={CaretDown} size="sm" className="pointer-events-none text-fg-2" />
          </label>
          {typing && (
            <input value={d.urge} onChange={(e) => { d.setUrge(e.target.value); d.setAddictionId('') }} placeholder="Name it" aria-label="Your own words for the urge"
              className="min-h-11 rounded-[0.75rem] bg-ink-2 px-3 text-body text-fg-1" autoFocus />
          )}
          {d.matchedPlan && (
            <p className="text-label text-fg-2">
              <span className="font-medium" style={{ color: onRaised('teal') }}>Your plan for “{d.matchedPlan.trigger}”:</span>{' '}
              {d.matchedPlan.coping || 'name it and let it pass.'}
            </p>
          )}
          <div>
            <div className="mb-1 flex items-baseline justify-between px-1">
              <span className="text-label text-fg-2">How strong</span>
              <span className="text-label font-medium text-fg-1">{INTENSITY_WORD[d.intensity - 1]}</span>
            </div>
            {/* Starts at 3 every time — a carried value, so no tap-to-clear. */}
            <Seg label="Intensity" value={d.intensity} onChange={(v) => v && d.setIntensity(v)}
              options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n), name: `${n} of 5 · ${INTENSITY_WORD[n - 1]}` }))} />
          </div>
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

      {/* After Today, not at the foot: it rides the screen bottom while the
          urge and the counts are above it, then settles here and scrolls away
          — the review below is for reading and nothing floats over it. */}
      <div className="log-dock">
        <button type="button" className="round-btn" onClick={() => setMore(true)} aria-label={`What helped and HALT${extras ? `, ${extras} added` : ''}`}>
          <Icon as={SlidersHorizontal} size="md" />
        </button>
        <button type="button" className="dock-chip" onClick={() => log('followed')}>I gave in</button>
        <button type="button" className="cta cta-compact" onClick={() => log('resisted')}>
          <Icon as={HandFist} size="md" />I held
        </button>
      </div>

      <Cells>
        <Cell icon={ArrowCounterClockwise} tone="red" title="Log a reset" subtitle={`Restarts the count · best ${best}d and total kept`} onPress={() => setResetting(true)} />
      </Cells>

      {review}


      <Sheet open={more} onOpenChange={setMore} title="About this urge" description="All optional">
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
