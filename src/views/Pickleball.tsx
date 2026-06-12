import { useState } from 'react'
import { Trophy, Repeat, ShieldPlus } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useJournal } from '../store'
import { Button, Card, Empty, Input, Segmented, StatTile, Textarea } from '../components/ui'
import { Page } from '../components/shell/Page'
import { cat } from '../lib/colors'
import { todayISO, prettyDay } from '../lib/date'
import { pickleTotals, winRateSeries, weeklyGames, playStreak } from '../lib/pickleball'

const tip = { background: '#181825', border: '1px solid #313244', borderRadius: 8, color: '#cdd6f4' }
const blank = { date: todayISO(), format: 'doubles' as 'singles' | 'doubles', gamesWon: '', gamesLost: '', durationMin: '', partner: '', rpe: '', notes: '' }

/** Physio / trainer / doctor guidance for pickleball — injury-prevention basics. */
const TIPS = [
  { t: 'Warm up first', d: '5–10 min: brisk walk, leg swings, arm circles, a few easy dinks. Cold muscles = pulls.' },
  { t: 'Protect the ankles', d: 'Lateral ankle sprains are the #1 court injury. Court shoes (not runners), split-step, don’t backpedal — turn and run.' },
  { t: 'Mind the shoulder & elbow', d: 'Rotator-cuff and “pickleball elbow” come from over-gripping and all-arm swings. Loosen the grip, drive from the legs/core.' },
  { t: 'Achilles & calves', d: 'Sudden push-offs strain the Achilles. Calf raises 3×/week; ease in after rest days.' },
  { t: 'Hydrate & cool down', d: 'Water before you’re thirsty; finish with calf, hip-flexor and shoulder stretches. Sharp joint pain → stop and rest.' },
]

