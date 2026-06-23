import type { BulletType, Collection, Entry, EntryStatus } from './types'
import { addDays, dayDiff, ymOf, MONTHS, WEEKDAYS } from './date'

// ── Rapid-logging signifiers (Ryder Carroll method + Elsa's additions) ───────

/** The leading glyph shown for an entry, derived from type + status. */
export function glyphFor(type: BulletType, status: EntryStatus): string {
  if (type === 'event') return '○'
  if (type === 'note') return '–'
  // task
  switch (status) {
    case 'done':
      return '✕'
    case 'migrated':
      return '>'
    case 'scheduled':
      return '<'
    case 'dropped':
      return '·'
    default:
      return '·'
  }
}

export const BULLET_LEGEND: { glyph: string; label: string }[] = [
  { glyph: '·', label: 'Task' },
  { glyph: '✕', label: 'Task complete' },
  { glyph: '>', label: 'Task migrated (next month)' },
  { glyph: '<', label: 'Task scheduled (future log)' },
  { glyph: '○', label: 'Event' },
  { glyph: '–', label: 'Note' },
  { glyph: '▲', label: 'Memory' },
  { glyph: '!', label: 'Important' },
  { glyph: '~', label: 'Dropped (struck through)' },
]

/** Cycle a task through its lifecycle on click: open → done → migrated → open. */
export function nextStatus(status: EntryStatus): EntryStatus {
  const cycle: EntryStatus[] = ['open', 'done', 'migrated', 'dropped']
  const i = cycle.indexOf(status)
  return cycle[(i + 1) % cycle.length]
}

