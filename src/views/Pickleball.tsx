import { useState } from 'react'
import { Trophy, Repeat, ShieldPlus, Target, ExternalLink, Dumbbell } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useJournal } from '../store'
import { Button, Card, Empty, Input, Segmented, StatTile, Textarea } from '../components/ui'
import { Page } from '../components/shell/Page'
import { cat } from '../lib/colors'
import { todayISO, prettyDay, addDays, fromISODay, WEEKDAYS } from '../lib/date'
import { pickleTotals, winRateSeries, weeklyGames, playStreak, formatStats, cumulativeGames, gamesByDay } from '../lib/pickleball'

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

/** Quick pre-match warm-up — done before logging a session keeps injuries down. */
const WARMUP = [
  '5 min brisk walk or light jog to raise the heart rate',
  'Leg swings ×10/side · ankle circles ×10 · hip openers',
  'Arm circles, shoulder rolls, wrist mobility',
  'Side shuffles + split-steps to prime lateral movement',
  '2–3 min of easy dinks and soft volleys at the kitchen line',
]

/** Rotating practice focus — one surfaces per day so you always have a goal. */
const DRILLS = [
  { name: 'Dink consistency', focus: 'Soft game', how: 'Cross-court dinks for 5 min with no pop-ups. Land in the kitchen, paddle out front, relaxed grip.' },
  { name: 'Third-shot drops', focus: 'Transition', how: 'Drop from the baseline into the kitchen. Track success — hit 7/10 before you speed anything up.' },
  { name: 'Reset volleys', focus: 'Defense', how: 'Partner feeds hard at your feet; soft-block into the kitchen. Absorb pace, don’t swing.' },
  { name: 'Serve depth & spin', focus: 'Serve', how: '20 serves to the back third for depth; add topspin only once depth is reliable.' },
  { name: 'Footwork & split-step', focus: 'Movement', how: 'Split-step on every shot, shuffle (never cross feet) at the line. 3×30s ladder.' },
  { name: 'Stacking & poaching', focus: 'Doubles strategy', how: 'Signals + switches with your partner; cover the middle, call “mine / yours”.' },
  { name: 'Lob & overhead', focus: 'Court coverage', how: 'Alternate defensive lobs and putaway overheads. Agree who takes the lob.' },
]

/** Reputable external coaching / rules resources (open in a new tab). */
const RESOURCES = [
  { name: 'USA Pickleball — official rules & how-to', url: 'https://usapickleball.org' },
  { name: 'The Dink — drills, strategy & news', url: 'https://www.thedinkpickleball.com' },
]

