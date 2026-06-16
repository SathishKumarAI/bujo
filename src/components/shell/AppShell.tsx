import { useState, type ReactNode } from 'react'
import { TooltipProvider } from '../ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Sidebar, type NavItem } from './Sidebar'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { CaptureBar } from '../CaptureBar'
import { useCursor } from './cursor'
import { useDevice } from './device'
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
  const { day } = useCursor()
  const isMobile = useDevice() === 'mobile'

  return (
    <TooltipProvider delayDuration={150}>
    <div className="flex min-h-screen flex-col md:flex-row">
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
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          view={view}
          onNavigate={onNavigate}
          onQuickAdd={() => setQuickOpen(true)}
          onCommand={onCommand}
          onMenu={() => setNavOpen((o) => !o)}
        />
        {/* Extra bottom padding on mobile clears the fixed bottom nav. */}
        <main className={`flex-1 overflow-x-hidden p-4 sm:p-6 ${isMobile ? 'pb-24' : 'pb-6'}`}>{children}</main>
      </div>

      {isMobile && <BottomNav items={items} view={view} onNavigate={onNavigate} onQuickAdd={() => setQuickOpen(true)} />}

      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick add</DialogTitle>
          </DialogHeader>
          <CaptureBar date={day} onAdded={() => setQuickOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  )
}
