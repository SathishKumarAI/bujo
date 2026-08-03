import { CalendarPlus, CaretRight, Star } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useRef, useState } from 'react'
import { useJournal } from '../store'
import { Card, Empty, Input, Segmented } from '../components/ui'
import { Button } from '../components/ui/button'
import { cat } from '../lib/colors'
import { addDays, prettyDay, todayISO, WEEKDAYS } from '../lib/date'
import { parseICS } from '../lib/ics'
import { entryThread, migrationCounts, overdueBuckets } from '../lib/bullets'
import type { BulletType } from '../lib/types'
import { QuietSection } from '../components/CollapsibleSection'

export function Plan() {
  const { data, addRecurrence, updateRecurrence, removeRecurrence, migrateEntry, dropEntry, bulkAddEvents, toggleImportant } = useJournal()
  const today = todayISO()
  const fileRef = useRef<HTMLInputElement>(null)
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date')
  const [showAllOverdue, setShowAllOverdue] = useState(false)
  const [openThread, setOpenThread] = useState<string | null>(null)
  const [agingOpen, setAgingOpen] = useState(false)

  // ── Recurring rule form ──
  const [text, setText] = useState('')
  const [type, setType] = useState<BulletType>('task')
  const [freq, setFreq] = useState<'daily' | 'weekly'>('daily')
  const [weekdays, setWeekdays] = useState<number[]>([1, 3, 5])

  function addRule() {
    if (!text.trim()) return
    addRecurrence({ text: text.trim(), type, important: false, freq, weekdays, startedOn: today })
    setText('')
  }

  // ── Migration: open tasks dated before today ──
  const overdue = data.entries
    .filter((e) => e.type === 'task' && e.status === 'open' && e.date && e.date < today)
    .sort((a, b) =>
      sortBy === 'priority'
        ? Number(b.important) - Number(a.important) || (a.date < b.date ? -1 : 1)
        : (a.date < b.date ? -1 : 1),
    )

  // ── Migration analytics (#406): chronically-deferred tasks ──
  const deferred = migrationCounts(data.entries).filter((t) => t.current.status !== 'done')

  // ── Overdue aging: bucket overdue open tasks by staleness ──
  const aging = overdueBuckets(data.entries, today)
  const agingBuckets = [
    { key: 'recent', label: '1–2d', n: aging.recent, color: 'yellow' as const },
    { key: 'week', label: '3–7d', n: aging.week, color: 'peach' as const },
    { key: 'stale', label: '1–4wk', n: aging.stale, color: 'maroon' as const },
    { key: 'ancient', label: '30d+', n: aging.ancient, color: 'red' as const },
  ].filter((b) => b.n > 0)

  // ── ICS import ──
  function onIcs(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const events = parseICS(String(reader.result))
      const added = bulkAddEvents(events)
      alert(`Imported ${added} event${added === 1 ? '' : 's'} from the calendar.`)
    }
    reader.readAsText(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  // `wide`, not `read`: this view is a CSS multi-column masonry. At 820px the
  // two columns collapse to ~380px each, which wraps every migration card's
  // title and stacks its actions vertically — a short measure helps prose, not
  // a column layout.
  return (
    <div className="mx-auto max-w-wide columns-1 gap-5 lg:columns-2 [&>*]:mb-5 [&>*]:break-inside-avoid">
      <Card
        title="Migration"
        subtitle={`${overdue.length} overdue open task${overdue.length === 1 ? '' : 's'}, the heart of bullet journaling`}
        right={overdue.length > 1 ? (
          <Segmented value={sortBy} onChange={setSortBy} options={[{ value: 'date', label: 'Date' }, { value: 'priority', label: 'Priority' }]} />
        ) : undefined}
      >
        {agingBuckets.length > 0 && (
          <div className="mb-3">
            <button
              type="button"
              onClick={() => setAgingOpen((o) => !o)}
              aria-expanded={agingOpen}
              className="flex w-full items-center gap-1.5 text-label text-fg-2 hover:text-fg-1"
              title={`Oldest overdue task: ${aging.oldestDays} days`}
            >
              <span className="caret-turn caret-turn-quarter inline-flex" data-open={agingOpen}><Icon as={CaretRight} size="sm" /></span>
              <span>Aging</span>
              <span className="ml-auto">oldest <b style={{ color: cat(aging.oldestDays > 30 ? 'red' : aging.oldestDays > 7 ? 'peach' : 'yellow') }}>{aging.oldestDays}d</b></span>
            </button>
            {agingOpen && (
              <div className="collapse-in">
                <div className="mt-1.5 flex h-2 overflow-hidden rounded-pill bg-ink-2">
                  {agingBuckets.map((b) => (
                    <div key={b.key} title={`${b.label}: ${b.n} task${b.n === 1 ? '' : 's'}`} style={{ flex: b.n, background: cat(b.color) }} />
                  ))}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-caption text-fg-2">
                  {agingBuckets.map((b) => (
                    <span key={b.key} className="inline-flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-pill" style={{ background: cat(b.color) }} />
                      {b.label} <b style={{ color: cat(b.color) }}>{b.n}</b>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {overdue.length === 0 ? (
          <Empty>Nothing overdue. You're on top of it. 🎉</Empty>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {(showAllOverdue ? overdue : overdue.slice(0, 5)).map((e) => (
              <li key={e.id} className="flex flex-col gap-1.5 rounded-card border border-line bg-ink-0 p-2 text-body" style={e.important ? { borderColor: cat('yellow') + '66' } : undefined}>
                <div className="flex items-start gap-1.5">
                  <button
                    onClick={() => toggleImportant(e.id)}
                    aria-label={e.important ? 'Unset priority' : 'Mark high priority'}
                    title={e.important ? 'High priority' : 'Mark high priority'}
                    className="mt-0.5 shrink-0"
                    style={{ color: e.important ? cat('yellow') : cat('overlay0') }}
                  >
                    {/* Important is a state, so it reads as a weight change
                        (duotone) rather than a fill colour. */}
                    <Icon as={Star} size="sm" active={e.important} />
                  </button>
                  <span className="flex-1 text-fg-1">{e.text}</span>
                  <span className="shrink-0 text-label text-fg-2">{prettyDay(e.date)}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button variant="secondary" onClick={() => migrateEntry(e.id, today)} title="Move to today" className="press-3d rounded-control">→ Today</Button>
                  <Button variant="secondary" onClick={() => migrateEntry(e.id, addDays(today, 1))} title="Move to tomorrow" className="press-3d rounded-control">→ Tomorrow</Button>
                  <Button variant="ghost" onClick={() => dropEntry(e.id)} title="Drop it" className="press-3d rounded-control text-red hover:text-red">drop</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {overdue.length > 5 && (
          <Button variant="ghost" onClick={() => setShowAllOverdue((v) => !v)} className="mt-3 h-auto p-0 text-body text-mauve">
            {showAllOverdue ? 'Show less' : `Show all ${overdue.length}`}
          </Button>
        )}
      </Card>

      {deferred.length > 0 && (
        <Card
          title="Chronically deferred"
          subtitle="Tasks you keep migrating — decide: do it or drop it"
          help="Every time you migrate a task forward it counts a hop here. A task pushed several times is a signal: it may be too big, badly timed, or not actually yours to do. Tackle it or let it go."
        >
          <ul className="space-y-1.5 text-body">
            {deferred.slice(0, 8).map((t) => {
              const open = openThread === t.rootId
              const thread = open ? entryThread(data.entries, t.current.id) : []
              return (
                <li key={t.rootId} className="rounded-card border border-line bg-ink-0 px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 truncate">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => migrateEntry(t.current.id, today)}
                        title="Bring to today"
                        className="shrink-0 text-fg-2 hover:text-mauve"
                        aria-label={`Bring "${t.text}" to today`}
                      >→</Button>
                      <span className="truncate text-fg-1">{t.text}</span>
                    </span>
                    <button
                      onClick={() => setOpenThread(open ? null : t.rootId)}
                      className="shrink-0 rounded-pill px-2 py-0.5 text-label font-medium"
                      style={{ background: cat(t.count >= 4 ? 'red' : t.count >= 2 ? 'peach' : 'yellow') + '33', color: cat(t.count >= 4 ? 'red' : t.count >= 2 ? 'peach' : 'yellow') }}
                      title={`Migrated ${t.count} time${t.count === 1 ? '' : 's'}, tap for history`}
                      aria-expanded={open}
                      aria-label={`Migration history for "${t.text}"`}
                    >
                      migrated {t.count}×
                    </button>
                  </div>
                  {open && thread.length > 0 && (
                    <ol className="mt-2 space-y-0.5 border-t border-line pt-2 text-label text-fg-2">
                      {thread.map((h, i) => (
                        <li key={h.id} className="flex items-center gap-2">
                          <span className="w-4 shrink-0 text-right">{i + 1}.</span>
                          <span className="w-24 shrink-0">{h.date ? prettyDay(h.date) : 'no date'}</span>
                          <span style={{ color: cat(h.status === 'done' ? 'green' : h.status === 'migrated' ? 'peach' : 'subtext0') }}>
                            {h.status}
                          </span>
                          {i === thread.length - 1 && <span className="text-fg-2">· now</span>}
                        </li>
                      ))}
                    </ol>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <QuietSection title="Setup" subtitle={<>recurring rules &amp; calendar import</>}>
          <div className="space-y-5">
      <Card title="Recurring tasks & events" subtitle="Auto-added to each day they apply">
        <div className="flex flex-wrap items-center gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Take vitamins" className="max-w-xs" />
          <select value={type} onChange={(e) => setType(e.target.value as BulletType)} className="rounded-card border border-line-strong bg-ink-0 px-2 py-2 text-body text-fg-1">
            <option value="task">task</option>
            <option value="event">event</option>
            <option value="note">note</option>
          </select>
          <select value={freq} onChange={(e) => setFreq(e.target.value as 'daily' | 'weekly')} className="rounded-card border border-line-strong bg-ink-0 px-2 py-2 text-body text-fg-1">
            <option value="daily">daily</option>
            <option value="weekly">weekly</option>
          </select>
          <Button variant="secondary" onClick={addRule} className="press-3d">Add rule</Button>
        </div>
        {freq === 'weekly' && (
          <div className="mt-2 flex gap-1">
            {WEEKDAYS.map((w, i) => (
              <button
                key={w}
                onClick={() => setWeekdays((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]))}
                className="rounded px-2 py-1 text-label"
                style={{ background: weekdays.includes(i) ? cat('mauve') : cat('surface0'), color: weekdays.includes(i) ? cat('crust') : cat('subtext0') }}
              >
                {w}
              </button>
            ))}
          </div>
        )}
        <div className="mt-3 border-t border-line pt-3">
          {data.recurrences.length === 0 ? (
            <Empty>Add a rule above to repeat something without retyping it.</Empty>
          ) : (
            <ul className="space-y-1 text-body">
              {data.recurrences.map((r) => (
                <li key={r.id} className="group flex items-center justify-between">
                  <span className="text-fg-1">
                    {r.type === 'event' ? '○' : r.type === 'note' ? '–' : '·'} {r.text}
                    <span className="ml-2 text-fg-2">
                      {r.freq === 'daily' ? 'every day' : r.weekdays.map((d) => WEEKDAYS[d]).join(' ')}
                    </span>
                  </span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => { const t = prompt('Edit recurring task (updates every future occurrence):', r.text); if (t && t.trim()) updateRecurrence(r.id, { text: t.trim() }) }}
                      aria-label="Edit rule"
                      className="text-fg-2 hover:text-mauve"
                    >✎</Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => removeRecurrence(r.id)} aria-label="Remove rule" className="text-fg-2 hover:text-red">×</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card title="Import calendar (.ics)" subtitle="Bring events from Google/Apple Calendar onto your monthly">
        <Button variant="secondary" onClick={() => fileRef.current?.click()} className="press-3d inline-flex items-center gap-1.5 rounded-control"><Icon as={CalendarPlus} size="sm" /> Choose .ics file</Button>
        <input ref={fileRef} type="file" accept=".ics,text/calendar" onChange={onIcs} className="hidden" />
        <p className="mt-2 text-label text-fg-2">Events appear as dots on the Monthly calendar. Duplicates are skipped.</p>
      </Card>
          </div>
      </QuietSection>
    </div>
  )
}
