// The cloud sync passphrase, and where it is allowed to live (COD-228).
//
// ── The hole this closes ───────────────────────────────────────────────────
//
// Auto-sync needs the passphrase on every push, including after a reload, so
// it was written to `localStorage['bujo:sync']` **in plaintext**. Separately,
// the passcode lock encrypts the journal at rest into `bujo:enc` and deletes
// the plaintext `bujo:data`.
//
// Those two features contradict each other, and the contradiction is worse
// than "a key in the clear". The passphrase is not just a local key: the cloud
// copy at `/api/sync` is encrypted with the SAME passphrase, and its storage
// path is *derived* from it. So anyone with the locked device could read
// `bujo:sync`, derive the path, download the blob and decrypt it — obtaining a
// byte-identical copy of the journal the passcode was protecting, without ever
// attacking the passcode. **The lock guarded the front door and this left the
// back one open.**
//
// ── What happens now ───────────────────────────────────────────────────────
//
// | passcode set | where the passphrase lives                                |
// |--------------|------------------------------------------------------------|
// | no           | `bujo:sync`, plaintext — unchanged, and fine: nothing else |
// |              | on the device is protected either, so there is no lock to  |
// |              | contradict. Pretending otherwise would be theatre.         |
// | yes          | `bujo:sync.enc`, encrypted under the PASSCODE, plus an     |
// |              | in-memory copy that exists only while unlocked.            |
//
// So with a passcode, a stolen device yields ciphertext twice over: the
// journal needs the passcode, and the passphrase that would fetch the remote
// copy needs the same passcode.
//
// ── The cost, stated ───────────────────────────────────────────────────────
//
// Auto-sync no longer runs while the app is locked. That is not a regression
// to work around — it is the feature being honest. A journal you have locked
// should not be shipping itself anywhere until you unlock it.
import { encryptString, decryptString, isEncryptedBlob } from './crypto'

/** Plaintext key. Only written when NO passcode is set. */
const PLAIN = 'bujo:sync'
/** Passcode-encrypted key. Only written when a passcode IS set. */
const SEALED = 'bujo:sync.enc'

/**
 * The decrypted passphrase for this session, when a passcode is in play.
 *
 * Module scope rather than `sessionStorage`: `sessionStorage` survives a
 * reload and is readable by any script on the origin, which is most of what
 * we are trying to stop. A module variable dies with the tab, which is exactly
 * the lifetime "unlocked" is supposed to have.
 */
let inMemory: string | null = null

function ls(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

/** Is auto-sync switched on at all, locked or not? */
export function autoSyncEnabled(): boolean {
  const s = ls()
  return !!s && (s.getItem(PLAIN) != null || s.getItem(SEALED) != null)
}

/**
 * The passphrase to sync with, or null when there is none *available*.
 *
 * Null has two meanings and the caller does not need to tell them apart: no
 * auto-sync configured, or configured but still locked. Both mean "do not
 * sync now", which is the only decision a caller makes with this.
 */
export function getSyncPassphrase(): string | null {
  if (inMemory) return inMemory
  const s = ls()
  return s?.getItem(PLAIN) ?? null
}

/**
 * Turn auto-sync on, storing the passphrase as safely as the device allows.
 *
 * `passcode` is the live passcode when the journal is locked-at-rest, else
 * null. It is NOT stored — only used as the key.
 */
export async function setSyncPassphrase(passphrase: string, passcode: string | null): Promise<void> {
  const s = ls()
  if (!s) return
  inMemory = passphrase
  if (passcode) {
    const blob = await encryptString(passphrase, passcode)
    s.setItem(SEALED, JSON.stringify(blob))
    // Belt and braces: a journal that had auto-sync on BEFORE a passcode was
    // set still has the plaintext key sitting there. Setting a passcode has to
    // clean it up, or the fix only protects new users.
    s.removeItem(PLAIN)
  } else {
    s.setItem(PLAIN, passphrase)
    s.removeItem(SEALED)
  }
}

/** Switch auto-sync off and forget the passphrase everywhere. */
export function clearSyncPassphrase(): void {
  inMemory = null
  const s = ls()
  s?.removeItem(PLAIN)
  s?.removeItem(SEALED)
}

/**
 * Called on unlock: recover the passphrase into memory for this session.
 *
 * Silent on failure by design. A wrong passcode cannot reach here (the journal
 * would not have decrypted either), so a failure means the sealed blob is
 * corrupt or from an older format — and the right behaviour then is "auto-sync
 * is off until you re-enter it", not an error dialog over a journal that
 * opened perfectly well.
 */
export async function unsealSyncPassphrase(passcode: string): Promise<void> {
  const s = ls()
  const raw = s?.getItem(SEALED)
  if (!raw) return
  try {
    const blob = JSON.parse(raw)
    if (!isEncryptedBlob(blob)) return
    inMemory = await decryptString(blob, passcode)
  } catch {
    inMemory = null
  }
}

/**
 * Called when a passcode is set on a journal that already had auto-sync on:
 * re-seal the plaintext key under it. Without this the migration path leaves
 * the very file this module exists to remove.
 */
export async function resealForNewPasscode(passcode: string | null): Promise<void> {
  const s = ls()
  if (!s) return
  const current = getSyncPassphrase() ?? s.getItem(PLAIN)
  if (!current) return
  await setSyncPassphrase(current, passcode)
}

/** Test seam. */
export function __resetSyncSecret(): void {
  inMemory = null
}
