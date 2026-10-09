import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { JournalProvider } from './store.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { ConfirmProvider } from './components/ConfirmDialog.tsx'
import { canonicalizeDeepLink } from './lib/deepLink.ts'
import { shouldReloadForUpdate, RELOAD_FLAG } from './lib/swUpdate.ts'
import { initAuth } from './lib/supabase.ts'

// Before the first render, so every reader — including the lazy view chunks that
// mount long after the address bar has been rewritten — sees one canonical URL.
canonicalizeDeepLink()

// Consume an OAuth return BEFORE anything can gate the app away. COD-295.
//
// `detectSessionInUrl` is work the Supabase client does when it is constructed,
// and `sb()` is lazy — so until now the first component to ask for the user was
// what triggered it. Those components all sit under `store.tsx`'s
// `if (!unlocked) return <LockScreen/>` and `App`'s `if (!mode) return
// <Welcome/>`, both of which return *instead of* the tree. Return from Google
// onto a locked journal and the fragment was never read: the sign-in vanished,
// looking exactly like COD-293 and having nothing to do with it.
//
// Here, before `createRoot`, is the only code that runs unconditionally.
initAuth()

// Ask the browser not to evict this origin under storage pressure. The journal
// is canonical here and a local-first app has nothing to re-fetch it from, so a
// silent eviction is total loss. Best-effort: unsupported or denied is fine,
// weekly backups remain the real safety net.
void navigator.storage?.persist?.().catch(() => {})

/**
 * Pick up a new build on the load that finds it, not the one after. COD-294.
 *
 * The generated worker skip-waits and claims the page, but the document has
 * already fetched its bundle from the OLD precache — so without this the first
 * load after every release serves the previous build and only the second shows
 * the new one. That is the "reload twice" trap in `CLAUDE.md`, as a defect
 * rather than as advice.
 *
 * `lib/swUpdate.ts` holds the two guards and why they are not optional — the
 * load-bearing one is that an update arriving mid-sign-in is skipped, because
 * reloading over `#access_token=…` destroys the session before
 * `detectSessionInUrl` can persist it. Registered before React renders so a
 * worker that claims the page during the first paint is not missed.
 */
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    let alreadyReloaded = false
    try { alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG) === '1' } catch { /* storage blocked */ }
    if (!shouldReloadForUpdate({ hadController, url: location.hash + location.search, alreadyReloaded })) return
    try { sessionStorage.setItem(RELOAD_FLAG, '1') } catch { /* then the guard is the hadController check alone */ }
    location.reload()
  })
}

// The boundary sits *outside* the provider so a crash in the store itself still
// lands on the rescue screen instead of a blank page.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <JournalProvider>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </JournalProvider>
    </ErrorBoundary>
  </StrictMode>,
)
