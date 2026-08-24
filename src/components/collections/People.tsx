import { ArrowSquareOut, At, UserPlus } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../../store'
import { Band, BandCell, BandRow } from '../mod'
import { Button } from '../ui/button'
import { fetchGithubProfile } from '../../lib/enrich'
import { MONTHS } from '../../lib/date'

/**
 * People — friends and birthdays, as one band with two cells.
 *
 * This replaces `components/FriendsCard.tsx`, which had exactly one call site
 * (this page) and existed only because the page was made of cards.
 *
 * The only network call in here is opt-in GitHub enrichment: you type a public
 * username and the official API returns that person's public profile. No
 * scraping, no people-search, nothing fetched unless you ask.
 */
export function People() {
  const { data, addFriend, updateFriend, removeFriend, addBirthday, removeBirthday } = useJournal()
  const friends = [...(data.friends ?? [])].sort((a, b) => a.name.localeCompare(b.name))

  const [name, setName] = useState('')
  const [gh, setGh] = useState('')
  const [bday, setBday] = useState('')
  const [busy, setBusy] = useState(false)

  const [bName, setBName] = useState('')
  const [month, setMonth] = useState(1)
  const [day, setDay] = useState(1)

  /** Days until a friend's next birthday, from "MM-DD" or "YYYY-MM-DD". */
  function daysToBirthday(b?: string): number | null {
    if (!b) return null
    const md = b.length === 5 ? b : b.slice(5)
    const [mm, dd] = md.split('-').map(Number)
    if (!mm || !dd) return null
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    let next = new Date(now.getFullYear(), mm - 1, dd)
    if (next < startOfToday) next = new Date(now.getFullYear() + 1, mm - 1, dd)
    return Math.round((next.getTime() - startOfToday.getTime()) / 86_400_000)
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
      setName('')
      setGh('')
      setBday('')
    } finally {
      setBusy(false)
    }
  }

  async function reEnrich(id: string, handle: string) {
    const p = await fetchGithubProfile(handle)
    if (p) updateFriend(id, { avatar: p.avatar, bio: p.bio, company: p.company, links: p.htmlUrl ? [p.htmlUrl] : undefined })
    else alert('Could not refresh that profile right now.')
  }

  // One list from two sources, deduped on person + date. Concatenating them put
  // anyone who is both a friend and a birthday entry on the same day twice; the
  // friend record wins because it is the one carrying a profile.
  const friendBirthdays = friends
    .filter((f) => f.birthday)
    .map((f) => {
      const md = f.birthday!.length === 5 ? f.birthday! : f.birthday!.slice(5)
      const [m, d] = md.split('-').map(Number)
      return { id: `friend:${f.id}`, name: f.name, month: m, day: d, fromFriend: true }
    })
  const key = (b: { name: string; month: number; day: number }) => `${b.name.trim().toLowerCase()}|${b.month}|${b.day}`
  const birthdays = [...friendBirthdays, ...data.birthdays.map((b) => ({ ...b, fromFriend: false }))]
    .filter((b) => b.month >= 1 && b.month <= 12 && b.day >= 1 && b.day <= 31)
    .filter((b, i, all) => all.findIndex((o) => key(o) === key(b)) === i)
    .sort((a, b) => a.month - b.month || a.day - b.day)

  return (
    <Band className="border-b-0">
      <BandRow>
        <BandCell className="basis-[24rem]">
          <h2 className="font-display text-heading font-medium text-fg-1">Friends</h2>
          <p className="mt-1 mb-3 text-label text-fg-2">Manual contacts, with an optional public GitHub pull.</p>

          <div className="flex flex-wrap items-center gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              aria-label="Friend name"
              className="min-w-[8rem] flex-1 border-0 border-b border-line bg-transparent py-1 text-label text-fg-1 placeholder:text-fg-3 focus-visible:border-brand focus-visible:outline-none"
            />
            <div className="flex min-w-[9rem] flex-1 items-center gap-1.5 border-b border-line">
              <Icon as={At} size="sm" className="shrink-0 text-fg-3" />
              <input
                value={gh}
                onChange={(e) => setGh(e.target.value)}
                placeholder="github (optional)"
                aria-label="GitHub username"
                className="w-full border-0 bg-transparent py-1 text-label text-fg-1 placeholder:text-fg-3 focus-visible:outline-none"
              />
            </div>
            <Button variant="secondary" onClick={add} className="shrink-0 rounded-none">
              <Icon as={UserPlus} size="sm" /> {busy ? '…' : 'Add'}
            </Button>
          </div>
          <label className="mt-2 flex items-center gap-2 text-label text-fg-2">
            Birthday
            <input
              type="date"
              value={bday}
              onChange={(e) => setBday(e.target.value)}
              className="border-0 border-b border-line bg-transparent py-1 text-fg-1 focus-visible:border-brand focus-visible:outline-none"
            />
          </label>
          <p className="mt-2 text-caption text-fg-3">
            The GitHub pull uses the official public API and only data they have made public.
          </p>

          {friends.length === 0 ? (
            <p className="mt-4 text-label text-fg-3">No friends added yet.</p>
          ) : (
            <ul className="mt-4">
              {friends.map((f) => {
                const d = daysToBirthday(f.birthday)
                return (
                  <li key={f.id} className="group flex items-start gap-3 border-t border-line py-2.5">
                    {f.avatar ? (
                      <img src={f.avatar} alt="" className="size-9 shrink-0" />
                    ) : (
                      <span className="grid size-9 shrink-0 place-items-center border border-line text-label text-fg-2">
                        {f.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0 flex-1 text-label">
                      <p className="truncate text-fg-1">
                        {f.name}
                        {d != null && <span className="ml-2 text-fg-2">🎂 {d === 0 ? 'today' : `${d}d`}</span>}
                      </p>
                      {f.bio && <p className="truncate text-fg-2">{f.bio}</p>}
                      {f.company && <p className="truncate text-fg-2">{f.company}</p>}
                      <div className="mt-0.5 flex flex-wrap gap-3 text-caption">
                        {(f.links ?? []).map((l) => (
                          <a key={l} href={l} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-text hover:underline">
                            <Icon as={ArrowSquareOut} size="sm" /> {new URL(l).hostname.replace('www.', '')}
                          </a>
                        ))}
                        {f.github && (
                          <button onClick={() => reEnrich(f.id, f.github!)} className="text-fg-2 hover:text-brand-text">
                            refresh
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFriend(f.id)}
                      aria-label={`Remove ${f.name}`}
                      className="shrink-0 text-fg-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-danger-text"
                    >
                      ×
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </BandCell>

        <BandCell className="basis-[18rem]">
          <h2 className="font-display text-heading font-medium text-fg-1">Birthdays</h2>
          <p className="mt-1 mb-3 text-label text-fg-2">Friends' dates and anyone else you add.</p>

          <div className="flex flex-wrap items-center gap-3">
            <input
              value={bName}
              onChange={(e) => setBName(e.target.value)}
              placeholder="Name"
              aria-label="Birthday name"
              className="min-w-[7rem] flex-1 border-0 border-b border-line bg-transparent py-1 text-label text-fg-1 placeholder:text-fg-3 focus-visible:border-brand focus-visible:outline-none"
            />
            <select
              aria-label="Birthday month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border-0 border-b border-line bg-transparent py-1 text-label text-fg-1 focus-visible:border-brand focus-visible:outline-none"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m.slice(0, 3)}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={31}
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              aria-label="Birthday day"
              className="w-14 border-0 border-b border-line bg-transparent py-1 text-right text-label text-fg-1 focus-visible:border-brand focus-visible:outline-none"
            />
            <Button
              variant="secondary"
              className="shrink-0 rounded-none"
              onClick={() => {
                if (!bName.trim()) return
                addBirthday({ name: bName.trim(), month, day })
                setBName('')
              }}
            >
              Add
            </Button>
          </div>

          {birthdays.length === 0 ? (
            <p className="mt-4 text-label text-fg-3">Add a birthday and it comes back every year.</p>
          ) : (
            <ul className="mt-4">
              {birthdays.map((b) => (
                <li key={b.id} className="group flex items-center gap-3 border-t border-line py-2 text-label">
                  <span className="min-w-0 flex-1 truncate text-fg-1">{b.name}</span>
                  <span className="num shrink-0 text-fg-2">
                    {MONTHS[b.month - 1].slice(0, 3)} {b.day}
                  </span>
                  {b.fromFriend ? (
                    <span className="shrink-0 text-caption text-fg-3">friend</span>
                  ) : (
                    <button
                      onClick={() => removeBirthday(b.id)}
                      aria-label={`Remove ${b.name}`}
                      className="shrink-0 text-fg-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-danger-text"
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </BandCell>
      </BandRow>
    </Band>
  )
}
