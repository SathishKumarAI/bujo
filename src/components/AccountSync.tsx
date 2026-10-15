import { useCallback, useEffect, useRef, useState } from 'react'
import { useJournal } from '../store'
import { isConfigured, onAuthChange, pullAccount, pushAccount } from '../lib/supabase'
import { mayPush, onAccountChange, afterPull, isDemo, initialState, lastOwner, rememberOwner, UNUSABLE_MESSAGE, type AccountSyncState } from '../lib/accountSync'
import { setAccountStatus, markSynced, markDirty, clearDirty } from '../lib/accountStatus'
import { resolveIncoming, CONFLICT_PROMPT } from '../lib/conflict'
import { useConfirm } from './ConfirmDialog'
import { migrate, emptyJournal } from '../lib/storage'
import { notify } from '../lib/notify'

/**
 * Account sync glue: pull the account's journal on sign-in, push it debounced
 * on change. No-op unless a Supabase project is configured AND someone is
 * signed in.
 *
 * Every decision this makes lives in `lib/accountSync.ts` as a pure function,
 * tested there. This file is the wiring, and deliberately holds no judgement of
 * its own — the judgements are the data-loss ones and they belong somewhere a
 * test can reach without a browser.
 *
 * ── There is no passphrase on this path any more ───────────────────────────
 *
 * COD-309. This component used to read `bujo:sync` and idle when there was
 * none, which made "signed in and nothing ever uploads" the default state of a
 * new account. Signing in is now the whole of the setup.
 *
 * `bujo:sync` still exists and still belongs to the **blob sync** — the
 * self-host / bring-your-own-storage target in `lib/bujocloud.ts`, which is
 * still end-to-end encrypted and still asks for a passphrase. The two targets
 * were sharing one secret; they no longer share anything, which is the honest
 * shape: one is an account, the other is a shared secret.
 */
