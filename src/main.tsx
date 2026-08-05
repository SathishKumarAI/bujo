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