/** Extract #tags from free text. */
export function parseTags(text: string): string[] {
  const matches = text.match(/#[\w-]+/g) ?? []
  return [...new Set(matches.map((t) => t.slice(1).toLowerCase()))]
}

/**
 * Build a tag → entries index across the journal (auto-collections / tag pages).
 * Tags come from each entry's parsed `tags`, falling back to re-parsing the text
 * for older entries that predate tag storage. Collection-only entries (empty
 * date) are still included — a #tag is a #tag wherever it lives.
 * Returns tags sorted by frequency (desc), then alphabetically.
 */
export function tagIndex(entries: Entry[]): { tag: string; entries: Entry[] }[] {
  const map = new Map<string, Entry[]>()
  for (const e of entries) {
    const tags = e.tags.length ? e.tags : parseTags(e.text)
    for (const t of new Set(tags)) {
      const list = map.get(t)
      if (list) list.push(e)
      else map.set(t, [e])
    }
  }
  return [...map.entries()]
    .map(([tag, es]) => ({ tag, entries: es }))
    .sort((a, b) => b.entries.length - a.entries.length || (a.tag < b.tag ? -1 : 1))
}

/**
 * Entries waiting in the brain-dump inbox: dateless (rapid-captured but not yet
 * scheduled) and not filed into a collection, excluding anything already done or
 * dropped. These are the items to triage — give them a day or a home.
 */
export function inboxEntries(entries: Entry[]): Entry[] {
  return entries
    .filter((e) => !e.date && !e.collection && e.status !== 'done' && e.status !== 'dropped')
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

/**
 * Migration analytics (#406): how often each task was migrated. A migrated task
 * leaves a `migrated`-status copy behind on every hop, threaded via `originId`
 * (which always points at the original entry's id). We group by thread root and
 * count the migrated hops; the surviving live entry is the latest non-migrated
 * member (or, if all hops are migrated, the most recent one). Returns threads
 * with ≥1 migration, most-deferred first, so chronically-pushed tasks surface.
 */
export function migrationCounts(
  entries: Entry[],
): { rootId: string; text: string; count: number; current: Entry }[] {
  // Group every entry by the root of its migration thread.
  const threads = new Map<string, Entry[]>()
  for (const e of entries) {
    if (e.type !== 'task') continue
    const root = e.originId ?? e.id
    const list = threads.get(root)
    if (list) list.push(e)
    else threads.set(root, [e])
  }
  const out: { rootId: string; text: string; count: number; current: Entry }[] = []
  for (const [rootId, list] of threads) {
    const count = list.filter((e) => e.status === 'migrated').length
    if (count < 1) continue
    // The "current" item: prefer a still-live (non-migrated) copy, else newest.
    const sorted = [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    const current = sorted.find((e) => e.status !== 'migrated') ?? sorted[0]
    out.push({ rootId, text: current.text, count, current })
  }
  return out.sort((a, b) => b.count - a.count || (a.text < b.text ? -1 : 1))
}

/**
 * Bullet-type breakdown over a set of entries: how many tasks / events / notes.
 * Dropped entries are excluded (they're noise). Pure; used for a glanceable
 * "what is this month made of" mix.
 */
export function bulletTypeBreakdown(
  entries: Entry[],
): { task: number; event: number; note: number; total: number } {
  let task = 0
  let event = 0
  let note = 0
  for (const e of entries) {
    if (e.status === 'dropped') continue
    if (e.type === 'task') task++
    else if (e.type === 'event') event++
    else note++
  }
  return { task, event, note, total: task + event + note }
}

/**
 * Completed-vs-open task ratio over a set of entries. Dropped tasks are excluded
 * from the denominator (they were intentionally abandoned, not left undone).
 * `rate` is 0–1 (done / considered); 0 when there are no live tasks.
 */
export function taskCompletion(
  entries: Entry[],
): { done: number; open: number; total: number; rate: number } {
  const tasks = entries.filter((e) => e.type === 'task' && e.status !== 'dropped')
  const done = tasks.filter((e) => e.status === 'done').length
  const open = tasks.length - done
  return { done, open, total: tasks.length, rate: tasks.length ? done / tasks.length : 0 }
}

/**
 * Entries-per-day counts across a contiguous ISO-day range [from..to] inclusive.
 * Every day in the window appears (zero-filled) so a sparkline has no gaps.
 * Collection-only (dateless) entries are skipped — they have no day. Dropped
 * entries still count: they happened. Returns days in ascending date order.
 */
export function entriesPerDay(
  entries: Entry[],
  from: string,
  to: string,
): { date: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const e of entries) {
    if (!e.date || e.date < from || e.date > to) continue
    counts.set(e.date, (counts.get(e.date) ?? 0) + 1)
  }
  const out: { date: string; count: number }[] = []
  let d = from
  // Walk the inclusive range a day at a time (string ISO days compare correctly).
  while (d <= to) {
    out.push({ date: d, count: counts.get(d) ?? 0 })
    d = addDays(d, 1)
  }
  return out
}

/**
 * Logging rhythm by weekday: how many dated entries fall on each day of the
 * week (Sun..Sat), so a user can see whether they journal more on weekends than
 * weekdays. Dropped entries still count (they happened); dateless entries are
 * skipped. Returns exactly 7 buckets in calendar order (index 0 = Sunday).
 */
export function weekdayActivity(
  entries: Entry[],
): { weekday: number; label: string; count: number }[] {
  const counts = [0, 0, 0, 0, 0, 0, 0]
  for (const e of entries) {
    if (!e.date) continue
    // ISO day at local midnight; getDay() → 0..6 (Sun..Sat).
    const dow = new Date(e.date + 'T00:00').getDay()
    counts[dow]++
  }
  return counts.map((count, weekday) => ({ weekday, label: WEEKDAYS[weekday], count }))
}

/**
 * Longest run of consecutive days on which at least one dated entry was logged,
 * plus the current (still-running, counting back from `today`) streak. A day
 * "counts" if any entry — of any type or status — lives on it. Dropped entries
 * still count: showing up to the journal is the point. Pure; `today` lets the
 * caller decide the reference day (and keeps tests deterministic).
 */
export function journalingStreak(
  entries: Entry[],
  today: string,
): { longest: number; current: number } {
  const days = [...new Set(entries.filter((e) => e.date).map((e) => e.date))].sort()
  if (days.length === 0) return { longest: 0, current: 0 }

  let longest = 1
  let run = 1
  for (let i = 1; i < days.length; i++) {
    if (dayDiff(days[i - 1], days[i]) === 1) run++
    else run = 1
    if (run > longest) longest = run
  }

  // Current streak: walk backward from `today` (or yesterday) while days exist.
  const have = new Set(days)
  let current = 0
  // The streak is only "current" if it includes today or yesterday — otherwise
  // it's already broken. Anchor on whichever of those two is present.
  let cursor = have.has(today) ? today : dayDiff(addDays(today, -1), today) === 1 && have.has(addDays(today, -1)) ? addDays(today, -1) : null
  while (cursor && have.has(cursor)) {
    current++
    cursor = addDays(cursor, -1)
  }
  return { longest, current }
}

/**
 * Progress of task-type entries filed into a collection (collection-item
 * checkboxes / progress bar, #258). Counts done vs total live tasks (dropped
 * excluded) for the given collection id. `rate` is 0–1; 0 when the collection
 * holds no live tasks. Non-task entries (notes/events) are ignored — only
 * checkable items contribute to the bar.
 */
export function collectionProgress(
  entries: Entry[],
  collection: string,
): { done: number; total: number; rate: number } {
  const tasks = entries.filter(
    (e) => e.collection === collection && e.type === 'task' && e.status !== 'dropped',
  )
  const done = tasks.filter((e) => e.status === 'done').length
  return { done, total: tasks.length, rate: tasks.length ? done / tasks.length : 0 }
}

/**
 * Bucket overdue open tasks by staleness relative to `today`, so the Migration
 * view can show *how* late things are, not just that they're late. Only open
 * tasks with a date strictly before today are considered. Buckets:
 *   recent  — 1–2 days overdue
 *   week    — 3–7 days
 *   stale   — 8–30 days
 *   ancient — 30+ days (the "do it or drop it" pile)
 * Returns counts plus the oldest entry's age in days (0 if none).
 */
export function overdueBuckets(
  entries: Entry[],
  today: string,
): { recent: number; week: number; stale: number; ancient: number; total: number; oldestDays: number } {
  let recent = 0
  let week = 0
  let stale = 0
  let ancient = 0
  let oldestDays = 0
  for (const e of entries) {
    if (e.type !== 'task' || e.status !== 'open' || !e.date || e.date >= today) continue
    const age = dayDiff(e.date, today)
    if (age <= 2) recent++
    else if (age <= 7) week++
    else if (age <= 30) stale++
    else ancient++
    if (age > oldestDays) oldestDays = age
  }
  return { recent, week, stale, ancient, total: recent + week + stale + ancient, oldestDays }
}

/**
 * Migration history thread (#268): the full chain a task moved through, oldest
 * first. Given any entry id, find its thread root (its own `originId` or itself),
 * gather every task entry in that thread, and order them by creation time so the
 * caller can render "lived on these days" history. Returns [] if the id isn't a
 * known task. Non-task entries never thread. The returned entries are the real
 * stored ones (not copies), so callers can read date/status off each hop.
 */
export function entryThread(entries: Entry[], id: string): Entry[] {
  const self = entries.find((e) => e.id === id)
  if (!self || self.type !== 'task') return []
  const root = self.originId ?? self.id
  return entries
    .filter((e) => e.type === 'task' && (e.originId ?? e.id) === root)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0))
}

