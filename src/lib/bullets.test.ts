import { describe, expect, it } from 'vitest'
import { glyphFor, inboxEntries, nextStatus, parseQuickCapture, parseTags, tagIndex } from './bullets'
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
