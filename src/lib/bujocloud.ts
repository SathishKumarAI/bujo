// One-passphrase cloud sync against the project's own /api/sync (Vercel Blob).
// End-to-end encrypted: the journal is encrypted in the browser with the
// passphrase before upload, and the path is a *hash* of the passphrase — so the
// server (and anyone with the URL) only ever sees ciphertext. No accounts.
import { encryptString, decryptString } from './crypto'
import type { JournalData } from './types'

/** SHA-256 of the passphrase → the storage path code (never the key itself). */
async function pathCode(passphrase: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('bujo-sync:' + passphrase))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 40)
}

/** Encrypt + upload the journal under the passphrase. */
export async function pushCloud(passphrase: string, data: JournalData): Promise<void> {
  const code = await pathCode(passphrase)
  const blob = await encryptString(JSON.stringify(data), passphrase)
  const res = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, payload: JSON.stringify(blob) }),
  })
  if (!res.ok) throw new Error(`Cloud push failed (${res.status})`)
}

/** Download + decrypt the journal for the passphrase, or null if none stored. */
export async function pullCloud(passphrase: string): Promise<JournalData | null> {
  const code = await pathCode(passphrase)
  const res = await fetch(`/api/sync?code=${code}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Cloud pull failed (${res.status})`)
  const { payload } = await res.json()
  const blob = JSON.parse(payload)
  const json = await decryptString(blob, passphrase) // throws on wrong passphrase
  return JSON.parse(json) as JournalData
}
