import { useEffect, useMemo, useRef, useState } from 'react'
import { useJournal } from '../store'
import { exportJSON } from '../lib/storage'
import { generateDemoData } from '../lib/demo'
import { todayISO } from '../lib/date'

export interface Command {
  id: string
  label: string
  hint?: string
  run: () => void
}

/**
 * ⌘/Ctrl-K command palette. Self-contained: owns the hotkey + overlay.
 * Navigation commands are supplied by the parent via `onNavigate`.
 */
export function CommandPalette({
  onNavigate,
  navItems,
}: {
  onNavigate: (id: string) => void
  navItems: { id: string; label: string }[]
}) {
  const { data, setSettings, replaceAll, undo, redo, canUndo, canRedo } = useJournal()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Global hotkey.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  function download(name: string, text: string) {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }

  const commands: Command[] = useMemo(() => {
    const nav: Command[] = navItems.map((n) => ({
      id: `go-${n.id}`, label: `Go to ${n.label}`, hint: 'view', run: () => onNavigate(n.id),
    }))
    const actions: Command[] = [
      ...(canUndo ? [{ id: 'undo', label: 'Undo last change', hint: 'history', run: undo }] : []),
      ...(canRedo ? [{ id: 'redo', label: 'Redo', hint: 'history', run: redo }] : []),
      { id: 'theme', label: `Switch to ${data.settings.theme === 'mocha' ? 'light' : 'dark'} theme`, hint: 'action', run: () => setSettings({ theme: data.settings.theme === 'mocha' ? 'latte' : 'mocha' }) },
      { id: 'paper', label: `${data.settings.paperMode ? 'Disable' : 'Enable'} paper texture`, hint: 'action', run: () => setSettings({ paperMode: !data.settings.paperMode }) },
      { id: 'hand', label: `${data.settings.handwriting ? 'Disable' : 'Enable'} handwriting font`, hint: 'action', run: () => setSettings({ handwriting: !data.settings.handwriting }) },
      { id: 'export', label: 'Export JSON backup', hint: 'action', run: () => download(`bujo-backup-${todayISO()}.json`, exportJSON(data)) },
      { id: 'demo', label: 'Load demo data', hint: 'action', run: () => { if (data.entries.length === 0 || confirm('Replace current journal with demo data?')) replaceAll(generateDemoData()) } },
    ]
    return [...nav, ...actions]
  }, [data, navItems, onNavigate, setSettings, replaceAll, undo, redo, canUndo, canRedo])

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()))

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-crust/60 p-4 pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="card-3d w-full max-w-lg overflow-hidden rounded-xl border border-surface1 bg-mantle"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setActive(0) }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)) }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
            else if (e.key === 'Enter' && filtered[active]) { filtered[active].run(); setOpen(false) }
          }}
          placeholder="Jump to… or type a command"
          aria-label="Command search"
          className="w-full border-b border-surface0 bg-transparent px-4 py-3 text-sm text-text placeholder:text-overlay0 focus:outline-none"
        />
        <ul className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 && <li className="px-4 py-3 text-sm text-overlay0">No matches</li>}
          {filtered.map((c, i) => (
            <li key={c.id}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => { c.run(); setOpen(false) }}
                className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm ${i === active ? 'bg-surface0 text-text' : 'text-subtext1'}`}
              >
                <span>{c.label}</span>
                {c.hint && <span className="text-xs text-overlay0">{c.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-surface0 px-4 py-2 text-xs text-overlay0">↑↓ navigate · ↵ run · esc close</div>
      </div>
    </div>
  )
}
