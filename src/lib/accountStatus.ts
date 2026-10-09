// Where account sync actually is, for the whole app. COD-291.
//
// `AccountSync` held this in a `useState` and rendered `null`, so the one
// component that knew whether anything had been uploaded was also the one
// component that could not say so. Everything else guessed from
// `localStorage['bujo:sync']`, which is the *blob* sync passphrase and answers
// a different question.
//
// Same module-store shape as `authUser.ts`, and for the same reason: the
// writer (`AccountSync`, mounted once in `AppShell`) and the readers (the
// header menu, the Account page, the account card) are in different branches
// of the tree.
//
// `lastSyncedAt` is persisted. "Last synced 4 minutes ago" that resets to
// "never" on every reload is worse than no timestamp at all — it reads as a
// sync that failed. It is a millisecond epoch and nothing else, so it is not a
// secret and does not go near `forEgress`.
import { useSyncExternalStore } from 'react'
import type { AccountPhase } from './account'
import type { SyncState } from './bujocloud'

const LAST = 'bujo:account.lastSync'

export interface AccountStatus {
  phase: AccountPhase
  lastSyncedAt: number | null
  /** Photos dropped from the last push because they did not fit the budget. */
  photosSkipped: number
}

function storedLast(): number | null {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(LAST)
    const n = raw ? Number(raw) : NaN
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

let snapshot: AccountStatus = { phase: 'signed-out', lastSyncedAt: storedLast(), photosSkipped: 0 }
const listeners = new Set<() => void>()

/**
 * Move the status on. Partial, so a caller changing only the phase does not
 * have to restate a timestamp it knows nothing about.
 *
 * Writes `lastSyncedAt` through to `localStorage` whenever it is set, and
 * swallows the failure: a private window with storage blocked must not take
 * down the sync it is reporting on.
 */
export function setAccountStatus(next: Partial<AccountStatus>): void {
  const merged = { ...snapshot, ...next }
  if (next.lastSyncedAt != null && next.lastSyncedAt !== snapshot.lastSyncedAt) {
    try { localStorage?.setItem(LAST, String(next.lastSyncedAt)) } catch { /* storage blocked */ }
  }
  if (merged.phase === snapshot.phase
    && merged.lastSyncedAt === snapshot.lastSyncedAt
    && merged.photosSkipped === snapshot.photosSkipped) return
  const phaseMoved = merged.phase !== snapshot.phase
  snapshot = merged
  if (phaseMoved) pill(merged.phase)
  for (const fn of listeners) fn()
}

/**
 * Light the transient bottom-right pill, which already exists.
 *
 * `components/SyncIndicator.tsx` listens for `bujo:sync` and only
 * `lib/bujocloud.ts` ever fired it, so account sync — the newer of the two
 * mechanisms — was the one with no live feedback at all. Dispatched from here
 * rather than from `AccountSync` so the pill and this store cannot disagree:
 * one writer, one mapping, and a phase that moves without the pill following is
 * impossible rather than merely unlikely.
 *
 * The `SyncState` vocabulary is coarser than `AccountPhase` on purpose — the
 * pill is a glance, the card is the explanation.
 */
function pill(phase: AccountPhase): void {
  const state =
    phase === 'checking' || phase === 'uploading' ? 'syncing'
      : phase === 'synced' ? 'synced'
        : phase === 'locked' || phase === 'error' ? 'error'
          : null
  if (!state || typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('bujo:sync', { detail: state satisfies SyncState }))
}

/** A completed pull or push. One call so no caller can move the phase without the clock. */
export function markSynced(photosSkipped = 0, now = Date.now()): void {
  setAccountStatus({ phase: 'synced', lastSyncedAt: now, photosSkipped })
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

const read = () => snapshot

export function useAccountStatus(): AccountStatus {
  return useSyncExternalStore(subscribe, read, read)
}

/** Test seam — read without React, so a fresh module import can stand in for a reload. */
export function __peekForTest(): AccountStatus {
  return snapshot
}

/** Test seam. */
export function __resetAccountStatus(): void {
  snapshot = { phase: 'signed-out', lastSyncedAt: null, photosSkipped: 0 }
  for (const fn of listeners) fn()
}
