import { toast } from 'sonner'

/**
 * The app's feedback vocabulary. Views call these instead of importing sonner
 * (or reaching for a blocking `alert()`), so the look and the wording rules stay
 * in one place.
 */
export const notify = {
  success: (message: string, description?: string) => toast.success(message, { description }),
  error: (message: string, description?: string) => toast.error(message, { description, duration: 6000 }),
  info: (message: string, description?: string) => toast(message, { description }),

  /**
   * Confirm a destructive action *after* it happened, with a way back. The store
   * already keeps an undo stack — this makes it discoverable to people who don't
   * know ⌘Z exists.
   */
  undo: (message: string, onUndo: () => void) =>
    toast(message, {
      duration: 7000,
      action: { label: 'Undo', onClick: onUndo },
    }),

  /** Resolve a promise with pending → success/error toasts (sync, import, export). */
  promise: <T>(p: Promise<T>, msgs: { loading: string; success: string; error: string }) =>
    toast.promise(p, msgs),
}