/**
 * Per-collection breakdown for the Index: for each collection, how many entries
 * it holds and — over its task entries (dropped excluded) — how many are done.
 * `rate` is 0–1 over live tasks (0 when none). Empty collections still appear
 * (count 0). Sorted by entry count desc, then name. Pure; read-only over data.
 */
export function collectionBreakdown(
  entries: Entry[],
  collections: Collection[],
): { id: string; name: string; icon: string; count: number; done: number; tasks: number; rate: number }[] {
  return collections
    .map((c) => {
      const mine = entries.filter((e) => e.collection === c.id)
      const liveTasks = mine.filter((e) => e.type === 'task' && e.status !== 'dropped')
      const done = liveTasks.filter((e) => e.status === 'done').length
      return {
        id: c.id,
        name: c.name,
        icon: c.icon,
        count: mine.length,
        done,
        tasks: liveTasks.length,
        rate: liveTasks.length ? done / liveTasks.length : 0,
      }
    })
    .sort((a, b) => b.count - a.count || (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1))
}

/**
 * Entries per calendar month across a trailing window ending at `ym` (inclusive),
 * oldest first, every month zero-filled. `months` is the window length (e.g. 12).
 * Collection-only (dateless) entries are skipped; dropped entries still count
 * (they happened). `label` is the short month name ("Jun") for axis ticks.
 * Pure — paces a yearly entry rhythm without touching the store.
 */
