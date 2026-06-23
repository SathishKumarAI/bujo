import { describe, expect, it } from 'vitest'
import {
  bulletTypeBreakdown,
  collectionBreakdown,
  collectionProgress,
  entriesPerDay,
  entryThread,
  glyphFor,
  inboxEntries,
  journalingStreak,
  memoryBullets,
  migrationCounts,
  monthlyEntryCounts,
  nextStatus,
  overdueBuckets,
  parseQuickCapture,
  parseTags,
  tagIndex,
  taskCompletion,
  weekdayActivity,
} from './bullets'
import type { Collection, Entry } from './types'

function entry(over: Partial<Entry> = {}): Entry {
  return {
    id: Math.random().toString(36).slice(2),
    date: '2026-06-10',
    type: 'task',
    text: 'thing',
    status: 'open',
    important: false,
    memory: false,
    tags: [],
    createdAt: '2026-06-10T08:00:00.000Z',
    ...over,
  }
}

describe('glyphFor', () => {
  it('renders task lifecycle glyphs', () => {
    expect(glyphFor('task', 'open')).toBe('·')
    expect(glyphFor('task', 'done')).toBe('✕')
    expect(glyphFor('task', 'migrated')).toBe('>')
    expect(glyphFor('task', 'scheduled')).toBe('<')
  })
  it('renders event and note glyphs regardless of status', () => {
    expect(glyphFor('event', 'open')).toBe('○')
    expect(glyphFor('note', 'open')).toBe('–')
  })
})

describe('nextStatus', () => {
  it('cycles open → done → migrated → dropped → open', () => {
    expect(nextStatus('open')).toBe('done')
    expect(nextStatus('done')).toBe('migrated')
    expect(nextStatus('migrated')).toBe('dropped')
    expect(nextStatus('dropped')).toBe('open')
  })
})

describe('parseTags', () => {
  it('extracts unique lowercased tags', () => {
    expect(parseTags('buy #Camp food #camp #travel')).toEqual(['camp', 'travel'])
  })
  it('returns empty array with no tags', () => {
    expect(parseTags('plain text')).toEqual([])
  })
})

describe('parseQuickCapture', () => {
  it('defaults to a task', () => {
    const r = parseQuickCapture('water the plants')
    expect(r.type).toBe('task')
    expect(r.text).toBe('water the plants')
    expect(r.status).toBe('open')
  })
  it('parses the event prefix', () => {
    expect(parseQuickCapture('e ecstatic dance').type).toBe('event')
  })
  it('parses the note prefix', () => {
    expect(parseQuickCapture('n switch to lamb blend').type).toBe('note')
  })
  it('parses important and memory signifiers and tags', () => {
    const r = parseQuickCapture('* t eliminate dairy #health')
    expect(r.type).toBe('task')
    expect(r.important).toBe(true)
    expect(r.text).toBe('eliminate dairy #health')
    expect(r.tags).toEqual(['health'])
  })
  it('parses a memory marker', () => {
    expect(parseQuickCapture('^ saw a shooting star').memory).toBe(true)
  })
})

describe('tagIndex', () => {
  it('groups entries by tag, sorted by frequency then name', () => {
    const idx = tagIndex([
      entry({ tags: ['camp', 'gear'] }),
      entry({ tags: ['camp'] }),
      entry({ tags: ['gear'] }),
      entry({ tags: ['camp'] }),
    ])
    expect(idx.map((g) => g.tag)).toEqual(['camp', 'gear'])
    expect(idx[0].entries).toHaveLength(3)
    expect(idx[1].entries).toHaveLength(2)
  })
  it('breaks frequency ties alphabetically', () => {
    const idx = tagIndex([entry({ tags: ['zebra'] }), entry({ tags: ['apple'] })])
    expect(idx.map((g) => g.tag)).toEqual(['apple', 'zebra'])
  })
  it('falls back to parsing tags from text for legacy entries', () => {
    const idx = tagIndex([entry({ tags: [], text: 'buy #lamb food' })])
    expect(idx).toHaveLength(1)
    expect(idx[0].tag).toBe('lamb')
  })
  it('counts an entry once per distinct tag even if repeated', () => {
    const idx = tagIndex([entry({ tags: ['camp', 'camp'] })])
    expect(idx).toHaveLength(1)
    expect(idx[0].entries).toHaveLength(1)
  })
  it('returns empty for no tags', () => {
    expect(tagIndex([entry({ tags: [], text: 'plain' })])).toEqual([])
  })
})

