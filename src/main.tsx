import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import { AppRoutes } from './routes.tsx'
import { JournalProvider } from './store.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { ConfirmProvider } from './components/ConfirmDialog.tsx'

// The boundary sits *outside* the provider so a crash in the store itself still
// lands on the rescue screen instead of a blank page. The router sits inside
// both: a routing error is an app error, and should hit the same rescue screen.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <JournalProvider>
        <ConfirmProvider>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </ConfirmProvider>
      </JournalProvider>
    </ErrorBoundary>
  </StrictMode>,
)
