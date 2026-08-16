import { CalendarPlus, CaretRight, Star } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useRef, useState } from 'react'
import { useJournal } from '../store'
import { Card, Empty, Input, Segmented } from '../components/ui'
import { PageLayout, StatBar } from '../components/page'
import { Button } from '../components/ui/button'
import { cat } from '../lib/colors'
import { addDays, prettyDay, todayISO, weekDaysOf, WEEKDAYS } from '../lib/date'
import { hrefFor } from '../lib/deepLink'
import { parseICS } from '../lib/ics'
import { entryThread, migrationCounts, overdueBuckets } from '../lib/bullets'
import type { BulletType, Entry } from '../lib/types'

/**
 * One-tap recurring rules. The Setup card used to open on an empty text box,
 * which asks people to invent a routine from nothing — these are the rules
 * almost every journal ends up with anyway. Weekdays are 0=Sun … 6=Sat, to
 * match `Recurrence`.
 */
const RULE_PRESETS: { text: string; type: BulletType; freq: 'daily' | 'weekly'; weekdays: number[] }[] = [
  { text: 'Take vitamins', type: 'task', freq: 'daily', weekdays: [] },
  { text: 'Journal', type: 'task', freq: 'daily', weekdays: [] },
  { text: 'Stretch 10 min', type: 'task', freq: 'daily', weekdays: [] },
  { text: 'Weekly review', type: 'task', freq: 'weekly', weekdays: [0] },
  { text: 'Meal prep', type: 'task', freq: 'weekly', weekdays: [0] },
  { text: 'Laundry', type: 'task', freq: 'weekly', weekdays: [6] },
  { text: 'Bin night', type: 'task', freq: 'weekly', weekdays: [2] },
  { text: 'Call family', type: 'task', freq: 'weekly', weekdays: [0] },
]

/** The bullet glyph for a type — the app's signature marks, in the mono face. */
const GLYPH: Record<BulletType, string> = { task: '·', event: '○', note: '–' }

/**
 * PLAN · WEEK — the seven days, then what is late.
 *
 * This page was a migration queue wearing the name "Week". It opened on twenty
 * overdue tasks, each in its own bordered card with three buttons, so the first
 * thing on a tab called Week was sixty controls and no week. The days it is
 * named after were nowhere on it.
 *
 * Zone 1  orient — three counts: this week, overdue, kept deferring.
 * Zone 2  act    — the rules that put things on the week automatically.
 * Zone 3  review — the seven days, then migration, then what keeps slipping.
 *
 * Migration is still here and still first among the review content, because
 * clearing it is the job people come to this page for. It is a list of rows
 * now rather than a wall of cards: same three decisions per task, a third of
 * the height, and the week is visible above it while you make them.
 */
