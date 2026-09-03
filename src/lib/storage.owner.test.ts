import { beforeEach, describe, expect, it } from 'vitest'
import { claimOwner, getOwner, isForeignOwner, OWNER_KEY } from './storage'

// COD-135: a different owner's journal is never treated as this account's own.
// One local journal per browser origin, no per-account separation — these pin
// the ownership record that keeps a shared device from merging/pushing one
// user's journal into another user's cloud row.

describe('journal ownership', () => {
  beforeEach(() => localStorage.clear())

  it('an unclaimed journal (no owner recorded) is never foreign', () => {
    expect(getOwner()).toBeNull()
    expect(isForeignOwner('user-a')).toBe(false)
    expect(isForeignOwner('user-b')).toBe(false)
  })

  it('a journal claimed by the same user is not foreign', () => {
    claimOwner('user-a')
    expect(isForeignOwner('user-a')).toBe(false)
  })

  it('a journal claimed by a different user IS foreign — the shared-device case', () => {
    claimOwner('user-a')
    expect(isForeignOwner('user-b')).toBe(true)
  })

  it('claiming records the raw user id under the documented key', () => {
    claimOwner('user-a')
    expect(localStorage.getItem(OWNER_KEY)).toBe('user-a')
  })

  it('re-claiming for a new owner overwrites the old one (adopt flips ownership)', () => {
    claimOwner('user-a')
    expect(isForeignOwner('user-b')).toBe(true)
    claimOwner('user-b')
    expect(isForeignOwner('user-b')).toBe(false)
    expect(isForeignOwner('user-a')).toBe(true)
  })
})