describe('inboxEntries', () => {
  it('keeps dateless, uncollected open entries', () => {
    const out = inboxEntries([
      entry({ date: '', text: 'triage me' }),
      entry({ date: '2026-06-10', text: 'has a day' }),
    ])
    expect(out.map((e) => e.text)).toEqual(['triage me'])
  })
  it('excludes collection-filed dateless entries', () => {
    expect(inboxEntries([entry({ date: '', collection: 'books' })])).toEqual([])
  })
  it('excludes done and dropped entries', () => {
    expect(inboxEntries([
      entry({ date: '', status: 'done' }),
      entry({ date: '', status: 'dropped' }),
    ])).toEqual([])
  })
  it('sorts newest-created first', () => {
    const out = inboxEntries([
      entry({ date: '', text: 'old', createdAt: '2026-06-01T00:00:00Z' }),
      entry({ date: '', text: 'new', createdAt: '2026-06-09T00:00:00Z' }),
    ])
    expect(out.map((e) => e.text)).toEqual(['new', 'old'])
  })
})

describe('migrationCounts', () => {
  it('counts migrated hops per thread, threaded by originId', () => {
    // A task migrated twice: original (migrated) → copy1 (migrated) → copy2 (open).
    const orig = entry({ id: 'a', text: 'pay rent', status: 'migrated', createdAt: '2026-06-01T00:00:00Z' })
    const c1 = entry({ id: 'b', text: 'pay rent', status: 'migrated', originId: 'a', createdAt: '2026-06-02T00:00:00Z' })
    const c2 = entry({ id: 'c', text: 'pay rent', status: 'open', originId: 'a', createdAt: '2026-06-03T00:00:00Z' })
    const out = migrationCounts([orig, c1, c2])
    expect(out).toHaveLength(1)
    expect(out[0].rootId).toBe('a')
    expect(out[0].count).toBe(2)
    expect(out[0].current.id).toBe('c')
  })
  it('excludes tasks that were never migrated', () => {
    expect(migrationCounts([entry({ status: 'open' }), entry({ status: 'done' })])).toEqual([])
  })
  it('ignores events and notes', () => {
    expect(migrationCounts([entry({ type: 'event', status: 'migrated' })])).toEqual([])
  })
  it('sorts most-deferred first, then by text', () => {
    const a1 = entry({ id: 'a1', text: 'twice', status: 'migrated', createdAt: '2026-06-01T00:00:00Z' })
    const a2 = entry({ id: 'a2', text: 'twice', status: 'migrated', originId: 'a1', createdAt: '2026-06-02T00:00:00Z' })
    const a3 = entry({ id: 'a3', text: 'twice', status: 'open', originId: 'a1', createdAt: '2026-06-03T00:00:00Z' })
    const b1 = entry({ id: 'b1', text: 'once', status: 'migrated', createdAt: '2026-06-01T00:00:00Z' })
    const b2 = entry({ id: 'b2', text: 'once', status: 'open', originId: 'b1', createdAt: '2026-06-02T00:00:00Z' })
    const out = migrationCounts([a1, a2, a3, b1, b2])
    expect(out.map((t) => t.text)).toEqual(['twice', 'once'])
  })
  it('falls back to newest entry when all hops are migrated', () => {
    const a = entry({ id: 'a', text: 'x', status: 'migrated', createdAt: '2026-06-01T00:00:00Z' })
    const b = entry({ id: 'b', text: 'x', status: 'migrated', originId: 'a', createdAt: '2026-06-02T00:00:00Z' })
    const out = migrationCounts([a, b])
    expect(out[0].count).toBe(2)
    expect(out[0].current.id).toBe('b')
  })
})

