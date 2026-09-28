/**
 * Where auto-sync keeps its secret — and what it stopped keeping.
 *
 * This module owns two things and nothing else: the **non-extractable PBKDF2
 * key** derived from the sync passphrase, and the **locator** that addresses
 * the blob it encrypts. It does not know the wire protocol (`bujocloud.ts`) and
 * it does not know the journal.
 *
 * ## What changed, and why (F-8)
 *
 * Auto-sync used to store the passphrase itself, in the clear, at
 * `localStorage['bujo:sync']` — beside `bujo:enc`, the ciphertext it opens. A
 * passcode-locked journal was therefore locked in form only: read that one
 * string, call `pullCloud`, get the journal in cleartext. `docs/AUTH.md` has
 * the measured storage dump.
 *
 * Now:
 *
 * | Stored | Where | What it gives an attacker who reads it |
 * |---|---|---|
 * | PBKDF2 base key, `extractable: false` | IndexedDB `bujo-keys` | Nothing they can carry away. `exportKey` rejects; it can only be *used*, on this origin, in this browser profile |
 * | Locator (`bujo:sync-code`) | `localStorage` | The ciphertext. Not the key |
 *
 * The locator was never a secret from the server — it is the URL every request
 * already sends. Keeping it in the clear while the key is not is the whole
 * trade: a storage dump now yields an encrypted blob instead of a journal.
 *
 * **Not solved, and it cannot be.** Script running on this origin can still
 * call `crypto.subtle.decrypt` with the stored key and read everything. A
 * browser cannot keep a secret from someone holding the unlocked device. What
 * this buys is that the secret cannot *leave*: no copied profile, no
 * `localStorage` dump, no export, and no offline attack on a passphrase people
 * reuse elsewhere.
 */
import { importPassphrase, type PassKey } from './crypto'

/** The blob locator. Non-secret — it is the path every request already sends. */
export const SYNC_CODE_KEY = 'bujo:sync-code'
/** RETIRED. The passphrase in plaintext. Read once, migrated, then deleted. */
export const LEGACY_SYNC_KEY = 'bujo:sync'

const DB = 'bujo-keys'
const STORE = 'keys'
const ENTRY = 'sync'

/**
 * SHA-256 of the passphrase → the storage path code.
 *
 * Lives here rather than in `bujocloud.ts` because it is the *other* thing
 * derived from the passphrase, and the two have to be minted and forgotten
 * together. A stored key with no locator syncs nothing; a stored locator with
 * no key fetches a blob it cannot open.
 */
export async function pathCode(passphrase: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('bujo-sync:' + passphrase))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 40)
}

// ── Key storage ──────────────────────────────────────────────────────────────
//
// A local IndexedDB rather than the generic helper this repo does not have.
// `fscloud.ts` and `imageStore.ts` each carry their own copy of this ceremony
// for their own database; unifying the three would mean rewiring the photo
// store, which is the one place in the app where a mistake loses bytes that
// cannot be re-taken. Not worth it for twenty lines.
//
// ponytail: local IDB wrapper; fold into a shared lib/idb.ts if a fourth
// database appears.

/** Memory fallback for engines with no IndexedDB (Safari private mode, jsdom). */
let memoryKey: PassKey | null = null

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

const hasIdb = () => typeof indexedDB !== 'undefined'

async function putKey(key: PassKey): Promise<void> {
  if (!hasIdb()) { memoryKey = key; return }
  const db = await idb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    // Throws DataCloneError on an engine that refuses to serialise a CryptoKey.
    // Let it: the caller turns that into a visible refusal, never a silent
    // fallback to storing the passphrase.
    tx.objectStore(STORE).put(key, ENTRY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error ?? new Error('key store aborted'))
  })
}

async function getKey(): Promise<PassKey | null> {
  if (!hasIdb()) return memoryKey
  try {
    const db = await idb()
    return await new Promise<PassKey | null>((resolve) => {
      const tx = db.transaction(STORE, 'readonly')
      const r = tx.objectStore(STORE).get(ENTRY)
      r.onsuccess = () => resolve((r.result as PassKey | undefined) ?? null)
      r.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

async function delKey(): Promise<void> {
  memoryKey = null
  if (!hasIdb()) return
  try {
    const db = await idb()
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(ENTRY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch { /* nothing stored */ }
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Both halves auto-sync needs. Null when auto-sync is off or the key is gone. */
export interface SyncSecret { key: PassKey; code: string }

/**
 * Both halves, derived and **not stored** — for a one-shot Push or Pull the
 * user is watching. Nothing is left behind afterwards, which is what keeps
 * manual sync the combination that does not defeat the passcode lock.
 */
export async function deriveSync(passphrase: string): Promise<SyncSecret> {
  return { key: await importPassphrase(passphrase), code: await pathCode(passphrase) }
}

/**
 * Turn auto-sync on: derive both halves, store the key non-extractably and the
 * locator in the clear.
 *
 * **The passphrase is not stored and cannot be read back off this device.**
 * Callers must say so — this is the one behaviour change a user can notice.
 *
 * Throws if the key could not be stored. Deliberately loud: the alternative is
 * a silent fall back to the plaintext key this exists to remove.
 */
export async function rememberSync(passphrase: string): Promise<SyncSecret> {
  const secret = await deriveSync(passphrase)
  await putKey(secret.key)
  localStorage.setItem(SYNC_CODE_KEY, secret.code)
  return secret
}

/** The stored secret, or null. Both halves or neither — a half is not usable. */
export async function loadSync(): Promise<SyncSecret | null> {
  const code = localStorage.getItem(SYNC_CODE_KEY)
  if (!code) return null
  const key = await getKey()
  if (!key) return null
  return { key, code }
}

/**
 * Is auto-sync configured? Synchronous, for render paths that cannot await.
 *
 * Reads the locator only, so it can be true while {@link loadSync} returns null
 * — a browser that cleared IndexedDB but kept `localStorage`. That state is
 * visible rather than hidden: the sync effect reports it and the card asks for
 * the passphrase again.
 */
export function hasSync(): boolean {
  return typeof localStorage !== 'undefined' && !!localStorage.getItem(SYNC_CODE_KEY)
}

/** Turn auto-sync off. Removes both halves. */
export async function forgetSync(): Promise<void> {
  localStorage.removeItem(SYNC_CODE_KEY)
  localStorage.removeItem(LEGACY_SYNC_KEY)
  await delKey()
}

/**
 * One-way door, run once on load: move `bujo:sync` out of plaintext.
 *
 * Idempotent and resumable — it keys on the legacy value still being present,
 * and only removes it **after** the replacement reads back. A crash between
 * the two leaves both, and the next load finishes the job. Re-running it on an
 * already-migrated journal is a no-op.
 *
 * Returns what happened so the caller can tell the user once. It matters: after
 * this the passphrase is gone from the device, and someone who never wrote it
 * down has lost their only copy of it. The journal is not at risk — it is
 * canonical in `localStorage` — but the cloud copy becomes unreadable from a
 * *new* device without it.
 */
export async function migrateLegacySync(): Promise<'none' | 'migrated' | 'failed'> {
  if (typeof localStorage === 'undefined') return 'none'
  const pass = localStorage.getItem(LEGACY_SYNC_KEY)
  if (!pass) return 'none'
  try {
    await rememberSync(pass)
    if (!(await loadSync())) return 'failed' // read-back failed → keep the legacy key
    localStorage.removeItem(LEGACY_SYNC_KEY)
    return 'migrated'
  } catch {
    return 'failed'
  }
}
