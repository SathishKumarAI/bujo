// Client-side key derivation and encryption for the journal (Web Crypto, local).
// PBKDF2(passcode) → AES-GCM. No key or passcode ever leaves the device.

const enc = new TextEncoder()
const dec = new TextDecoder()

/**
 * PBKDF2 rounds, per blob version. **Never change a row; add one.**
 *
 * A blob records the version it was written at, so the number used to encrypt
 * it stays available to decrypt it. Editing `1` in place would make every
 * journal already in `bujo:enc` or the sync blob undecryptable — a one-way
 * data loss with no error message beyond "wrong passcode".
 *
 * v1 was 150 000, which is below current guidance (OWASP: 600 000 for
 * PBKDF2-HMAC-SHA256) and was the weaker half of nothing — the *path code* in
 * `bujocloud` was one unsalted SHA-256 of the same passphrase, so the cheapest
 * attack was never against this key at all. See COD-267.
 *
 * Measured on this machine before choosing 600 000 (`crypto.subtle.deriveKey`,
 * median of 5): 150k → **15.0 ms**, 300k → **30.1 ms**, 600k → **59.3 ms**.
 * Linear, as expected. 59 ms sits inside a debounced background push, and the
 * path code — the other derivation per sync — is cached for the session, so the
 * bump costs one extra ~44 ms per push and ~59 ms once per session.
 */
const ROUNDS: Record<EncryptedBlob['v'], number> = { 1: 150_000, 2: 600_000 }
/** What new blobs are written at. */
const CURRENT = 2 as const

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
function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Derive an AES-GCM key from a passcode + salt at a given round count. */
async function deriveKey(passcode: string, salt: BufferSource, rounds: number): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', enc.encode(passcode) as BufferSource, 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: rounds, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export interface EncryptedBlob {
  v: 1 | 2
  salt: string // base64
  iv: string // base64
  data: string // base64 ciphertext
}

/** Encrypt a plaintext string with a passcode. Always writes the current version. */
export async function encryptString(plaintext: string, passcode: string): Promise<EncryptedBlob> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passcode, salt, ROUNDS[CURRENT])
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext))
  return { v: CURRENT, salt: b64(salt.buffer), iv: b64(iv.buffer), data: b64(ct) }
}

/**
 * Decrypt a blob with a passcode. Throws on a wrong passcode (never wipes data).
 *
 * The round count comes from the blob, which is what makes the v1→v2 bump a
 * lazy migration rather than an upgrade step: an old journal still opens, and
 * the next save rewrites it at the current version.
 */
export async function decryptString(blob: EncryptedBlob, passcode: string): Promise<string> {
  const rounds = ROUNDS[blob.v]
  // A version this build does not know is a blob from a NEWER client. Say so
  // rather than deriving at the wrong round count, which fails as "wrong
  // passcode" and sends the user looking for a password they typed correctly.
  if (!rounds) throw new Error(`Journal was encrypted by a newer version of bujo (v${blob.v}).`)
  const salt = unb64(blob.salt) as BufferSource
  const iv = unb64(blob.iv) as BufferSource
  const key = await deriveKey(passcode, salt, rounds)
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, unb64(blob.data) as BufferSource)
  return dec.decode(pt)
}

export function isEncryptedBlob(x: unknown): x is EncryptedBlob {
  if (!x || typeof x !== 'object') return false
  const b = x as EncryptedBlob
  return (b.v === 1 || b.v === 2) && 'data' in b && 'salt' in b && 'iv' in b
}

/**
 * Derive the sync **storage path** from the passphrase — 40 hex characters.
 *
 * This is the other job the one passphrase does, and before COD-267 it was done
 * by a single unsalted `SHA-256('bujo-sync:' + passphrase)`. That made the path
 * code, not the ciphertext, the cheapest attack on the passphrase by a factor
 * of 150 000 — and the path code is the half that **leaves the device**, in a
 * query string, into serverless access logs, CDN logs, browser history and
 * `Referer` headers.
 *
 * The salt is a fixed context string and has to be: the server must find the
 * blob knowing only what the client sends, and there is no account to hang a
 * per-user salt on. That is the real ceiling of a no-accounts design, so it is
 * written down rather than hidden — a fixed salt at 600 000 rounds is still
 * 600 000x the work of a bare hash, and it is rainbow-table-proof only in the
 * sense that no table exists for this context string.
 *
 * `deriveBits` rather than `deriveKey` because the output is an identifier, not
 * a key; 160 bits is exactly the 40 hex characters the endpoint validates.
 */
const CODE_CONTEXT = 'bujo-sync-path:v2'

export async function deriveCode(passphrase: string): Promise<string> {
  const base = await crypto.subtle.importKey('raw', enc.encode(passphrase) as BufferSource, 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(CODE_CONTEXT) as BufferSource, iterations: ROUNDS[CURRENT], hash: 'SHA-256' },
    base,
    160,
  )
  return hex(bits)
}

/**
 * The v1 path derivation, kept **only** so a journal already in the cloud can
 * be found and migrated. Never used to write.
 *
 * It is deliberately still here rather than deleted: the alternative is that
 * everyone syncing before this release silently gets "nothing stored for that
 * passphrase yet" and a fresh empty blob at the new path, which reads exactly
 * like their journal being gone. See `bujocloud.pullCloud`.
 */
export async function legacyCode(passphrase: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode('bujo-sync:' + passphrase))
  return hex(buf).slice(0, 40)
}
