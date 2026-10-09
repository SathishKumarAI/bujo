// Why a new build was invisible until you reloaded twice. COD-294.
//
// ── The mechanism ──────────────────────────────────────────────────────────
//
// `vite-plugin-pwa` is configured `registerType: 'autoUpdate'`, and the worker
// it generates does call `skipWaiting()` and `clientsClaim()`. So the *worker*
// updates itself promptly. What it cannot do is update a page that has already
// run: by the time the new worker activates and claims the client, the open
// document has long since fetched `index.html` and its `assets/index-*.js`
// **from the old worker's precache**. Nothing reloads it.
//
// The injected registration is the whole of the client side, and it is three
// statements long:
//
//     if('serviceWorker' in navigator) { window.addEventListener('load', () =>
//       navigator.serviceWorker.register('./sw.js', { scope: './' })) }
//
// Register, and no more. There is no `controllerchange` listener anywhere in
// the app, so the sequence after every deploy is:
//
//   load 1 — old bundle (old worker answers), new worker installs and claims
//   load 2 — new bundle
//
// Which is "I merged it and I cannot see it", once per release, for every user.
// It is already written down in `CLAUDE.md` — as a *manual workaround*, with an
// unregister snippet and the instruction to reload twice. By this repo's own
// rule, a workaround written in a handover note is a defect nobody fixed: the
// trap entry even names the failure mode it caused, which was reverting a change
// that worked.
//
// ── The reload is conditional, and the condition is the interesting part ───
//
// Two guards, and skipping either one turns this fix into a worse bug.
//
// **1. There must have been a controller already.** On a first-ever visit the
// very first worker installs and claims the page, firing `controllerchange` for
// a document that is *already* the newest build. Reloading there is a pointless
// flash on someone's first second in the app.
//
// **2. The URL must not be carrying an auth round trip.** This is the one that
// matters. Supabase returns from Google with `#access_token=…` (implicit flow,
// which is this client's default — `flowType` is unset) or `?code=…`, and
// `detectSessionInUrl` reads it from `window.location` asynchronously after the
// client is constructed. A reload at that instant **discards the fragment before
// the session is persisted**, and the user lands signed-out with nothing to
// read — which is indistinguishable from COD-290 and COD-293 and would have been
// blamed on either. So an update found mid-sign-in is deliberately left for the
// next load: being one build stale for thirty seconds is free, and losing a
// sign-in is not.
//
// The pure predicate is here, and the three lines of wiring are in `main.tsx`,
// because `controllerchange` cannot be fired from a test and the decision can.

/** Everything the decision depends on. No globals read in here. */
export interface UpdateContext {
  /** Was a service worker already controlling this page when it loaded? */
  hadController: boolean
  /** `window.location.hash` + `search`, or any string to scan for auth material. */
  url: string
  /** Has this page already reloaded for an update? Loop guard. */
  alreadyReloaded: boolean
}

/**
 * Auth material that must survive to `detectSessionInUrl`.
 *
 * `error` is included on purpose: a failed sign-in's reason is consumed from the
 * URL by `consumeAuthError`, and reloading over it would restore the exact
 * silence COD-290 was filed to end.
 */
const AUTH_PARAM = /(?:^|[#&?])(access_token|refresh_token|code|error|error_code|error_description)=/

export function urlCarriesAuth(url: string): boolean {
  return AUTH_PARAM.test(url)
}

/** May we reload this page to pick up a new build? */
export function shouldReloadForUpdate(c: UpdateContext): boolean {
  if (c.alreadyReloaded) return false
  if (!c.hadController) return false
  if (urlCarriesAuth(c.url)) return false
  return true
}

/** Where the loop guard lives. `sessionStorage`, so it dies with the tab. */
export const RELOAD_FLAG = 'bujo:sw.reloaded'
