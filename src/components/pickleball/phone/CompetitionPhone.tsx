import { useState } from 'react'
import { CalendarDot, CaretDown, Check, Minus, Plus, X } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../../../store'
import { Cell, Cells, ControlCell, FieldCell } from '../../ui/cells'
import { Seg } from '../../ui/seg'
import { useConfirm } from '../../ConfirmDialog'
import { onRaised } from '../../../lib/colors'
import { prettyDay, todayISO } from '../../../lib/date'
import { duprTrend, upcomingEvents } from '../../../lib/pickleball'
import { PICKLE_FORMATS, FORMAT_LABEL } from '../../../lib/pickleballPlan'
import type { PickleballFormat } from '../../../lib/types'
import { notify } from '../../../lib/notify'
import { evtBlankOf, eventFrom, PREP_CHECKLIST, type EventDraft } from '../competitionDraft'

const KINDS = [{ value: 'tournament', label: 'Tournament' }, { value: 'league', label: 'League' }] as const
/** One tap for the answers `medals` counts; anything else ("2nd of 8") is typed. */
const MEDALS = ['Gold', 'Silver', 'Bronze']

/**
 * PICKLEBALL'S COMPETITION SHEET ON A PHONE (COD-553) — what the Competition row
 * opens, instead of the desktop `CompetitionPanel` form at 1702px.
 *
 * OWNS: the phone drawing — the event form as inset rows with its Save pinned
 * to the sheet's bottom edge, the DUPR rating as two rows, then the read-back
 * (events, ratings, what is coming up and its checklist), no chart.
 * DOES NOT OWN: the draft or what saving writes (`competitionDraft.ts`, shared
 * with the desktop panel), or the sheet itself (`PickleballPhone`).
 *
 * Shape: the date and kind on one bar (QuickLog's date pill + `Seg`), the
 * record as a stepper row each, placement with Gold/Silver/Bronze one
 * tap away. Kind arrives pre-set to Tournament, so no `allowNone` on it (the
 * `Seg` trap: a confirming tap would clear it).
 */