describe('bulletTypeBreakdown', () => {
  it('counts tasks, events and notes', () => {
    const out = bulletTypeBreakdown([
      entry({ type: 'task' }),
      entry({ type: 'task', status: 'done' }),
      entry({ type: 'event' }),
      entry({ type: 'note' }),
    ])
    expect(out).toEqual({ task: 2, event: 1, note: 1, total: 4 })
  })
  it('excludes dropped entries', () => {
    expect(bulletTypeBreakdown([entry({ type: 'task', status: 'dropped' })])).toEqual({
      task: 0, event: 0, note: 0, total: 0,
    })
  })
})

describe('taskCompletion', () => {
  it('computes done/open ratio over live tasks', () => {
    const out = taskCompletion([
      entry({ type: 'task', status: 'done' }),
      entry({ type: 'task', status: 'done' }),
      entry({ type: 'task', status: 'open' }),
      entry({ type: 'event' }),
    ])
    expect(out).toEqual({ done: 2, open: 1, total: 3, rate: 2 / 3 })
  })
  it('excludes dropped tasks from the denominator', () => {
    const out = taskCompletion([
      entry({ type: 'task', status: 'done' }),
      entry({ type: 'task', status: 'dropped' }),
    ])
    expect(out).toEqual({ done: 1, open: 0, total: 1, rate: 1 })
  })
  it('returns rate 0 with no tasks', () => {
    expect(taskCompletion([entry({ type: 'note' })])).toEqual({ done: 0, open: 0, total: 0, rate: 0 })
  })
})

describe('entriesPerDay', () => {
  it('zero-fills every day in the inclusive range', () => {
    const out = entriesPerDay(
      [entry({ date: '2026-06-02' }), entry({ date: '2026-06-02' }), entry({ date: '2026-06-04' })],
      '2026-06-01',
      '2026-06-04',
    )
    expect(out).toEqual([
      { date: '2026-06-01', count: 0 },
      { date: '2026-06-02', count: 2 },
      { date: '2026-06-03', count: 0 },
      { date: '2026-06-04', count: 1 },
    ])
  })
  it('ignores dateless and out-of-range entries', () => {
    const out = entriesPerDay(
      [entry({ date: '' }), entry({ date: '2026-05-31' }), entry({ date: '2026-06-01' })],
      '2026-06-01',
      '2026-06-01',
    )
    expect(out).toEqual([{ date: '2026-06-01', count: 1 }])
  })
})

describe('weekdayActivity', () => {
  it('returns 7 buckets in Sun..Sat order', () => {
    const out = weekdayActivity([])
    expect(out.map((b) => b.label)).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
    expect(out.every((b) => b.count === 0)).toBe(true)
  })
  it('counts dated entries on their weekday', () => {
    // 2026-06-07 is a Sunday, 2026-06-08 a Monday.
    const out = weekdayActivity([
      entry({ date: '2026-06-07' }),
      entry({ date: '2026-06-07' }),
      entry({ date: '2026-06-08' }),
    ])
    expect(out[0].count).toBe(2) // Sunday
    expect(out[1].count).toBe(1) // Monday
  })
  it('skips dateless entries and counts dropped ones', () => {
    const out = weekdayActivity([entry({ date: '' }), entry({ date: '2026-06-08', status: 'dropped' })])
    expect(out.reduce((a, b) => a + b.count, 0)).toBe(1)
    expect(out[1].count).toBe(1)
  })
})

describe('journalingStreak', () => {
  it('returns zero for no dated entries', () => {
    expect(journalingStreak([entry({ date: '' })], '2026-06-10')).toEqual({ longest: 0, current: 0 })
  })
  it('finds the longest consecutive run', () => {
    const out = journalingStreak(
      [
        entry({ date: '2026-06-01' }),
        entry({ date: '2026-06-02' }),
        entry({ date: '2026-06-03' }),
        entry({ date: '2026-06-05' }), // gap breaks the run
      ],
      '2026-06-05',
    )
    expect(out.longest).toBe(3)
  })
  it('dedupes multiple entries on the same day', () => {
    const out = journalingStreak(
      [entry({ date: '2026-06-01' }), entry({ date: '2026-06-01' }), entry({ date: '2026-06-02' })],
      '2026-06-02',
    )
    expect(out.longest).toBe(2)
  })
  it('counts the current streak ending today', () => {
    const out = journalingStreak(
      [entry({ date: '2026-06-08' }), entry({ date: '2026-06-09' }), entry({ date: '2026-06-10' })],
      '2026-06-10',
    )
    expect(out.current).toBe(3)
  })
  it('counts a current streak ending yesterday', () => {
    const out = journalingStreak(
      [entry({ date: '2026-06-08' }), entry({ date: '2026-06-09' })],
      '2026-06-10',
    )
    expect(out.current).toBe(2)
  })
  it('reports current 0 when the latest day is stale', () => {
    const out = journalingStreak([entry({ date: '2026-06-01' })], '2026-06-10')
    expect(out.current).toBe(0)
    expect(out.longest).toBe(1)
  })
})

