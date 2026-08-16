import { useState, type ReactNode } from 'react'
import { TooltipProvider } from '../ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { CaptureBar } from '../CaptureBar'
import { MilestoneToast } from '../MilestoneToast'
import { ServerSync } from '../ServerSync'
import { Toasts } from '../Toasts'
import { ShortcutHelp } from '../ShortcutHelp'
import { useHotkeys, useLeaderKey } from '../../lib/useHotkeys'
import { useCursor } from './cursor'
import { useDevice } from './device'
import { useHeaderHeight } from './useHeaderHeight'
import type { SectionGates } from './sections'
import type { ViewId } from './viewChrome'

/**
 * Owns the page frame and the global quick-add dialog.
 *
 * There is no rail: navigation is the two rows of `TopBar` on desktop and
 * `TopBar` + `BottomNav` on phones, so the shell is a header and a `<main>`
 * rather than a grid. What that deleted, and why:
 *
 * - **the docked sidebar** — a third chrome layer holding the same five
 *   sections the header now holds.
 * - **collapse and auto-hide** — two settings and a hover-edge overlay that
 *   existed only to win back the 240px the rail was spending.
 * - **the mobile drawer and its scrim** — `BottomNav` already puts all five
 *   sections one thumb-tap away, so the drawer was a second way to the same
 *   place, behind an extra tap.
 */
export function AppShell({
  gates,
  view,
  onNavigate,
  onCommand,
  children,
}: {
  gates: SectionGates
  view: ViewId
  onNavigate: (id: ViewId) => void
  onCommand: () => void
  children: ReactNode
}) {
  const [quickOpen, setQuickOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const { day } = useCursor()
  const isMobile = useDevice() === 'mobile'
  useHeaderHeight()

  // Single-key shortcuts. ⌘K (palette) and ⌘Z (undo) are chords, so they stay
  // where they are — these are the bare keys, which need the typing/dialog
  // guards that useHotkeys provides.
  useHotkeys({
    n: () => setQuickOpen(true),
    '?': () => setHelpOpen(true),
  })

  // `g` then a destination — jump without lifting your hands.
  useLeaderKey('g', {
    t: () => onNavigate('today'),
    p: () => onNavigate('plan'),
    h: () => onNavigate('trackers'),
    f: () => onNavigate('fitness'),
    c: () => onNavigate('collections'),
    i: () => onNavigate('insights'),
    s: () => onNavigate('stats'),
    ',': () => onNavigate('settings'),
  })

  return (
    <TooltipProvider delayDuration={150}>
    <div className="flex min-h-screen flex-col">
      {/* First focusable element on the page: a keyboard user lands here and can
          jump straight past the top bar to the content. Off-screen until
          focused. Listed as a known gap in docs/ACCESSIBILITY.md. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-card focus:bg-ink-1 focus:px-3 focus:py-2 focus:text-body focus:text-fg-1 focus:outline-2 focus:outline-mauve"
      >
        Skip to content
      </a>
      <TopBar
        view={view}
        gates={gates}
        onNavigate={onNavigate}
        onQuickAdd={() => setQuickOpen(true)}
        onCommand={onCommand}
      />
      {/* `overflow-x-clip`, NOT `overflow-x-hidden`. `hidden` on one axis forces
          the other to compute `auto`, which made `<main>` a scroll container —
          and a `position: sticky` child sticks to its nearest scrolling
          ancestor, not the viewport. `<main>` grows with its content instead of
          scrolling, so that scrollport never moves and every sticky-under-the-
          header element in the app was silently inert: Mindset's `LibraryBar`,
          Today's mobile `CaptureBar`, and the page contract's act column.
          Measured, not read: the bar sat at -544px after scrolling past it,
          instead of clamping to `--header-h`. `clip` does the same visual job
          without creating a scrollport.
          Extra bottom padding on mobile clears the fixed bottom nav. */}
      <main id="main" className={`flex-1 overflow-x-clip p-4 sm:p-6 ${isMobile ? 'pb-24' : 'pb-6'}`}>{children}</main>

      {isMobile && <BottomNav view={view} gates={gates} onNavigate={onNavigate} />}

      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick add</DialogTitle>
          </DialogHeader>
          <CaptureBar date={day} onAdded={() => setQuickOpen(false)} />
        </DialogContent>
      </Dialog>
      <ShortcutHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
      <MilestoneToast />
      <Toasts />
      <ServerSync />
    </div>
    </TooltipProvider>
  )
}