export function AccountSync() {
  const { data, replaceAll } = useJournal()
  const confirm = useConfirm()
  const [state, setState] = useState<AccountSyncState>(initialState)
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])
  const latest = useRef(data)
  useEffect(() => { latest.current = data })

  const askConflict = useCallback(() => confirm({ ...CONFLICT_PROMPT, destructive: true }), [confirm])
  const askRef = useRef(askConflict)
  useEffect(() => { askRef.current = askConflict }, [askConflict])
  /**
   * Same reason as `askRef` directly above: the debounced push needs
   * `replaceAll` to apply a merge after a stale write, and listing it in that
   * effect's deps would re-run the effect — and so clear the pending
   * timeout — on every render where the store hands back a new identity. A
   * four-second debounce that restarts on each keystroke never fires.
   */
  const replaceAllRef = useRef(replaceAll)
  useEffect(() => { replaceAllRef.current = replaceAll }, [replaceAll])

  // ── Sign-in / sign-out / account switch ──────────────────────────────────
  useEffect(() => {
    if (!isConfigured()) return
    return onAuthChange((user) => {
      // The persisted owner is what makes `alice -> sign out -> bob` and
      // `alice -> reload -> bob` detectable. In-memory state is null in both.
      const { state: next, discardLocal } = onAccountChange(stateRef.current, user?.id ?? null, lastOwner())
      setState(next)
      // Sign-out deliberately does NOT forget the owner: the journal on this
      // device still belongs to whoever was last signed in, and that is
      // precisely the fact the next sign-in has to check against. It is
      // cleared by the full erase, which sweeps the `bujo:` prefix.
      if (!user) { setAccountStatus({ phase: 'signed-out' }); return }
      // A DIFFERENT account on the same device. The local journal belongs to
      // whoever was signed in before, and merging it into this account is
      // COD-135 — which shipped. Drop it, then read the new account's row.
      if (discardLocal) replaceAll(emptyJournal())
      // Claim the journal for this account before the pull. If the tab dies
      // mid-request, the next load still knows whose data is on disk — and
      // recording it only on success is what would leave that window open.
      rememberOwner(user.id)

      setAccountStatus({ phase: 'checking' })
      void (async () => {
        try {
          const { journal: remote, updatedAt } = await pullAccount()
          // The stamp the next push will send back as `ifUnchangedSince`. Held
          // in a ref rather than state: the push effect reads it inside a
          // timeout, where a stale closure over state would send a stamp from
          // before the pull and make every write look conflicted.
          seenAt.current = updatedAt
          if (remote == null) {
            // Row empty: first sign-in for this account. The local journal is
            // the only copy, so it is the one to keep and upload.
            setState((s) => afterPull(s, { row: 'empty' }))
            // Not `markSynced` — nothing has crossed the wire yet. The push
            // effect below is what will, and it is what stamps the clock.
            setAccountStatus({ phase: 'uploading' })
            return
          }
          const merged = discardLocal
            // Nothing local worth keeping — it was someone else's.
            ? migrate(remote)
            : await resolveIncoming(latest.current, migrate(remote), askRef.current)
          if (merged) replaceAll(merged)
          setState((s) => afterPull(s, { row: 'read' }))
          markSynced()
        } catch {
          // A throw here is "I could not read the row", never "the row is
          // empty". `pullAccount` is written so those two are distinguishable
          // — null for absent, a throw for anything else — because collapsing
          // them here would upload over a journal we failed to fetch.
          setState((s) => afterPull(s, { row: 'unreadable' }))
          setAccountStatus({ phase: 'unusable' })
          notify.error('Nothing was uploaded', UNUSABLE_MESSAGE)
        }
      })()
    })
  }, [replaceAll])

  // ── Debounced push ───────────────────────────────────────────────────────
  const lastPushed = useRef('')
  /**
   * The server stamp on the row as this device last saw it.
   *
   * `null` means "there was no row when I pulled", which is what tells
   * `pushAccount` to insert rather than update. Every successful write
   * replaces it with the stamp the server chose — never with a local clock,
   * because the `journals_touch_updated_at` trigger exists precisely so the
   * ordering is not decided by whichever device is furthest ahead.
   */
  const seenAt = useRef<string | null>(null)
  /** One writer at a time. A retry trigger during a push must not start a second. */
  const inFlight = useRef(false)

  /**
   * The actual write, callable from more than one trigger.
   *
   * This used to live inside the debounce timer, which made the debounce the
   * ONLY way a push could happen. The comment in its catch said so out loud —
   * "the next change IS the retry queue, no queue needed" — and that is true
   * only if there is a next change. Edit on a plane, close the laptop, land,
   * reopen: the journal is dirty, the network is back, and nothing sends until
   * you happen to type something. A sync you trigger by accident is not a sync.
   *
   * Hoisted out, it can be driven by the debounce, by reconnecting, by the tab
   * becoming visible, and by the page being hidden. `useCallback` with an empty
   * dep list plus refs for everything mutable, so its identity never changes
   * and the listeners below never re-bind.
   */
  type PushReason = 'debounce' | 'online' | 'visible' | 'pagehide'
  /**
   * The implementation lives behind a ref, assigned in an effect.
   *
   * Not a `useCallback`: `react-hooks/immutability` refuses a ref write inside
   * one, and this function must write four of them (`seenAt`, `lastPushed`,
   * `inFlight`, and the merged journal). An effect is where a mutation is
   * allowed, and it is the idiom this file already uses for `askRef` and
   * `replaceAllRef` — so the identity the listeners below bind to is stable
   * for the component's whole life and can never close over a stale value.
   */
  const pushRef = useRef<(reason: PushReason) => Promise<void>>(async () => {})
  useEffect(() => {
    pushRef.current = async (reason: PushReason) => {
      if (!isConfigured()) return
      if (inFlight.current) return
      if (!mayPush(stateRef.current, { isDemo: isDemo(latest.current) })) return

      const snapshot = JSON.stringify(latest.current)
      // Nothing has changed since the last successful write. A retry trigger
      // firing on an unchanged journal should do nothing, rather than rewrite the
      // same bytes on every tab focus.
      if (snapshot === lastPushed.current) return

      inFlight.current = true
      try {
        setAccountStatus({ phase: 'uploading' })
        lastPushed.current = snapshot
        const res = await pushAccount(latest.current, seenAt.current)

        if (!res.ok) {
          // Somebody else wrote this row since we last looked. Not an error, and
          // deliberately not reported as one: it is the guard working. Pull,
          // union, and let the result push. `migrate` first because the other
          // device may be on an older build.
          const fresh = await pullAccount()
          seenAt.current = fresh.updatedAt
          if (fresh.journal) {
            const merged = await resolveIncoming(latest.current, migrate(fresh.journal), askRef.current)
            if (merged) replaceAllRef.current(merged)
          }
          lastPushed.current = '' // the merged result still needs sending
          setAccountStatus({ phase: 'checking' })
          return
        }

        seenAt.current = res.updatedAt
        clearDirty()
        markSynced()
      } catch {
        // Offline, or the token expired past its refresh. Record that there is
        // unsent work so a reconnect can act without waiting for the user to
        // type. `reason` is read only by the dev log below.
        void reason
        lastPushed.current = ''
        markDirty()
        setAccountStatus({ phase: 'error' })
      } finally {
        inFlight.current = false
      }
    }
  })

  /**
   * The triggers that are NOT "the user typed".
   *
   * Each is a moment when a previously impossible push becomes possible, and
   * none of them involve the journal changing:
   *
   *   online            the network came back
   *   visibilitychange  the tab was focused again, which on a phone is the
   *                     same event as the app being reopened
   *   pagehide          last chance before the tab goes. Deliberately not
   *                     `beforeunload`, which does not fire on a mobile tab
   *                     discard — exactly when a journal is most at risk.
   *
   * Bound once: `pushNow` has a stable identity and reads everything mutable
   * through refs, so these never re-bind and cannot hold a stale closure.
   */
  useEffect(() => {
    if (!isConfigured()) return
    const onOnline = () => { void pushRef.current('online') }
    const onVisible = () => { if (document.visibilityState === 'visible') void pushRef.current('visible') }
    const onHide = () => { void pushRef.current('pagehide') }
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pagehide', onHide)
    return () => {
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pagehide', onHide)
    }
  }, [])

  useEffect(() => {
    if (!isConfigured()) return
    if (!mayPush(state, { isDemo: isDemo(data) })) {
      // Every refusal here is silent by design — `mayPush` answers "no" to
      // every unknown — and silence is exactly what made this feature look
      // broken. One refusal is left that a signed-in user can sit in
      // indefinitely without being told, so it is named; `unusable` has
      // already published its own phase on the pull path, and the rest resolve
      // themselves within a tick.
      if (state.userId && isDemo(data)) setAccountStatus({ phase: 'demo' })
      return
    }
    const snapshot = JSON.stringify(data)
    if (snapshot === lastPushed.current) return // echo guard: we just applied this
    // There is unsent work from this moment until a push succeeds. Recorded
    // before the wait, not after it, so a tab closed during those four seconds
    // still leaves the next load knowing.
    markDirty()
    const id = setTimeout(() => { void pushRef.current('debounce') }, 4000)
    return () => clearTimeout(id)
  }, [data, state])

  return null
}