describe('collectionProgress', () => {
  it('counts done vs live tasks in a collection', () => {
    const out = collectionProgress(
      [
        entry({ collection: 'pack', type: 'task', status: 'done' }),
        entry({ collection: 'pack', type: 'task', status: 'open' }),
        entry({ collection: 'pack', type: 'note' }), // ignored
        entry({ collection: 'other', type: 'task', status: 'done' }), // other collection
      ],
      'pack',
    )
    expect(out).toEqual({ done: 1, total: 2, rate: 0.5 })
  })
  it('excludes dropped tasks', () => {
    const out = collectionProgress(
      [
        entry({ collection: 'pack', type: 'task', status: 'done' }),
        entry({ collection: 'pack', type: 'task', status: 'dropped' }),
      ],
      'pack',
    )
    expect(out).toEqual({ done: 1, total: 1, rate: 1 })
  })
  it('returns rate 0 for an empty collection', () => {
    expect(collectionProgress([], 'pack')).toEqual({ done: 0, total: 0, rate: 0 })
  })
})

describe('overdueBuckets', () => {
  const today = '2026-06-30'
  it('buckets open overdue tasks by staleness', () => {
    const out = overdueBuckets(
      [
        entry({ type: 'task', status: 'open', date: '2026-06-29' }), // 1d → recent
        entry({ type: 'task', status: 'open', date: '2026-06-25' }), // 5d → week
        entry({ type: 'task', status: 'open', date: '2026-06-10' }), // 20d → stale
        entry({ type: 'task', status: 'open', date: '2026-05-01' }), // 60d → ancient
      ],
      today,
    )
    expect(out).toEqual({ recent: 1, week: 1, stale: 1, ancient: 1, total: 4, oldestDays: 60 })
  })
  it('ignores done, dropped, future, dateless, and non-task entries', () => {
    const out = overdueBuckets(
      [
        entry({ type: 'task', status: 'done', date: '2026-06-01' }),
        entry({ type: 'task', status: 'open', date: '2026-07-05' }), // future
        entry({ type: 'task', status: 'open', date: '' }),
        entry({ type: 'event', date: '2026-06-01' }),
        entry({ type: 'task', status: 'open', date: '2026-06-30' }), // today, not overdue
      ],
      today,
    )
    expect(out.total).toBe(0)
    expect(out.oldestDays).toBe(0)
  })
})

describe('entryThread', () => {
  it('returns the full migration chain oldest-first', () => {
    const orig = entry({ id: 'a', date: '2026-06-01', status: 'migrated', createdAt: '2026-06-01T08:00:00Z' })
    const c1 = entry({ id: 'b', date: '2026-06-02', status: 'migrated', originId: 'a', createdAt: '2026-06-02T08:00:00Z' })
    const c2 = entry({ id: 'c', date: '2026-06-03', status: 'open', originId: 'a', createdAt: '2026-06-03T08:00:00Z' })
    // Query by any member id resolves the same thread.
    expect(entryThread([c2, orig, c1], 'c').map((e) => e.id)).toEqual(['a', 'b', 'c'])
    expect(entryThread([c2, orig, c1], 'a').map((e) => e.id)).toEqual(['a', 'b', 'c'])
  })
  it('returns just the entry for an unmigrated task', () => {
    expect(entryThread([entry({ id: 'solo' })], 'solo').map((e) => e.id)).toEqual(['solo'])
  })
  it('returns [] for an unknown or non-task id', () => {
    expect(entryThread([entry({ id: 'x' })], 'nope')).toEqual([])
    expect(entryThread([entry({ id: 'ev', type: 'event' })], 'ev')).toEqual([])
  })
})

