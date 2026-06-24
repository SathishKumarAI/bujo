import { useState } from 'react'
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Code2, Flame, Keyboard } from 'lucide-react'
import { useJournal } from '../store'
import { prettyDay, todayISO } from '../lib/date'
import { Button, Card, Empty, Input, Pill, Slider, StatTile } from '../components/ui'
import { Page } from '../components/shell/Page'
import { PomodoroCard } from '../components/PomodoroCard'
import { cat } from '../lib/colors'
import {
  weeklyCodingMinutes, focusStreak, avgWeighted, dailyCodingMinutes, topTags, focusInsight, cumulativeHours, projectedWeeklyMinutes,
  minutesByWeekday, longestSession, minutesByProject, interruptionsTrend, deepWorkHeatmap, focusByWeekday,
} from '../lib/focus'
import {
  typingWeekMinutes, typingGoalProgress, bestWpm, avgWpm, wpmTrend, typingStreak, isWeekday, DEFAULT_TYPING_GOAL_MIN,
} from '../lib/typing'

const blank = { date: todayISO(), durationMin: '', project: '', focus: 7, stress: 3, interruptions: '', tags: '', notes: '' }

export function Focus() {
  const { data, addDevSession, updateDevSession, removeDevSession } = useJournal()
  const [f, setF] = useState(blank)
  const set = (p: Partial<typeof blank>) => setF((c) => ({ ...c, ...p }))
  const today = todayISO()

  const sessions = [...(data.devSessions ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1))
  const weekMin = weeklyCodingMinutes(data, today)
  const projWeekMin = projectedWeeklyMinutes(data, today)
  const streak = focusStreak(data, today)
  const series = dailyCodingMinutes(data, today, 14)
  const maxDay = Math.max(60, ...series.map((s) => s.min))
  const tags = topTags(data)
  const maxTag = Math.max(1, ...tags.map((t) => t.min))
  const insight = focusInsight(data)
  const byWeekday = minutesByWeekday(data)
  const maxWd = Math.max(1, ...byWeekday.map((w) => w.min))
  const longest = longestSession(data)
  const byProject = minutesByProject(data)
  const maxProj = Math.max(1, ...byProject.map((p) => p.min))
  const intTrend = interruptionsTrend(data, today, 14)
  const maxInt = Math.max(1, ...intTrend.map((d) => d.avg))
  const heat = deepWorkHeatmap(data, today, 26)
  const focusWd = focusByWeekday(data)
  const maxFocusWd = Math.max(1, ...focusWd.map((w) => w.avg))

  function log() {
    if (!f.durationMin) return
    addDevSession({
      date: f.date,
      durationMin: Number(f.durationMin),
      project: f.project.trim() || undefined,
      focus: f.focus,
      stress: f.stress,
      interruptions: f.interruptions ? Number(f.interruptions) : undefined,
      tags: f.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
      notes: f.notes.trim() || undefined,
    })
    setF({ ...blank })
  }

  const hrs = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`)

  return (
    <Page
      asideFirst
      aside={
        <>
        <PomodoroCard />
        <Card title="Log a session" subtitle="Coding / deep-work time">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm text-subtext1">Date<Input type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} className="mt-1" /></label>
              <label className="block text-sm text-subtext1">Minutes<Input type="number" value={f.durationMin} onChange={(e) => set({ durationMin: e.target.value })} placeholder="90" className="mt-1" /></label>
            </div>
            <label className="block text-sm text-subtext1">Project<Input value={f.project} onChange={(e) => set({ project: e.target.value })} placeholder="bujo, work…" className="mt-1" /></label>
            <Slider label="Focus / flow" value={f.focus} onChange={(v) => set({ focus: v })} color="mauve" hint="0 scattered · 10 deep flow" />
            <Slider label="Stress" value={f.stress} onChange={(v) => set({ stress: v })} color="red" hint="0 calm · 10 high" />
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm text-subtext1">Interruptions<Input type="number" value={f.interruptions} onChange={(e) => set({ interruptions: e.target.value })} placeholder="0" className="mt-1" /></label>
              <label className="block text-sm text-subtext1">Tags<Input value={f.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="typescript, react" className="mt-1" /></label>
            </div>
            <Button variant="primary" onClick={log} className="w-full">Log session</Button>
          </div>
        </Card>
        </>
      }
    >
      <div className="grid items-start gap-5 lg:grid-cols-2">
      <Card title="This week" subtitle="Coding time & wellbeing">
        <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          <Stat label="This week" value={hrs(weekMin)} color="mauve" icon={<Code2 size={14} />} />
          <Stat label="Day streak" value={String(streak)} color="peach" icon={<Flame size={14} />} />
          <Stat label="Avg focus" value={`${avgWeighted(data, 'focus')}/10`} color="green" />
          <Stat label="Avg stress" value={`${avgWeighted(data, 'stress')}/10`} color="red" />
        </div>
        {projWeekMin != null && projWeekMin > weekMin && (
          <p className="mt-3 rounded-lg border border-surface0 bg-base px-3 py-2 text-sm text-subtext1">
            📈 At this pace, you're on track for <span className="font-medium text-mauve">{hrs(projWeekMin)}</span> this week.
          </p>
        )}
        {longest && (
          <p className="mt-3 rounded-lg border border-surface0 bg-base px-3 py-2 text-sm text-subtext1">
            🏆 Longest session: <span className="font-medium text-peach">{hrs(longest.durationMin)}</span>
            {longest.project ? <> on <span className="text-text">{longest.project}</span></> : null} · {prettyDay(longest.date)}
          </p>
        )}
        {insight && <p className="mt-3 rounded-lg border border-surface0 bg-base px-3 py-2 text-sm text-subtext1">💡 {insight}</p>}
      </Card>

      <Card title="Coding minutes" subtitle="Last 14 days" defer>
        <div className="flex items-end gap-1" style={{ height: 80 }} role="img" aria-label={`Bar chart of coding minutes per day over the last 14 days: ${series.map((s) => `${s.min}m`).join(', ')}`}>
          {series.map((s) => (
            <div key={s.date} className="group relative flex-1" title={`${s.date}: ${s.min}m`}>
              <div className="rounded-t" style={{ height: `${Math.max(2, (s.min / maxDay) * 100)}%`, background: s.date === today ? cat('mauve') : cat('surface2') }} />
            </div>
          ))}
        </div>
      </Card>
      </div>

      {(() => {
        const cum = cumulativeHours(data)
        if (cum.length < 2) return null
        const max = cum[cum.length - 1].hours || 1
        const W = 600, H = 120
        const pts = cum.map((c, i) => `${(i / (cum.length - 1)) * W},${H - (c.hours / max) * H}`).join(' ')
        return (
          <Card title="Cumulative coding hours" subtitle={`${cum[cum.length - 1].hours}h logged all-time · momentum over ${cum.length} days`}>
            <div className="w-full" role="img" aria-label={`Line chart of cumulative coding hours, reaching ${cum[cum.length - 1].hours} hours`}>
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-32 w-full">
                <polyline points={`0,${H} ${pts} ${W},${H}`} fill={cat('mauve') + '22'} stroke="none" />
                <polyline points={pts} fill="none" stroke={cat('mauve')} strokeWidth={2} vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
          </Card>
        )
      })()}

      {heat.max > 0 && (
        <Card title="Deep-work heatmap" subtitle="Daily coding minutes · last 26 weeks">
          <div className="overflow-x-auto">
            <div
              className="grid w-max gap-[3px]"
              style={{ gridTemplateRows: 'repeat(7, 11px)', gridAutoFlow: 'column', gridAutoColumns: '11px' }}
              role="img"
              aria-label={`Heatmap of daily coding minutes over the last 26 weeks, busiest day ${heat.max} minutes`}
            >
              {heat.cells.map((c) => {
                const bg = c.level === 0 ? cat('surface0') : cat('mauve')
                const opacity = c.level === 0 ? 1 : 0.25 + (c.level / 4) * 0.75
                return (
                  <div
                    key={c.date}
                    title={`${c.date}: ${c.min}m`}
                    className="rounded-[2px]"
                    style={{ gridRow: c.weekday + 1, background: bg, opacity }}
                  />
                )
              })}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-overlay0">
            <span>less</span>
            {[0, 1, 2, 3, 4].map((lv) => (
              <span key={lv} className="h-2.5 w-2.5 rounded-[2px]"
                style={{ background: lv === 0 ? cat('surface0') : cat('mauve'), opacity: lv === 0 ? 1 : 0.25 + (lv / 4) * 0.75 }} />
            ))}
            <span>more</span>
          </div>
        </Card>
      )}

      {byWeekday.some((w) => w.min > 0) && (
        <Card title="Focus by weekday" subtitle="Total deep-work minutes by day of week">
          <div className="space-y-1.5">
            {byWeekday.map((w) => (
              <div key={w.day} className="flex items-center gap-2 text-sm">
                <span className="w-10 shrink-0 text-subtext1">{w.label}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface0">
                  <div className="h-full rounded-full" style={{ width: `${(w.min / maxWd) * 100}%`, background: w.min === maxWd ? cat('mauve') : cat('surface2') }} />
                </div>
                <span className="w-12 shrink-0 text-right text-xs text-overlay0">{hrs(w.min)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {focusWd.some((w) => w.count > 0) && (
        <Card title="Focus quality by weekday" subtitle="Duration-weighted avg focus score by day of week">
          <div className="space-y-1.5">
            {focusWd.map((w) => (
              <div key={w.day} className="flex items-center gap-2 text-sm">
                <span className="w-10 shrink-0 text-subtext1">{w.label}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface0">
                  <div className="h-full rounded-full" style={{ width: `${(w.avg / maxFocusWd) * 100}%`, background: w.avg === maxFocusWd && w.avg > 0 ? cat('green') : cat('teal') }} />
                </div>
                <span className="w-12 shrink-0 text-right text-xs text-overlay0">{w.count ? `${w.avg}/10` : '—'}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {byProject.length > 0 && (
        <Card title="Focus by project" subtitle="Total deep-work minutes per project">
          <div className="space-y-1.5">
            {byProject.map((p) => (
              <div key={p.project} className="flex items-center gap-2 text-sm">
                <span className="w-24 shrink-0 truncate text-subtext1">{p.project}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface0">
                  <div className="h-full rounded-full" style={{ width: `${(p.min / maxProj) * 100}%`, background: p.min === maxProj ? cat('mauve') : cat('surface2') }} />
                </div>
                <span className="w-12 shrink-0 text-right text-xs text-overlay0">{hrs(p.min)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {intTrend.some((d) => d.count > 0) && (
        <Card title="Interruptions trend" subtitle="Avg interruptions per session · last 14 days">
          <div className="flex items-end gap-1" style={{ height: 72 }} role="img"
            aria-label={`Average interruptions per session over the last 14 days: ${intTrend.map((d) => `${d.date} ${d.avg}`).join(', ')}`}>
            {intTrend.map((d) => (
              <div key={d.date} className="group relative flex-1" title={`${d.date}: ${d.count ? `${d.avg} avg` : 'no session'}`}>
                <div className="rounded-t" style={{ height: `${d.count ? Math.max(4, (d.avg / maxInt) * 100) : 0}%`, background: d.date === today ? cat('peach') : cat('surface2') }} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {tags.length > 0 && (
        <Card title="Languages & tools" subtitle="By time logged">
          <div className="space-y-1.5">
            {tags.map((t) => (
              <div key={t.tag} className="flex items-center gap-2 text-sm">
                <span className="w-24 shrink-0 truncate text-subtext1">{t.tag}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface0">
                  <div className="h-full rounded-full" style={{ width: `${(t.min / maxTag) * 100}%`, background: cat('teal') }} />
                </div>
                <span className="w-12 shrink-0 text-right text-xs text-overlay0">{hrs(t.min)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <TypingPractice />

      <Card title="History">
        {sessions.length === 0 ? (
          <Empty>No sessions yet. Log your first coding block.</Empty>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => (
              <SessionRow key={s.id} s={s} onSave={(p) => updateDevSession(s.id, p)} onDelete={() => removeDevSession(s.id)} />
            ))}
          </ul>
        )}
      </Card>
    </Page>
  )
}

function Stat({ label, value, color, icon }: { label: string; value: string; color: string; icon?: React.ReactNode }) {
  return <StatTile label={label} value={value} color={color} icon={icon} />
}

const TYPING_SOURCES = ['Monkeytype', 'keybr', 'TypingClub', '10FastFingers', 'TypeRacer', 'Other'] as const
const PRACTICE_SITES: { name: string; url: string; color: string }[] = [
  { name: 'Monkeytype', url: 'https://monkeytype.com', color: 'mauve' },
  { name: 'keybr', url: 'https://www.keybr.com', color: 'sky' },
  { name: 'TypingClub', url: 'https://www.typingclub.com', color: 'green' },
  { name: '10FastFingers', url: 'https://10fastfingers.com', color: 'peach' },
  { name: 'TypeRacer', url: 'https://play.typeracer.com', color: 'pink' },
]
const typingBlank = { date: todayISO(), durationMin: '', wpm: '', accuracy: '', source: 'Monkeytype' as string }

// Typing-practice tracker (mirrors the dev-session log) — logged inside the
// Focus view since speed-typing drills are deep-work practice.
function TypingPractice() {
  const { data, addTypingSession, removeTypingSession } = useJournal()
  const [f, setF] = useState(typingBlank)
  const set = (p: Partial<typeof typingBlank>) => setF((c) => ({ ...c, ...p }))
  const today = todayISO()

  const sessions = [...(data.typingSessions ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1))
  const goalMin = data.settings.typingGoalMin ?? DEFAULT_TYPING_GOAL_MIN
  const goal = typingGoalProgress(data, today, goalMin)
  const weekday = isWeekday(today)
  const weekMin = typingWeekMinutes(data, today)
  const best = bestWpm(data)
  const avg = avgWpm(data)
  const streak = typingStreak(data, today)
  const trend = wpmTrend(data, 14, today).filter((d) => d.has)
  const wpmCount = (data.typingSessions ?? []).filter((s) => s.wpm != null).length

  const hrs = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`)

  function log() {
    if (!f.durationMin) return
    addTypingSession({
      date: f.date,
      durationMin: Number(f.durationMin),
      wpm: f.wpm ? Number(f.wpm) : undefined,
      accuracy: f.accuracy ? Number(f.accuracy) : undefined,
      source: f.source || undefined,
    })
    setF({ ...typingBlank })
  }

  return (
    <Card title="Typing practice" subtitle="Speed & accuracy drills">
      <div className="grid items-start gap-5 lg:grid-cols-2">
        {/* Log form */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm text-subtext1">Date<Input type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} className="mt-1" /></label>
            <label className="block text-sm text-subtext1">Minutes<Input type="number" value={f.durationMin} onChange={(e) => set({ durationMin: e.target.value })} placeholder="20" className="mt-1" /></label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm text-subtext1">WPM<Input type="number" value={f.wpm} onChange={(e) => set({ wpm: e.target.value })} placeholder="75" className="mt-1" /></label>
            <label className="block text-sm text-subtext1">Accuracy %<Input type="number" value={f.accuracy} onChange={(e) => set({ accuracy: e.target.value })} placeholder="96" className="mt-1" /></label>
          </div>
          <label className="block text-sm text-subtext1">Source
            <select
              value={f.source}
              onChange={(e) => set({ source: e.target.value })}
              className="mt-1 w-full rounded-lg border border-surface0 bg-base px-3 py-2 text-sm text-text outline-none focus:border-mauve"
            >
              {TYPING_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <Button variant="primary" onClick={log} className="w-full">Add session</Button>

          {/* Today's goal progress */}
          <div className="rounded-lg border border-surface0 bg-base px-3 py-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-subtext1">
                {weekday ? "Today's goal" : 'Bonus today'} · {hrs(goal.minutes)} / {hrs(goal.goalMin)}
              </span>
              <span className={`text-xs ${goal.met ? 'text-green' : 'text-overlay0'}`}>
                {goal.met ? '✓ met' : weekday ? `${goal.pct}%` : 'optional'}
              </span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface0">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${goal.pct}%`, background: goal.met ? cat('green') : weekday ? cat('mauve') : cat('teal') }}
              />
            </div>
            {!weekday && <p className="mt-1 text-[11px] text-overlay0">Weekends are off-schedule — practice counts as bonus and won't break your streak.</p>}
          </div>
        </div>

        {/* Stats + trend */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <Stat label="Best WPM" value={best ? String(best) : '—'} color="mauve" icon={<Keyboard size={14} />} />
            <Stat label="Avg WPM" value={avg ? String(avg) : '—'} color="sky" />
            <Stat label="This week" value={hrs(weekMin)} color="green" />
            <Stat label="Streak" value={String(streak)} color="peach" icon={<Flame size={14} />} />
          </div>

          {wpmCount >= 2 && trend.length >= 1 && (
            <div className="h-32" role="img" aria-label={`Line chart of best WPM per practiced day: ${trend.map((d) => `${d.date} ${d.wpm}`).join(', ')}`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid stroke={cat('surface0')} strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke={cat('overlay0')} fontSize={11} />
                  <YAxis domain={['auto', 'auto']} stroke={cat('overlay0')} fontSize={11} />
                  <Tooltip contentStyle={{ background: '#181825', border: '1px solid #313244', borderRadius: 8, color: '#cdd6f4' }} />
                  <Line type="monotone" dataKey="wpm" stroke={cat('mauve')} dot={{ r: 2 }} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Practice sites */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-overlay0">Practice:</span>
        {PRACTICE_SITES.map((site) => (
          <a key={site.name} href={site.url} target="_blank" rel="noreferrer noopener" className="transition-opacity hover:opacity-80">
            <Pill color={site.color}>{site.name}</Pill>
          </a>
        ))}
      </div>

      {/* Recent sessions */}
      {sessions.length === 0 ? (
        <Empty>No typing sessions yet. Log a quick drill.</Empty>
      ) : (
        <ul className="mt-4 space-y-2">
          {sessions.slice(0, 12).map((s) => (
            <li key={s.id} className="group flex items-center justify-between rounded-lg border border-border bg-background p-2.5 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium text-text">{s.source || 'Typing'}</span>
                <span className="text-xs text-overlay0">{prettyDay(s.date)}</span>
                <span className="text-subtext0">{hrs(s.durationMin)}</span>
                {s.wpm != null && <span style={{ color: cat('mauve') }}>{s.wpm} wpm</span>}
                {s.accuracy != null && <span style={{ color: cat('green') }}>{s.accuracy}% acc</span>}
              </div>
              <button onClick={() => removeTypingSession(s.id)} aria-label="Delete typing session" className="text-overlay0 opacity-0 transition-opacity hover:text-red group-hover:opacity-100">×</button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

const hrsLabel = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`)

// History row with an in-place editor (BUJO-201) so a mistyped duration/focus
// no longer means delete-and-re-log (which also skews the duration-weighted avg).
function SessionRow({ s, onSave, onDelete }: {
  s: import('../lib/types').DevSession
  onSave: (patch: Partial<import('../lib/types').DevSession>) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [d, setD] = useState({
    durationMin: String(s.durationMin), project: s.project ?? '',
    focus: s.focus, stress: s.stress, notes: s.notes ?? '',
  })
  function save() {
    const mins = Number(d.durationMin)
    if (!mins || mins <= 0) return
    onSave({ durationMin: mins, project: d.project.trim() || undefined, focus: d.focus, stress: d.stress, notes: d.notes.trim() || undefined })
    setEditing(false)
  }
  if (editing) {
    return (
      <li className="rounded-lg border border-mauve/40 bg-background p-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs text-subtext1">Minutes<Input type="number" value={d.durationMin} onChange={(e) => setD((c) => ({ ...c, durationMin: e.target.value }))} className="mt-1" /></label>
          <label className="block text-xs text-subtext1">Project<Input value={d.project} onChange={(e) => setD((c) => ({ ...c, project: e.target.value }))} className="mt-1" /></label>
        </div>
        <div className="mt-2"><Slider label="Focus / flow" value={d.focus} onChange={(v) => setD((c) => ({ ...c, focus: v }))} color="mauve" /></div>
        <div className="mt-2"><Slider label="Stress" value={d.stress} onChange={(v) => setD((c) => ({ ...c, stress: v }))} color="red" /></div>
        <label className="mt-2 block text-xs text-subtext1">Notes<Input value={d.notes} onChange={(e) => setD((c) => ({ ...c, notes: e.target.value }))} className="mt-1" /></label>
        <div className="mt-3 flex gap-2">
          <Button variant="primary" onClick={save} className="flex-1">Save</Button>
          <Button onClick={() => setEditing(false)} className="flex-1">Cancel</Button>
        </div>
      </li>
    )
  }
  return (
    <li className="group rounded-lg border border-border bg-background p-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-text">{s.project || 'Session'}<span className="ml-2 text-xs text-overlay0">{prettyDay(s.date)}</span></span>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
          <button onClick={() => { setD({ durationMin: String(s.durationMin), project: s.project ?? '', focus: s.focus, stress: s.stress, notes: s.notes ?? '' }); setEditing(true) }} aria-label="Edit session" className="text-xs text-overlay0 hover:text-mauve">Edit</button>
          <button onClick={onDelete} aria-label="Delete session" className="text-overlay0 hover:text-red">×</button>
        </div>
      </div>
      <div className="mt-1 flex flex-wrap gap-3 text-xs text-subtext0">
        <span>{hrsLabel(s.durationMin)}</span>
        <span style={{ color: cat('mauve') }}>focus {s.focus}</span>
        <span style={{ color: cat('red') }}>stress {s.stress}</span>
        {s.interruptions != null && <span>{s.interruptions} interruptions</span>}
        {(s.tags ?? []).map((t) => <span key={t} className="text-teal">#{t}</span>)}
      </div>
      {s.notes && <p className="mt-1 text-xs text-overlay1 italic">{s.notes}</p>}
    </li>
  )
}
