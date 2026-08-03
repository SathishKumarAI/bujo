import { useState } from 'react'
import { glyphFor } from '../lib/bullets'
import { cat } from '../lib/colors'
import { notify } from '../lib/notify'
import { useJournal } from '../store'
import type { Entry } from '../lib/types'

/** Roughly two lines at the reading width — past this, an entry is a paragraph. */
const LONG_ENTRY = 180

/** A single rapid-log line: click the glyph to advance status, double-click text to edit. */
export function EntryRow({ entry }: { entry: Entry }) {
  const { cycleStatus, toggleImportant, deleteEntry, updateEntry, undo } = useJournal()
  const dropped = entry.status === 'dropped'
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(entry.text)
  // A rapid log is meant to be scannable. One pasted paragraph pushes every
  // other line off the screen, so long entries clamp to two lines with a way
  // to open them. The threshold is on characters, not rendered height, so the
  // control appears deterministically rather than depending on column width.
  const [expanded, setExpanded] = useState(false)
  const long = entry.text.length > LONG_ENTRY

  function commit() {
    setEditing(false)
    const t = draft.trim()
    if (t && t !== entry.text) updateEntry(entry.id, { text: t })
    else setDraft(entry.text)
  }

  return (
    <li className="group flex items-start gap-2 py-1">
      {/* The signature column. Fixed 24px gutter so every glyph in the log sits
          on one axis no matter how the text wraps — a ragged bullet column is
          what makes a rapid log read as a list of rows instead of a page of
          marks. `key` on the glyph re-runs the set animation on each cycle. */}
      <button
        onClick={() => cycleStatus(entry.id)}
        aria-label={`Advance status of ${entry.text}`}
        title="Click to cycle: task → done → migrated → dropped"
        className="mt-px w-6 shrink-0 text-center font-mono text-heading leading-6 text-fg-2 transition-colors hover:text-brand"
        style={{ color: entry.status === 'done' ? cat('green') : undefined }}
      >
        <span key={`${entry.type}-${entry.status}`} className="glyph-set inline-block">
          {glyphFor(entry.type, entry.status)}
        </span>
      </button>

      {entry.memory && <span title="Memory" style={{ color: cat('teal') }}>▲</span>}
      {/* The `!` used to render on every row at 45% opacity, so a five-line log
          showed five amber marks — noise that competed with the glyph column
          for the same job. Now it only shows when the entry IS important; the
          affordance for setting it appears on row hover, like delete does. */}
      <button
        onClick={() => toggleImportant(entry.id)}
        title={entry.important ? 'Important, tap to clear' : 'Mark important'}
        aria-pressed={entry.important}
        aria-label="Toggle important"
        className={`shrink-0 font-medium transition-opacity ${
          entry.important ? 'opacity-100' : 'opacity-0 group-hover:opacity-60 focus-visible:opacity-100'
        }`}
        style={{ color: entry.important ? cat('yellow') : cat('overlay0') }}
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
          className="flex-1 rounded border border-mauve bg-ink-0 px-1 text-body text-fg-1 focus:outline-none"
        />
      ) : (
        <span className="flex min-w-0 flex-1 flex-col items-start">
        <span
          onDoubleClick={() => { setDraft(entry.text); setEditing(true) }}
          title="Double-click to edit"
          /* A finished line recedes: struck through and dropped to the tertiary
             tier, so the eye skips it and lands on what is still open. Done and
             dropped read the same way here on purpose — both are closed. */
          className={`w-full cursor-text text-body transition-colors ${
            entry.status === 'done' || dropped ? 'text-fg-3 line-through decoration-fg-3/50' : 'text-fg-1'
          } ${long && !expanded ? 'line-clamp-2' : ''}`}
        >
          {entry.text}
          {entry.recurringId && <span className="ml-1 align-middle text-label" style={{ color: cat('overlay1') }} title="Repeats, edit the rule in Plan to change every future occurrence">↻</span>}
          {/* Only append a tag chip for tags NOT already written in the line.
              Typing "#travel walk the rim" put the tag in the text *and* in
              `entry.tags`, so the row rendered "#travel walk the rim #travel". */}
          {entry.tags
            .filter((t) => !new RegExp(`#${t}\\b`, 'i').test(entry.text))
            .map((t) => (
              <span key={t} className="ml-1 text-label" style={{ color: cat('sapphire') }}>
                #{t}
              </span>
            ))}
        </span>
        {long && (
          <button
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            className="text-label text-fg-2 underline-offset-2 hover:text-fg-1 hover:underline"
          >
            {expanded ? 'show less' : 'show more'}
          </button>
        )}
        </span>
      )}

      <button
        onClick={() => {
          deleteEntry(entry.id)
          // The store keeps an undo stack; surface it here so deleting is
          // recoverable without knowing ⌘Z exists.
          notify.undo('Entry deleted', undo)
        }}
        aria-label="Delete entry"
        className="shrink-0 text-fg-2 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red"
      >
        ×
      </button>
    </li>
  )
}
