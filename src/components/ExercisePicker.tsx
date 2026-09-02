import { CaretDown, MagnifyingGlass } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useEffect, useId, useRef, useState } from 'react'
import { cat } from '../lib/colors'

/**
 * EXERCISE PICKER · a real combobox (ARIA 1.2, listbox popup).
 *
 * Click the trigger → a search field over recents + the library; pick one, or
 * type a name that is not in either and add it.
 *
 * It called itself a combobox in this docstring for months while being a button
 * that toggled a list of buttons (COD-91): no `role`, no `aria-expanded`, no
 * `aria-activedescendant`, and the entire keyboard surface was "Enter takes
 * whatever is typed, Escape closes". **axe passes that** — a named button above
 * a list of named buttons is structurally valid — so the gate could not have
 * told anyone. Widget semantics are not something a rendering gate asserts.
 *
 * Two things follow from the pattern and are easy to undo by accident:
 *
 * - **The options are `<li role="option">`, not buttons.** In a listbox the
 *   option *is* the row, focus stays in the input, and the active option is
 *   named by `aria-activedescendant`. Putting a `<button>` back inside would
 *   re-add 35 tab stops per set row and break the role nesting.
 * - **The group headings are `role="presentation"`.** A listbox may only
 *   contain options and groups; a bare `<li>` reading "Recent" would be an
 *   option with no value.
 *
 * It is used twice on `?view=gym` — every set row and the anatomy lookup — so
 * it is the most-used control on that page.
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
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listId = useId()

  const ql = q.trim().toLowerCase()
  const recent = recents.filter((r) => r.toLowerCase().includes(ql)).slice(0, 5)
  const lib = library.filter((e) => e.toLowerCase().includes(ql) && !recent.includes(e)).slice(0, 30)
  const showCustom = !!ql && !library.some((e) => e.toLowerCase() === ql) && !recents.some((r) => r.toLowerCase() === ql)

  /**
   * The options in the order they are rendered, flat. Arrow keys walk this, so
   * the headings must NOT be in it — an index that counts a heading moves the
   * highlight to nothing every time it passes one.
   */
  const options = [...(showCustom ? [q.trim()] : []), ...recent, ...lib]
  const optionId = (i: number) => `${listId}-opt-${i}`
  const activeId = open && options.length > 0 ? optionId(Math.min(active, options.length - 1)) : undefined

  // Keep the highlighted option on screen. A listbox that highlights row 20 of
  // 35 while showing rows 1–8 is unusable from the keyboard even though every
  // attribute is correct.
  useEffect(() => {
    if (!activeId) return
    // `?.()` on the method too — jsdom does not implement scrollIntoView, and a
    // TypeError thrown from an effect takes the whole render down.
    document.getElementById(activeId)?.scrollIntoView?.({ block: 'nearest' })
  }, [activeId])

  function pick(name: string) {
    onPick(name)
    close()
  }

  function close() {
    setOpen(false)
    setQ('')
    setActive(0)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault() // else the caret jumps to either end of the field
      if (options.length === 0) return
      const next = e.key === 'ArrowDown' ? active + 1 : active - 1
      setActive((next + options.length) % options.length)
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      setActive(e.key === 'Home' ? 0 : options.length - 1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      // The highlighted option, or — with nothing to highlight — whatever has
      // been typed, which is how a name outside the library gets added.
      pick(options[active] ?? q.trim() ?? value)
    } else if (e.key === 'Escape') {
      close()
      triggerRef.current?.focus()
    }
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={value ? `Exercise: ${value}` : 'Pick exercise'}
        onClick={() => { setOpen((o) => !o); setTimeout(() => inputRef.current?.focus(), 0) }}
        className="flex w-full items-center justify-between gap-1 rounded-card border border-line-strong bg-ink-0 px-2 py-1.5 text-left text-body text-fg-1"
      >
        <span className={value ? 'truncate' : 'text-fg-2'}>{value || 'Pick exercise…'}</span>
        <Icon as={CaretDown} size="sm" className="shrink-0 text-fg-2" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} aria-hidden />
          <div className="absolute top-full left-0 z-50 mt-1 w-72 overflow-hidden rounded-card border border-line-strong bg-ink-1 shadow-xl">
            <div className="flex items-center gap-2 border-b border-line px-2.5 py-2">
              <Icon as={MagnifyingGlass} size="sm" className="text-fg-2" />
              <input
                ref={inputRef}
                role="combobox"
                aria-expanded
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={activeId}
                aria-label="Search or type a new exercise"
                value={q}
                // Typing changes the list under the highlight, so the highlight
                // goes back to the top with it. Done here rather than in an
                // effect on `q` — `react-hooks/set-state-in-effect` is right
                // that this is a render cascade, and the query only ever
                // changes from this one handler.
                onChange={(e) => { setQ(e.target.value); setActive(0) }}
                onKeyDown={onKeyDown}
                placeholder="Search or type a new exercise…"
                className="w-full bg-transparent text-body text-fg-1 placeholder:text-fg-2 focus:outline-none"
              />
            </div>
            <ul id={listId} role="listbox" aria-label="Exercises" className="max-h-64 overflow-y-auto py-1">
              {showCustom && (
                <Option id={optionId(0)} name={`+ Add “${q.trim()}”`} active={active === 0} selected={false} onPick={() => pick(q.trim())} accent />
              )}
              {recent.length > 0 && <li role="presentation" className="px-3 pt-1.5 pb-0.5 text-micro tracking-wide text-fg-2 uppercase">Recent</li>}
              {recent.map((r, i) => {
                const idx = (showCustom ? 1 : 0) + i
                return <Option key={`r-${r}`} id={optionId(idx)} name={r} active={active === idx} selected={r === value} onPick={() => pick(r)} />
              })}
              {lib.length > 0 && <li role="presentation" className="px-3 pt-1.5 pb-0.5 text-micro tracking-wide text-fg-2 uppercase">Library</li>}
              {lib.map((e, i) => {
                const idx = (showCustom ? 1 : 0) + recent.length + i
                return <Option key={`l-${e}`} id={optionId(idx)} name={e} active={active === idx} selected={e === value} onPick={() => pick(e)} />
              })}
              {options.length === 0 && (
                <li role="presentation" className="px-3 py-2 text-body text-fg-2">No matches</li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * One row of the listbox. `active` is the keyboard highlight
 * (`aria-activedescendant` points here); `selected` is the exercise the row
 * currently holds. They are different states and the old code had only the
 * second one, in colour alone.
 */
function Option({
  id, name, active, selected, onPick, accent = false,
}: { id: string; name: string; active: boolean; selected: boolean; onPick: () => void; accent?: boolean }) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={selected}
      onClick={onPick}
      onMouseDown={(e) => e.preventDefault()} // keep focus in the input
      className={`flex cursor-pointer items-center justify-between px-3 py-1.5 text-left text-body ${active ? 'bg-ink-2' : ''}`}
      style={{ color: accent ? cat('mauve') : selected ? cat('mauve') : cat('subtext1') }}
    >
      {name}
    </li>
  )
}
