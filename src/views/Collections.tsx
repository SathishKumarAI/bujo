import { useState } from 'react'
import { useJournal } from '../store'
import { Cake } from 'lucide-react'
import { Button, Card, Empty, Input } from '../components/ui'
import { EntryRow } from '../components/EntryRow'
import { FriendsCard } from '../components/FriendsCard'
import { MONTHS, todayISO } from '../lib/date'
import { cat } from '../lib/colors'
import { collectionBreakdown, collectionProgress, inboxEntries, memoryBullets, tagIndex } from '../lib/bullets'

export function Collections() {
  const { data, addBirthday, removeBirthday, addCollection, removeCollection, addEntry } = useJournal()
  const [name, setName] = useState('')
  const [month, setMonth] = useState(1)
  const [day, setDay] = useState(1)
  // Custom collections.
  const [colName, setColName] = useState('')
  const [colIcon, setColIcon] = useState('📚')
  const [openCol, setOpenCol] = useState<string | null>(null)
  const [colEntry, setColEntry] = useState('')
  // Tag pages (auto-collections): one filtered page per #tag.
  const [openTag, setOpenTag] = useState<string | null>(null)

  // Auto-collections: every #tag across the journal, most-used first.
  const tags = tagIndex(data.entries)
  const openTagEntries = openTag ? (tags.find((t) => t.tag === openTag)?.entries ?? []) : []

  // Brain-dump inbox: dateless, unfiled entries waiting to be triaged.
  const inbox = inboxEntries(data.entries)

  // ── Index / table of contents (#402): every collection + tag page in one list,
  // with a per-collection task-completion badge (#366-style breakdown).
  const collectionIndex = collectionBreakdown(data.entries, data.collections)

  // ── Memories (▲): quick-memory bullets surfaced as their own auto-page. ──
  const memories = memoryBullets(data.entries)

  function jumpToCollection(id: string) {
    setOpenCol(id)
    document.getElementById('bujo-collections')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  function jumpToTag(tag: string) {
    setOpenTag(tag)
    document.getElementById('bujo-tags')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Future log = events/tasks dated after today.
  const today = todayISO()
  const future = data.entries
    .filter((e) => e.date > today)
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  // One unified birthday list: manually-added birthdays + friends who have one.
  const friendBirthdays = (data.friends ?? [])
    .filter((f) => f.birthday)
    .map((f) => {
      const md = f.birthday!.length === 5 ? f.birthday! : f.birthday!.slice(5)
      const [m, d] = md.split('-').map(Number)
      return { id: `friend:${f.id}`, name: f.name, month: m, day: d, fromFriend: true }
    })
    .filter((b) => b.month >= 1 && b.month <= 12 && b.day >= 1 && b.day <= 31)
  const birthdays = [...data.birthdays.map((b) => ({ ...b, fromFriend: false })), ...friendBirthdays]
    .filter((b) => b.month >= 1 && b.month <= 12 && b.day >= 1 && b.day <= 31)
    .sort((a, b) => a.month - b.month || a.day - b.day)

  return (
    <div className="mx-auto grid max-w-[1400px] items-start gap-5 lg:grid-cols-2">
      {(collectionIndex.length > 0 || tags.length > 0) && (
        <Card
          title="Index"
          subtitle="The journal's table of contents · jump to any page"
          className="md:col-span-2"
          help="A classic bullet-journal Index: every custom collection and every #tag page in one place, with how many entries each holds. Tap a row to open it below."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 text-xs tracking-wide text-overlay0 uppercase">Collections</div>
              {collectionIndex.length === 0 ? (
                <Empty>No collections yet.</Empty>
              ) : (
                <ul className="space-y-0.5 text-sm">
                  {collectionIndex.map((c) => (
                    <li key={c.id}>
                      <button onClick={() => jumpToCollection(c.id)} className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-surface0">
                        <span>{c.icon}</span>
                        <span className="flex-1 truncate text-subtext1">{c.name}</span>
                        {c.tasks > 0 && (
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                            style={{ background: cat('green') + '22', color: cat('green') }}
                            title={`${c.done} of ${c.tasks} tasks done`}
                          >
                            {c.done}/{c.tasks}
                          </span>
                        )}
                        <span className="w-5 text-right text-overlay0">{c.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div className="mb-1.5 text-xs tracking-wide text-overlay0 uppercase">Tag pages</div>
              {tags.length === 0 ? (
                <Empty>No tags yet.</Empty>
              ) : (
                <ul className="space-y-0.5 text-sm">
                  {tags.slice(0, 20).map(({ tag, entries }) => (
                    <li key={tag}>
                      <button onClick={() => jumpToTag(tag)} className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-surface0">
                        <span className="flex-1 truncate" style={{ color: cat('sapphire') }}>#{tag}</span>
                        <span className="text-overlay0">{entries.length}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card
        title="Brain-dump inbox"
        subtitle={`${inbox.length} dateless item${inbox.length === 1 ? '' : 's'} to triage`}
        className="md:col-span-2"
        help="Rapid-captured entries with no day and no collection land here. Triage them: give one a day (edit it on Today) or check it off when it's handled."
      >
        {inbox.length === 0 ? (
          <Empty>Inbox zero. Nothing dateless waiting to be sorted. ✨</Empty>
        ) : (
          <ul>
            {inbox.map((e) => (
              <EntryRow key={e.id} entry={e} />
            ))}
          </ul>
        )}
      </Card>

      <Card title="Future log" subtitle="Tasks & events dated ahead of today">
        {future.length === 0 ? (
          <Empty>Nothing scheduled. Add a future-dated entry from any day.</Empty>
        ) : (
          <ul className="space-y-1 text-sm">
            {future.map((e) => (
              <li key={e.id} className="flex gap-2">
                <span className="w-24 shrink-0 text-overlay0">{e.date}</span>
                <span className="text-subtext1">
                  {e.type === 'event' ? '○' : '·'} {e.text}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <FriendsCard />

      <Card title="Birthdays" subtitle="Never miss one">
        <div className="mb-3 flex flex-wrap gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="max-w-[40%]" />
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-lg border border-surface1 bg-base px-2 text-sm text-text">
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m.slice(0, 3)}</option>)}
          </select>
          <input type="number" min={1} max={31} value={day} onChange={(e) => setDay(Number(e.target.value))} className="w-16 rounded-lg border border-surface1 bg-base px-2 text-sm text-text" aria-label="Day" />
          <Button variant="primary" onClick={() => { if (name.trim()) { addBirthday({ name: name.trim(), month, day }); setName('') } }}>Add</Button>
        </div>
        {birthdays.length === 0 ? (
          <Empty>No birthdays yet.</Empty>
        ) : (
          <ul className="space-y-1 text-sm">
            {birthdays.map((b) => (
              <li key={b.id} className="group flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-subtext1">
                  <Cake size={14} style={{ color: cat('pink') }} /> {b.name}
                  <span className="ml-1 text-overlay0">{MONTHS[b.month - 1].slice(0, 3)} {b.day}</span>
                  {b.fromFriend && <span className="text-[10px] text-overlay0">· friend</span>}
                </span>
                {!b.fromFriend && <button onClick={() => removeBirthday(b.id)} aria-label={`Remove ${b.name}`} className="text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red">×</button>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <span id="bujo-collections" className="-mt-5 block scroll-mt-20 md:col-span-2" aria-hidden />
      <Card
        title="Custom collections"
        subtitle="Free-form pages · book lists, packing, projects…"
        className="md:col-span-2"
      >
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            value={colIcon}
            onChange={(e) => setColIcon(e.target.value.slice(0, 2))}
            aria-label="Collection icon"
            className="w-12 rounded-lg border border-surface1 bg-base px-2 text-center text-lg text-text"
          />
          <Input value={colName} onChange={(e) => setColName(e.target.value)} placeholder="Collection name" className="max-w-xs" />
          <Button variant="primary" onClick={() => { if (colName.trim()) { addCollection(colName.trim(), colIcon || '📄'); setColName('') } }}>
            New collection
          </Button>
        </div>

        {data.collections.length === 0 ? (
          <Empty>No collections yet. Create one above.</Empty>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.collections.map((c) => (
              <span
                key={c.id}
                className="group inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm"
                style={{ borderColor: openCol === c.id ? cat('mauve') : cat('surface1') }}
              >
                <button onClick={() => setOpenCol(openCol === c.id ? null : c.id)} className="inline-flex items-center gap-2" style={{ color: cat('subtext1') }}>
                  <span>{c.icon}</span> {c.name}
                </button>
                <button
                  onClick={() => { removeCollection(c.id); if (openCol === c.id) setOpenCol(null) }}
                  aria-label={`Delete ${c.name}`}
                  className="text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red"
                >×</button>
              </span>
            ))}
          </div>
        )}

        {openCol && (
          <div className="mt-4 border-t border-surface0 pt-3">
            <form
              className="mb-2 flex gap-2"
              onSubmit={(e) => { e.preventDefault(); if (colEntry.trim()) { addEntry(todayISO(), colEntry, openCol); setColEntry('') } }}
            >
              <Input value={colEntry} onChange={(e) => setColEntry(e.target.value)} placeholder="Add to this collection… (t/e/n)" />
              <Button type="submit" variant="primary">Add</Button>
            </form>
            {(() => {
              const p = collectionProgress(data.entries, openCol)
              if (p.total === 0) return null
              const pct = Math.round(p.rate * 100)
              return (
                <div className="mb-3" title={`${p.done} of ${p.total} tasks done`}>
                  <div className="mb-1 flex items-baseline justify-between text-xs text-overlay0">
                    <span>Checklist</span>
                    <span><b style={{ color: cat('green') }}>{p.done}/{p.total}</b> · {pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface0">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cat('green') }} />
                  </div>
                </div>
              )
            })()}
            <ul>
              {data.entries.filter((e) => e.collection === openCol).map((e) => (
                <EntryRow key={e.id} entry={e} />
              ))}
            </ul>
            {data.entries.filter((e) => e.collection === openCol).length === 0 && (
              <Empty>Empty · add your first item above.</Empty>
            )}
          </div>
        )}
      </Card>

      <span id="bujo-tags" className="-mt-5 block scroll-mt-20 md:col-span-2" aria-hidden />
      <Card
        title="Tags"
        subtitle="Auto-collections · every #tag, tap to open its page"
        className="md:col-span-2"
        help="Tag pages are built automatically from the #tags in your entries — no setup. Tap a tag to see every entry that mentions it, across days and collections."
      >
        {tags.length === 0 ? (
          <Empty>No tags yet. Add a #tag to any entry and it shows up here.</Empty>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map(({ tag, entries }) => (
              <button
                key={tag}
                onClick={() => setOpenTag(openTag === tag ? null : tag)}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm"
                style={{
                  borderColor: openTag === tag ? cat('sapphire') : cat('surface1'),
                  color: cat('sapphire'),
                }}
              >
                #{tag}
                <span className="text-xs text-overlay0">{entries.length}</span>
              </button>
            ))}
          </div>
        )}

        {openTag && (
          <div className="mt-4 border-t border-surface0 pt-3">
            <div className="mb-1 text-sm text-subtext1">
              <span style={{ color: cat('sapphire') }}>#{openTag}</span>
              <span className="ml-2 text-overlay0">{openTagEntries.length} entr{openTagEntries.length === 1 ? 'y' : 'ies'}</span>
            </div>
            {openTagEntries.length === 0 ? (
              <Empty>No entries with this tag.</Empty>
            ) : (
              <ul>
                {openTagEntries
                  .slice()
                  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
                  .map((e) => (
                    <EntryRow key={e.id} entry={e} />
                  ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      <Card
        title="Memories"
        subtitle={`${memories.length} ▲ moment${memories.length === 1 ? '' : 's'} worth remembering`}
        className="md:col-span-2"
        help="Any bullet you mark as a memory (the ▲ signifier, or the '^' prefix in quick capture) is gathered here automatically — a running highlight reel of small moments, newest first."
      >
        {memories.length === 0 ? (
          <Empty>No memories yet. Mark a bullet with ▲ (or capture with '^ …') to start your highlight reel.</Empty>
        ) : (
          <ul>
            {memories.map((e) => (
              <EntryRow key={e.id} entry={e} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
