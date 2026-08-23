import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { JournalProvider } from './store.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { ConfirmProvider } from './components/ConfirmDialog.tsx'
import { canonicalizeDeepLink } from './lib/deepLink.ts'

// Before the first render, so every reader — including the lazy view chunks that
// mount long after the address bar has been rewritten — sees one canonical URL.
canonicalizeDeepLink()

// Ask the browser not to evict this origin under storage pressure. The journal
// is canonical here and a local-first app has nothing to re-fetch it from, so a
// silent eviction is total loss. Best-effort: unsupported or denied is fine,
// weekly backups remain the real safety net.
void navigator.storage?.persist?.().catch(() => {})

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
