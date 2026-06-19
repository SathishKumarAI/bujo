import { useRef, useState } from 'react'
import { suggest, findDuplicates, type SuggestContext, type DupItem, type Suggestion } from '../lib/suggest'

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

  function submit() {
    if (!value.trim()) return
    if (confirmOnDuplicate && dupes.length && !confirm('Possible duplicate · add anyway?')) return
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
        className={`w-full rounded-lg border border-input bg-background px-3 py-2 pr-9 text-sm text-text placeholder:text-overlay0 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none ${className}`}
      />

      {/* Duplicate corner badge */}
      {dupes.length > 0 && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setDupOpen((o) => !o)}
          aria-label={`${dupes.length} possible duplicate${dupes.length === 1 ? '' : 's'}`}
          title="Possible duplicate"
          className="absolute top-1/2 right-2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full bg-yellow text-[11px] font-bold text-crust"
        >
          {dupes.length}
        </button>
      )}

      {/* Duplicate popover */}
      {dupOpen && dupes.length > 0 && (
        <div className="absolute top-full right-0 z-50 mt-1 w-72 overflow-hidden rounded-lg border border-surface1 bg-mantle shadow-xl">
          <p className="border-b border-surface0 px-3 py-2 text-xs text-overlay0">Looks similar to:</p>
          <ul className="max-h-56 overflow-y-auto py-1">
            {dupes.map((d) => (
              <li key={d.id} className="px-3 py-1.5 text-sm">
                <div className="truncate text-subtext1">{d.text}</div>
                <div className="mt-1 flex gap-2 text-xs">
                  {onGoToDuplicate && <button onMouseDown={(e) => e.preventDefault()} onClick={() => { onGoToDuplicate(d.id); setDupOpen(false) }} className="text-blue hover:underline">Go to</button>}
                  {onMergeDuplicate && <button onMouseDown={(e) => e.preventDefault()} onClick={() => { onMergeDuplicate(d.id); setDupOpen(false); onChange('') }} className="text-green hover:underline">Merge</button>}
                  <span className="text-overlay0">{Math.round(d.score * 100)}% match</span>
                </div>
              </li>
            ))}
          </ul>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => { setDupOpen(false); submit() }} className="w-full border-t border-surface0 px-3 py-2 text-left text-xs text-subtext0 hover:bg-surface0">Add anyway</button>
        </div>
      )}

      {/* Completion popover */}
      {open && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 z-40 mt-1 w-full overflow-hidden rounded-lg border border-surface1 bg-mantle shadow-xl">
          {suggestions.map((s, i) => (
            <li key={`${s.kind}-${s.value}`}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); accept(s) }}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm ${i === active ? 'bg-surface0 text-text' : 'text-subtext1'}`}
              >
                <span className="truncate">{s.label ?? s.value}</span>
                {s.hint && <span className="ml-2 shrink-0 text-[10px] text-overlay0">{s.hint}</span>}
              </button>
            </li>
          ))}
          <li className="border-t border-surface0 px-3 py-1 text-[10px] text-overlay0">↑↓ move · Tab accept · ↵ add</li>
        </ul>
      )}
    </div>
  )
}
