import { useState, type ReactNode } from 'react'
import { TooltipProvider } from '../ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Sidebar, type NavItem } from './Sidebar'
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
import type { ViewId } from './viewChrome'

/** Owns the shell grid (sidebar + topbar/content) and the global quick-add dialog. */
export function AppShell({
  items,
  groupOrder,
  view,
  collapsed,
  autoHide,
  onNavigate,
  onToggleCollapse,
  onCommand,
  children,
}: {
  items: NavItem[]
  groupOrder: string[]
  view: ViewId
  collapsed: boolean
  autoHide: boolean
  onNavigate: (id: ViewId) => void
  onToggleCollapse: () => void
  onCommand: () => void
  children: ReactNode
}) {
  const [quickOpen, setQuickOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
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
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* First focusable element on the page: a keyboard user lands here and can
          jump straight past the sidebar and top bar to the content. Off-screen
          until focused. Listed as a known gap in docs/ACCESSIBILITY.md. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-card focus:bg-ink-1 focus:px-3 focus:py-2 focus:text-body focus:text-fg-1 focus:outline-2 focus:outline-mauve"
      >
        Skip to content
      </a>
      {/* Dim scrim behind the mobile drawer — tap to close (iOS-style). */}
      {isMobile && (
        <div
          onClick={() => setNavOpen(false)}
          aria-hidden
          className={`fixed inset-0 z-40 bg-crust/55 backdrop-blur-sm transition-opacity duration-300 ${
            navOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        />
      )}
      <Sidebar
        items={items}
        groupOrder={groupOrder}
        view={view}
        collapsed={autoHide ? false : collapsed}
        navOpen={navOpen}
        autoHide={autoHide}
        onNavigate={(id) => {
          onNavigate(id)
          setNavOpen(false)
        }}
        onToggleCollapse={onToggleCollapse}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-x-clip">
        <TopBar
          view={view}
          onNavigate={onNavigate}
          onQuickAdd={() => setQuickOpen(true)}
          onCommand={onCommand}
          onMenu={() => setNavOpen((o) => !o)}
        />
        {/* Extra bottom padding on mobile clears the fixed bottom nav. */}
        <main id="main" className={`flex-1 overflow-x-hidden p-4 sm:p-6 ${isMobile ? 'pb-24' : 'pb-6'}`}>{children}</main>
      </div>

      {isMobile && <BottomNav items={items} view={view} onNavigate={onNavigate} />}

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
