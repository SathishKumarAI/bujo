import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useJournal } from '../../store'
import { Band, BandCell, BandRow, Eyebrow } from '../mod'
import { Button } from '../ui/button'
import { cat, rechartsTooltip } from '../../lib/colors'
import { prettyDay, todayISO } from '../../lib/date'
import { formatMinutes } from '../../lib/focus'
import {
  avgWpm, bestWpm, DEFAULT_TYPING_GOAL_MIN, isWeekday, typingGoalProgress, typingStreak, typingWeekMinutes, wpmTrend,
} from '../../lib/typing'

const SOURCES = ['Monkeytype', 'keybr', 'TypingClub', '10FastFingers', 'TypeRacer', 'Other'] as const
const SITES = [
  { name: 'Monkeytype', url: 'https://monkeytype.com' },
  { name: 'keybr', url: 'https://www.keybr.com' },
  { name: 'TypingClub', url: 'https://www.typingclub.com' },
  { name: '10FastFingers', url: 'https://10fastfingers.com' },
  { name: 'TypeRacer', url: 'https://play.typeracer.com' },
]
const blank = { date: todayISO(), durationMin: '', wpm: '', accuracy: '', source: 'Monkeytype' as string }

/**
 * Typing practice — a second tracker on the same page, because speed drills are
 * deep-work practice and nobody wants a whole tab for them.
 *
 * Owns its own form, stats, trend and history. It talks to the store directly:
 * nothing else on the page reads or writes typing sessions, so routing six
 * callbacks through the view would only add indirection.
 *
 * It used to be a collapsed accordion holding a card holding a two-column grid.
 * Same content, one band.
 */