export function monthlyEntryCounts(
  entries: Entry[],
  ym: string,
  months: number,
): { ym: string; label: string; count: number }[] {
  // Build the ordered list of YYYY-MM keys, stepping back from `ym`.
  const [y0, m0] = ym.split('-').map(Number)
  const keys: string[] = []
  for (let i = months - 1; i >= 0; i--) {
    // Step back i months from (y0, m0) using a 0-based month index.
    const idx = (y0 * 12 + (m0 - 1)) - i
    const yy = Math.floor(idx / 12)
    const mm = (idx % 12) + 1
    keys.push(`${yy}-${String(mm).padStart(2, '0')}`)
  }
  const counts = new Map<string, number>()
  for (const e of entries) {
    if (!e.date) continue
    const k = ymOf(e.date)
    if (counts.has(k) || keys.includes(k)) counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return keys.map((k) => ({
    ym: k,
    label: MONTHS[Number(k.slice(5)) - 1].slice(0, 3),
    count: counts.get(k) ?? 0,
  }))
}

/**
 * Quick-memory bullets (▲): entries flagged `memory` — fleeting moments worth
 * remembering, captured inline in the daily log. Dropped ones are excluded.
 * Sorted by day desc (dateless last), then newest-created first, so the most
 * recent memories surface. Pure; powers a read-only "Memories" collection page.
 */
export function memoryBullets(entries: Entry[]): Entry[] {
  return entries
    .filter((e) => e.memory && e.status !== 'dropped')
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1
      return a.createdAt < b.createdAt ? 1 : -1
    })
}

/**
 * Parse a quick-capture line into a partial entry.
 * Prefixes: "t " task, "e " event, "n " note, "* " important, "^ " memory.
 * Examples: "t buy lamb food #camp", "e ecstatic dance", "* eliminate dairy".
 */
export function parseQuickCapture(raw: string): Pick<
  Entry,
  'type' | 'text' | 'important' | 'memory' | 'tags' | 'status'
> {
  let text = raw.trim()
  let type: BulletType = 'task'
  let important = false
  let memory = false

  // Allow stacking signifiers, e.g. "* t something" or "^ e party".
  let changed = true
  while (changed) {
    changed = false
    if (/^t\s+/i.test(text)) { type = 'task'; text = text.replace(/^t\s+/i, ''); changed = true }
    else if (/^e\s+/i.test(text)) { type = 'event'; text = text.replace(/^e\s+/i, ''); changed = true }
    else if (/^n\s+/i.test(text)) { type = 'note'; text = text.replace(/^n\s+/i, ''); changed = true }
    if (/^[*!]\s+/.test(text)) { important = true; text = text.replace(/^[*!]\s+/, ''); changed = true }
    if (/^\^\s+/.test(text)) { memory = true; text = text.replace(/^\^\s+/, ''); changed = true }
  }

  return {
    type,
    text: text.trim(),
    important,
    memory,
    tags: parseTags(text),
    status: 'open',
  }
}
