import { describe, expect, it } from 'vitest'
import { decryptString, encryptString, isEncryptedBlob } from './crypto'

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
