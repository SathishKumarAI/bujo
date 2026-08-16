import { ArrowSquareOut, Check, Plus, Trash } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../../store'
import { Band, Eyebrow } from '../mod'
import { Button } from '../ui/button'

/**
 * Saved links to read later: paste, tick off, remove.
 *
 * The one band that still talks to the store directly — it owns a list nothing
 * else on the page touches, so threading six callbacks through the view would
 * buy nothing. Unread first, then newest.
 */
export function ReadLater() {
  const store = useJournal()
  const { data } = store
  const links = [...(data.readLinks ?? [])].sort(
    (a, b) => Number(a.done) - Number(b.done) || b.createdAt.localeCompare(a.createdAt),
  )
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')

  function add() {
    const u = url.trim()
    if (!u) return
    store.addReadLink({ url: /^https?:\/\//.test(u) ? u : `https://${u}`, title: title.trim() || undefined })
    setUrl('')
    setTitle('')
  }

  return (
    <Band className="border-b-0 py-6">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <h2 className="font-display text-heading font-medium text-fg-1">Read later</h2>
        <Eyebrow className="tracking-[0.1em]">{links.filter((l) => !l.done).length} to read</Eyebrow>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-3">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Paste a link to read later"
          aria-label="Link to save"
          className="min-w-[12rem] flex-1 border-0 border-b border-line bg-transparent py-1 text-label text-fg-1 placeholder:text-fg-3 focus-visible:border-brand focus-visible:outline-none"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Title (optional)"
          aria-label="Link title"
          className="min-w-[8rem] flex-1 border-0 border-b border-line bg-transparent py-1 text-label text-fg-1 placeholder:text-fg-3 focus-visible:border-brand focus-visible:outline-none"
        />
        <Button variant="secondary" onClick={add} className="shrink-0 rounded-none">
          <Icon as={Plus} size="sm" /> Save
        </Button>
      </div>

      {links.length === 0 ? (
        <p className="py-4 text-label text-fg-2">No saved links yet — paste an article or a book page.</p>
      ) : (
        <ul>
          {links.map((l) => (
            <li key={l.id} className="group flex items-center gap-3 border-t border-line py-2 text-label">
              <button
                onClick={() => store.updateReadLink(l.id, { done: !l.done })}
                aria-label={l.done ? `Mark ${l.title || l.url} unread` : `Mark ${l.title || l.url} read`}
                aria-pressed={!!l.done}
                className={`grid size-4 shrink-0 place-items-center border ${
                  l.done ? 'border-brand bg-brand-wash text-brand-text' : 'border-line'
                }`}
              >
                {l.done && <Icon as={Check} size="sm" className="size-3" />}
              </button>
              <a
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className={`min-w-0 flex-1 truncate ${l.done ? 'text-fg-3 line-through' : 'text-fg-1 hover:text-brand-text'}`}
              >
                {l.title || l.url}
              </a>
              <Icon as={ArrowSquareOut} size="sm" className="shrink-0 text-fg-3" />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => store.removeReadLink(l.id)}
                aria-label={`Remove ${l.title || l.url}`}
                className="shrink-0 text-fg-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-danger-text"
              >
                <Icon as={Trash} size="sm" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Band>
  )
}
