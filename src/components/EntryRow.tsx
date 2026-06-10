import { glyphFor } from '../lib/bullets'
import { cat } from '../lib/colors'
import { useJournal } from '../store'
import type { Entry } from '../lib/types'

/** A single rapid-log line: click the glyph to advance task status. */
export function EntryRow({ entry }: { entry: Entry }) {
  const { cycleStatus, toggleImportant, deleteEntry } = useJournal()
  const dropped = entry.status === 'dropped'

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
      {entry.important && (
        <button onClick={() => toggleImportant(entry.id)} title="Important" style={{ color: cat('yellow') }}>
          !
        </button>
      )}

      <span
        className={`flex-1 text-sm ${entry.status === 'done' ? 'text-overlay0' : 'text-text'} ${dropped ? 'text-overlay0 line-through' : ''}`}
      >
        {entry.text}
        {entry.tags.map((t) => (
          <span key={t} className="ml-1 text-xs" style={{ color: cat('sapphire') }}>
            #{t}
          </span>
        ))}
      </span>

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
