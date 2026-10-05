// One-passphrase cloud sync against the project's own /api/sync (Vercel Blob).
// End-to-end encrypted: the journal is encrypted in the browser with the
// passphrase before upload, and the path is *derived* from the passphrase — so
// the server (and anyone with the URL) only ever sees ciphertext. No accounts.
import { encryptString, decryptString, deriveCode, legacyCode } from './crypto'
import { inlineImagesWithinBudget, notePhotosSkipped, externalizeImages } from './imageStore'
import type { JournalData } from './types'
import { forEgress } from './cyclePrivacy'

/** `photos-skipped` = the journal synced, but it was too big to carry its photos. */
export type SyncState = 'syncing' | 'synced' | 'error' | 'photos-skipped'
function emit(state: SyncState) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('bujo:sync', { detail: state }))
}

/**
 * Memoised path codes. `deriveCode` is 600 000 PBKDF2 rounds (~59 ms measured),
 * and auto-sync derives one on every pull and every push — so without this the
 * bump would cost ~120 ms per 4-second push cycle instead of ~59 ms once per
 * session.
 *
 * The map holds the passphrase as its key, which is a deliberate and small
 * trade: the passphrase is already a live string in this module's callers, and
 * with auto-sync on it sits in `localStorage['bujo:sync']` in plaintext anyway
 * (see docs/AUTH.md). The exposure this change is about is a code written into
 * someone else's log, not a heap dump.
 */
const codes = new Map<string, string>()
async function pathCode(passphrase: string): Promise<string> {
  const hit = codes.get(passphrase)
  if (hit) return hit
  const code = await deriveCode(passphrase)
  codes.set(passphrase, code)
  return code
}

/**
 * Read the payload stored at a code, or null when there is nothing there.
 *
 * The code goes in a **header**, not the query string. It is a secret in the
 * sense that matters — possession of it is what makes the passphrase cheap to
 * attack — and a query string is the one place a secret is guaranteed to be
 * written down by somebody else: serverless access logs, CDN logs, browser
 * history, `Referer`. The endpoint still reads `?code=` so a bundle cached
 * before this release keeps working; that fallback is marked for removal in
 * `api/sync.ts`.
 */
async function readAt(code: string): Promise<string | null> {
  const res = await fetch('/api/sync', { headers: { 'x-sync-code': code } })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Cloud pull failed (${res.status})`)
  const { payload } = await res.json()
  return payload as string
}

async function writeAt(code: string, payload: string): Promise<void> {
  const res = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, payload }),
  })
  if (!res.ok) throw new Error(`Cloud push failed (${res.status})`)
}

/** Encrypt + upload the journal under the passphrase. */
export async function pushCloud(passphrase: string, data: JournalData): Promise<void> {
  emit('syncing')
  try {
    const code = await pathCode(passphrase)
    // Inline photos so their bytes actually travel — but only within the budget
    // Vercel's 4.5 MB body limit allows. Over it, the journal still syncs and
    // the photos stay behind, which beats the whole push failing.
    // `forEgress` drops the cycle log and this device's sync secrets — see
    // lib/cyclePrivacy. Applied BEFORE image inlining so a withheld domain
    // never reaches the encryptor at all, rather than being encrypted and then
    // regretted. The secrets matter here even though the blob is encrypted:
    // two people sharing one passphrase share the journal, and a journal
    // carrying `githubToken` would hand over a PAT with it.
    const { payload: toSend, skipped } = await inlineImagesWithinBudget(forEgress(data))
    const blob = await encryptString(JSON.stringify(toSend), passphrase)
    await writeAt(code, JSON.stringify(blob))
    if (skipped) notePhotosSkipped(skipped)
    else emit('synced')
  } catch (e) { emit('error'); throw e }
}

/**
 * Download + decrypt the journal for the passphrase, or null if none stored.
 *
 * Tries the current path, then the v1 one. A journal synced before COD-267
 * lives at `SHA-256('bujo-sync:' + passphrase)`, and without this fallback its
 * owner would be told "nothing stored for that passphrase yet" and handed a
 * fresh empty blob at the new path — which from the chair is indistinguishable
 * from their journal having been deleted.
 *
 * On a v1 hit it re-pushes to the new path, best-effort: the pull has already
 * succeeded by then, so a failed migration must not turn a good read into an
 * error. The next pull tries again.
 *
 * **The old blob is deliberately left where it is** — a change from
 * `docs/security/sync-hardening-plan.md` §3, which said to delete it, and worth
 * saying why. Deleting would not undo the exposure: the weak code is derivable
 * from the passphrase whether or not a blob answers at it, so an attacker
 * holding a leaked v1 code can attack the passphrase offline with no ciphertext
 * at all. What deletion *would* cost is an unauthenticated DELETE on this
 * endpoint — strictly more destructive power than the overwrite COD-266 just
 * finished making recoverable. The real remedy for a suspected leak is a new
 * passphrase, which is already a new code and a new blob. One consequence to
 * keep in mind: the v1 blob stays decryptable by the OLD passphrase forever, so
 * rotating is not erasing.
 */
export async function pullCloud(passphrase: string): Promise<JournalData | null> {
  const code = await pathCode(passphrase)
  let payload = await readAt(code)
  let migrating = false
  if (payload == null) {
    payload = await readAt(await legacyCode(passphrase))
    if (payload == null) return null
    migrating = true
  }
  const blob = JSON.parse(payload)
  const json = await decryptString(blob, passphrase) // throws on wrong passphrase
  const data = await externalizeImages(JSON.parse(json) as JournalData)
  if (migrating) {
    // Re-encrypt rather than move the bytes: the payload was written at blob v1
    // (150 000 rounds), and copying it unchanged would carry that round count
    // to the new path and quietly keep half of what this change is for.
    try { await writeAt(code, JSON.stringify(await encryptString(json, passphrase))) }
    catch { /* the read succeeded; the next pull will try the move again */ }
  }
  return data
}
