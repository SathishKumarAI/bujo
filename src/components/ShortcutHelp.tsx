import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Kbd } from './Kbd'

const MOD = navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'

const GROUPS: { title: string; items: { keys: string[]; desc: string }[] }[] = [
  {
    title: 'Anywhere',
    items: [
      { keys: [MOD, 'K'], desc: 'Command palette — jump to a view or run a command' },
      { keys: [MOD, 'Z'], desc: 'Undo the last change' },
      { keys: [MOD, '⇧', 'Z'], desc: 'Redo' },
      { keys: ['n'], desc: 'Quick add — capture an entry' },
      { keys: ['?'], desc: 'This cheatsheet' },
      { keys: ['Esc'], desc: 'Close any dialog' },
    ],
  },
  {
    title: 'Go to',
    items: [
      { keys: ['g', 't'], desc: 'Today' },
      { keys: ['g', 'p'], desc: 'Plan' },
      { keys: ['g', 'h'], desc: 'Trackers (habits)' },
      { keys: ['g', 'f'], desc: 'Fitness' },
      { keys: ['g', 'c'], desc: 'Collections' },
      { keys: ['g', 'i'], desc: 'Insights' },
      { keys: ['g', 's'], desc: 'Stats' },
      { keys: ['g', ','], desc: 'Settings' },
    ],
  },
]

export function ShortcutHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <div className="mb-1.5 font-mono text-micro uppercase tracking-widest text-fg-2">
                {g.title}
              </div>
              <div className="flex flex-col gap-0.5">
                {g.items.map((s) => (
                  <div
                    key={s.desc}
                    className="flex items-center justify-between gap-4 rounded-md px-2 py-1.5 hover:bg-ink-2/60"
                  >
                    <span className="text-body text-fg-1">{s.desc}</span>
                    <span className="flex shrink-0 gap-1">
                      {s.keys.map((k, i) => (
                        <Kbd key={i}>{k}</Kbd>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
