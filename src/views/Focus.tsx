import { useState } from 'react'
import { Code2, Flame } from 'lucide-react'
import { useJournal } from '../store'
import { prettyDay, todayISO } from '../lib/date'
import { Button, Card, Empty, Input, Slider, StatTile } from '../components/ui'
import { Page } from '../components/shell/Page'
import { cat } from '../lib/colors'
import {
  weeklyCodingMinutes, focusStreak, avgWeighted, dailyCodingMinutes, topTags, focusInsight, cumulativeHours,
} from '../lib/focus'

const blank = { date: todayISO(), durationMin: '', project: '', focus: 7, stress: 3, interruptions: '', tags: '', notes: '' }

export function Focus() {
  const { data, addDevSession, removeDevSession } = useJournal()
  const [f, setF] = useState(blank)
  const set = (p: Partial<typeof blank>) => setF((c) => ({ ...c, ...p }))
  const today = todayISO()

  const sessions = [...(data.devSessions ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1))
  const weekMin = weeklyCodingMinutes(data, today)
  const streak = focusStreak(data, today)
  const series = dailyCodingMinutes(data, today, 14)
  const maxDay = Math.max(60, ...series.map((s) => s.min))
  const tags = topTags(data)
  const maxTag = Math.max(1, ...tags.map((t) => t.min))
  const insight = focusInsight(data)

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
          <Card title="Cumulative coding hours" subtitle={`${cum[cum.length - 1].hours}h logged all-time — momentum over ${cum.length} days`}>
            <div className="w-full" role="img" aria-label={`Line chart of cumulative coding hours, reaching ${cum[cum.length - 1].hours} hours`}>
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-32 w-full">
                <polyline points={`0,${H} ${pts} ${W},${H}`} fill={cat('mauve') + '22'} stroke="none" />
                <polyline points={pts} fill="none" stroke={cat('mauve')} strokeWidth={2} vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
          </Card>
        )
      })()}

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

      <Card title="History">
        {sessions.length === 0 ? (
          <Empty>No sessions yet. Log your first coding block.</Empty>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s.id} className="group rounded-lg border border-border bg-background p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-text">{s.project || 'Session'}<span className="ml-2 text-xs text-overlay0">{prettyDay(s.date)}</span></span>
                  <button onClick={() => removeDevSession(s.id)} aria-label="Delete session" className="text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red">×</button>
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-subtext0">
                  <span>{hrs(s.durationMin)}</span>
                  <span style={{ color: cat('mauve') }}>focus {s.focus}</span>
                  <span style={{ color: cat('red') }}>stress {s.stress}</span>
                  {s.interruptions != null && <span>{s.interruptions} interruptions</span>}
                  {(s.tags ?? []).map((t) => <span key={t} className="text-teal">#{t}</span>)}
                </div>
                {s.notes && <p className="mt-1 text-xs text-overlay1 italic">{s.notes}</p>}
              </li>
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
