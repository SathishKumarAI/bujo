import { useState } from 'react'
import { useJournal } from '../store'
import { Button } from './ui'
import { SmartInput } from './SmartInput'
import { parseTags } from '../lib/bullets'

/**
 * Quick-capture input. Prefixes: t=task, e=event, n=note, *=important, ^=memory.
 * Default kind is task. Enter to add. Now backed by SmartInput for completion
 * (#tags, recent entries) and same-day duplicate detection.
 */
export function QuickAdd({ date, onAdded }: { date: string; onAdded?: () => void }) {
  const { data, addEntry } = useJournal()
  const [val, setVal] = useState('')

  // Completion corpus + duplicate set (same-day, non-collection entries).
  const tags = [...new Set(data.entries.flatMap((e) => parseTags(e.text)))]
  const recents = data.entries.slice(-40).reverse().map((e) => e.text).filter(Boolean)
  const habits = data.habits.map((h) => h.name)
  const dupItems = data.entries
    .filter((e) => e.date === date && !e.collection && e.text)
    .map((e) => ({ id: e.id, text: e.text }))

  function add(text: string) {
    if (!text.trim()) return
    addEntry(date, text)
    setVal('')
    onAdded?.()
  }

  return (
    <div className="flex items-start gap-2">
      <SmartInput
        value={val}
        onChange={setVal}
        onSubmit={add}
        suggestCtx={{ tags, recents, habits }}
        dupItems={dupItems}
        placeholder="Add… (t task · e event · n note · * important · ^ memory)"
        aria-label="Quick add entry"
      />
      <Button type="button" variant="primary" onClick={() => add(val)}>
        Add
      </Button>
    </div>
  )
}
