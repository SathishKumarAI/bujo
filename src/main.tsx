import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { JournalProvider } from './store.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { ConfirmProvider } from './components/ConfirmDialog.tsx'

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