describe('collectionBreakdown', () => {
  function col(over: Partial<Collection> = {}): Collection {
    return { id: 'c1', name: 'Pack', icon: '🎒', createdAt: '2026-06-01T00:00:00Z', ...over }
  }
  it('counts entries and live-task completion per collection', () => {
    const out = collectionBreakdown(
      [
        entry({ collection: 'c1', type: 'task', status: 'done' }),
        entry({ collection: 'c1', type: 'task', status: 'open' }),
        entry({ collection: 'c1', type: 'note' }),
        entry({ collection: 'c1', type: 'task', status: 'dropped' }), // excluded from tasks
        entry({ collection: 'c2', type: 'task', status: 'done' }),
      ],
      [col({ id: 'c1', name: 'Pack' }), col({ id: 'c2', name: 'Work' })],
    )
    const pack = out.find((c) => c.id === 'c1')!
    expect(pack.count).toBe(4)
    expect(pack.tasks).toBe(2)
    expect(pack.done).toBe(1)
    expect(pack.rate).toBe(0.5)
    expect(out.find((c) => c.id === 'c2')!.rate).toBe(1)
  })
  it('includes empty collections with rate 0 and sorts by count desc then name', () => {
    const out = collectionBreakdown(
      [entry({ collection: 'b', type: 'note' })],
      [col({ id: 'a', name: 'Apple' }), col({ id: 'b', name: 'Banana' }), col({ id: 'z', name: 'Zen' })],
    )
    expect(out.map((c) => c.id)).toEqual(['b', 'a', 'z']) // b has 1 entry; a,z tie at 0 → alpha
    expect(out[1].rate).toBe(0)
  })
})

describe('monthlyEntryCounts', () => {
  it('zero-fills a trailing window of months, oldest first', () => {
    const out = monthlyEntryCounts(
      [
        entry({ date: '2026-06-10' }),
        entry({ date: '2026-06-20' }),
        entry({ date: '2026-04-05' }),
      ],
      '2026-06',
      3,
    )
    expect(out.map((m) => m.ym)).toEqual(['2026-04', '2026-05', '2026-06'])
    expect(out.map((m) => m.count)).toEqual([1, 0, 2])
    expect(out.map((m) => m.label)).toEqual(['Apr', 'May', 'Jun'])
  })
  it('crosses a year boundary correctly', () => {
    const out = monthlyEntryCounts([entry({ date: '2025-12-31' })], '2026-01', 2)
    expect(out.map((m) => m.ym)).toEqual(['2025-12', '2026-01'])
    expect(out[0].count).toBe(1)
  })
  it('ignores dateless and out-of-window entries', () => {
    const out = monthlyEntryCounts(
      [entry({ date: '' }), entry({ date: '2026-01-01' }), entry({ date: '2026-06-01' })],
      '2026-06',
      2,
    )
    expect(out.map((m) => m.ym)).toEqual(['2026-05', '2026-06'])
    expect(out.reduce((a, b) => a + b.count, 0)).toBe(1) // only June is in-window
  })
})

describe('memoryBullets', () => {
  it('keeps memory-flagged entries, newest day first', () => {
    const out = memoryBullets([
      entry({ id: 'old', date: '2026-06-01', memory: true }),
      entry({ id: 'new', date: '2026-06-09', memory: true }),
      entry({ id: 'plain', date: '2026-06-10', memory: false }),
    ])
    expect(out.map((e) => e.id)).toEqual(['new', 'old'])
  })
  it('excludes dropped memories', () => {
    expect(memoryBullets([entry({ memory: true, status: 'dropped' })])).toEqual([])
  })
  it('orders dateless memories after dated ones', () => {
    const out = memoryBullets([
      entry({ id: 'nodate', date: '', memory: true }),
      entry({ id: 'dated', date: '2026-06-01', memory: true }),
    ])
    expect(out.map((e) => e.id)).toEqual(['dated', 'nodate'])
  })
})
