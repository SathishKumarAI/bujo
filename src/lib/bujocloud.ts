// One-passphrase cloud sync against the project's own /api/sync (Vercel Blob).
// End-to-end encrypted: the journal is encrypted in the browser before upload,
// and the path is a *hash* of the passphrase — so the server (and anyone with
// the URL) only ever sees ciphertext.
//
// This module no longer takes a passphrase. It takes a {@link SyncSecret}: the
// non-extractable PBKDF2 key and the locator, both minted by `lib/syncKey.ts`.
// That is what lets auto-sync run without the passphrase string existing
// anywhere on disk (F-8) — the key can encrypt and decrypt, and cannot be read
// out or turned back into the passphrase.
import { encryptString, decryptString } from './crypto'
import { inlineImagesWithinBudget, notePhotosSkipped, externalizeImages } from './imageStore'
import type { SyncSecret } from './syncKey'
import type { JournalData } from './types'

/** `photos-skipped` = the journal synced, but it was too big to carry its photos. */
export type SyncState = 'syncing' | 'synced' | 'error' | 'photos-skipped'
function emit(state: SyncState) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('bujo:sync', { detail: state }))
}

/** Encrypt + upload the journal under the sync secret. */
export async function pushCloud({ key, code }: SyncSecret, data: JournalData): Promise<void> {
  emit('syncing')
  try {
    // Inline photos so their bytes actually travel — but only within the budget
    // Vercel's 4.5 MB body limit allows. Over it, the journal still syncs and
    // the photos stay behind, which beats the whole push failing.
    const { payload: toSend, skipped } = await inlineImagesWithinBudget(data)
    const blob = await encryptString(JSON.stringify(toSend), key)
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, payload: JSON.stringify(blob) }),
    })
    if (!res.ok) throw new Error(`Cloud push failed (${res.status})`)
    if (skipped) notePhotosSkipped(skipped)
    else emit('synced')
  } catch (e) { emit('error'); throw e }
}

/** Download + decrypt the journal for the sync secret, or null if none stored. */
export async function pullCloud({ key, code }: SyncSecret): Promise<JournalData | null> {
  const res = await fetch(`/api/sync?code=${code}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Cloud pull failed (${res.status})`)
  const { payload } = await res.json()
  const blob = JSON.parse(payload)
  const json = await decryptString(blob, key) // throws on the wrong key
  return externalizeImages(JSON.parse(json) as JournalData)
}
