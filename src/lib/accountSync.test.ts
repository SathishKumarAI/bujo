import { describe, expect, it } from 'vitest'
import { mayPush, onAccountChange, afterPull, isDemo, initialState } from './accountSync'
import { emptyJournal } from './storage'

/**
 * Every test here is a data-loss scenario. The shape they share: the device has
 * a perfectly good local journal and a remote it cannot read, and the obvious
 * move — "mine must be the good copy, push it" — destroys someone's data.
 */

describe('nothing pushes until this device has proved it can read the row', () => {
  const ok = { hasPassphrase: true, isDemo: false }

  it('refuses before any pull has happened', () => {
    // The default. A push that fires between sign-in and the first pull is the
    // whole bug, and it is also the most likely ordering under a slow network.
    expect(mayPush({ ...initialState, userId: 'u1' }, ok)).toBe(false)
  })

  it('allows once a pull decrypted', () => {
    const s = afterPull({ ...initialState, userId: 'u1' }, { row: 'read' })
    expect(mayPush(s, ok)).toBe(true)
  })

  it('allows once a pull found the row empty', () => {
    // First sign-in. There is nothing to destroy, so the local journal is the
    // only copy and must be uploaded.
    const s = afterPull({ ...initialState, userId: 'u1' }, { row: 'empty' })
    expect(mayPush(s, ok)).toBe(true)
  })

  it('REFUSES when the row would not decrypt', () => {
    // The one that matters. The row is intact; this device simply holds the
    // wrong passphrase. Pushing a fresh encryption over it is irreversible.
    const s = afterPull({ ...initialState, userId: 'u1' }, { row: 'unreadable' })
    expect(s.mismatch).toBe(true)
    expect(mayPush(s, ok)).toBe(false)
  })

  it('stays refused even after a later successful-looking state', () => {
    // A mismatch is sticky until the account changes: the passphrase in use has
    // not changed just because another effect ran.
    let s = afterPull({ ...initialState, userId: 'u1' }, { row: 'unreadable' })
    s = { ...s, verified: true } // whatever else happens…
    expect(mayPush(s, ok)).toBe(false) // …mismatch still vetoes
  })

  it('refuses with no passphrase, signed in or not', () => {
    const s = afterPull({ ...initialState, userId: 'u1' }, { row: 'empty' })
    expect(mayPush(s, { hasPassphrase: false, isDemo: false })).toBe(false)
  })

  it('refuses when not signed in', () => {
    const s = afterPull(initialState, { row: 'empty' })
    expect(mayPush(s, ok)).toBe(false)
  })
})

describe('sample data never reaches a real account', () => {
  it('refuses to push a seeded demo', () => {
    const s = afterPull({ ...initialState, userId: 'u1' }, { row: 'empty' })
    expect(mayPush(s, { hasPassphrase: true, isDemo: true })).toBe(false)
  })

  it('recognises both the seeded demo and explore mode', () => {
    const j = emptyJournal()
    expect(isDemo(j)).toBe(false)
    expect(isDemo({ ...j, settings: { ...j.settings, demoSeeded: true } })).toBe(true)
    expect(isDemo({ ...j, settings: { ...j.settings, explore: true } })).toBe(true)
  })
})

describe('switching accounts does not hand one person another person’s journal', () => {
  /**
   * COD-135 shipped exactly this: the merge machinery is right for "one person,
   * two devices" and catastrophically wrong for "two people, one device", and
   * it cannot tell them apart. So the caller has to.
   */
  it('discards the local journal when the user id changes', () => {
    const prev = afterPull({ ...initialState, userId: 'alice' }, { row: 'read' })
    const { state, discardLocal } = onAccountChange(prev, 'bob')
    expect(discardLocal).toBe(true)
    expect(state.userId).toBe('bob')
    // And bob's device has proved nothing yet, so it cannot push over bob's row.
    expect(state.verified).toBe(false)
    expect(mayPush(state, { hasPassphrase: true, isDemo: false })).toBe(false)
  })

  it('keeps the local journal on a first sign-in', () => {
    // Nobody was signed in, so the journal on this device belongs to whoever
    // just signed in. Discarding it here would delete their work.
    const { state, discardLocal } = onAccountChange(initialState, 'alice')
    expect(discardLocal).toBe(false)
    expect(state.userId).toBe('alice')
  })

  it('keeps the local journal on sign-out', () => {
    // Signing out must never look like deleting.
    const prev = afterPull({ ...initialState, userId: 'alice' }, { row: 'read' })
    const { state, discardLocal } = onAccountChange(prev, null)
    expect(discardLocal).toBe(false)
    expect(state.userId).toBeNull()
  })

  it('keeps the local journal when the same user signs in again', () => {
    const prev = afterPull({ ...initialState, userId: 'alice' }, { row: 'read' })
    expect(onAccountChange(prev, 'alice').discardLocal).toBe(false)
  })

  it('clears a mismatch when the account changes', () => {
    // A different account is a different row; the old row's passphrase has no
    // bearing on whether this one opens.
    const prev = afterPull({ ...initialState, userId: 'alice' }, { row: 'unreadable' })
    expect(onAccountChange(prev, 'bob').state.mismatch).toBe(false)
  })
})
