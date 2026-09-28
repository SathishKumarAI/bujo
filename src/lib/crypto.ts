// Client-side encryption for the journal blob (Web Crypto, local-only).
// PBKDF2(passcode) → AES-GCM. No key or passcode ever leaves the device.

const enc = new TextEncoder()
const dec = new TextDecoder()

function b64(buf: ArrayBuffer): string {
  // Chunk the byte→char conversion: spreading a large Uint8Array into
  // String.fromCharCode(...) overflows the call stack on image-heavy journals.
  const bytes = new Uint8Array(buf)
  const CHUNK = 0x8000
  let s = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    s += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(s)
}
function unb64(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
}

/**
 * The passphrase, imported as a PBKDF2 base key — **non-extractable by
 * construction**: the WebCrypto spec requires `extractable: false` for PBKDF2,
 * so `crypto.subtle.exportKey` on one of these always rejects.
 *
 * That property is the whole point. A `CryptoKey` is structured-cloneable, so
 * this can be parked in IndexedDB (`lib/syncKey.ts`) and used to derive the
 * AES key for any future salt **without the passphrase string ever being
 * written down anywhere**. It replaces `localStorage['bujo:sync']`, which held
 * the passphrase in the clear beside the ciphertext it opens (F-8).
 *
 * It is not a secret from script running on this origin — XSS can still *use*
 * it. It is a secret from anything that reads storage and leaves: a copied
 * profile, a `localStorage` dump, an export.
 */
export type PassKey = CryptoKey

/** Import a passphrase as a non-extractable PBKDF2 base key. */
export function importPassphrase(passphrase: string): Promise<PassKey> {
  return crypto.subtle.importKey('raw', enc.encode(passphrase) as BufferSource, 'PBKDF2', false, ['deriveKey'])
}

/** Accept either the passphrase or an already-imported base key. */
async function baseKey(secret: string | PassKey): Promise<PassKey> {
  return typeof secret === 'string' ? importPassphrase(secret) : secret
}

/** Derive an AES-GCM key from a passcode (or its base key) + salt. */
async function deriveKey(passcode: string | PassKey, salt: BufferSource): Promise<CryptoKey> {
  const base = await baseKey(passcode)
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
export async function encryptString(plaintext: string, passcode: string | PassKey): Promise<EncryptedBlob> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passcode, salt)
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext))
  return { v: 1, salt: b64(salt.buffer), iv: b64(iv.buffer), data: b64(ct) }
}

/** Decrypt a blob with a passcode. Throws on a wrong passcode (never wipes data). */
export async function decryptString(blob: EncryptedBlob, passcode: string | PassKey): Promise<string> {
  const salt = unb64(blob.salt) as BufferSource
  const iv = unb64(blob.iv) as BufferSource
  const key = await deriveKey(passcode, salt)
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, unb64(blob.data) as BufferSource)
  return dec.decode(pt)
}

export function isEncryptedBlob(x: unknown): x is EncryptedBlob {
  return !!x && typeof x === 'object' && (x as EncryptedBlob).v === 1 && 'data' in x && 'salt' in x && 'iv' in x
}
