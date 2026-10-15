import { describe, expect, it } from 'vitest'
import { mayPush, onAccountChange, afterPull, isDemo, initialState } from './accountSync'
import { emptyJournal } from './storage'

/**
 * Every test here is a data-loss scenario. The shape they share: the device has
 * a perfectly good local journal and a remote it cannot read, and the obvious
 * move — "mine must be the good copy, push it" — destroys someone's data.
 */

describe('nothing pushes until this device has proved it can read the row', () => {
  const ok = { isDemo: false }

  it('refuses before any pull has happened', () => {
    // The default. A push that fires between sign-in and the first pull is the
    // whole bug, and it is also the most likely ordering under a slow network.
    expect(mayPush({ ...initialState, userId: 'u1' }, ok)).toBe(false)
  })

  it('allows once a pull read the row', () => {
    const s = afterPull({ ...initialState, userId: 'u1' }, { row: 'read' })
    expect(mayPush(s, ok)).toBe(true)
  })

  it('allows once a pull found the row empty', () => {
    // First sign-in. There is nothing to destroy, so the local journal is the
    // only copy and must be uploaded.
    const s = afterPull({ ...initialState, userId: 'u1' }, { row: 'empty' })
    expect(mayPush(s, ok)).toBe(true)
  })

  it('REFUSES when the row could not be read', () => {
    // The one that matters, and the one COD-309 did NOT remove. The row is
    // intact and this build could not make sense of it — a transport failure,
    // or ciphertext left by the previous design. Writing over it is
    // irreversible and "I have local data" is not evidence that it should be.
    const s = afterPull({ ...initialState, userId: 'u1' }, { row: 'unreadable' })
    expect(s.unusable).toBe(true)
    expect(mayPush(s, ok)).toBe(false)
  })

  it('stays refused even after a later successful-looking state', () => {
    // Sticky until the account changes. Nothing about the row has improved
    // just because another effect ran and set `verified`.
    let s = afterPull({ ...initialState, userId: 'u1' }, { row: 'unreadable' })
    s = { ...s, verified: true } // whatever else happens…
    expect(mayPush(s, ok)).toBe(false) // …unusable still vetoes
  })

  it('refuses when not signed in', () => {
    const s = afterPull(initialState, { row: 'empty' })
    expect(mayPush(s, ok)).toBe(false)
  })
})

describe('sample data never reaches a real account', () => {
  it('refuses to push a seeded demo', () => {
    const s = afterPull({ ...initialState, userId: 'u1' }, { row: 'empty' })
    expect(mayPush(s, { isDemo: true })).toBe(false)
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
    expect(mayPush(state, { isDemo: false })).toBe(false)
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

  it('clears an unusable row when the account changes', () => {
    // A different account is a different row. Whatever was wrong with alice's
    // has no bearing on whether bob's can be read.
    const prev = afterPull({ ...initialState, userId: 'alice' }, { row: 'unreadable' })
    expect(onAccountChange(prev, 'bob').state.unusable).toBe(false)
  })
})

describe('an account switch is still a switch after a sign-out or a reload', () => {
  /**
   * COD-135 shipped, was fixed, and the fix only covered one of three routes.
   *
   * The original compared `prev.userId` with the incoming id. That is
   * in-memory, so it is null after a sign-out and null again on a fresh load —
   * and both of those sequences then look exactly like a first-ever sign-in,
   * which is the one case where the local journal SHOULD be kept and merged.
   *
   * The result in both: alice's journal merged into bob's account and pushed
   * there. The sign-out route is not exotic. Signing out is the obvious thing
   * to do before handing someone your laptop.
   *
   * Found by composing two tests that each pass on their own — which is why it
   * survived. Every individual assertion about `onAccountChange` was correct.
   */
  const signedIn = (id: string) => afterPull({ ...initialState, userId: id }, { row: 'read' })

  it('discards when the id changes directly', () => {
    // The route that always worked. Kept so a regression here is loud.
    expect(onAccountChange(signedIn('alice'), 'bob', 'alice').discardLocal).toBe(true)
  })

  it('discards across a sign-out', () => {
    // alice -> null -> bob. In-memory `prev.userId` is null at the second
    // step; only the remembered owner can tell this from a first sign-in.
    const afterSignOut = onAccountChange(signedIn('alice'), null, 'alice').state
    expect(onAccountChange(afterSignOut, 'bob', 'alice').discardLocal).toBe(true)
  })

  it('discards across a reload, where there is no in-memory state at all', () => {
    // The worst of the three: a fresh tab has `initialState`, so without the
    // persisted owner there is nothing to compare against.
    expect(onAccountChange(initialState, 'bob', 'alice').discardLocal).toBe(true)
  })

  it('KEEPS the journal when the same person signs back in after a reload', () => {
    // The other half, and the reason this cannot just always discard: coming
    // back to your own account must not wipe the work you did offline.
    expect(onAccountChange(initialState, 'alice', 'alice').discardLocal).toBe(false)
  })

  it('keeps the journal on a genuine first sign-in', () => {
    // Nobody has ever owned this journal, so it belongs to whoever just
    // signed in. Discarding here would delete their work.
    expect(onAccountChange(initialState, 'alice', null).discardLocal).toBe(false)
  })

  it('never discards on sign-out itself', () => {
    // Signing out must never look like deleting.
    expect(onAccountChange(signedIn('alice'), null, 'alice').discardLocal).toBe(false)
  })
})
