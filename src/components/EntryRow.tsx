import { useState } from 'react'
import { glyphFor } from '../lib/bullets'
import { cat, onRaised } from '../lib/colors'
import { useJournal } from '../store'
import type { Entry } from '../lib/types'
import { justCapturedProps, useJustCaptured } from './CaptureReceipt'
import { ENTRY_KEY } from '../lib/recordKeys'

/** Roughly two lines at the reading width — past this, an entry is a paragraph. */
const LONG_ENTRY = 180

/** A single rapid-log line: click the glyph to advance status, double-click text to edit. */
export function EntryRow({ entry }: { entry: Entry }) {
  // Marked here rather than at the five call sites. `EntryRow` is rendered by
  // Today, Collections, the tag pages and the inbox band, and a capture that
  // writes a note can land in front of any of them — one of the few places
  // where putting the state inside the leaf is the smaller diff, not the lazier
  // one.
  const justNew = useJustCaptured().has(ENTRY_KEY(entry.id))
  const { cycleStatus, toggleImportant, deleteEntry, updateEntry } = useJournal()
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
    <li {...justCapturedProps(justNew)} className={`group flex items-start gap-2 py-1 ${justNew ? 'just-captured' : ''}`}>
      {/* The signature column. Fixed 24px gutter so every glyph in the log sits
          on one axis no matter how the text wraps — a ragged bullet column is
          what makes a rapid log read as a list of rows instead of a page of
          marks. `key` on the glyph re-runs the set animation on each cycle. */}
      <button
        onClick={() => cycleStatus(entry.id)}
        aria-label={`Advance status of ${entry.text}`}
        title="Click to cycle: task → done → migrated → dropped"
        className="mt-px w-6 shrink-0 text-center font-mono text-heading leading-6 text-fg-2 transition-colors hover:text-brand-text"
        style={{ color: entry.status === 'done' ? cat('green') : undefined }}
      >
        <span key={`${entry.type}-${entry.status}`} className="glyph-set inline-block">
          {glyphFor(entry.type, entry.status)}
        </span>
      </button>

      {entry.memory && <span title="Memory" style={{ color: onRaised('teal') }}>▲</span>}

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
          {entry.recurringId && <span className="ml-1 align-middle text-label" style={{ color: onRaised('overlay1') }} title="Repeats, edit the rule in Plan to change every future occurrence">↻</span>}
          {/* Only append a tag chip for tags NOT already written in the line.
              Typing "#travel walk the rim" put the tag in the text *and* in
              `entry.tags`, so the row rendered "#travel walk the rim #travel". */}
          {entry.tags
            .filter((t) => !new RegExp(`#${t}\\b`, 'i').test(entry.text))
            .map((t) => (
              <span key={t} className="ml-1 text-label" style={{ color: onRaised('sapphire') }}>
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

      {/* ACTION CLUSTER · every control this row owns, side by side on the
          right, in one place.
          `!` used to sit to the LEFT of the text, which cost a column on every
          row in the log — a permanent indent paid so a mark could appear on the
          few rows that are important — and split the row's controls across two
          ends of the line. Right-aligned and grouped, the text gets that width
          back, and "what can I do to this row" is one target area instead of a
          scavenger hunt.
          Important stays visible when set; both reveal on hover or focus. */}
      <span className="ml-auto flex shrink-0 items-center gap-1.5">
        <button
          onClick={() => toggleImportant(entry.id)}
          title={entry.important ? 'Important, tap to clear' : 'Mark important'}
          aria-pressed={entry.important}
          aria-label="Toggle important"
          className={`font-medium transition-opacity ${
            entry.important ? 'opacity-100' : 'opacity-0 group-hover:opacity-60 focus-visible:opacity-100'
          }`}
          style={{ color: entry.important ? cat('yellow') : cat('overlay0') }}
        >
          !
        </button>
        <button
          onClick={() => deleteEntry(entry.id)} // the store raises the undo toast
          aria-label="Delete entry"
          className="reveal text-fg-2 hover:text-red"
        >
          ×
        </button>
      </span>
    </li>
  )
}
