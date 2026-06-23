import { useState } from 'react'
import { glyphFor } from '../lib/bullets'
import { cat } from '../lib/colors'
import { useJournal } from '../store'
import type { Entry } from '../lib/types'

/** A single rapid-log line: click the glyph to advance status, double-click text to edit. */
export function EntryRow({ entry }: { entry: Entry }) {
  const { cycleStatus, toggleImportant, deleteEntry, updateEntry } = useJournal()
  const dropped = entry.status === 'dropped'
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(entry.text)

  function commit() {
    setEditing(false)
    const t = draft.trim()
    if (t && t !== entry.text) updateEntry(entry.id, { text: t })
    else setDraft(entry.text)
  }

  return (
    <li className="group flex items-start gap-2 py-1">
      <button
        onClick={() => cycleStatus(entry.id)}
        aria-label={`Advance status of ${entry.text}`}
        title="Click to cycle: task → done → migrated → dropped"
        className="mt-0.5 w-5 shrink-0 text-center font-mono text-subtext1 hover:text-mauve"
        style={{ color: entry.status === 'done' ? cat('green') : undefined }}
      >
        {glyphFor(entry.type, entry.status)}
      </button>

      {entry.memory && <span title="Memory" style={{ color: cat('teal') }}>▲</span>}
      <button
        onClick={() => toggleImportant(entry.id)}
        title={entry.important ? 'Important · tap to clear' : 'Mark important'}
        aria-pressed={entry.important}
        aria-label="Toggle important"
        className="font-bold"
        style={{ color: entry.important ? cat('yellow') : cat('overlay0'), opacity: entry.important ? 1 : 0.45 }}
      >
        !
      </button>

      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(entry.text); setEditing(false) } }}
          className="flex-1 rounded border border-mauve bg-base px-1 text-sm text-text focus:outline-none"
        />
      ) : (
        <span
          onDoubleClick={() => { setDraft(entry.text); setEditing(true) }}
          title="Double-click to edit"
          className={`flex-1 cursor-text text-sm ${entry.status === 'done' ? 'text-overlay0' : 'text-text'} ${dropped ? 'text-overlay0 line-through' : ''}`}
        >
          {entry.text}
          {entry.recurringId && <span className="ml-1 align-middle text-xs" style={{ color: cat('overlay1') }} title="Repeats · edit the rule in Plan to change every future occurrence">↻</span>}
          {entry.tags.map((t) => (
            <span key={t} className="ml-1 text-xs" style={{ color: cat('sapphire') }}>
              #{t}
            </span>
          ))}
        </span>
      )}

      <button
        onClick={() => deleteEntry(entry.id)}
        aria-label="Delete entry"
        className="shrink-0 text-overlay0 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red"
      >
        ×
      </button>
    </li>
  )
}
