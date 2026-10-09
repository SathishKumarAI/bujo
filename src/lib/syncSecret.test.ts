import { beforeEach, describe, expect, it } from 'vitest'
import {
  autoSyncEnabled,
  clearSyncPassphrase,
  getSyncPassphrase,
  resealForNewPasscode,
  setSyncPassphrase,
  unsealSyncPassphrase,
  __resetSyncSecret,
} from './syncSecret'

const PLAIN = 'bujo:sync'
const SEALED = 'bujo:sync.enc'

/** Everything the attacker in COD-228 can see: the contents of localStorage. */
const onDisk = () => ({ plain: localStorage.getItem(PLAIN), sealed: localStorage.getItem(SEALED) })

describe('the cloud passphrase, and where it is allowed to live (COD-228)', () => {
  beforeEach(() => {
    localStorage.clear()
    __resetSyncSecret()
  })

  it('writes it in the clear when there is no passcode — deliberately', () => {
    // Not a hole: with no passcode the journal itself is plaintext in
    // `bujo:data`, so sealing the key to it would be theatre.
    return setSyncPassphrase('correct horse battery', null).then(() => {
      expect(onDisk().plain).toBe('correct horse battery')
      expect(onDisk().sealed).toBeNull()
      expect(getSyncPassphrase()).toBe('correct horse battery')
    })
  })

  it('NEVER leaves the passphrase readable once a passcode is set', async () => {
    // The reported bug, as an assertion. With a passcode, the journal is
    // ciphertext at rest — but `bujo:sync` held the key to a byte-identical
    // cloud copy, so the lock could be walked around entirely.
    await setSyncPassphrase('correct horse battery', '1234')
    const { plain, sealed } = onDisk()
    expect(plain).toBeNull()
    expect(sealed).not.toBeNull()
    expect(sealed).not.toContain('correct horse battery')
  })

  it('cannot be read back from storage alone after a reload', async () => {
    await setSyncPassphrase('correct horse battery', '1234')
    __resetSyncSecret() // a new tab: memory is gone, localStorage is not
    expect(getSyncPassphrase()).toBeNull()
  })

  it('comes back on unlock, and only with the right passcode', async () => {
    await setSyncPassphrase('correct horse battery', '1234')
    __resetSyncSecret()

    await unsealSyncPassphrase('9999')
    expect(getSyncPassphrase()).toBeNull()

    await unsealSyncPassphrase('1234')
    expect(getSyncPassphrase()).toBe('correct horse battery')
  })

  it('re-seals a key that was already in the clear when a passcode is set', async () => {
    // The migration path, and the one most likely to be forgotten: auto-sync
    // was on BEFORE the passcode existed. Without this the fix would only ever
    // protect new users, and the plaintext key would sit there untouched.
    await setSyncPassphrase('correct horse battery', null)
    expect(onDisk().plain).toBe('correct horse battery')

    await resealForNewPasscode('1234')
    expect(onDisk().plain).toBeNull()
    expect(onDisk().sealed).not.toBeNull()
  })

  it('unseals back to plaintext when the passcode is removed', async () => {
    await setSyncPassphrase('correct horse battery', '1234')
    await resealForNewPasscode(null)
    expect(onDisk().plain).toBe('correct horse battery')
    expect(onDisk().sealed).toBeNull()
  })

  it('reports auto-sync as on while locked, so the UI does not lie', async () => {
    // `getSyncPassphrase()` is null while locked, but auto-sync IS configured.
    // Conflating the two would make the account menu claim sync is off.
    await setSyncPassphrase('correct horse battery', '1234')
    __resetSyncSecret()
    expect(getSyncPassphrase()).toBeNull()
    expect(autoSyncEnabled()).toBe(true)
  })

  it('forgets it everywhere when auto-sync is switched off', async () => {
    await setSyncPassphrase('correct horse battery', '1234')
    clearSyncPassphrase()
    expect(onDisk()).toEqual({ plain: null, sealed: null })
    expect(getSyncPassphrase()).toBeNull()
    expect(autoSyncEnabled()).toBe(false)
  })
})
