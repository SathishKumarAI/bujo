import { useState } from 'react'
import { UserPlus, AtSign, ExternalLink } from 'lucide-react'
import { useJournal } from '../store'
import { cat } from '../lib/colors'
import { fetchGithubProfile } from '../lib/enrich'
import { Button, Card, Empty, Input } from './ui'

/**
 * Friends / contacts collection. Everything is manual; the only network call is
 * an opt-in GitHub enrichment · you type a username and we pull that person's
 * PUBLIC profile from GitHub's official API (avatar, bio, company). No scraping,
 * no people-search, no third-party trackers.
 */
export function FriendsCard() {
  const { data, addFriend, updateFriend, removeFriend } = useJournal()
  const friends = [...(data.friends ?? [])].sort((a, b) => a.name.localeCompare(b.name))
  const [name, setName] = useState('')
  const [gh, setGh] = useState('')
  const [bday, setBday] = useState('')
  const [busy, setBusy] = useState(false)

  // Days until a friend's next birthday (from "MM-DD" or "YYYY-MM-DD").
  function daysToBirthday(b?: string): number | null {
    if (!b) return null
    const md = b.length === 5 ? b : b.slice(5)
    const [mm, dd] = md.split('-').map(Number)
    if (!mm || !dd) return null
    const now = new Date()
    let next = new Date(now.getFullYear(), mm - 1, dd)
    if (next < new Date(now.getFullYear(), now.getMonth(), now.getDate())) next = new Date(now.getFullYear() + 1, mm - 1, dd)
    return Math.round((next.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86_400_000)
  }

  async function add() {
    if (!name.trim()) return
    setBusy(true)
    try {
      let enrich = {}
      if (gh.trim()) {
        const p = await fetchGithubProfile(gh)
        if (p) enrich = { avatar: p.avatar, bio: p.bio, company: p.company, links: p.htmlUrl ? [p.htmlUrl] : undefined }
        else alert('Could not find that public GitHub profile (or rate-limited). Added without it.')
      }
      addFriend({ name: name.trim(), github: gh.trim() || undefined, birthday: bday || undefined, ...enrich })
      setName(''); setGh(''); setBday('')
    } finally {
      setBusy(false)
    }
  }

  async function reEnrich(id: string, handle: string) {
    const p = await fetchGithubProfile(handle)
    if (p) updateFriend(id, { avatar: p.avatar, bio: p.bio, company: p.company, links: p.htmlUrl ? [p.htmlUrl] : undefined })
    else alert('Could not refresh that profile right now.')
  }

  return (
    <Card title="Friends" subtitle="Manual contacts · optional GitHub profile pull (public, opt-in)">
      <div className="mb-3 space-y-2">
        <div className="flex flex-wrap gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="max-w-[45%]" />
          <div className="flex flex-1 items-center gap-1 rounded-lg border border-input bg-background px-2">
            <AtSign size={14} className="shrink-0 text-overlay0" />
            <input value={gh} onChange={(e) => setGh(e.target.value)} placeholder="github (optional)" className="w-full bg-transparent py-2 text-sm text-text placeholder:text-overlay0 focus:outline-none" />
          </div>
          <Button variant="primary" onClick={add} className="inline-flex items-center gap-1.5">
            <UserPlus size={14} /> {busy ? '…' : 'Add'}
          </Button>
        </div>
        <label className="flex items-center gap-2 text-xs text-overlay0">Birthday<input type="date" value={bday} onChange={(e) => setBday(e.target.value)} className="rounded-lg border border-input bg-background px-2 py-1 text-text" /></label>
        <p className="text-[11px] text-overlay0">GitHub pull uses the official public API · only data they’ve made public. Nothing else is fetched.</p>
      </div>

      {friends.length === 0 ? (
        <Empty>No friends added yet.</Empty>
      ) : (
        <ul className="space-y-2">
          {friends.map((f) => (
            <li key={f.id} className="group flex items-start gap-3 rounded-lg border border-surface0 bg-base p-2">
              {f.avatar
                ? <img src={f.avatar} alt="" className="h-9 w-9 shrink-0 rounded-full" />
                : <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold" style={{ background: cat('surface1'), color: cat('subtext0') }}>{f.name.slice(0, 1).toUpperCase()}</span>}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text">
                  {f.name}
                  {(() => {
                    const d = daysToBirthday(f.birthday)
                    if (d == null) return null
                    return <span className="ml-1.5 text-xs" style={{ color: d <= 14 ? cat('pink') : cat('overlay0') }}>🎂 {d === 0 ? 'today!' : `${d}d`}</span>
                  })()}
                </p>
                {f.bio && <p className="truncate text-xs text-subtext0">{f.bio}</p>}
                {f.company && <p className="truncate text-xs text-overlay0">{f.company}</p>}
                <div className="mt-0.5 flex flex-wrap gap-2 text-xs">
                  {(f.links ?? []).map((l) => (
                    <a key={l} href={l} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-blue hover:underline">
                      <ExternalLink size={11} /> {new URL(l).hostname.replace('www.', '')}
                    </a>
                  ))}
                  {f.github && <button onClick={() => reEnrich(f.id, f.github!)} className="text-overlay0 hover:text-mauve">refresh</button>}
                </div>
              </div>
              <button onClick={() => removeFriend(f.id)} aria-label={`Remove ${f.name}`} className="text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red">×</button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
