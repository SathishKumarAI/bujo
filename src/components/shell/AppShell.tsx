import { useState, type ReactNode } from 'react'
import { TooltipProvider } from '../ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Sidebar, type NavItem } from './Sidebar'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { QuickAdd } from '../QuickAdd'
import { useCursor } from './cursor'
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

  return (
    <TooltipProvider delayDuration={150}>
    <div className="flex min-h-screen flex-col md:flex-row">
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
        <main className="flex-1 overflow-x-hidden p-4 pb-24 sm:p-6 md:pb-6">{children}</main>
      </div>

      <BottomNav items={items} view={view} onNavigate={onNavigate} onQuickAdd={() => setQuickOpen(true)} />

      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick add</DialogTitle>
          </DialogHeader>
          <QuickAdd date={day} onAdded={() => setQuickOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  )
}
