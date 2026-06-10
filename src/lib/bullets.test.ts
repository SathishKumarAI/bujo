import { describe, expect, it } from 'vitest'
import { glyphFor, nextStatus, parseQuickCapture, parseTags } from './bullets'

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
