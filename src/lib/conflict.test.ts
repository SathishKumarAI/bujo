import { describe, expect, it, vi } from 'vitest'
import { resolveIncoming } from './conflict'
import { emptyJournal } from './storage'

const at = (iso?: string) => ({ ...emptyJournal(), updatedAt: iso })

describe('resolveIncoming', () => {
  it('adopts remote when it is newer (normal sync, no prompt)', () => {
    const ask = vi.fn(() => false)
    const local = at('2026-06-15T10:00:00.000Z')
    const remote = at('2026-06-15T12:00:00.000Z')
    expect(resolveIncoming(local, remote, ask)).toBe(remote)
    expect(ask).not.toHaveBeenCalled()
  })

  it('adopts remote when neither side is stamped (legacy)', () => {
    const ask = vi.fn(() => false)
    expect(resolveIncoming(at(undefined), at(undefined), ask)).toMatchObject({ updatedAt: undefined })
    expect(ask).not.toHaveBeenCalled()
  })

  it('prompts when local is newer; keeps local on cancel', () => {
    const ask = vi.fn(() => false)
    const local = at('2026-06-15T12:00:00.000Z')
    const remote = at('2026-06-15T10:00:00.000Z')
    expect(resolveIncoming(local, remote, ask)).toBeNull()
    expect(ask).toHaveBeenCalledOnce()
  })

  it('prompts when local is newer; adopts cloud on confirm', () => {
    const ask = vi.fn(() => true)
    const local = at('2026-06-15T12:00:00.000Z')
    const remote = at('2026-06-15T10:00:00.000Z')
    expect(resolveIncoming(local, remote, ask)).toBe(remote)
  })

  it('prompts when local is stamped but remote is not (local has unsynced edits)', () => {
    const ask = vi.fn(() => true)
    const local = at('2026-06-15T12:00:00.000Z')
    const remote = at(undefined)
    expect(resolveIncoming(local, remote, ask)).toBe(remote)
    expect(ask).toHaveBeenCalledOnce()
  })
})
