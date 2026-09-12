import { describe, expect, it, vi } from 'vitest'
import { askModel, isLocalEndpoint, listModels } from './model'

const TODAY = '2026-09-12'

/** An Ollama `/api/chat` reply carrying `content` as the model wrote it. */
const reply = (content: unknown) =>
  vi.fn(async () => new Response(JSON.stringify({ message: { content: typeof content === 'string' ? content : JSON.stringify(content) } }), { status: 200 }))

describe('isLocalEndpoint', () => {
  /**
   * The failure this catches is silent and total: one pasted endpoint and every
   * sentence spoken into a health journal goes to someone else's server. There
   * is no override, so this list is the whole security boundary.
   */
  it('allows this machine and refuses everywhere else', () => {
    for (const ok of ['http://localhost:11434', 'http://127.0.0.1:1234', 'http://[::1]:11434', 'https://localhost:443']) {
      expect(isLocalEndpoint(ok), ok).toBe(true)
    }
    for (const no of [
      'http://evil.example.com',
      'https://api.openai.com/v1',
      'http://localhost.evil.com',
      'http://192.168.1.50:11434',
      'ftp://localhost',
      'not a url',
    ]) {
      expect(isLocalEndpoint(no), no).toBe(false)
    }
  })

  it('refuses a remote endpoint without calling it', async () => {
    const fetchImpl = vi.fn()
    const r = await askModel('anything', TODAY, { endpoint: 'https://api.example.com' }, fetchImpl as unknown as typeof fetch)
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(r.records).toHaveLength(0)
    expect(r.error).toMatch(/not on this machine/)
  })
})

describe('askModel', () => {
  it('turns a flat answer into a validated record', async () => {
    const f = reply({ kind: 'metric', mood: 7, sleep: 6.5, stress: null })
    const r = await askModel('mood seven, slept six and a half', TODAY, {}, f as unknown as typeof fetch)
    expect(r.records).toHaveLength(1)
    expect(r.records[0]).toMatchObject({ kind: 'metric', date: TODAY, mood: 7, sleep: 6.5 })
    expect(r.records[0]).not.toHaveProperty('stress')
  })

  /**
   * Measured against the real `llama3.1:8b`: under this schema it answered
   * `"kind": "null"` — the four-character string, not JSON null. A reader that
   * trusts the type files a record of kind "null".
   */
  it('treats the string "null" as absent, the way the real model emits it', async () => {
    const f = reply({ kind: 'null', mood: 'null', text: 'the court was busy' })
    const r = await askModel('the court was busy', TODAY, {}, f as unknown as typeof fetch)
    expect(r.records[0]).toMatchObject({ kind: 'entry', type: 'note', text: 'the court was busy' })
    expect(r.records[0]).not.toHaveProperty('mood')
  })

  it('keeps the sentence when the model classifies nothing', async () => {
    const f = reply({ kind: null })
    const r = await askModel('rallied on the back wall', TODAY, {}, f as unknown as typeof fetch)
    expect(r.records[0]).toMatchObject({ kind: 'entry', text: 'rallied on the back wall' })
  })

  /**
   * The model is untrusted input like any file. A fabricated mood of 99 is
   * refused by the same range check that refuses a malformed import — it is not
   * clamped into a plausible 10.
   */
  it('refuses a fabricated value instead of storing it', async () => {
    const f = reply({ kind: 'metric', mood: 99 })
    const r = await askModel('felt great', TODAY, {}, f as unknown as typeof fetch)
    expect(r.records).toHaveLength(0)
    expect(r.rejected[0].reason).toMatch(/mood 99 is outside 0–10/)
  })

  it('survives prose where JSON was asked for', async () => {
    const f = reply('Sure! Here is the JSON you asked for.')
    const r = await askModel('anything', TODAY, {}, f as unknown as typeof fetch)
    expect(r.records).toHaveLength(0)
    expect(r.error).toMatch(/did not answer with JSON/)
  })

  it('survives no model server at all', async () => {
    const f = vi.fn(async () => { throw new Error('ECONNREFUSED') })
    const r = await askModel('anything', TODAY, {}, f as unknown as typeof fetch)
    expect(r.records).toHaveLength(0)
    expect(r.error).toMatch(/No model is answering/)
  })

  it('survives an error status', async () => {
    const f = vi.fn(async () => new Response('nope', { status: 500 }))
    const r = await askModel('anything', TODAY, {}, f as unknown as typeof fetch)
    expect(r.error).toMatch(/answered 500/)
  })

  it('uses the day it was given when the model names none', async () => {
    const f = reply({ kind: 'metric', mood: 6 })
    const r = await askModel('ok day', '2026-01-09', {}, f as unknown as typeof fetch)
    expect(r.records[0].date).toBe('2026-01-09')
  })
})

describe('listModels', () => {
  it('reads the server\'s model list', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ models: [{ name: 'llama3.1:8b' }, { name: 'gemma4:12b' }] }), { status: 200 }))
    expect(await listModels('http://localhost:11434', f as unknown as typeof fetch)).toEqual(['gemma4:12b', 'llama3.1:8b'])
  })

  it('returns nothing for a remote endpoint, without calling it', async () => {
    const f = vi.fn()
    expect(await listModels('https://api.example.com', f as unknown as typeof fetch)).toEqual([])
    expect(f).not.toHaveBeenCalled()
  })
})
