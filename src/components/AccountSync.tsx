import { useCallback, useEffect, useRef, useState } from 'react'
import { useJournal } from '../store'
import { isConfigured, onAuthChange, pullAccount, pushAccount } from '../lib/supabase'
import { mayPush, onAccountChange, afterPull, isDemo, initialState, lastOwner, rememberOwner, UNUSABLE_MESSAGE, type AccountSyncState } from '../lib/accountSync'
import { setAccountStatus, markSynced } from '../lib/accountStatus'
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
    const id = setTimeout(async () => {
      try {
        setAccountStatus({ phase: 'uploading' })
        lastPushed.current = JSON.stringify(latest.current)
        const res = await pushAccount(latest.current, seenAt.current)

        if (!res.ok) {
          // ── Somebody else wrote this row since we last looked ───────────
          //
          // Not an error, and deliberately not reported as one: it is the
          // guard working. Before this, the account was the only network
          // writer in the app that did not compare — phone pulls at 09:00,
          // sits in a pocket while the laptop works all morning, then wakes
          // and overwrites the lot. No error, and the laptop's next pull
          // adopts the loss as the truth.
          //
          // Pull, union, and let the next change push the result. `migrate`
          // first because the other device may be on an older build, and
          // `resolveIncoming` because a union is exactly what two edits to one
          // journal want — the same machinery the sign-in path uses.
          const fresh = await pullAccount()
          seenAt.current = fresh.updatedAt
          if (fresh.journal) {
            const merged = await resolveIncoming(latest.current, migrate(fresh.journal), askRef.current)
            if (merged) replaceAll(merged)
          }
          // Clear the echo guard so the merged result is allowed to push.
          lastPushed.current = ''
          setAccountStatus({ phase: 'checking' })
          return
        }

        seenAt.current = res.updatedAt
        markSynced()
      } catch {
        // Offline, or the token expired past its refresh. The whole journal is
        // the payload, so the next change IS the retry queue — no queue needed.
        lastPushed.current = ''
        setAccountStatus({ phase: 'error' })
      }
    }, 4000)
    return () => clearTimeout(id)
  }, [data, state])

  return null
}
