// "I clicked Continue with Google and came back to nothing." COD-293.
//
// ── The third way a sign-in can fail silently ──────────────────────────────
//
// COD-290 closed the *failed exchange* leg: Google refuses, Supabase returns
// with `error=…` in the URL, `consumeAuthError` reads it and says so. COD-291
// closed the *succeeded but invisible* leg: the session arrived and only one
// card rendered it.
//
// This is the third, and it is the quietest of the three, because **the browser
// never comes back to this app at all.**
//
// `signInGoogle` sends `redirect_to = origin + pathname + search`. Supabase
// checks that against the project's Redirect URLs allow-list and, if it is not
// on it, **silently substitutes the project Site URL** — no error, no warning,
// not even a hint in the response. Measured on this project: the Site URL is
// `http://localhost:3000`, and no deployed origin is allow-listed, so a sign-in
// from `https://bujo-journal.vercel.app` sends the user to a dead local address
// after Google and the app they left never runs again. Every successful sign-in
// anyone had was `localhost:4173` or `:5173`, both of which *are* allow-listed,
// which is exactly why nobody saw it.
//
// ── Why a stamp, and not a check ───────────────────────────────────────────
//
// Nothing client-side can read the allow-list, so this cannot be pre-empted —
// the app cannot know, before it leaves, whether it will be allowed back. What
// it can do is **remember that it left.** The stamp is written immediately
// before the redirect and cleared the moment the session or an error arrives;
// a stamp still sitting there on a later load means the round trip was lost.
//
// Deliberately NOT time-limited. A ten-minute window would have to guess how
// long someone takes at a Google consent screen, and the failure this exists
// for sends them somewhere with no way back — so they return by typing the URL
// again, minutes or hours later, which is precisely the case a window would
// throw away. The stamp is cleared by resolution, not by the clock.
//
// The honest limit, written down because it is a real false positive: a user who
// opens Google and closes the tab without choosing an account also leaves a
// stamp behind, and will be told the sign-in did not come back. That is true —
// it did not — and the message says what to check rather than asserting a
// specific fault, which is the most a client can honestly claim here.

const KEY = 'bujo:auth.pending'

function ls(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export interface PendingSignIn {
  /** The origin that asked to be returned to. This is the string to allow-list. */
  origin: string
  /** Epoch ms, for the message only — never for deciding whether to report. */
  startedAt: number
}

/** Called immediately before handing the browser to the provider. */
export function markSignInStarted(origin: string, now = Date.now()): void {
  const s = ls()
  if (!s) return
  try {
    s.setItem(KEY, JSON.stringify({ origin, startedAt: now } satisfies PendingSignIn))
  } catch { /* storage blocked — the sign-in still proceeds */ }
}

/** The sign-in resolved, one way or the other. Clears the stamp. */
export function clearSignInPending(): void {
  ls()?.removeItem(KEY)
}

/**
 * Read and clear the stamp, or null when there is none.
 *
 * Reads **and** clears, so one lost round trip is reported once. A message that
 * reappears on every load is a message people learn to dismiss.
 */
export function takeSignInPending(): PendingSignIn | null {
  const s = ls()
  const raw = s?.getItem(KEY)
  if (!raw) return null
  s?.removeItem(KEY)
  try {
    const p = JSON.parse(raw) as Partial<PendingSignIn>
    if (typeof p?.origin !== 'string' || !p.origin) return null
    return { origin: p.origin, startedAt: typeof p.startedAt === 'number' ? p.startedAt : 0 }
  } catch {
    return null
  }
}

/**
 * What to say. Names the origin, because that string IS the fix — someone has
 * to paste it into Supabase's Redirect URLs, and a message that says "check your
 * configuration" without it costs the reader the one piece of information the
 * app actually has.
 *
 * It does not accuse the allow-list outright: a closed consent tab produces the
 * same evidence, and claiming a specific server-side fault from the client would
 * be a guess dressed as a diagnosis.
 */
export function unfinishedSignInMessage(p: PendingSignIn): { message: string; detail: string } {
  return {
    message: 'That sign-in never came back',
    detail:
      `Google was opened from ${p.origin} but the browser was not returned here, so there is no `
      + 'session. If you did not cancel it, this origin is most likely missing from the Redirect '
      + "URLs in the Supabase project's Authentication → URL Configuration — add "
      + `${p.origin}/** there. Nothing on this device changed and your entries are all still here.`,
  }
}
