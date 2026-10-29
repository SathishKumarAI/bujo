import { useState } from 'react'
import { ArrowRight, CalendarPlus, CaretLeft, CaretRight, Check, Plus, ArrowsClockwise, Trash } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../../store'
import { useConfirm } from '../ConfirmDialog'
import { addDays, prettyDay, weekDaysOf, WEEKDAYS } from '../../lib/date'
import type { Entry } from '../../lib/types'
import { Cell, Cells } from '../ui/cells'
import { Sheet } from '../ui/sheet'

const GLYPH: Record<Entry['type'], string> = { task: '·', event: '○', note: '–' }
const RULE_PRESETS = ['Take vitamins', 'Journal', 'Stretch 10 min']

/**
 * PLAN · WEEK ON A PHONE (COD-466) — pick a day in the week strip, see and add
 * to that day, clear what is overdue.
 *
 * OWNS: the phone page: a seven-chip week strip (arrows step whole weeks),
 * the chosen day as rows you tick, an add field for that day, the overdue
 * queue as rows with "→ Today", and recurring rules in a sheet.
 * DOES NOT OWN: the overdue sort or ICS import (the view's, passed in).
 *
 * The desktop week is a seven-column table; at 390px it showed four and a
 * half columns with every title wrapped a word per line. A phone reads one
 * day at a time, the way Program now reads one training day.
 */
