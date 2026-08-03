import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { Button, buttonVariants } from './ui/button'
import { cn } from '../lib/cn'

/**
 * A promise-based replacement for the browser's confirm(). Native confirm() is
 * unstyled and says nothing about what is being destroyed; this names it, and
 * for data-destroying actions offers a backup without losing the dialog.
 *
 *   if (await confirm({ title: 'Erase everything?' })) wipe()
 */
export type ConfirmOptions = {
  title: string
  /** What exactly happens, and what is lost. Be specific. */
  description?: ReactNode
  /** Name the action ("Erase everything"), don't say "OK". */
  confirmLabel?: string
  cancelLabel?: string
  /** Red confirm button. Use whenever data is destroyed. */
  destructive?: boolean
  /** Renders an "Export a backup first" button that runs without closing. */
  onBackup?: () => void | Promise<void>
}

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void }

const ConfirmContext = createContext<((o: ConfirmOptions) => Promise<boolean>) | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null)
  const [backingUp, setBackingUp] = useState(false)
  // Radix can fire close + action together; never resolve the same promise twice.
  const settled = useRef(false)

  const confirm = useCallback((o: ConfirmOptions) => {
    settled.current = false
    return new Promise<boolean>((resolve) => setPending({ ...o, resolve }))
  }, [])

  function settle(ok: boolean) {
    if (settled.current) return
    settled.current = true
    pending?.resolve(ok)
    setPending(null)
    setBackingUp(false)
  }

  async function runBackup() {
    if (!pending?.onBackup) return
    setBackingUp(true)
    try { await pending.onBackup() } finally { setBackingUp(false) }
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={!!pending} onOpenChange={(open) => { if (!open) settle(false) }}>
        {pending && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{pending.title}</AlertDialogTitle>
              {pending.description && (
                <AlertDialogDescription>{pending.description}</AlertDialogDescription>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              {pending.onBackup && (
                <Button variant="secondary" onClick={runBackup} disabled={backingUp} className="sm:mr-auto">
                  {backingUp ? 'Exporting…' : 'Export a backup first'}
                </Button>
              )}
              <AlertDialogCancel onClick={() => settle(false)}>
                {pending.cancelLabel ?? 'Cancel'}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => settle(true)}
                className={cn(pending.destructive && buttonVariants({ variant: 'danger' }))}
              >
                {pending.confirmLabel ?? 'Confirm'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </ConfirmContext.Provider>
  )
}

/**
 * Async confirm(). Falls back to window.confirm when no provider is mounted, so
 * a missing provider can never silently turn a destructive guard into a no-op.
 */
// eslint-disable-next-line react-refresh/only-export-components -- hook co-located with its provider by design
export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  return useCallback(
    (o: ConfirmOptions): Promise<boolean> => (ctx ? ctx(o) : Promise.resolve(window.confirm(o.title))),
    [ctx],
  )
}
