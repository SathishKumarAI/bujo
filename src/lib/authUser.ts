// THE signed-in user, for the whole app. One subscription. COD-291.
//
// ── What this replaces ─────────────────────────────────────────────────────
//
// `AccountCard` owned the only copy of "who is signed in", in a `useState` fed
// by its own `currentUser()` + `onAuthChange()` effect. That is why signing in
// changed one card and nothing else: the header menu, the Account page's
// orientation bar and the sync indicator had no way to ask.
//
// COD-134 is the same bug one component over, and it was closed by adding
// `onAuthChange` — to the card. The header it was filed about still read the
// local profile. A fix that adds a subscription to one consumer does not make
// the state shared; it makes a second private copy possible.
//
// ── Why a module store and not a context ───────────────────────────────────
//
// A `useAuth()` backed by a provider would need the provider mounted above
// every consumer, and one of the consumers is the header inside `AppShell`
// while another is a card rendered by a lazily-imported view. A module-level
// store with `useSyncExternalStore` has no provider to forget, cannot throw
// "used outside its provider", and gives every consumer the same object in the
// same tick. The journal store is a context because it is per-tree state; the
// signed-in user is per-*tab*, so this is the honest shape for it.
//
// The Supabase subscription is opened on the first `subscribe` and never torn
// down. Deliberate: it lives as long as the tab, like the session it tracks,
// and an unsubscribe on the last consumer's unmount would mean a sign-in during
// a view transition goes unheard.
import { useSyncExternalStore } from 'react'
import { isConfigured, currentUser, onAuthChange, type User } from './supabase'

export interface AuthSnapshot {
  user: User | null
  /**
   * Has the session been resolved yet?
   *
   * The distinction matters for copy: `false` means "we do not know", and a
   * surface that renders "this device only" while still `false` flashes the
   * signed-out answer at a signed-in user on every reload. Starts `true` when
   * unconfigured, because then the answer is known immediately and final.
   */
  ready: boolean
}

let snapshot: AuthSnapshot = { user: null, ready: false }
const listeners = new Set<() => void>()
let started = false
/** Has the live subscription spoken yet? Distinct from `ready` — see `start`. */
let heard = false

function publish(next: AuthSnapshot) {
  snapshot = next
  for (const fn of listeners) fn()
}

function start() {
  if (started) return
  started = true
  // Unconfigured builds know the answer immediately and finally: no project, no
  // session, ever. Resolved here rather than in the initialiser above because
  // `isConfigured()` reads `import.meta.env` and a module-load-time answer
  // cannot be re-asked — which is exactly how a test that configures the
  // feature after importing this module would get a permanently stale `ready`.
  if (!isConfigured()) { publish({ user: null, ready: true }); return }
  // Both halves, for the reason `AccountCard`'s comment gave: the one-shot
  // catches a session restored from storage on this very mount, the
  // subscription catches a sign-in that happens later.
  //
  // `heard` is the race between them, and it has to be its own flag rather than
  // `ready`: `onAuthStateChange` fires `INITIAL_SESSION` almost immediately and
  // usually wins, and a `currentUser()` promise resolving after it must not
  // overwrite the newer answer with the older one.
  void currentUser()
    .then((u) => { if (!heard) publish({ user: u, ready: true }) })
    .catch(() => { if (!heard) publish({ user: null, ready: true }) })
  onAuthChange((u) => { heard = true; publish({ user: u, ready: true }) })
}

function subscribe(fn: () => void): () => void {
  start()
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

const read = () => snapshot

/** The signed-in user and whether we know yet. Identical object for every caller. */
export function useAuthUser(): AuthSnapshot {
  return useSyncExternalStore(subscribe, read, read)
}

/** Test seam — drive the store directly, without a client. */
export function __setAuthSnapshot(next: AuthSnapshot): void {
  heard = true
  publish(next)
}

/** Test seam — back to "nothing asked yet", so the next mount re-subscribes. */
export function __resetAuthUser(): void {
  started = false
  heard = false
  publish({ user: null, ready: false })
}
