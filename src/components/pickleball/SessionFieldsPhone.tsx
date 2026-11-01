import { Check, Minus, Plus } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Seg } from '../ui/seg'
import { Cells, ControlCell, FieldCell } from '../ui/cells'
import { todayISO } from '../../lib/date'
import { SESSION_SKILLS } from '../../lib/pickleballAcademy'
import type { SessionDraft } from './sessionDraft'
import type { SessionSection } from './SessionFields'

const LEVELS = ['2.5', '3.0', '3.5', '4.0', '4.5', '5.0'].map((l) => ({ value: l, label: l }))
const SCORING = [
  { value: '11', label: '11', name: 'to 11' },
  { value: '15', label: '15', name: 'to 15' },
  { value: '21', label: '21', name: 'to 21' },
  { value: 'rally21', label: 'Rally', name: 'rally to 21' },
] as const
const TIME = [
  { value: '30', label: '30m', name: '30 minutes' },
  { value: '45', label: '45m', name: '45 minutes' },
  { value: '60', label: '1h', name: '1 hour' },
  { value: '90', label: '1½h', name: '1 and a half hours' },
  { value: '120', label: '2h', name: '2 hours' },
] as const
const ENERGY = [
  { value: '1', label: '1', name: '1, drained' },
  { value: '2', label: '2', name: '2, tired' },
  { value: '3', label: '3', name: '3, okay' },
  { value: '4', label: '4', name: '4, good' },
  { value: '5', label: '5', name: '5, buzzing' },
] as const

/**
 * EVERY FIELD A SESSION HAS, drawn for a phone (COD-454).
 *
 * OWNS: the phone's rendering of the session form — iOS inset groups of rows,
 * segmented controls for one-of-few, toggle pills for pick-several, inline
 * text rows with one-tap suggestions.
 * DOES NOT OWN: the draft or its meaning (`sessionDraft.ts`), or which device
 * gets it — `SessionFields` hands off here on a phone, so every caller (the
 * quick log's sheet, the history edit sheet) gets it without knowing, and
 * there is still one entry point for a session's form.
 *
 * Same fields, same `sections`, same draft keys as the desktop form. A field
 * added to a session must be added in BOTH renderings — the round-trip test
 * in `sessionDraft.test.ts` guards the draft, not the drawing.
 */