export function CompetitionPhone({ allPartners }: { allPartners: string[] }) {
  const { data, addPickleEvent, removePickleEvent, logDupr, removeDupr } = useJournal()
  const confirm = useConfirm()
  const today = todayISO()
  const [ev, setEv] = useState(evtBlankOf)
  const set = (p: Partial<EventDraft>) => setEv((c) => ({ ...c, ...p }))
  const [dupr, setDupr] = useState({ date: today, rating: '' })
  const stats = duprTrend(data.settings)
  const upcoming = upcomingEvents(data, today)
  const events = [...(data.pickleballEvents ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1))
  const dayLabel = ev.date === today ? 'Today' : prettyDay(ev.date)
  // Wins/losses start empty — an untouched record is not stored as 0–0.
  const step = (k: 'wins' | 'losses', d: number) => {
    const next = (ev[k] === '' ? 0 : Number(ev[k])) + d
    set({ [k]: next < 0 ? '' : String(Math.min(99, next)) })
  }

  function save() {
    if (!ev.name.trim()) { notify.info('Name the event', 'A league or tournament needs a name to find it by.'); return }
    addPickleEvent(eventFrom(ev))
    notify.success('Event logged', ev.name.trim())
    setEv(evtBlankOf())
  }
  function saveDupr() {
    const r = Number(dupr.rating)
    if (!dupr.rating || Number.isNaN(r) || r <= 0) return
    logDupr(dupr.date, r)
    setDupr({ date: todayISO(), rating: '' })
  }

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Log an event" className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {/* A pill over a real date input — the phone's own date wheel. No
              `max`: an event you have entered but not yet played is logged too. */}
          <label className="relative inline-flex h-[2.75rem] shrink-0 items-center gap-1.5 rounded-[0.75rem] bg-ink-2 px-3 text-body font-medium text-fg-1">
            <Icon as={CalendarDot} size="sm" className="text-fg-2" />
            {dayLabel}
            <Icon as={CaretDown} size="sm" className="text-fg-2" />
            <input type="date" value={ev.date} onChange={(e) => e.target.value && set({ date: e.target.value })}
              aria-label={`Date, ${dayLabel}`} className="absolute inset-0 cursor-pointer opacity-0" />
          </label>
          <Seg label="Kind" className="min-w-0 flex-1" value={ev.kind} onChange={(v) => v && set({ kind: v })} options={KINDS} />
        </div>

        <datalist id="pb-comp-partners">{allPartners.map((x) => <option key={x} value={x} />)}</datalist>
        <div className="cells">
          <FieldCell label="Event" value={ev.name} onChange={(v) => set({ name: v })} placeholder="Name" />
          {/* Eight formats: a native select, which a phone draws as its wheel. */}
          <label className="cell">
            <span className="w-[6.5rem] shrink-0 text-body text-fg-1">Format</span>
            <select value={ev.format} onChange={(e) => set({ format: e.target.value as PickleballFormat })} className="cell-input comp-select">
              {PICKLE_FORMATS.map((fm) => <option key={fm.id} value={fm.id}>{fm.label}</option>)}
            </select>
          </label>
          {/* Two rows, as `SessionFieldsPhone` draws a score: both steppers on
              one row put the last + past the cell's edge at 390px. */}
          {(['wins', 'losses'] as const).map((k) => {
            const name = k === 'wins' ? 'Wins' : 'Losses'
            return (
              <div key={k} className="cell justify-between">
                <span className="text-body text-fg-1">{name}</span>
                <span className="mini-step">
                  <button type="button" className="round-btn" onClick={() => step(k, -1)} aria-label={`Fewer ${name.toLowerCase()}`}><Icon as={Minus} size="sm" /></button>
                  <output aria-label={name} aria-live="polite">{ev[k] || 0}</output>
                  <button type="button" className="round-btn" onClick={() => step(k, 1)} aria-label={`More ${name.toLowerCase()}`}><Icon as={Plus} size="sm" /></button>
                </span>
              </div>
            )
          })}
          {/* Not `FieldCell`'s suggestions: its strip is indented 7.25rem and
              does not wrap, which put Bronze 5px past the cell's content box
              at 390px (363 vs 358). Here the medals sit under the field,
              right-aligned, and may wrap. */}
          <div className="cell cell-stack gap-1.5">
            <label className="flex min-h-[2.25rem] items-center gap-3">
              <span className="w-[6.5rem] shrink-0 text-body text-fg-1">Placement</span>
              <input value={ev.placement} onChange={(e) => set({ placement: e.target.value })} placeholder="2nd of 8" className="cell-input" />
            </label>
            <div className="flex flex-wrap justify-end gap-1.5" role="group" aria-label="Medal">
              {MEDALS.filter((m) => m !== ev.placement).map((m) => (
                <button key={m} type="button" className="suggest" onClick={() => set({ placement: m })}>{m}</button>
              ))}
            </div>
          </div>
          <FieldCell label="Division" value={ev.division} onChange={(v) => set({ division: v })} placeholder="3.5 Mixed" />
          <FieldCell label="Partner" value={ev.partner} onChange={(v) => set({ partner: v })} placeholder="Optional" list="pb-comp-partners" />
        </div>
        {/* Pinned to the sheet's bottom edge while the form is on screen. */}
        <div className="comp-dock">
          <button type="button" className="cta cta-compact" onClick={save}><Icon as={Check} size="md" />Save event</button>
        </div>
      </section>

      <Cells title="DUPR rating" aside={stats.latest != null ? `latest ${stats.latest} · best ${stats.best}` : undefined}>
        <label className="cell">
          <span className="w-[6.5rem] shrink-0 text-body text-fg-1">Date</span>
          <input type="date" value={dupr.date} onChange={(e) => e.target.value && setDupr((c) => ({ ...c, date: e.target.value }))} className="cell-input" aria-label="Rating date" />
        </label>
        <div className="cell gap-2">
          <label className="flex min-w-0 flex-1 items-center gap-3">
            <span className="w-[6.5rem] shrink-0 text-body text-fg-1">Rating</span>
            <input type="number" step="0.01" inputMode="decimal" value={dupr.rating} onChange={(e) => setDupr((c) => ({ ...c, rating: e.target.value }))} placeholder="3.75" className="cell-input" />
          </label>
          <button type="button" className="urge-held" onClick={saveDupr} disabled={!dupr.rating}>Save rating</button>
        </div>
      </Cells>

      {upcoming.length > 0 && (
        <Cells title="Coming up">
          {upcoming.map((e) => (
            <Cell key={e.id} icon={CalendarDot} tone={e.soon ? 'peach' : 'mauve'} title={e.name}
              subtitle={`${prettyDay(e.date)} · ${FORMAT_LABEL[e.format]}${e.division ? ` · ${e.division}` : ''}`}
              trail={e.daysUntil === 0 ? 'Today' : e.daysUntil === 1 ? 'Tomorrow' : `${e.daysUntil} days`} />
          ))}
          <ControlCell label="Tournament-day checklist">
            <ul className="flex flex-col gap-1.5">
              {PREP_CHECKLIST.map((x) => <li key={x} className="text-label text-fg-2">{x}</li>)}
            </ul>
          </ControlCell>
        </Cells>
      )}

      {events.length > 0 && (
        <Cells title="Events" aside={`${events.length} logged`}>
          {events.map((e) => (
            <Cell key={e.id} title={e.name}
              subtitle={[prettyDay(e.date), FORMAT_LABEL[e.format], e.placement, (e.wins != null || e.losses != null) ? `${e.wins ?? 0}–${e.losses ?? 0}` : ''].filter(Boolean).join(' · ')}
              trail={(
                <button type="button" className="comp-remove" aria-label={`Remove ${e.name}`} onClick={async () => {
                  if (await confirm({ title: `Remove ${e.name}?`, description: 'The event and its record come off your history.', confirmLabel: 'Remove it', destructive: true })) removePickleEvent(e.id)
                }}><Icon as={X} size="sm" /></button>
              )} />
          ))}
        </Cells>
      )}

      {stats.points.length > 0 && (
        <Cells title="Ratings">
          {[...stats.points].reverse().slice(0, 8).map((p) => (
            <Cell key={p.date} title={prettyDay(p.date)}
              trail={(
                <span className="flex items-center gap-1">
                  <span className="font-semibold tabular-nums" style={{ color: onRaised('mauve') }}>{p.rating}</span>
                  <button type="button" className="comp-remove" aria-label={`Remove rating from ${prettyDay(p.date)}`} onClick={async () => {
                    if (await confirm({ title: 'Remove this rating?', description: `${p.rating} on ${prettyDay(p.date)} comes off the trend.`, confirmLabel: 'Remove it', destructive: true })) removeDupr(p.date)
                  }}><Icon as={X} size="sm" /></button>
                </span>
              )} />
          ))}
        </Cells>
      )}
    </div>
  )
}
