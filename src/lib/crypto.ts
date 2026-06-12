// Client-side encryption for the journal blob (Web Crypto, local-only).
// PBKDF2(passcode) → AES-GCM. No key or passcode ever leaves the device.

const enc = new TextEncoder()
const dec = new TextDecoder()

function b64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}
function unb64(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
}

/** Derive an AES-GCM key from a passcode + salt. */
async function deriveKey(passcode: string, salt: BufferSource): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', enc.encode(passcode) as BufferSource, 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 150_000, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export interface EncryptedBlob {
  v: 1
  salt: string // base64
  iv: string // base64
  data: string // base64 ciphertext
}

/** Encrypt a plaintext string with a passcode. */
export async function encryptString(plaintext: string, passcode: string): Promise<EncryptedBlob> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passcode, salt)
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext))
  return { v: 1, salt: b64(salt.buffer), iv: b64(iv.buffer), data: b64(ct) }
}

/** Decrypt a blob with a passcode. Throws on a wrong passcode (never wipes data). */
export async function decryptString(blob: EncryptedBlob, passcode: string): Promise<string> {
  const salt = unb64(blob.salt) as BufferSource
  const iv = unb64(blob.iv) as BufferSource
  const key = await deriveKey(passcode, salt)
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, unb64(blob.data) as BufferSource)
  return dec.decode(pt)
}

export function isEncryptedBlob(x: unknown): x is EncryptedBlob {
  return !!x && typeof x === 'object' && (x as EncryptedBlob).v === 1 && 'data' in x && 'salt' in x && 'iv' in x
}
