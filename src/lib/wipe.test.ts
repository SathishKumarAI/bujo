import { describe, expect, it, beforeEach } from 'vitest'
import { eraseDevice, wipeableKeys, wipeSummary } from './wipe'

/**
 * COD-299. "Erase everything and start fresh?" told the user it deletes every
 * entry, habit, workout "and every photo and memory on this device. It cannot
 * be undone." It called `replaceAll(emptyJournal())`, which rewrites ONE key.
 *
 * There was no `localStorage.clear()` and no `indexedDB.deleteDatabase()`
 * anywhere in the application — every occurrence of either was in a test file.
 * So a wiped device still held the plaintext sync passphrase, the Supabase
 * access and refresh tokens, every progress photo, a live handle to the user's
 * sync folder, and 30 days of their own food searches.
 *
 * `cyclePrivacy.ts` already names the rule: *a dialog that overstates what it
 * destroys is the same defect as one that understates it.* This is the
 * dangerous direction — someone hands over a laptop believing it is clean.
 */
beforeEach(() => localStorage.clear())

const seed = () => {
  localStorage.setItem('bujo:data', '{"entries":[]}')
  localStorage.setItem('bujo:sync', 'correct-horse-battery')      // the passphrase, plaintext
  localStorage.setItem('bujo:sync.enc', '{"v":2}')
  localStorage.setItem('sb-abc123-auth-token', '{"refresh_token":"r"}') // the session
  localStorage.setItem('bujo:device-id', 'uuid')
  localStorage.setItem('bujo:food-cache', '{"pizza":1}')          // a search log
  localStorage.setItem('bujo.ui.cycle.group', 'x')
  localStorage.setItem('bujo:mindset-spotlight:2026-10-09', '1')
  localStorage.setItem('bujo:onboarded', '1')
}

describe('erasing this device', () => {
  it('removes the credentials the old erase left behind', async () => {
    seed()
    await eraseDevice()
    // The three that mattered, named individually rather than by a count: a
    // count passes while the one key you care about survives.
    expect(localStorage.getItem('bujo:sync'), 'the plaintext sync passphrase').toBeNull()
    expect(localStorage.getItem('bujo:sync.enc'), 'the sealed passphrase').toBeNull()
    expect(localStorage.getItem('sb-abc123-auth-token'), 'the Supabase session').toBeNull()
  })

  it('removes the journal, the caches and the per-day flags too', async () => {
    seed()
    await eraseDevice()
    for (const k of ['bujo:data', 'bujo:device-id', 'bujo:food-cache', 'bujo.ui.cycle.group', 'bujo:mindset-spotlight:2026-10-09']) {
      expect(localStorage.getItem(k), k).toBeNull()
    }
  })

  /**
   * The sweep is by PREFIX, not by a hand-written list, because a list resolved
   * against another source is the most repeated mistake in this repo. This is
   * the property that buys: a key invented tomorrow is covered today.
   */
  it('covers a key that did not exist when this was written', async () => {
    localStorage.setItem('bujo:some-future-key', 'x')
    localStorage.setItem('bujo.ui.a.brand.new.fold', '1')
    localStorage.setItem('sb-otherproject-auth-token', 'y')
    await eraseDevice()
    expect(localStorage.getItem('bujo:some-future-key')).toBeNull()
    expect(localStorage.getItem('bujo.ui.a.brand.new.fold')).toBeNull()
    expect(localStorage.getItem('sb-otherproject-auth-token')).toBeNull()
  })

  it('keeps bujo:onboarded, because "erase my data" is not "send me to the start screen"', async () => {
    seed()
    await eraseDevice()
    // The dialog's sibling button exists to re-run that choice. Erasing this
    // would silently do the sibling's job and drop someone into onboarding.
    expect(localStorage.getItem('bujo:onboarded')).toBe('1')
  })

  it('leaves nothing of ours behind that is not deliberately kept', async () => {
    seed()
    await eraseDevice()
    expect(wipeableKeys()).toEqual([])
    expect(Object.keys(localStorage).sort()).toEqual(['bujo:onboarded'])
  })

  it('does not touch another origin-sharing app\'s keys', async () => {
    localStorage.setItem('theme', 'dark')
    localStorage.setItem('unrelated-app:state', '1')
    seed()
    await eraseDevice()
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(localStorage.getItem('unrelated-app:state')).toBe('1')
  })

  it('reports what it actually removed instead of asserting success', async () => {
    seed()
    const r = await eraseDevice()
    expect(r.keys).toContain('bujo:sync')
    expect(r.signedOut, 'a Supabase session was among the keys').toBe(true)
    expect(r.keys).not.toContain('bujo:onboarded')
    // jsdom has no indexedDB, so the databases could not be deleted here — and
    // the report says so rather than claiming they were. That honesty is the
    // reason this returns a report at all.
    expect(r.databases).toEqual([])
  })

  it('tells the user when a database could not be deleted, and why', async () => {
    seed()
    const r = await eraseDevice()
    const msg = wipeSummary(r)
    expect(msg).toMatch(/Removed \d+ stored items/)
    expect(msg).toMatch(/your signed-in session/)
    // A blocked database means another tab holds it open. Saying so beats a
    // silent partial wipe on the one screen where "it cannot be undone" was
    // just promised.
    expect(msg).toMatch(/Close any other tab/)
    expect(msg).not.toMatch(/every photo/)
  })

  it('is safe to run twice', async () => {
    seed()
    await eraseDevice()
    const second = await eraseDevice()
    expect(second.keys).toEqual([])
    expect(second.signedOut).toBe(false)
  })
})