export function PlanPhone({ today, overdue, onImport, importNote }: {
  today: string
  overdue: Entry[]
  onImport: () => void
  importNote: string | null
}) {
  const { data, addEntry, updateEntry, deleteEntry, migrateEntry, addRecurrence, updateRecurrence, removeRecurrence } = useJournal()
  const [sel, setSel] = useState(today)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState<Entry | null>(null)
  const [rules, setRules] = useState(false)
  const [allOverdue, setAllOverdue] = useState(false)
  const week = weekDaysOf(sel, data.settings.weekStart)
  const onDay = (iso: string) => data.entries.filter((e) => e.date === iso)
  const items = onDay(sel)
  const openOn = (iso: string) => onDay(iso).filter((e) => e.type === 'task' && e.status === 'open').length
  const dayName = sel === today ? 'Today' : sel === addDays(today, 1) ? 'Tomorrow' : prettyDay(sel)
  const first = new Date(week[0] + 'T00:00')
  const shownOverdue = allOverdue ? overdue : overdue.slice(0, 5)

  function add() {
    if (!draft.trim()) return
    addEntry(sel, draft)
    setDraft('')
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
      <h1 className="sr-only">Plan · week</h1>

      <section aria-label="Choose a day" className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <button type="button" className="round-btn" aria-label="Previous week" onClick={() => setSel(addDays(sel, -7))}><Icon as={CaretLeft} size="sm" /></button>
          <span className="text-body font-semibold text-fg-1">
            Week of {first.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
          <button type="button" className="round-btn" aria-label="Next week" onClick={() => setSel(addDays(sel, 7))}><Icon as={CaretRight} size="sm" /></button>
        </div>
        <div role="radiogroup" aria-label="Days" className="grid grid-cols-7 gap-1">
          {week.map((d) => {
            const dt = new Date(d + 'T00:00')
            const n = openOn(d)
            return (
              <button key={d} type="button" role="radio" aria-checked={d === sel} className="day-chip" data-today={d === today || undefined} onClick={() => setSel(d)}>
                <span className="text-label text-fg-2">{WEEKDAYS[dt.getDay()]}</span>
                <span className="text-heading font-bold">{dt.getDate()}</span>
                <span className="text-label text-fg-2">{n ? <>{n}<span className="sr-only"> open</span></> : <span aria-hidden>·</span>}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section aria-label={dayName} className="ios-form flex flex-col gap-2">
        <h2 className="px-1 text-title font-bold text-fg-1">{dayName}</h2>
        <div className="cells">
          <div className="cell gap-2">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add() }}
              placeholder={`Add to ${dayName}`} aria-label={`Add to ${dayName}`} className="cell-input cell-input-left" enterKeyHint="done" />
            <button type="button" className="round-btn round-btn-primary" aria-label="Add" onClick={add}><Icon as={Plus} size="md" /></button>
          </div>
          {items.map((e) => (
            <div key={e.id} className="cell">
              {e.type === 'task'
                ? <button type="button" className="check-circle" aria-pressed={e.status === 'done'} aria-label={`Done: ${e.text}`} onClick={() => updateEntry(e.id, { status: e.status === 'done' ? 'open' : 'done' })}><span aria-hidden><Icon as={Check} size="md" /></span></button>
                : <span aria-hidden className="grid w-[2.75rem] place-items-center text-heading text-fg-2">{GLYPH[e.type]}</span>}
              <button type="button" className="min-w-0 flex-1 py-2 text-left" onClick={() => setEditing(e)}>
                <span className="sr-only">Edit </span>
                <span className={`block text-body ${e.status === 'done' || e.status === 'dropped' ? 'text-fg-2 line-through' : 'text-fg-1'}`}>{e.text}</span>
              </button>
            </div>
          ))}
        </div>
        {items.length === 0 && <p className="px-1 text-label text-fg-2">Nothing on this day yet.</p>}
      </section>

      {overdue.length > 0 && (
        <Cells title="Overdue" aside={`${overdue.length} waiting`}>
          {shownOverdue.map((e) => (
            <div key={e.id} className="cell">
              <span className="min-w-0 flex-1">
                <span className="block text-body text-fg-1">{e.text}</span>
                <span className="block text-label text-fg-2">{prettyDay(e.date)}</span>
              </span>
              <button type="button" className="round-btn" aria-label={`Move "${e.text}" to today`} onClick={() => migrateEntry(e.id, today)}><Icon as={ArrowRight} size="sm" /></button>
            </div>
          ))}
          {overdue.length > 5 && <Cell title={allOverdue ? 'Show fewer' : `Show all ${overdue.length}`} chevron={false} onPress={() => setAllOverdue((x) => !x)} />}
          {overdue.length > 1 && <Cell icon={ArrowRight} tone="mauve" title={`Move all ${overdue.length} to today`} chevron={false} onPress={() => overdue.forEach((e) => migrateEntry(e.id, today))} />}
        </Cells>
      )}

      <Cells>
        <Cell icon={ArrowsClockwise} tone="teal" title="Recurring" subtitle={`${data.recurrences.length} ${data.recurrences.length === 1 ? 'rule' : 'rules'} put things on the week`} onPress={() => setRules(true)} />
        <Cell icon={CalendarPlus} tone="sky" title="Import a calendar" subtitle={importNote ?? 'An .ics file from Google or Apple'} onPress={onImport} />
      </Cells>

      {editing && (
        <EntrySheet e={editing} today={today} onClose={() => setEditing(null)}
          onSave={(text) => updateEntry(editing.id, { text })}
          onMove={(to) => { migrateEntry(editing.id, to); setEditing(null) }}
          onDelete={() => { deleteEntry(editing.id); setEditing(null) }} />
      )}

      <Sheet open={rules} onOpenChange={setRules} title="Recurring" description="Added to every day they apply">
        <div className="ios-form flex flex-col gap-5">
          <Cells>
            {data.recurrences.map((r) => (
              <div key={r.id} className="cell gap-2">
                <input defaultValue={r.text} aria-label={`Rule: ${r.text}`} className="cell-input cell-input-left"
                  onBlur={(ev) => { const t = ev.target.value.trim(); if (t && t !== r.text) updateRecurrence(r.id, { text: t }) }} />
                <span className="shrink-0 text-label text-fg-2">{r.freq === 'daily' ? 'daily' : r.weekdays.map((d) => WEEKDAYS[d]).join(' ')}</span>
                <button type="button" className="round-btn" aria-label={`Remove rule ${r.text}`} onClick={() => removeRecurrence(r.id)}><Icon as={Trash} size="sm" /></button>
              </div>
            ))}
            <RuleAdd onAdd={(text) => addRecurrence({ text, type: 'task', important: false, freq: 'daily', weekdays: [], startedOn: today })} />
          </Cells>
          <Cells title="Suggestions">
            {RULE_PRESETS.filter((p) => !data.recurrences.some((r) => r.text.toLowerCase() === p.toLowerCase())).map((p) => (
              <Cell key={p} icon={Plus} tone="mauve" title={p} subtitle="Every day" chevron={false}
                onPress={() => addRecurrence({ text: p, type: 'task', important: false, freq: 'daily', weekdays: [], startedOn: today })} />
            ))}
          </Cells>
          <p className="px-1 text-label text-fg-2">Weekly rules are set up on the desktop.</p>
        </div>
      </Sheet>
    </div>
  )
}

function RuleAdd({ onAdd }: { onAdd: (text: string) => void }) {
  const [t, setT] = useState('')
  const go = () => { if (t.trim()) { onAdd(t.trim()); setT('') } }
  return (
    <div className="cell gap-2">
      <input value={t} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') go() }} placeholder="New daily rule" aria-label="New daily rule" className="cell-input cell-input-left" />
      <button type="button" className="round-btn round-btn-primary" aria-label="Add rule" onClick={go}><Icon as={Plus} size="md" /></button>
    </div>
  )
}

/** Edit one line: its text, move it, or delete it (asks first, names it). */
function EntrySheet({ e, today, onClose, onSave, onMove, onDelete }: {
  e: Entry
  today: string
  onClose: () => void
  onSave: (text: string) => void
  onMove: (to: string) => void
  onDelete: () => void
}) {
  const confirm = useConfirm()
  const [text, setText] = useState(e.text)
  const save = () => { if (text.trim() && text.trim() !== e.text) onSave(text.trim()) }
  return (
    <Sheet open onOpenChange={(o) => { if (!o) { save(); onClose() } }} title="Edit" description={prettyDay(e.date)}>
      <div className="ios-form flex flex-col gap-4">
        <Cells>
          <div className="cell"><input value={text} onChange={(ev) => setText(ev.target.value)} aria-label="Text" className="cell-input cell-input-left" /></div>
        </Cells>
        <Cells>
          {e.date !== today && <Cell icon={ArrowRight} tone="mauve" title="Move to today" chevron={false} onPress={() => { save(); onMove(today) }} />}
          <Cell icon={ArrowRight} tone="sky" title="Move to tomorrow" chevron={false} onPress={() => { save(); onMove(addDays(today, 1)) }} />
        </Cells>
        <button type="button" className="h-12 rounded-[0.875rem] bg-danger-wash text-body font-semibold text-danger-text"
          onClick={async () => { if (await confirm({ title: 'Delete this line?', description: `“${e.text}”. This cannot be undone.`, confirmLabel: 'Delete', destructive: true })) onDelete() }}>
          Delete
        </button>
      </div>
    </Sheet>
  )
}
