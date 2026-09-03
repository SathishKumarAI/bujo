import { afterEach, describe, expect, it } from 'vitest'
import { STORAGE_KEY, STORAGE_ENC_KEY, hasEncrypted, writeEncrypted, clearEncrypted, readEncryptedRaw } from './storage'
import type { EncryptedBlob } from './crypto'

const blob: EncryptedBlob = { v: 1, salt: 'cw==', iv: 'aXY=', data: 'ZGF0YQ==' }

// The two storage keys are mutually exclusive on purpose: an encrypted journal
// must never leave a readable plaintext copy behind (COD-138).

describe('encrypted storage is exclusive with plaintext', () => {
  afterEach(() => localStorage.clear())

  it('writeEncrypted deletes the plaintext journal in the same call', () => {
    localStorage.setItem(STORAGE_KEY, '{"entries":[]}')
    writeEncrypted(blob)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(hasEncrypted()).toBe(true)
    expect(readEncryptedRaw()).toEqual(blob)
  })

  it('clearEncrypted removes the blob so the next start is unlocked', () => {
    writeEncrypted(blob)
    clearEncrypted()
    expect(hasEncrypted()).toBe(false)
    expect(localStorage.getItem(STORAGE_ENC_KEY)).toBeNull()
  })

  it('a corrupt blob reads as null rather than throwing', () => {
    localStorage.setItem(STORAGE_ENC_KEY, 'not-json{')
    expect(readEncryptedRaw()).toBeNull()
  })
})
