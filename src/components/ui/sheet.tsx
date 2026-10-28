import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './dialog'

/**
 * A bottom sheet — the phone's place for the OPTIONAL half of a form.
 *
 * OWNS: the sheet's geometry (pinned to the bottom edge, rounded top, its own
 * scroll, a Done bar that stays in reach of a thumb). The slide-up keyframe is
 * `styles/phone.css` (`.sheet-up`).
 * DOES NOT OWN: focus trapping, Escape, the backdrop or the accessible name —
 * those are the existing Radix `Dialog`, which is why this is a dozen lines
 * and not a drawer library.
 *
 * Built for Pickleball's quick log (COD-452): the main screen holds what every
 * session has, and everything you answer only sometimes lives here, one tap
 * away, instead of below the fold.
 */
export function Sheet({ open, onOpenChange, title, description, children }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sheet-up ios-form top-auto bottom-0 left-0 flex max-h-[88dvh] max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none rounded-t-card border-x-0 border-b-0 p-0 sm:max-w-none"
      >
        <span aria-hidden className="sheet-grabber" />
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 pt-1 pb-3">
          <div className="min-w-0">
            <DialogTitle className="text-heading font-semibold">{title}</DialogTitle>
            {description && <DialogDescription className="mt-0.5 text-label text-fg-2">{description}</DialogDescription>}
          </div>
          {/* iOS's sheet Done: bold brand TEXT, no fill — a wash button here
              competed with the sheet's own content for attention. */}
          <button type="button" onClick={() => onOpenChange(false)} className="sheet-done">Done</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