export function SessionFieldsPhone({ f, set, allPartners, allVenues, sections, noDate }: {
  f: SessionDraft
  set: (p: Partial<SessionDraft>) => void
  allPartners: string[]
  allVenues: string[]
  sections?: readonly SessionSection[]
  /** As `SessionFields`: the page's `DayStrip` owns the day. */
  noDate?: boolean
}) {
  const has = (k: SessionSection) => !sections || sections.includes(k)
  const doubles = f.format === 'doubles'
  const n = (v: string) => (v === '' ? 0 : Number(v))
  const step = (k: 'gamesWon' | 'gamesLost', d: number) => set({ [k]: String(Math.max(0, Math.min(30, n(f[k]) + d))) })
  const toggle = (k: 'worked' | 'toFix', v: string) => set({ [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] })

  return (
    <div className="flex flex-col gap-5">
      {(has('when') || has('score') || has('session')) && (
        <Cells title="Session">
          {has('when') && (<>
            {!noDate && (
              <label className="cell">
                <span className="w-[6.5rem] shrink-0 text-body text-fg-1">Date</span>
                <input type="date" value={f.date} max={todayISO()} onChange={(e) => e.target.value && set({ date: e.target.value })} className="cell-input" aria-label="Date" />
              </label>
            )}
            <ControlCell label="Format">
              <Seg label="Format" value={f.format} onChange={(v) => v && set({ format: v })} options={[{ value: 'doubles', label: 'Doubles' }, { value: 'singles', label: 'Singles' }]} />
            </ControlCell>
          </>)}
          {has('score') && (['gamesWon', 'gamesLost'] as const).map((k) => {
            const name = k === 'gamesWon' ? 'Games won' : 'Games lost'
            return (
              <div key={k} className="cell justify-between">
                <span className="text-body text-fg-1">{name}</span>
                <span className="mini-step">
                  <button type="button" className="round-btn" onClick={() => step(k, -1)} aria-label={`Decrease ${name}`}><Icon as={Minus} size="sm" /></button>
                  <output aria-label={name} aria-live="polite">{n(f[k])}</output>
                  <button type="button" className="round-btn" onClick={() => step(k, 1)} aria-label={`Increase ${name}`}><Icon as={Plus} size="sm" /></button>
                </span>
              </div>
            )
          })}
          {has('session') && (<>
            <ControlCell label="Time on court" hint={f.durationMin && !TIME.some((t) => t.value === f.durationMin) ? `${f.durationMin} min` : undefined}>
              <Seg label="Time on court" value={(TIME.find((t) => t.value === f.durationMin)?.value) ?? null} onChange={(v) => v && set({ durationMin: v })} options={TIME} />
            </ControlCell>
            <FieldCell label="Minutes" type="number" inputMode="numeric" value={f.durationMin} onChange={(v) => set({ durationMin: v })} placeholder="Other" />
            <ControlCell label="Effort" hint={f.rpe ? `${f.rpe} of 10` : 'Not set'}>
              <input type="range" min={1} max={10} value={f.rpe === '' ? 5 : Number(f.rpe)} onChange={(e) => set({ rpe: e.target.value })} aria-label="Effort" aria-valuetext={f.rpe ? `${f.rpe} of 10` : 'Not set'} className="effort" data-unset={f.rpe === '' || undefined} />
            </ControlCell>
          </>)}
        </Cells>
      )}

      {has('who') && (
        <Cells title="Who & where">
          {/* datalists once: every name ever used, in each field's own dropdown */}
          <datalist id="pb-partners-phone">{allPartners.map((x) => <option key={x} value={x} />)}</datalist>
          <datalist id="pb-venues-phone">{allVenues.map((x) => <option key={x} value={x} />)}</datalist>
          {doubles && <FieldCell label="Partner" value={f.partner} onChange={(v) => set({ partner: v })} placeholder="Name" suggestions={allPartners} list="pb-partners-phone" />}
          <FieldCell label={doubles ? 'Opponent 1' : 'Opponent'} value={f.opponent} onChange={(v) => set({ opponent: v })} placeholder="Name" />
          {doubles && <FieldCell label="Opponent 2" value={f.opponent2} onChange={(v) => set({ opponent2: v })} placeholder="Name" />}
          <FieldCell label="Court" value={f.location} onChange={(v) => set({ location: v })} placeholder="Where" suggestions={allVenues} list="pb-venues-phone" />
        </Cells>
      )}

      {has('how') && (
        <Cells title="How it went">
          {([['worked', 'What worked', 'green'], ['toFix', 'To work on', 'peach']] as const).map(([k, label, tone]) => (
            <ControlCell key={k} label={label} hint={f[k].length ? `${f[k].length} picked` : 'Tap any'}>
              <div role="group" aria-label={label} className="grid grid-cols-3 gap-1.5" style={{ ['--tone' as string]: `var(--color-${tone})` }}>
                {SESSION_SKILLS.map((s) => (
                  <button key={s.value} type="button" className="chip-toggle" aria-pressed={f[k].includes(s.value)} onClick={() => toggle(k, s.value)}>
                    <Icon as={Check} size="sm" />{s.label}
                  </button>
                ))}
              </div>
            </ControlCell>
          ))}
          <ControlCell label="Energy after" hint="1 drained · 5 buzzing">
            <Seg label="Energy after" value={(ENERGY.find((e) => e.value === f.energy)?.value) ?? null} onChange={(v) => set({ energy: v ?? '' })} options={ENERGY} allowNone />
          </ControlCell>
          <ControlCell label="Any pain?" hint={f.pain === 'yes' ? 'Say where in the notes' : undefined}>
            <Seg label="Any pain?" value={f.pain || null} onChange={(v) => set({ pain: v ?? '' })} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} allowNone />
          </ControlCell>
        </Cells>
      )}

      {has('details') && (
        <Cells title="Match details">
          <ControlCell label="Level">
            {/* No `allowNone` on Level or Scoring: both arrive pre-filled from
                last session, and a confirming tap would erase them (the trap
                on `Seg`). */}
            <Seg label="Level" value={f.level || null} onChange={(v) => v && set({ level: v })} options={LEVELS} />
          </ControlCell>
          <ControlCell label="Scoring">
            <Seg label="Scoring" value={f.scoring || null} onChange={(v) => v && set({ scoring: v })} options={SCORING} />
          </ControlCell>
          <FieldCell label="Points for" type="number" inputMode="numeric" value={f.pointsFor} onChange={(v) => set({ pointsFor: v })} placeholder="0" />
          <FieldCell label="Points against" type="number" inputMode="numeric" value={f.pointsAgainst} onChange={(v) => set({ pointsAgainst: v })} placeholder="0" />
        </Cells>
      )}
    </div>
  )
}
