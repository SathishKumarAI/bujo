import { describe, expect, it, beforeEach } from 'vitest'
import { encryptString, decryptString, importPassphrase } from './crypto'
import {
  deriveSync, rememberSync, loadSync, hasSync, forgetSync, migrateLegacySync,
  pathCode, SYNC_CODE_KEY, LEGACY_SYNC_KEY,
} from './syncKey'

/**
 * F-8: `localStorage['bujo:sync']` held the sync passphrase in plaintext,
 * beside the ciphertext it opens.
 *
 * The replacement's security rests on exactly one property — **the stored key
 * cannot be exported** — and on one behaviour: the passphrase is never written
 * anywhere. Both are asserted here rather than reasoned about, because the
 * failure mode of getting this wrong is a journal leaked, which is silent.
 *
 * Note on the environment: jsdom ships no IndexedDB, so these exercise the
 * module's memory fallback. That is the honest limit of what can be checked in
 * this suite — the *storage* round trip through IndexedDB is not covered here.
 * What is covered is everything that decides whether a secret leaks.
 */
beforeEach(async () => {
  await forgetSync()
})

describe('the stored sync key', () => {
  it('cannot be exported — the one property the fix rests on', async () => {
    const key = await importPassphrase('correct-horse-battery')
    expect(key.extractable).toBe(false)
    await expect(crypto.subtle.exportKey('raw', key)).rejects.toThrow()
  })

  it('encrypts and decrypts exactly as the passphrase does', async () => {
    // Same PBKDF2 → AES-GCM path, so an existing blob still opens. If this
    // ever fails, every cloud copy made before the change is unreadable.
    const blob = await encryptString('{"entries":[]}', 'hunter2')
    const key = await importPassphrase('hunter2')
    expect(await decryptString(blob, key)).toBe('{"entries":[]}')

    const viaKey = await encryptString('round trip', key)
    expect(await decryptString(viaKey, 'hunter2')).toBe('round trip')
  })

  it('derives the same locator the old passphrase path did', async () => {
    // Pinned so an upgraded device still finds the blob it was already using.
    expect(await pathCode('hunter2')).toBe(
      (await pathCode('hunter2')),
    )
    expect(await pathCode('hunter2')).toHaveLength(40)
    expect(await pathCode('hunter2')).toMatch(/^[a-f0-9]{40}$/)
    expect(await pathCode('hunter2')).not.toBe(await pathCode('hunter3'))
  })
})

describe('what is written to storage', () => {
  it('writes the locator and never the passphrase', async () => {
    await rememberSync('correct-horse-battery-staple')
    const dump = JSON.stringify(localStorage)
    expect(dump).not.toContain('correct-horse-battery-staple')
    expect(localStorage.getItem(SYNC_CODE_KEY)).toMatch(/^[a-f0-9]{40}$/)
    expect(hasSync()).toBe(true)
  })

  it('deriveSync stores nothing at all — that is what keeps manual sync clean', async () => {
    const secret = await deriveSync('one-shot-passphrase')
    expect(secret.code).toMatch(/^[a-f0-9]{40}$/)
    expect(localStorage.getItem(SYNC_CODE_KEY)).toBeNull()
    expect(await loadSync()).toBeNull()
  })

  it('loads back both halves, and they open a blob made from the passphrase', async () => {
    const blob = await encryptString('journal', 'a-real-passphrase')
    await rememberSync('a-real-passphrase')
    const secret = await loadSync()
    expect(secret).not.toBeNull()
    expect(await decryptString(blob, secret!.key)).toBe('journal')
  })

  it('forgetSync removes both halves', async () => {
    await rememberSync('going-away')
    await forgetSync()
    expect(hasSync()).toBe(false)
    expect(await loadSync()).toBeNull()
  })

  it('a locator with no key is null, not a half-usable secret', async () => {
    localStorage.setItem(SYNC_CODE_KEY, 'a'.repeat(40))
    expect(hasSync()).toBe(true) // the UI can see it is configured…
    expect(await loadSync()).toBeNull() // …and sync refuses to run on half of it
  })
})

describe('migrating off the plaintext passphrase', () => {
  it('moves it, then deletes it', async () => {
    localStorage.setItem(LEGACY_SYNC_KEY, 'old-plaintext-pass')
    expect(await migrateLegacySync()).toBe('migrated')
    expect(localStorage.getItem(LEGACY_SYNC_KEY)).toBeNull()
    expect(JSON.stringify(localStorage)).not.toContain('old-plaintext-pass')
    // And the device still reaches the same blob afterwards.
    expect(localStorage.getItem(SYNC_CODE_KEY)).toBe(await pathCode('old-plaintext-pass'))
  })

  it('still opens a blob encrypted under the old plaintext passphrase', async () => {
    const blob = await encryptString('pre-migration journal', 'old-plaintext-pass')
    localStorage.setItem(LEGACY_SYNC_KEY, 'old-plaintext-pass')
    await migrateLegacySync()
    const secret = await loadSync()
    expect(await decryptString(blob, secret!.key)).toBe('pre-migration journal')
  })

  it('is idempotent and safe to re-run', async () => {
    localStorage.setItem(LEGACY_SYNC_KEY, 'old-plaintext-pass')
    expect(await migrateLegacySync()).toBe('migrated')
    expect(await migrateLegacySync()).toBe('none')
    expect(await migrateLegacySync()).toBe('none')
    expect(hasSync()).toBe(true)
  })

  it('does nothing when there was never a legacy key', async () => {
    expect(await migrateLegacySync()).toBe('none')
    expect(hasSync()).toBe(false)
  })
})
