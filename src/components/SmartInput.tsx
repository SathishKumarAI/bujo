import { useRef, useState } from 'react'
import { suggest, findDuplicates, type SuggestContext, type DupItem, type Suggestion } from '../lib/suggest'
import { useConfirm } from './ConfirmDialog'
import { Button } from './ui/button'

/**
 * A text input with VS Code-style completion + duplicate detection.
 *
 * - Completion popover (↑/↓ move · Tab/Enter accept · Esc dismiss).
 * - A small circular badge at the field's top-right when likely duplicates
 *   exist; its popover offers Go-to / Merge / Add-anyway.
 * - `confirmOnDuplicate` (opt-in) asks before submitting a likely dupe.
 */
export function SmartInput({
  value,
  onChange,
  onSubmit,
  suggestCtx,
  dupItems,
  placeholder,
  'aria-label': ariaLabel,
  className = '',
  onGoToDuplicate,
  onMergeDuplicate,
  confirmOnDuplicate = false,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: (v: string) => void
  suggestCtx: SuggestContext
  dupItems: DupItem[]
  placeholder?: string
  'aria-label'?: string
  className?: string
  onGoToDuplicate?: (id: string) => void
  onMergeDuplicate?: (id: string) => void
  confirmOnDuplicate?: boolean
}) {
  const confirm = useConfirm()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [dupOpen, setDupOpen] = useState(false)

  const suggestions = open ? suggest(value, suggestCtx) : []
  const dupes = findDuplicates(value, dupItems)

  function accept(s: Suggestion) {
    // Tag completes the trailing token; everything else replaces the field.
    const next = s.kind === 'tag' ? value.replace(/\S*$/, s.value) + ' ' : s.value
    onChange(next)
    setOpen(false)
    setActive(0)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  async function submit() {
    if (!value.trim()) return
    if (confirmOnDuplicate && dupes.length && !await confirm({
      title: 'This looks like a duplicate.',
      description: 'You already have a similar entry. Add this one anyway?',
      confirmLabel: 'Add anyway',
    })) return
    onSubmit(value)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (open && suggestions.length) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, suggestions.length - 1)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); return }
      if ((e.key === 'Tab' || e.key === 'Enter') && suggestions[active]) {
        // Enter on a non-command suggestion that equals the value should submit, not re-accept.
        if (e.key === 'Tab') { e.preventDefault(); accept(suggestions[active]); return }
      }
      if (e.key === 'Escape') { setOpen(false); return }
    }
    if (e.key === 'Enter') { e.preventDefault(); submit() }
  }

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(0) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`w-full rounded-lg border border-input bg-background px-3 py-2 pr-9 text-body text-fg-1 placeholder:text-fg-2 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none ${className}`}
      />

      {/* Duplicate corner badge */}
      {dupes.length > 0 && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setDupOpen((o) => !o)}
          aria-label={`${dupes.length} possible duplicate${dupes.length === 1 ? '' : 's'}`}
          title="Possible duplicate"
          className="absolute top-1/2 right-2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full bg-yellow text-caption font-medium text-crust"
        >
          {dupes.length}
        </button>
      )}

      {/* Duplicate popover */}
      {dupOpen && dupes.length > 0 && (
        <div className="absolute top-full right-0 z-50 mt-1 w-72 overflow-hidden rounded-lg border border-line-strong bg-ink-1 shadow-xl">
          <p className="border-b border-line px-3 py-2 text-label text-fg-2">Looks similar to:</p>
          <ul className="max-h-56 overflow-y-auto py-1">
            {dupes.map((d) => (
              <li key={d.id} className="px-3 py-1.5 text-body">
                <div className="truncate text-fg-1">{d.text}</div>
                <div className="mt-1 flex gap-2 text-label">
                  {onGoToDuplicate && <Button variant="link" size="xs" onMouseDown={(e) => e.preventDefault()} onClick={() => { onGoToDuplicate(d.id); setDupOpen(false) }} className="h-auto p-0 text-label font-normal text-blue">Go to</Button>}
                  {onMergeDuplicate && <Button variant="link" size="xs" onMouseDown={(e) => e.preventDefault()} onClick={() => { onMergeDuplicate(d.id); setDupOpen(false); onChange('') }} className="h-auto p-0 text-label font-normal text-green">Merge</Button>}
                  <span className="text-fg-2">{Math.round(d.score * 100)}% match</span>
                </div>
              </li>
            ))}
          </ul>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => { setDupOpen(false); submit() }} className="w-full border-t border-line px-3 py-2 text-left text-label text-fg-2 hover:bg-ink-2">Add anyway</button>
        </div>
      )}

      {/* Completion popover */}
      {open && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 z-40 mt-1 w-full overflow-hidden rounded-lg border border-line-strong bg-ink-1 shadow-xl">
          {suggestions.map((s, i) => (
            <li key={`${s.kind}-${s.value}`}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); accept(s) }}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-body ${i === active ? 'bg-ink-2 text-fg-1' : 'text-fg-1'}`}
              >
                <span className="truncate">{s.label ?? s.value}</span>
                {s.hint && <span className="ml-2 shrink-0 text-micro text-fg-2">{s.hint}</span>}
              </button>
            </li>
          ))}
          <li className="border-t border-line px-3 py-1 text-micro text-fg-2">↑↓ move · Tab accept · ↵ add</li>
        </ul>
      )}
    </div>
  )
}
