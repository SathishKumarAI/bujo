import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Download, RotateCw } from 'lucide-react'
import { Button } from './ui/button'
import { STORAGE_KEY, STORAGE_ENC_KEY } from '../lib/storage'

interface Props { children: ReactNode }
interface State { error: Error | null }

/**
 * Last line of defence. A render crash anywhere below this boundary would
 * otherwise blank the whole app and strand the journal behind a white screen.
 *
 * Deliberately reads localStorage directly instead of the journal store: the
 * store is one of the things that could be broken, and the single job of this
 * screen is to get the user's data back out of the browser regardless.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('bujo crashed:', error, info.componentStack)
  }

  /** Raw dump — never migrated, never parsed, so a corrupt journal still downloads. */
  private download = () => {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_ENC_KEY)
    if (!raw) return
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `bujo-rescue-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const hasData =
      localStorage.getItem(STORAGE_KEY) != null || localStorage.getItem(STORAGE_ENC_KEY) != null

    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="w-full max-w-md rounded-xl border border-surface1 bg-mantle p-6 text-center">
          <div className="text-3xl">✦</div>
          <h1 className="mt-2 text-lg font-semibold text-text">bujo hit a snag</h1>
          <p className="mt-1 text-sm text-subtext1">
            Something in the app crashed. <strong className="text-text">Your journal is safe</strong> —
            it lives in this browser, not in the screen that broke.
          </p>

          <div className="mt-5 flex flex-col gap-2">
            <Button onClick={() => window.location.reload()}>
              <RotateCw /> Reload the app
            </Button>
            {hasData && (
              <Button variant="outline" onClick={this.download}>
                <Download /> Download a backup first
              </Button>
            )}
          </div>

          <details className="mt-5 text-left">
            <summary className="cursor-pointer text-xs text-subtext0">Technical details</summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-crust p-3 font-mono text-[11px] text-subtext0">
              {error.message}
            </pre>
          </details>
        </div>
      </div>
    )
  }
}
