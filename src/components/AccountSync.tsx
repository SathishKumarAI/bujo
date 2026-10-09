import { getSyncPassphrase } from '../lib/syncSecret'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useJournal } from '../store'
import { isConfigured, onAuthChange, pullAccount, pushAccount } from '../lib/supabase'
import { mayPush, onAccountChange, afterPull, isDemo, initialState, MISMATCH_MESSAGE, type AccountSyncState } from '../lib/accountSync'
import { setAccountStatus, markSynced } from '../lib/accountStatus'
import { resolveIncoming, CONFLICT_PROMPT } from '../lib/conflict'
import { useConfirm } from './ConfirmDialog'
import { migrate, emptyJournal } from '../lib/storage'
import { notify } from '../lib/notify'

/**
 * Account sync glue: pull the account's journal on sign-in, push it debounced
 * on change. No-op unless a Supabase project is configured AND someone is
 * signed in AND a passphrase exists.
 *
 * Every decision this makes lives in `lib/accountSync.ts` as a pure function,
 * tested there. This file is the wiring, and deliberately holds no judgement of
 * its own — the judgements are the data-loss ones and they belong somewhere a
 * test can reach without a browser.
 *
 * ── The passphrase ─────────────────────────────────────────────────────────
 *
 * The same `bujo:sync` passphrase the blob sync uses, on purpose. Two cloud
 * targets with two secrets is two things to lose, and the account card already
 * tells the user "your sync passphrase is what opens it". Set it in
 * Settings → Sync & privacy. Without one this component idles: there is nothing
 * to encrypt with, and uploading a journal in the clear is not a fallback.
 *
 * It is stored in plaintext, which is COD-228 and is disclosed on screen. An
 * account does not make that better and must not be allowed to make it feel
 * more official than it is.
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

  const pass = () => getSyncPassphrase()

  // ── Sign-in / sign-out / account switch ──────────────────────────────────
  useEffect(() => {
    if (!isConfigured()) return
    return onAuthChange((user) => {
      const { state: next, discardLocal } = onAccountChange(stateRef.current, user?.id ?? null)
      setState(next)
      if (!user) { setAccountStatus({ phase: 'signed-out' }); return }
      // A DIFFERENT account on the same device. The local journal belongs to
      // whoever was signed in before, and merging it into this account is
      // COD-135 — which shipped. Drop it, then read the new account's row.
      if (discardLocal) replaceAll(emptyJournal())

      const p = pass()
      // Nothing to encrypt with, so NOTHING IS UPLOADED and nothing will be.
      // This used to be a bare `return` whose comment said "the card explains",
      // and the card did not: it said "Signed in — your journal syncs to your
      // account" either way. Publishing the phase is what makes the three
      // surfaces able to say the true thing instead (COD-291).
      if (!p) { setAccountStatus({ phase: 'no-passphrase' }); return }

      setAccountStatus({ phase: 'checking' })
      void (async () => {
        try {
          const remote = await pullAccount(p)
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
          // `pullAccount` throws on a failed decrypt, and that is NOT "the
          // remote is broken" — it is "this row is not mine to overwrite".
          setState((s) => afterPull(s, { row: 'unreadable' }))
          setAccountStatus({ phase: 'locked' })
          notify.error('Journal locked', MISMATCH_MESSAGE)
        }
      })()
    })
  }, [replaceAll])

  // ── Debounced push ───────────────────────────────────────────────────────
  const lastPushed = useRef('')
  useEffect(() => {
    if (!isConfigured()) return
    const p = pass()
    if (!mayPush(state, { hasPassphrase: !!p, isDemo: isDemo(data) })) {
      // Every refusal here is silent by design — `mayPush` answers "no" to
      // every unknown — and silence is exactly what made this feature look
      // broken. Name the two refusals a signed-in user can actually sit in, so
      // the card stops claiming a sync that is not happening. `mismatch` has
      // already set `locked` on the pull path.
      if (state.userId && !p) setAccountStatus({ phase: 'no-passphrase' })
      else if (state.userId && isDemo(data)) setAccountStatus({ phase: 'demo' })
      return
    }
    const snapshot = JSON.stringify(data)
    if (snapshot === lastPushed.current) return // echo guard: we just applied this
    const id = setTimeout(async () => {
      try {
        setAccountStatus({ phase: 'uploading' })
        lastPushed.current = JSON.stringify(latest.current)
        await pushAccount(p!, latest.current)
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
