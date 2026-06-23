import { describe, expect, it } from 'vitest'
import {
  bulletTypeBreakdown,
  entriesPerDay,
  glyphFor,
  inboxEntries,
  migrationCounts,
  nextStatus,
  parseQuickCapture,
  parseTags,
  tagIndex,
  taskCompletion,
} from './bullets'
import type { Entry } from './types'

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