export function Pickleball() {
  const { data, addPickleball, removePickleball, setSettings } = useJournal()
  const [f, setF] = useState(blank)
  const set = (p: Partial<typeof blank>) => setF((c) => ({ ...c, ...p }))
  const today = todayISO()
  // Deterministic daily rotation so the practice focus is stable for the day.
  const drill = DRILLS[(fromISODay(today).getDate() + fromISODay(today).getMonth() * 3) % DRILLS.length]

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
  const formats = formatStats(data)
  const cum = cumulativeGames(data)
  const byDay = gamesByDay(data)
  const goal = data.settings.pickleballGoalGames ?? 0
  // 13-week play-frequency heatmap.
  const WEEKS = 13
  const hStart = addDays(today, -(WEEKS * 7 - 1))
  const hPad = fromISODay(hStart).getDay()
  const maxDay = Math.max(1, ...byDay.values())

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
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="text-subtext0">This week: <span className="text-text">{week.games}</span> games · <span style={{ color: cat('green') }}>{week.winPct}%</span> won</span>
          <label className="ml-auto inline-flex items-center gap-1.5 text-subtext1">Weekly goal
            <Input type="number" value={goal || ''} onChange={(e) => setSettings({ pickleballGoalGames: e.target.value ? Number(e.target.value) : undefined })} placeholder="—" className="w-16 py-1 text-right" />
            <span className="text-xs text-overlay0">games</span>
          </label>
        </div>
        {goal > 0 && (
          <div className="mt-2">
            <div className="h-2.5 overflow-hidden rounded-full bg-surface0">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (week.games / goal) * 100)}%`, background: cat(week.games >= goal ? 'green' : 'teal') }} />
            </div>
            <p className="mt-1 text-xs text-overlay0">{week.games} of {goal} games this week{week.games >= goal ? ' ✓' : ''}</p>
          </div>
        )}
      </Card>

      <div className="grid items-start gap-5 max-xl:order-last lg:grid-cols-2">
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

      <Card title="Games per week" subtitle="Last 8 weeks" defer>
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

      <div className="grid items-start gap-5 max-xl:order-last lg:grid-cols-2">
        <Card title="By format" subtitle="Singles vs doubles — games & win %">
          {formats.length === 0 ? <Empty>No games yet.</Empty> : (
            <ul className="space-y-3">
              {formats.map((fm) => (
                <li key={fm.format}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="capitalize text-subtext1">{fm.format}</span>
                    <span className="text-overlay1">{fm.games} games · <span style={{ color: cat('green') }}>{fm.winPct}%</span></span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface0" role="img" aria-label={`${fm.format} win rate ${fm.winPct}%`}>
                    <div className="h-full rounded-full" style={{ width: `${fm.winPct}%`, background: cat(fm.format === 'doubles' ? 'mauve' : 'teal') }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Cumulative games" subtitle={`${all.games} played all-time`}>
          {cum.length < 2 ? <Empty>Log a couple of sessions.</Empty> : (
            <div className="h-44" role="img" aria-label={`Line chart of cumulative pickleball games, reaching ${all.games}`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cum} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke={cat('surface0')} strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke={cat('overlay0')} fontSize={11} />
                  <YAxis stroke={cat('overlay0')} fontSize={11} />
                  <Tooltip contentStyle={tip} />
                  <Line type="monotone" dataKey="games" stroke={cat('blue')} dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <Card title="Play heatmap" subtitle="Last 13 weeks — darker = more games that day" defer>
        <div className="overflow-x-auto">
          <div className="grid grid-flow-col gap-1" style={{ gridTemplateRows: 'repeat(7, 0.7rem)' }} role="img" aria-label="Heatmap of pickleball games played per day over the last 13 weeks">
            {Array.from({ length: hPad }).map((_, i) => <span key={`p${i}`} />)}
            {Array.from({ length: WEEKS * 7 }).map((_, i) => {
              const d = addDays(hStart, i)
              const g = byDay.get(d) ?? 0
              return <span key={d} title={`${d}: ${g} games`} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: g === 0 ? cat('surface0') : `color-mix(in srgb, ${cat('teal')} ${Math.round(30 + (g / maxDay) * 70)}%, ${cat('surface1')})` }} />
            })}
          </div>
        </div>
        <div className="mt-1 text-center text-[10px] text-overlay0">{WEEKDAYS[1]}–{WEEKDAYS[0]} · 13 weeks</div>
      </Card>

      <Card title={<span className="inline-flex items-center gap-2"><Target size={18} className="text-mauve" /> Practice today & improve</span>} subtitle="A focus for today, plus a warm-up to start right">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Today's rotating practice focus */}
          <div className="rounded-lg border border-surface0 bg-base p-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm font-medium text-text">{drill.name}</span>
              <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: cat('mauve') + '22', color: cat('mauve') }}>{drill.focus}</span>
            </div>
            <p className="text-xs text-overlay1">{drill.how}</p>
            <p className="mt-2 text-[11px] text-overlay0">New focus each day — log a session below after you drill it.</p>
          </div>
          {/* Warm-up checklist */}
          <div className="rounded-lg border border-surface0 bg-base p-3">
            <p className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-text"><Dumbbell size={14} className="text-green" /> Warm up first</p>
            <ul className="space-y-1">
              {WARMUP.map((w) => (
                <li key={w} className="flex gap-1.5 text-xs text-overlay1"><span className="text-green">•</span> {w}</li>
              ))}
            </ul>
          </div>
        </div>
        {/* External resources */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-surface0 pt-3">
          <span className="text-xs text-overlay0">Learn more:</span>
          {RESOURCES.map((r) => (
            <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue hover:underline">
              {r.name} <ExternalLink size={11} />
            </a>
          ))}
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