export function Pickleball() {
  const { data, addPickleball, removePickleball } = useJournal()
  const [f, setF] = useState(blank)
  const set = (p: Partial<typeof blank>) => setF((c) => ({ ...c, ...p }))
  const today = todayISO()

  const all = pickleTotals(data)
  const week = pickleTotals(data, 7, today)
  const streak = playStreak(data, today)
  const trend = winRateSeries(data)
  const weeks = weeklyGames(data, 8, today)
  const sessions = [...(data.pickleball ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1))
  const [showAll, setShowAll] = useState(false)

  function log() {
    if (!f.gamesWon && !f.gamesLost) return
    addPickleball({
      date: f.date,
      format: f.format,
      gamesWon: Number(f.gamesWon) || 0,
      gamesLost: Number(f.gamesLost) || 0,
      durationMin: f.durationMin ? Number(f.durationMin) : undefined,
      partner: f.partner.trim() || undefined,
      rpe: f.rpe ? Number(f.rpe) : undefined,
      notes: f.notes.trim() || undefined,
    })
    setF({ ...blank })
  }
  function repeatLast() {
    const last = sessions[0]
    if (last) setF({ date: today, format: last.format, gamesWon: '', gamesLost: '', durationMin: String(last.durationMin ?? ''), partner: last.partner ?? '', rpe: '', notes: '' })
  }

  const wl = [{ name: 'Won', value: all.gamesWon, color: 'green' }, { name: 'Lost', value: all.gamesLost, color: 'red' }]

  return (
    <Page
      asideFirst
      aside={
        <>
          <Card title="Log a session" right={sessions.length ? <Button onClick={repeatLast} className="inline-flex items-center gap-1"><Repeat size={13} /> Repeat</Button> : undefined}>
            <div className="space-y-3">
              <label className="block text-sm text-subtext1">Date<Input type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} className="mt-1" /></label>
              <div><p className="mb-1 text-sm text-subtext1">Format</p><Segmented value={f.format} onChange={(v) => set({ format: v })} options={[{ value: 'doubles', label: 'Doubles' }, { value: 'singles', label: 'Singles' }]} /></div>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-sm text-subtext1">Games won<Input type="number" value={f.gamesWon} onChange={(e) => set({ gamesWon: e.target.value })} placeholder="0" className="mt-1" /></label>
                <label className="block text-sm text-subtext1">Games lost<Input type="number" value={f.gamesLost} onChange={(e) => set({ gamesLost: e.target.value })} placeholder="0" className="mt-1" /></label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" value={f.durationMin} onChange={(e) => set({ durationMin: e.target.value })} placeholder="Minutes" aria-label="Minutes" />
                <Input type="number" value={f.rpe} onChange={(e) => set({ rpe: e.target.value })} placeholder="RPE 1–10" aria-label="RPE" />
              </div>
              {f.format === 'doubles' && <Input value={f.partner} onChange={(e) => set({ partner: e.target.value })} placeholder="Partner (optional)" />}
              <Textarea value={f.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="How did it go?" rows={2} />
              <Button variant="primary" onClick={log} className="w-full">Log session</Button>
            </div>
          </Card>

          <Card title="History" subtitle="Tap × to remove">
            {sessions.length === 0 ? (
              <Empty>No sessions logged yet.</Empty>
            ) : (
              <ul className="divide-y divide-surface0">
                {(showAll ? sessions : sessions.slice(0, 6)).map((p) => (
                  <li key={p.id} className="group flex items-center justify-between gap-2 py-2 text-sm">
                    <span className="text-subtext1">{prettyDay(p.date)} <span className="text-overlay0">· {p.format}</span></span>
                    <span className="flex items-center gap-2">
                      <span style={{ color: cat('green') }}>{p.gamesWon}</span>–<span style={{ color: cat('red') }}>{p.gamesLost}</span>
                      <button onClick={() => removePickleball(p.id)} aria-label="Remove" className="text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red">×</button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {sessions.length > 6 && <button onClick={() => setShowAll((v) => !v)} className="mt-2 text-sm text-mauve hover:underline">{showAll ? 'Show less' : `Show all ${sessions.length}`}</button>}
          </Card>
        </>
      }
    >
      <Card title="At a glance" subtitle="Your pickleball record">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile compact label="Sessions" value={all.sessions} color="mauve" />
          <StatTile compact label="Games" value={all.games} color="blue" />
          <StatTile compact label="Win %" value={`${all.winPct}%`} color="green" icon={<Trophy size={14} />} />
          <StatTile compact label="Day streak" value={streak} color="peach" />
        </div>
        <p className="mt-3 text-sm text-subtext0">This week: <span className="text-text">{week.games}</span> games · <span style={{ color: cat('green') }}>{week.winPct}%</span> won</p>
      </Card>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card title="Win-rate trend" subtitle="Win % per session">
          {trend.length < 2 ? <Empty>Log a couple of sessions to see the trend.</Empty> : (
            <div className="h-52" role="img" aria-label="Line chart of win percentage per session over time">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke={cat('surface0')} strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke={cat('overlay0')} fontSize={11} />
                  <YAxis domain={[0, 100]} stroke={cat('overlay0')} fontSize={11} />
                  <Tooltip contentStyle={tip} />
                  <Line type="monotone" dataKey="winPct" stroke={cat('green')} dot={{ r: 2 }} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="Win / loss" subtitle="All games played">
          {all.games === 0 ? <Empty>No games yet.</Empty> : (
            <div className="h-52" role="img" aria-label={`Donut of ${all.gamesWon} games won and ${all.gamesLost} lost`}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={wl} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2}>
                    {wl.map((x) => <Cell key={x.name} fill={cat(x.color)} />)}
                  </Pie>
                  <Tooltip contentStyle={tip} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 text-xs">
                {wl.map((x) => <span key={x.name} style={{ color: cat(x.color) }}>● {x.name} {x.value}</span>)}
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card title="Games per week" subtitle="Last 8 weeks">
        <div className="h-40" role="img" aria-label="Bar chart of pickleball games played per week over the last 8 weeks">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeks.map((g, i) => ({ wk: `w${i + 1}`, games: g }))} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid stroke={cat('surface0')} vertical={false} />
              <XAxis dataKey="wk" stroke={cat('overlay0')} fontSize={11} />
              <YAxis stroke={cat('overlay0')} fontSize={11} />
              <Tooltip contentStyle={tip} cursor={{ fill: cat('surface0') }} />
              <Bar dataKey="games" fill={cat('teal')} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title={<span className="inline-flex items-center gap-2"><ShieldPlus size={18} className="text-green" /> Play safe — physio & trainer notes</span>} subtitle="Injury-prevention basics for the court" collapsible>
        <ul className="space-y-2">
          {TIPS.map((x) => (
            <li key={x.t} className="border-t border-surface0 pt-2 text-sm first:border-t-0 first:pt-0">
              <p className="text-subtext1">{x.t}</p>
              <p className="text-xs text-overlay1">{x.d}</p>
            </li>
          ))}
        </ul>
      </Card>
    </Page>
  )
}
