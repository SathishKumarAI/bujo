import { describe, expect, it } from 'vitest'
import { decryptString, deriveCode, encryptString, isEncryptedBlob, legacyCode } from './crypto'

// The passcode path had shipped for its whole life with zero tests (COD-138).
// These pin the properties Settings' PasscodeCard and the LockScreen rely on.

describe('journal encryption', () => {
  it('round-trips a journal string through encrypt + decrypt', async () => {
    const blob = await encryptString('{"entries":[1,2,3]}', 'hunter2')
    expect(await decryptString(blob, 'hunter2')).toBe('{"entries":[1,2,3]}')
  })

  it('a wrong passcode throws and leaves the blob intact', async () => {
    const blob = await encryptString('secret journal', 'right-pc')
    const before = JSON.stringify(blob)
    await expect(decryptString(blob, 'wrong-pc')).rejects.toThrow()
    expect(JSON.stringify(blob)).toBe(before)
  })

  it('every encryption gets a fresh salt and iv', async () => {
    const a = await encryptString('same text', 'pc')
    const b = await encryptString('same text', 'pc')
    expect(a.salt).not.toBe(b.salt)
    expect(a.iv).not.toBe(b.iv)
    expect(a.data).not.toBe(b.data)
  })

  it('an image-heavy journal larger than one base64 chunk survives', async () => {
    // The chunked byte→char conversion exists because spreading a large
    // Uint8Array overflowed the call stack; 3× the 0x8000 chunk proves it.
    const big = 'x'.repeat(0x8000 * 3 + 17)
    const blob = await encryptString(big, 'pc')
    expect(await decryptString(blob, 'pc')).toBe(big)
  })

  it('isEncryptedBlob accepts real blobs and rejects journal JSON', async () => {
    expect(isEncryptedBlob(await encryptString('x', 'pc'))).toBe(true)
    expect(isEncryptedBlob({ entries: [] })).toBe(false)
    expect(isEncryptedBlob(null)).toBe(false)
    expect(isEncryptedBlob('string')).toBe(false)
  })
})

describe('the round count is versioned, so an old journal still opens', () => {
  /**
   * COD-267 raised PBKDF2 from 150 000 to 600 000 rounds. The whole migration
   * strategy is "do nothing" — a blob records the version it was written at —
   * and that only works if a v1 blob still decrypts. There is no upgrade step
   * and no backup taken before one, so this test is the entire safety net.
   */
  const v1 = async (plaintext: string, pass: string) => {
    // Hand-built at the v1 parameters, because `encryptString` can no longer
    // produce one. If this helper and `crypto.ts` ever disagree the test fails
    // loudly rather than passing against a blob only it can make.
    const enc = new TextEncoder()
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey'])
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 150_000, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
    )
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext))
    const b64 = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b)))
    return { v: 1 as const, salt: b64(salt.buffer), iv: b64(iv.buffer), data: b64(ct) }
  }

  it('decrypts a v1 blob written at 150 000 rounds', async () => {
    const blob = await v1('{"entries":[1]}', 'hunter2')
    expect(await decryptString(blob, 'hunter2')).toBe('{"entries":[1]}')
  })

  it('writes v2 now, and v2 round-trips', async () => {
    const blob = await encryptString('fresh', 'pc')
    expect(blob.v).toBe(2)
    expect(await decryptString(blob, 'pc')).toBe('fresh')
  })

  it('a v1 blob re-encrypted comes back as v2 with the same contents', async () => {
    // The lazy migration, end to end: read at the old rounds, write at the new.
    const old = await v1('journal', 'pc')
    const text = await decryptString(old, 'pc')
    const next = await encryptString(text, 'pc')
    expect(next.v).toBe(2)
    expect(await decryptString(next, 'pc')).toBe('journal')
  })

  it('accepts v1 and v2 as blobs, and nothing else', async () => {
    expect(isEncryptedBlob(await v1('x', 'p'))).toBe(true)
    expect(isEncryptedBlob(await encryptString('x', 'p'))).toBe(true)
    expect(isEncryptedBlob({ v: 3, salt: 's', iv: 'i', data: 'd' })).toBe(false)
  })

  it('names a future version instead of failing as a wrong passcode', async () => {
    // Deriving at the wrong round count fails with the same error as a bad
    // passcode, which sends the user hunting for a password they typed right.
    const blob = { ...(await encryptString('x', 'pc')), v: 9 as unknown as 2 }
    await expect(decryptString(blob, 'pc')).rejects.toThrow(/newer version/)
  })
})

describe('the sync path code is derived, not hashed once', () => {
  /**
   * The sharpest half of COD-267: the key was 150 000 rounds and the path code
   * was ONE unsalted SHA-256 of the same passphrase, so the cheapest attack on
   * the passphrase was never against the ciphertext.
   */
  it('is 40 hex characters, which is what the endpoint validates', async () => {
    expect(await deriveCode('correct-horse-battery')).toMatch(/^[a-f0-9]{40}$/)
  })

  it('is stable for the same passphrase', async () => {
    // It addresses a blob. If it moved between calls the journal would vanish.
    expect(await deriveCode('same')).toBe(await deriveCode('same'))
  })

  it('differs for a different passphrase', async () => {
    expect(await deriveCode('one')).not.toBe(await deriveCode('two'))
  })

  it('is not the v1 code, or the migration would be a no-op', async () => {
    expect(await deriveCode('pass')).not.toBe(await legacyCode('pass'))
  })

  it('still computes the v1 code, so a journal already in the cloud is findable', async () => {
    // Pinned to the literal value, not just to its shape. `legacyCode` is the
    // only thing that can still find a blob written before COD-267, so a drift
    // of one character silently means "nothing stored for that passphrase" for
    // everyone who synced before this release. A self-consistency check would
    // have passed through any such drift.
    //   $ printf 'bujo-sync:pass' | sha256sum   # first 40 hex
    expect(await legacyCode('pass')).toBe('d5dff7acec9c9cda091552ac996c98cfb880587d')
  })
})
