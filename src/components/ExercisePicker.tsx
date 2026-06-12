import { useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { cat } from '../lib/colors'

/**
 * A quick exercise picker (combobox): click the button → searchable dropdown of
 * recents + the library; pick to set, or type a custom name. Replaces free-typing
 * into a bare input so swapping an exercise is one tap.
 */
export function ExercisePicker({
  value,
  onPick,
  library,
  recents = [],
}: {
  value: string
  onPick: (name: string) => void
  library: string[]
  recents?: string[]
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const ql = q.trim().toLowerCase()
  const recent = recents.filter((r) => r.toLowerCase().includes(ql)).slice(0, 5)
  const lib = library.filter((e) => e.toLowerCase().includes(ql) && !recent.includes(e)).slice(0, 30)
  const showCustom = ql && !library.some((e) => e.toLowerCase() === ql) && !recents.some((r) => r.toLowerCase() === ql)

  function pick(name: string) {
    onPick(name)
    setOpen(false)
    setQ('')
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setTimeout(() => inputRef.current?.focus(), 0) }}
        className="flex w-full items-center justify-between gap-1 rounded-lg border border-surface1 bg-base px-2 py-1.5 text-left text-sm text-text"
      >
        <span className={value ? 'truncate' : 'text-overlay0'}>{value || 'Pick exercise…'}</span>
        <ChevronDown size={14} className="shrink-0 text-overlay1" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute top-full left-0 z-50 mt-1 w-72 overflow-hidden rounded-lg border border-surface1 bg-mantle shadow-xl">
            <div className="flex items-center gap-2 border-b border-surface0 px-2.5 py-2">
              <Search size={14} className="text-overlay0" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') pick(q.trim() || value); if (e.key === 'Escape') setOpen(false) }}
                placeholder="Search or type a new exercise…"
                className="w-full bg-transparent text-sm text-text placeholder:text-overlay0 focus:outline-none"
              />
            </div>
            <ul className="max-h-64 overflow-y-auto py-1">
              {showCustom && (
                <li>
                  <button type="button" onClick={() => pick(q.trim())} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-mauve hover:bg-surface0">
                    + Add “{q.trim()}”
                  </button>
                </li>
              )}
              {recent.length > 0 && <li className="px-3 pt-1.5 pb-0.5 text-[10px] tracking-wide text-overlay0 uppercase">Recent</li>}
              {recent.map((r) => <Item key={`r-${r}`} name={r} active={r === value} onPick={pick} />)}
              {lib.length > 0 && <li className="px-3 pt-1.5 pb-0.5 text-[10px] tracking-wide text-overlay0 uppercase">Library</li>}
              {lib.map((e) => <Item key={`l-${e}`} name={e} active={e === value} onPick={pick} />)}
              {recent.length === 0 && lib.length === 0 && !showCustom && (
                <li className="px-3 py-2 text-sm text-overlay0">No matches</li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

function Item({ name, active, onPick }: { name: string; active: boolean; onPick: (n: string) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onPick(name)}
        className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-surface0"
        style={{ color: active ? cat('mauve') : cat('subtext1') }}
      >
        {name}
      </button>
    </li>
  )
}
