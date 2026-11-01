import { Check, X } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { parseTags } from '../lib/bullets'
import { cat, onRaised } from '../lib/colors'
import { Card, Empty } from './ui'
import { useDevice } from './shell/device'
import { Cell, Cells } from './ui/cells'

/**
 * Tag manager: every #tag with its usage count, renamable in place. Renaming to
 * an existing tag merges them (both rewrite to the same name across all entries).
 */
export function TagManager() {
  const { data, renameTag } = useJournal()
  const [editing, setEditing] = useState<string | null>(null)
  const [val, setVal] = useState('')
  const phone = useDevice() === 'mobile'

  const counts = new Map<string, number>()
  for (const e of data.entries) for (const t of parseTags(e.text)) counts.set(t, (counts.get(t) ?? 0) + 1)
  const tags = [...counts.entries()].sort((a, b) => b[1] - a[1])

  function commit(old: string) {
    const next = val.trim().replace(/^#/, '').toLowerCase()
    if (next && next !== old) renameTag(old, next)
    setEditing(null); setVal('')
  }

  // Phone: one row per tag, its count at the right; tapping it edits in place.
  if (phone) return (
    <Cells title="Tags" aside="tap to rename or merge">
      {tags.length === 0 && <p className="cell text-body text-fg-2">No #tags yet — add one in any entry, e.g. #travel</p>}
      {tags.map(([tag, n]) => editing === tag ? (
        <div key={tag} className="cell">
          <label className="flex min-w-0 flex-1 items-center gap-1">
            <span className="text-body text-fg-2">#</span>
            <input
              autoFocus
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') commit(tag); if (e.key === 'Escape') { setEditing(null); setVal('') } }}
              className="cell-input cell-input-left"
              aria-label={`Rename tag ${tag}`}
            />
          </label>
          <button type="button" onClick={() => commit(tag)} aria-label="Save tag" className="grid size-11 place-items-center"><Icon as={Check} size="sm" className="text-green" /></button>
          <button type="button" onClick={() => { setEditing(null); setVal('') }} aria-label="Cancel" className="grid size-11 place-items-center"><Icon as={X} size="sm" className="text-fg-2" /></button>
        </div>
      ) : (
        <Cell key={tag} title={`#${tag}`} trail={n} label="Rename" onPress={() => { setEditing(tag); setVal(tag) }} />
      ))}
    </Cells>
  )

  return (
    <Card band collapsible defaultCollapsed title="Tags" subtitle="Rename or merge your #tags across every entry">
      {tags.length === 0 ? (
        <Empty>No #tags yet · add them inline in any entry, e.g. “#travel”.</Empty>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {tags.map(([tag, n]) => (
            <li key={tag}>
              {editing === tag ? (
                <span className="inline-flex items-center gap-1 rounded-pill border border-mauve bg-ink-0 px-1.5 py-0.5">
                  <span className="text-sky">#</span>
                  <input
                    autoFocus
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') commit(tag); if (e.key === 'Escape') { setEditing(null); setVal('') } }}
                    className="w-24 bg-transparent text-body text-fg-1 focus:outline-none"
                    aria-label={`Rename tag ${tag}`}
                  />
                  <button onClick={() => commit(tag)} title="Save tag" aria-label="Save tag"><Icon as={Check} size="sm" className="text-green" /></button>
                  <button onClick={() => { setEditing(null); setVal('') }} aria-label="Cancel"><Icon as={X} size="sm" className="text-fg-2" /></button>
                </span>
              ) : (
                <button
                  onClick={() => { setEditing(tag); setVal(tag) }}
                  className="inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-body hover:ring-1 hover:ring-mauve"
                  style={{ background: cat('surface0'), color: onRaised('sapphire') }}
                  title="Click to rename / merge"
                >
                  #{tag}<sup className="ml-0.5 text-micro text-fg-2">{n}</sup>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