export function Plan() {
  const { data, addRecurrence, updateRecurrence, removeRecurrence, migrateEntry, dropEntry, bulkAddEvents, toggleImportant } = useJournal()
  const today = todayISO()
  const fileRef = useRef<HTMLInputElement>(null)
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date')
  // Both default open now that the page is one column and fits. Showing 5 of 14
  // while the subtitle already said 14 meant the page stated the number twice
  // and showed a third of it; hiding the aging histogram hid the one thing that
  // answers the question the page is asking (a task 26 days overdue usually
  // wants dropping, not migrating).
  const [showAllOverdue, setShowAllOverdue] = useState(true)
  const [openThread, setOpenThread] = useState<string | null>(null)
  const [agingOpen, setAgingOpen] = useState(true)
  const [icsNote, setIcsNote] = useState<string | null>(null)

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

  const ruleExists = (t: string) =>
    data.recurrences.some((r) => r.text.trim().toLowerCase() === t.toLowerCase())

  // ── The week itself · seven days from the user's week start ──
  const weekDays = weekDaysOf(today, data.settings.weekStart)
  const onDay = (iso: string) => data.entries.filter((e) => e.date === iso)
  const weekOpen = weekDays.reduce(
    (n, d) => n + onDay(d).filter((e) => e.type === 'task' && e.status === 'open').length,
    0,
  )

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
      // Was `alert()`, which blocks the whole page — and a modal dialog stops
      // the extension driving this app dead, so it also could not be verified
      // in a browser pass. An inline line says the same thing.
      setIcsNote(`Imported ${added} event${added === 1 ? '' : 's'} from the calendar.`)
    }
    reader.readAsText(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <PageLayout
      tier={1180}
      // Zone 1 carries the fact bar AND the week, which is a deliberate
      // deviation from the contract's "one horizontal bar, ~64px". The rule
      // exists to stop an orientation bar growing into a stats card; this is a
      // different object — the seven days the page is named after, and the one
      // thing it did not have. It spans both columns because at 62% of the tier
      // its seven columns are ~94px each and every task title truncates to
      // "Back up p…", which is a week you cannot read.
      zone1={
        <>
          <StatBar
            facts={[
              { label: 'This week', value: `${weekOpen} open` },
              { label: 'Overdue', value: overdue.length },
              { label: 'Kept deferring', value: deferred.length },
            ]}
          />
          <WeekAgenda days={weekDays} today={today} entriesOn={onDay} />
        </>
      }
      zone2={
        <section className="space-y-5">
          <h2 className="text-heading font-medium text-fg-1">Put things on the week</h2>

          <Card title="Recurring tasks &amp; events" subtitle="Auto-added to each day they apply">
            <div className="flex flex-wrap items-center gap-2">
              {/* Named, not labelled: the row reads as one sentence ("Take vitamins
                  · task · daily") and three visible labels would break that. The
                  names were missing entirely until this section stopped being
                  collapsed — axe never scanned inside a closed fold. */}
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Take vitamins" aria-label="What to repeat" className="max-w-xs" />
              <select value={type} onChange={(e) => setType(e.target.value as BulletType)} aria-label="Bullet type" className="rounded-card border border-line-strong bg-ink-0 px-2 py-2 text-body text-fg-1">
                <option value="task">task</option>
                <option value="event">event</option>
                <option value="note">note</option>
              </select>
              <select value={freq} onChange={(e) => setFreq(e.target.value as 'daily' | 'weekly')} aria-label="How often" className="rounded-card border border-line-strong bg-ink-0 px-2 py-2 text-body text-fg-1">
                <option value="daily">daily</option>
                <option value="weekly">weekly</option>
              </select>
              <Button variant="secondary" onClick={addRule} className="press-3d">Add rule</Button>
            </div>
            {/* Added on tap, not loaded into the form — a suggestion you have to
                then press "Add rule" on is two steps for no gain. Already-added
                ones stay visible but disabled, so the list doesn't reshuffle. */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-label text-fg-2">Suggestions:</span>
              {RULE_PRESETS.map((p) => {
                const added = ruleExists(p.text)
                return (
                  <button
                    key={p.text}
                    disabled={added}
                    title={added ? 'Already a rule' : `Repeat ${p.freq === 'daily' ? 'every day' : `on ${p.weekdays.map((d) => WEEKDAYS[d]).join(' ')}`}`}
                    onClick={() => addRecurrence({ text: p.text, type: p.type, important: false, freq: p.freq, weekdays: p.weekdays, startedOn: today })}
                    className="rounded-pill border border-line-strong bg-ink-0 px-2.5 py-1 text-label text-fg-1 hover:border-mauve disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line-strong"
                  >
                    {p.text}
                    <span className="ml-1.5 text-fg-2">{p.freq === 'daily' ? 'daily' : p.weekdays.map((d) => WEEKDAYS[d]).join(' ')}</span>
                  </button>
                )
              })}
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
                        {GLYPH[r.type]} {r.text}
                        <span className="ml-2 text-fg-2">
                          {r.freq === 'daily' ? 'every day' : r.weekdays.map((d) => WEEKDAYS[d]).join(' ')}
                        </span>
                      </span>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
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

          <div>
            <h3 className="text-body font-medium text-fg-1">Import calendar (.ics)</h3>
            <p className="mt-0.5 text-label text-fg-2">Bring events from Google/Apple Calendar onto your monthly</p>
            <Button variant="secondary" onClick={() => fileRef.current?.click()} className="press-3d mt-2 inline-flex items-center gap-1.5 rounded-control"><Icon as={CalendarPlus} size="sm" /> Choose .ics file</Button>
            <input ref={fileRef} type="file" accept=".ics,text/calendar" onChange={onIcs} className="hidden" />
            <p className="mt-2 text-label text-fg-2" aria-live="polite">
              {icsNote ?? 'Events appear as dots on the Monthly calendar. Duplicates are skipped.'}
            </p>
          </div>
        </section>
      }
      zone3={
        <>
          <section>
            <div className="mb-2 flex items-baseline justify-between gap-3 border-b border-line pb-1">
              <h2 className="text-heading font-medium text-fg-1">
                Migration <span className="text-label text-fg-2">{overdue.length} waiting on a decision</span>
              </h2>
              {overdue.length > 1 && (
                <Segmented value={sortBy} onChange={setSortBy} options={[{ value: 'date', label: 'Date' }, { value: 'priority', label: 'Priority' }]} />
              )}
            </div>

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
              <>
                {/* The page exists to clear a backlog and could only ever clear it one
                    task at a time — fourteen overdue tasks meant fourteen decisions.
                    No confirm: this moves dates, destroys nothing, and undo covers it. */}
                {overdue.length > 1 && (
                  <div className="mb-2 flex items-center justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => overdue.forEach((e) => migrateEntry(e.id, today))}
                      className="press-3d rounded-control"
                    >
                      Move all {overdue.length} → Today
                    </Button>
                  </div>
                )}
                {/* Rows, not cards. Twenty bordered cards of three buttons each was
                    sixty controls and 1,100px before anything else on the page —
                    and a card is supposed to mean "an object with its own state",
                    which an overdue task is not; it is a line in a list awaiting a
                    decision. The three decisions are unchanged and all three stay
                    visible: hiding them behind hover would make the page's entire
                    purpose invisible on a touch screen. */}
                <ul className="divide-y divide-line">
                  {(showAllOverdue ? overdue : overdue.slice(0, 8)).map((e) => (
                    <li key={e.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 py-1.5 text-body">
                      <button
                        onClick={() => toggleImportant(e.id)}
                        aria-label={e.important ? `Unset priority on "${e.text}"` : `Mark "${e.text}" high priority`}
                        title={e.important ? 'High priority' : 'Mark high priority'}
                        className="grid size-6 shrink-0 place-items-center"
                        style={{ color: e.important ? cat('yellow') : cat('overlay0') }}
                      >
                        {/* Important is a state, so it reads as a weight change
                            (duotone) rather than a fill colour. */}
                        <Icon as={Star} size="sm" active={e.important} />
                      </button>
                      <span className="min-w-0 flex-1 text-fg-1" title={e.text}>{e.text}</span>
                      <span className="shrink-0 text-label text-fg-2">{prettyDay(e.date)}</span>
                      <span className="flex shrink-0 items-center gap-1">
                        <Button variant="secondary" size="sm" onClick={() => migrateEntry(e.id, today)} aria-label={`Move "${e.text}" to today`} className="press-3d rounded-control">→ Today</Button>
                        <Button variant="secondary" size="sm" onClick={() => migrateEntry(e.id, addDays(today, 1))} aria-label={`Move "${e.text}" to tomorrow`} className="press-3d rounded-control">→ Tomorrow</Button>
                        <Button variant="ghost" size="sm" onClick={() => dropEntry(e.id)} aria-label={`Drop "${e.text}"`} className="press-3d rounded-control text-red hover:text-red">drop</Button>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {overdue.length > 8 && (
              <Button variant="ghost" onClick={() => setShowAllOverdue((v) => !v)} className="mt-3 h-auto p-0 text-body text-mauve">
                {showAllOverdue ? 'Show less' : `Show all ${overdue.length}`}
              </Button>
            )}
          </section>

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
                        <span className="flex min-w-0 items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => migrateEntry(t.current.id, today)}
                            title="Bring to today"
                            className="shrink-0 text-fg-2 hover:text-mauve"
                            aria-label={`Bring "${t.text}" to today`}
                          >→</Button>
                          <span className="min-w-0 text-fg-1">{t.text}</span>
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
        </>
      }
    />
  )
}

/**
 * The seven days, which a tab called "Week" had never shown.
 *
 * A `<table>` rather than seven divs, because that is what it is: days are
 * columns, and a screen reader gets column headers naming the day instead of a
 * flat run of task text with no idea which day it belongs to. The header row
 * carries the accessible day name; the visible cell repeats it, since the
 * visual is a strip, not a spreadsheet.
 *
 * Each day is a real `<a href>` at the day's own deep link, so ⌘-click opens it
 * in a tab — the same rule the day chevrons already follow.
 */
function WeekAgenda({
  days,
  today,
  entriesOn,
}: {
  days: string[]
  today: string
  entriesOn: (iso: string) => Entry[]
}) {
  return (
    <section>
      <h2 className="mb-2 border-b border-line pb-1 text-heading font-medium text-fg-1">This week</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[38rem] table-fixed border-collapse">
          <caption className="sr-only">Open tasks, events and notes for each day of this week</caption>
          <thead>
            <tr>
              {days.map((d) => {
                const dt = new Date(d + 'T00:00')
                const isToday = d === today
                return (
                  <th key={d} scope="col" className="w-[14.28%] p-0 align-bottom">
                    <a
                      href={hrefFor('today', d)}
                      className={`block rounded-t-control px-1.5 py-1 text-left text-label font-medium hover:bg-ink-2 ${isToday ? 'text-fg-1' : 'text-fg-2'}`}
                      style={isToday ? { boxShadow: `inset 0 -2px 0 ${cat('mauve')}` } : undefined}
                      aria-current={isToday ? 'date' : undefined}
                    >
                      {WEEKDAYS[dt.getDay()]}{' '}
                      <span className="num text-fg-2">{dt.getDate()}</span>
                    </a>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              {days.map((d) => {
                const items = entriesOn(d)
                const open = items.filter((e) => e.type === 'task' && e.status === 'open')
                const shown = items.slice(0, 4)
                return (
                  <td key={d} className={`h-28 align-top border-t border-line p-1.5 ${d === today ? 'bg-ink-2/40' : ''}`}>
                    {items.length === 0 ? (
                      // The empty frame is the cell itself. A day with nothing on
                      // it is a fact about the week, not a gap to be hidden.
                      <span className="text-label text-fg-2">—</span>
                    ) : (
                      <ul className="space-y-0.5">
                        {shown.map((e) => (
                          // Two lines, not one with an ellipsis. `truncate` cut
                          // every title to about eighteen characters at this
                          // column width — "Get camp new fo…", "Find something
                          // r…", "#travel walk the …" — so the week you came
                          // here to read was a column of prefixes. The card
                          // header two files over already states the rule this
                          // follows: wraps, never truncates, because a second
                          // line costs less than a clipped word. `line-clamp-2`
                          // keeps the cell bounded, and the fourth item plus the
                          // "+n more" row still cap the cell's height.
                          <li
                            key={e.id}
                            className={`line-clamp-2 text-label ${e.status === 'done' ? 'text-fg-2 line-through' : 'text-fg-1'}`}
                            title={e.text}
                          >
                            <span className="num text-fg-2">{GLYPH[e.type]}</span> {e.text}
                          </li>
                        ))}
                        {items.length > shown.length && (
                          <li className="text-label text-fg-2">+{items.length - shown.length} more</li>
                        )}
                      </ul>
                    )}
                    {open.length > 0 && (
                      <p className="mt-1 text-micro text-fg-2">{open.length} open</p>
                    )}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
