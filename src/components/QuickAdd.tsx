import { useState } from 'react'
import { useJournal } from '../store'
import { Button } from './ui'

/**
 * Quick-capture input. Prefixes: t=task, e=event, n=note, *=important, ^=memory.
 * Default kind is task. Enter to add.
 */
export function QuickAdd({ date, onAdded }: { date: string; onAdded?: () => void }) {
  const { addEntry } = useJournal()
  const [val, setVal] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!val.trim()) return
    addEntry(date, val)
    setVal('')
    onAdded?.()
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Add… (t task · e event · n note · * important · ^ memory)"
        aria-label="Quick add entry"
        className="flex-1 rounded-lg border border-surface1 bg-base px-3 py-2 text-sm text-text placeholder:text-overlay0 focus-visible:border-mauve focus-visible:ring-1 focus-visible:ring-mauve focus-visible:outline-none"
      />
      <Button type="submit" variant="primary">
        Add
      </Button>
    </form>
  )
}
