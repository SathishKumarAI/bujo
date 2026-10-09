import { useEffect, useRef } from 'react'
import { isConfigured } from '../lib/supabase'
import { useAuthUser } from '../lib/authUser'
import { takeSignInPending, clearSignInPending, unfinishedSignInMessage } from '../lib/authReturn'
import { notify } from '../lib/notify'

/**
 * Reports the one sign-in failure the app could not see: the redirect that
 * never came back. COD-293.
 *
 * `lib/authReturn.ts` carries the whole explanation. The short version:
 * `redirectTo` is a *request*, and Supabase silently replaces it with the
 * project Site URL when the origin is not on the Redirect URLs allow-list — so
 * the browser is sent elsewhere after Google and this app never runs again.
 * There is no error to read, because from the app's point of view nothing
 * happened at all.
 *
 * ── Why a component and not an effect in `App` ─────────────────────────────
 *
 * It needs `useAuthUser()`, and putting that hook in `App` would re-render the
 * entire view tree on every sign-in and sign-out for the sake of one toast.
 * Same reasoning, and the same `return null` shape, as `AccountSync`.
 *
 * ── Why it waits for `ready` ───────────────────────────────────────────────
 *
 * `ready` is false until the session has actually been resolved. Reporting on
 * `!user` before that fires the message at a *successful* sign-in, in the gap
 * between mount and `INITIAL_SESSION` — the wait-before-assert rule from
 * `CLAUDE.md`, in application code rather than in a gate: "not yet" is not
 * "not ever".
 *
 * It is mounted in `App` rather than inside the account page on purpose, for
 * the reason `consumeAuthError` is: when this fails, the user is not on the
 * page they started from. They are not necessarily even on this app.
 */
export function AuthReturnReport() {
  const { user, ready } = useAuthUser()
  const done = useRef(false)

  useEffect(() => {
    if (!isConfigured() || !ready || done.current) return
    // A session arrived: the round trip completed, so the stamp is spent.
    if (user) { clearSignInPending(); done.current = true; return }
    // No session, and we had left for a provider. `consumeAuthError` has
    // already run (it is a mount effect in `App`) and would have cleared the
    // stamp if the URL carried a reason — so reaching here means there was no
    // reason to read, which is the whole point.
    const pending = takeSignInPending()
    if (!pending) return
    done.current = true
    const { message, detail } = unfinishedSignInMessage(pending)
    notify.error(message, detail)
  }, [ready, user])

  return null
}