export function TypingBand() {
  const { data, addTypingSession, removeTypingSession } = useJournal()
  const [f, setF] = useState(blank)
  const set = (p: Partial<typeof blank>) => setF((c) => ({ ...c, ...p }))
  const today = todayISO()

  const sessions = [...(data.typingSessions ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1))
  const goalMin = data.settings.typingGoalMin ?? DEFAULT_TYPING_GOAL_MIN
  const goal = typingGoalProgress(data, today, goalMin)
  const weekday = isWeekday(today)
  const trend = wpmTrend(data, 14, today).filter((d) => d.has)
  const wpmCount = (data.typingSessions ?? []).filter((s) => s.wpm != null).length

  const field = 'w-full border-0 border-b border-line bg-transparent py-1 text-label text-fg-1 placeholder:text-fg-3 focus-visible:border-brand focus-visible:outline-none'

  function log() {
    if (!f.durationMin) return
    addTypingSession({
      date: f.date,
      durationMin: Number(f.durationMin),
      wpm: f.wpm ? Number(f.wpm) : undefined,
      accuracy: f.accuracy ? Number(f.accuracy) : undefined,
      source: f.source || undefined,
    })
    setF({ ...blank })
  }

  return (
    <Band>
      <BandRow>
        <BandCell className="basis-[20rem]">
          <h2 className="font-display text-heading font-medium text-fg-1">Typing practice</h2>
          <p className="mt-1 mb-4 text-label text-fg-2">Speed and accuracy drills.</p>

          <div className="grid max-w-[24rem] gap-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="text-label text-fg-2">
                Date
                <input type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} className={field} />
              </label>
              <label className="text-label text-fg-2">
                Minutes
                <input type="number" value={f.durationMin} onChange={(e) => set({ durationMin: e.target.value })} placeholder="20" className={field} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-label text-fg-2">
                WPM
                <input type="number" value={f.wpm} onChange={(e) => set({ wpm: e.target.value })} placeholder="75" className={field} />
              </label>
              <label className="text-label text-fg-2">
                Accuracy %
                <input type="number" value={f.accuracy} onChange={(e) => set({ accuracy: e.target.value })} placeholder="96" className={field} />
              </label>
            </div>
            <label className="text-label text-fg-2">
              Source
              <select value={f.source} onChange={(e) => set({ source: e.target.value })} className={field}>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <Button variant="secondary" onClick={log} className="w-full rounded-none">
              Add session
            </Button>
          </div>

          <div className="mt-5 max-w-[24rem] border-t border-line pt-4">
            <div className="flex items-baseline justify-between text-label">
              <span className="text-fg-1">
                {weekday ? 'Today’s goal' : 'Bonus today'} · {formatMinutes(goal.minutes)} / {formatMinutes(goal.goalMin)}
              </span>
              <span className={goal.met ? 'text-brand-text' : 'text-fg-2'}>
                {goal.met ? 'met' : weekday ? `${goal.pct}%` : 'optional'}
              </span>
            </div>
            <div className="mt-2 h-2.5 bg-ink-2">
              <div className={`h-full ${goal.met ? 'bg-brand' : 'bg-fg-1'}`} style={{ width: `${goal.pct}%` }} />
            </div>
            {!weekday && (
              <p className="mt-2 text-caption text-fg-3">
                Weekends are off-schedule — practice counts as bonus and will not break the streak.
              </p>
            )}
          </div>
        </BandCell>

        <BandCell className="basis-[22rem]">
          <dl className="flex flex-wrap gap-x-8 gap-y-3 text-label">
            <div>
              <dt className="text-fg-2">Best WPM</dt>
              <dd className="num font-display text-heading text-fg-1">{bestWpm(data) || '—'}</dd>
            </div>
            <div>
              <dt className="text-fg-2">Avg WPM</dt>
              <dd className="num font-display text-heading text-fg-1">{avgWpm(data) || '—'}</dd>
            </div>
            <div>
              <dt className="text-fg-2">This week</dt>
              <dd className="num font-display text-heading text-fg-1">{formatMinutes(typingWeekMinutes(data, today))}</dd>
            </div>
            <div>
              <dt className="text-fg-2">Streak</dt>
              <dd className="num font-display text-heading text-fg-1">{typingStreak(data, today)}</dd>
            </div>
          </dl>

          {wpmCount >= 2 && trend.length >= 1 && (
            <div
              className="mt-4 h-32"
              role="img"
              aria-label={`Best WPM per practised day: ${trend.map((d) => `${d.date} ${d.wpm}`).join(', ')}`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid stroke={cat('surface0')} strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke={cat('overlay0')} fontSize={11} />
                  <YAxis domain={['auto', 'auto']} stroke={cat('overlay0')} fontSize={11} />
                  <Tooltip contentStyle={rechartsTooltip()} />
                  <Line type="monotone" dataKey="wpm" stroke={cat('mauve')} dot={{ r: 2 }} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="mt-5">
            <Eyebrow>Practice at</Eyebrow>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-label">
              {SITES.map((s) => (
                <a key={s.name} href={s.url} target="_blank" rel="noreferrer noopener" className="text-fg-2 hover:text-brand-text">
                  {s.name}
                </a>
              ))}
            </div>
          </div>

          {sessions.length === 0 ? (
            <p className="mt-5 text-label text-fg-3">No typing sessions yet — log a quick drill.</p>
          ) : (
            <ul className="mt-5">
              {/* Twelve most recent. The full history lives in the sessions band
                  below for deep work; typing drills are a check, not a log. */}
              {sessions.slice(0, 12).map((s) => (
                <li key={s.id} className="group flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line py-2 text-label">
                  <span className="text-fg-1">{s.source || 'Typing'}</span>
                  <span className="text-fg-3">{prettyDay(s.date)}</span>
                  <span className="num text-fg-2">{formatMinutes(s.durationMin)}</span>
                  {s.wpm != null && <span className="num text-fg-2">{s.wpm} wpm</span>}
                  {s.accuracy != null && <span className="num text-fg-2">{s.accuracy}% acc</span>}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeTypingSession(s.id)}
                    aria-label={`Delete typing session on ${prettyDay(s.date)}`}
                    className="ml-auto text-fg-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-danger-text"
                  >
                    ×
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </BandCell>
      </BandRow>
    </Band>
  )
}
