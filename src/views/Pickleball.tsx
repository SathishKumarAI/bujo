import { useState } from 'react'
import { Trophy, Repeat, ShieldPlus, Target, ExternalLink, Dumbbell, Medal, Flame, ListChecks, Users, MapPin, Swords, Activity, TrendingUp, TrendingDown, Minus, Gauge, CalendarRange } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useJournal } from '../store'
import { Button, Card, Empty, Input, Segmented, StatTile, Textarea } from '../components/ui'
import { Page } from '../components/shell/Page'
import { cat } from '../lib/colors'
import { todayISO, prettyDay, addDays, fromISODay, dayDiff, WEEKDAYS } from '../lib/date'
import { pickleTotals, winRateSeries, weeklyGames, playStreak, formatStats, cumulativeGames, gamesByDay, partnerStats, venueStats, opponentRecords, rollingForm, winStreaks, pointDifferential, levelMatchup, weekdayPerformance } from '../lib/pickleball'
import { PICKLE_FORMATS, FORMAT_LABEL, PICKLE_PLAN, PLAN_TOTAL_DAYS, SKILLS_35_TO_40 } from '../lib/pickleballPlan'
import type { PickleballFormat } from '../lib/types'

const tip = { background: '#181825', border: '1px solid #313244', borderRadius: 8, color: '#cdd6f4' }
const blank = { date: todayISO(), format: 'doubles' as 'singles' | 'doubles', gamesWon: '', gamesLost: '', durationMin: '', partner: '', rpe: '', notes: '', opponent: '', location: '', level: '', pointsFor: '', pointsAgainst: '', scoring: '' as '' | '11' | '15' | '21' | 'rally21' }
const evtBlank = { date: todayISO(), name: '', kind: 'tournament' as 'league' | 'tournament', format: 'pool-play' as PickleballFormat, division: '', wins: '', losses: '', placement: '', partner: '', notes: '' }

/** Physio / trainer / doctor guidance for pickleball · injury-prevention basics. */
const TIPS = [
  { t: 'Warm up first', d: '5–10 min: brisk walk, leg swings, arm circles, a few easy dinks. Cold muscles = pulls.' },
  { t: 'Protect the ankles', d: 'Lateral ankle sprains are the #1 court injury. Court shoes (not runners), split-step, don’t backpedal · turn and run.' },
  { t: 'Mind the shoulder & elbow', d: 'Rotator-cuff and “pickleball elbow” come from over-gripping and all-arm swings. Loosen the grip, drive from the legs/core.' },
  { t: 'Achilles & calves', d: 'Sudden push-offs strain the Achilles. Calf raises 3×/week; ease in after rest days.' },
  { t: 'Hydrate & cool down', d: 'Water before you’re thirsty; finish with calf, hip-flexor and shoulder stretches. Sharp joint pain → stop and rest.' },
]

/** Quick pre-match warm-up · done before logging a session keeps injuries down. */
const WARMUP = [
  '5 min brisk walk or light jog to raise the heart rate',
  'Leg swings ×10/side · ankle circles ×10 · hip openers',
  'Arm circles, shoulder rolls, wrist mobility',
  'Side shuffles + split-steps to prime lateral movement',
  '2–3 min of easy dinks and soft volleys at the kitchen line',
]

/** Rotating practice focus · one surfaces per day so you always have a goal. */
const DRILLS = [
  { name: 'Dink consistency', focus: 'Soft game', how: 'Cross-court dinks for 5 min with no pop-ups. Land in the kitchen, paddle out front, relaxed grip.' },
  { name: 'Third-shot drops', focus: 'Transition', how: 'Drop from the baseline into the kitchen. Track success · hit 7/10 before you speed anything up.' },
  { name: 'Reset volleys', focus: 'Defense', how: 'Partner feeds hard at your feet; soft-block into the kitchen. Absorb pace, don’t swing.' },
  { name: 'Serve depth & spin', focus: 'Serve', how: '20 serves to the back third for depth; add topspin only once depth is reliable.' },
  { name: 'Footwork & split-step', focus: 'Movement', how: 'Split-step on every shot, shuffle (never cross feet) at the line. 3×30s ladder.' },
  { name: 'Stacking & poaching', focus: 'Doubles strategy', how: 'Signals + switches with your partner; cover the middle, call “mine / yours”.' },
  { name: 'Lob & overhead', focus: 'Court coverage', how: 'Alternate defensive lobs and putaway overheads. Agree who takes the lob.' },
]

/** Reputable external coaching / rules resources (open in a new tab). */
const RESOURCES = [
  { name: 'USA Pickleball · official rules & how-to', url: 'https://usapickleball.org' },
  { name: 'The Dink · drills, strategy & news', url: 'https://www.thedinkpickleball.com' },
]

export function Pickleball() {
  const { data, addPickleball, updatePickleball, removePickleball, addPickleEvent, removePickleEvent, setSettings } = useJournal()
  const [f, setF] = useState(blank)
  const set = (p: Partial<typeof blank>) => setF((c) => ({ ...c, ...p }))
  const [ev, setEv] = useState(evtBlank)
  const setE = (p: Partial<typeof evtBlank>) => setEv((c) => ({ ...c, ...p }))
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
      opponent: f.opponent.trim() || undefined,
      location: f.location.trim() || undefined,
      level: f.level.trim() || undefined,
      pointsFor: f.pointsFor ? Number(f.pointsFor) : undefined,
      pointsAgainst: f.pointsAgainst ? Number(f.pointsAgainst) : undefined,
      scoring: f.scoring || undefined,
    })
    setF({ ...blank })
  }
  function logEvent() {
    if (!ev.name.trim()) return
    addPickleEvent({
      date: ev.date,
      name: ev.name.trim(),
      kind: ev.kind,
      format: ev.format,
      division: ev.division.trim() || undefined,
      wins: ev.wins ? Number(ev.wins) : undefined,
      losses: ev.losses ? Number(ev.losses) : undefined,
      placement: ev.placement.trim() || undefined,
      partner: ev.partner.trim() || undefined,
      notes: ev.notes.trim() || undefined,
    })
    setEv({ ...evtBlank })
  }
  function repeatLast() {
    const last = sessions[0]
    if (last) setF({ ...blank, date: today, format: last.format, durationMin: String(last.durationMin ?? ''), partner: last.partner ?? '', location: last.location ?? '', level: last.level ?? '', scoring: last.scoring ?? '' })
  }

  const wl = [{ name: 'Won', value: all.gamesWon, color: 'green' }, { name: 'Lost', value: all.gamesLost, color: 'red' }]
  const formats = formatStats(data)
  const cum = cumulativeGames(data)
  const byDay = gamesByDay(data)
  // Read-only rivalry / chemistry / venue aggregates over logged sessions.
  const partners = partnerStats(data)
  const venues = venueStats(data)
  const opponents = opponentRecords(data)
  // Read-only form / streak / point / matchup / weekday signals over logged sessions.
  const form = rollingForm(data)
  const streaks = winStreaks(data)
  const points = pointDifferential(data)
  const matchup = levelMatchup(data)
  const weekdays = weekdayPerformance(data)
  const weekdaysPlayed = weekdays.filter((w) => w.games > 0)
  const goal = data.settings.pickleballGoalGames ?? 0
  // 13-week play-frequency heatmap.
  const WEEKS = 13
  const hStart = addDays(today, -(WEEKS * 7 - 1))
  const hPad = fromISODay(hStart).getDay()
  const maxDay = Math.max(1, ...byDay.values())

  // ── Leagues & tournaments ──
  const events = [...(data.pickleballEvents ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1))
  const evWins = events.reduce((s, e) => s + (e.wins ?? 0), 0)
  const evLosses = events.reduce((s, e) => s + (e.losses ?? 0), 0)
  const medals = events.filter((e) => /gold|silver|bronze|1st|2nd|3rd/i.test(e.placement ?? '')).length

  // ── 75-day 3.5→4.0 plan ──
  const planStart = data.settings.pickleballPlanStart
  // A future-dated start means "not started yet" (0), not Day 1.
  const planDay = planStart ? Math.min(PLAN_TOTAL_DAYS, Math.max(0, dayDiff(planStart, today) + 1)) : 0
  const PHASE_END = [18, 36, 54, 72, 75]
  const activePhaseIdx = planDay > 0 ? PHASE_END.findIndex((end) => planDay <= end) : -1

  // Charts live in the right rail (compact, enlargeable) so the main column
  // stays focused on logging + actionable coaching content, not chart noise.
  const charts = (
    <>
      <p className="px-1 text-[11px] font-medium tracking-wider text-overlay0 uppercase">Visualizations · tap ⛶ to enlarge</p>
      <Card title="Win-rate trend" subtitle="Win % per session" enlargeable>
        {trend.length < 2 ? <Empty>Log a couple of sessions to see the trend.</Empty> : (
          <div className="h-44" role="img" aria-label="Line chart of win percentage per session over time">
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
      <Card title="Win / loss" subtitle="All games played" enlargeable>
        {all.games === 0 ? <Empty>No games yet.</Empty> : (
          <div className="h-44" role="img" aria-label={`Donut of ${all.gamesWon} games won and ${all.gamesLost} lost`}>
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
      <Card title="Games per week" subtitle="Last 8 weeks" enlargeable>
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
      <Card title="By format" subtitle="Singles vs doubles · games & win %" enlargeable>
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
      <Card title="Cumulative games" subtitle={`${all.games} played all-time`} enlargeable>
        {cum.length < 2 ? <Empty>Log a couple of sessions.</Empty> : (
          <div className="h-40" role="img" aria-label={`Line chart of cumulative pickleball games, reaching ${all.games}`}>
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
      <Card title="Play heatmap" subtitle="Last 13 weeks · darker = more games" enlargeable>
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
    </>
  )

  return (
    <Page
      aside={charts}
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

      {/* ── Recent form & momentum (#323) ── */}
      {form.results.length > 0 && (
        <Card title={<span className="inline-flex items-center gap-2"><Activity size={18} className="text-sky" /> Recent form</span>} subtitle={`Last ${form.results.length} ${form.results.length === 1 ? 'session' : 'sessions'} · newest first`}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-1" role="img" aria-label={`Recent form: ${form.wins} won, ${form.losses} lost, ${form.draws} drawn`}>
              {form.results.map((r, i) => {
                const c = r === 'W' ? 'green' : r === 'L' ? 'red' : 'overlay0'
                return <span key={i} className="grid h-6 w-6 place-items-center rounded-md text-[11px] font-semibold" style={{ background: cat(c) + '22', color: cat(c) }}>{r}</span>
              })}
            </div>
            <span className="text-sm text-overlay1"><span style={{ color: cat('green') }}>{form.wins}W</span> · <span style={{ color: cat('red') }}>{form.losses}L</span>{form.draws ? ` · ${form.draws}D` : ''} · <span style={{ color: cat('green') }}>{form.winPct}%</span></span>
            {form.momentum !== 'flat' && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]" style={{ background: cat(form.momentum === 'up' ? 'green' : 'red') + '22', color: cat(form.momentum === 'up' ? 'green' : 'red') }}>
                {form.momentum === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {form.momentum === 'up' ? 'Trending up' : 'In a slump'}
              </span>
            )}
            {form.momentum === 'flat' && <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-overlay0"><Minus size={12} /> Steady</span>}
          </div>
          {(streaks.longest > 0 || streaks.current > 0) && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-surface0 pt-3 text-xs text-overlay1">
              {streaks.current > 0 && <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: cat('peach') + '22', color: cat('peach') }}><Flame size={12} /> {streaks.current}-session win streak</span>}
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: cat('mauve') + '22', color: cat('mauve') }}><Trophy size={12} /> Longest: {streaks.longest}</span>
            </div>
          )}
        </Card>
      )}

      <Card title="Log a session" right={sessions.length ? <Button onClick={repeatLast} className="inline-flex items-center gap-1"><Repeat size={13} /> Repeat</Button> : undefined}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-subtext1">Date<Input type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} className="mt-1" /></label>
          <div><p className="mb-1 text-sm text-subtext1">Format</p><Segmented value={f.format} onChange={(v) => set({ format: v })} options={[{ value: 'doubles', label: 'Doubles' }, { value: 'singles', label: 'Singles' }]} /></div>
          <label className="block text-sm text-subtext1">Games won<Input type="number" value={f.gamesWon} onChange={(e) => set({ gamesWon: e.target.value })} placeholder="0" className="mt-1" /></label>
          <label className="block text-sm text-subtext1">Games lost<Input type="number" value={f.gamesLost} onChange={(e) => set({ gamesLost: e.target.value })} placeholder="0" className="mt-1" /></label>
          <Input type="number" value={f.durationMin} onChange={(e) => set({ durationMin: e.target.value })} placeholder="Minutes" aria-label="Minutes" />
          <Input type="number" value={f.rpe} onChange={(e) => set({ rpe: e.target.value })} placeholder="RPE 1–10" aria-label="RPE" />
          {f.format === 'doubles' && <Input value={f.partner} onChange={(e) => set({ partner: e.target.value })} placeholder="Partner (optional)" />}
          <Input value={f.opponent} onChange={(e) => set({ opponent: e.target.value })} placeholder="Opponent(s) (optional)" />
          <Input value={f.location} onChange={(e) => set({ location: e.target.value })} placeholder="Location" aria-label="Location" />
          <Input value={f.level} onChange={(e) => set({ level: e.target.value })} placeholder="Level e.g. 3.5" aria-label="Level" />
          <Input type="number" value={f.pointsFor} onChange={(e) => set({ pointsFor: e.target.value })} placeholder="Pts for" aria-label="Points for" />
          <Input type="number" value={f.pointsAgainst} onChange={(e) => set({ pointsAgainst: e.target.value })} placeholder="Pts against" aria-label="Points against" />
          <select value={f.scoring} onChange={(e) => set({ scoring: e.target.value as typeof f.scoring })} aria-label="Scoring" className="rounded-md border border-input bg-background px-2 py-2 text-sm text-foreground">
            <option value="">Scoring</option>
            <option value="11">to 11</option>
            <option value="15">to 15</option>
            <option value="21">to 21</option>
            <option value="rally21">rally 21</option>
          </select>
        </div>
        <Textarea value={f.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="How did it go?" rows={2} className="mt-3" />
        <Button variant="primary" onClick={log} className="mt-3 w-full">Log session</Button>
      </Card>

      <Card title="History" subtitle="Tap Edit to fix a score · × to remove" collapsible>
        {sessions.length === 0 ? (
          <Empty>No sessions logged yet.</Empty>
        ) : (
          <ul className="divide-y divide-surface0">
            {(showAll ? sessions : sessions.slice(0, 8)).map((p) => (
              <PickleRow key={p.id} p={p} onSave={(patch) => updatePickleball(p.id, patch)} onDelete={() => removePickleball(p.id)} />
            ))}
          </ul>
        )}
        {sessions.length > 8 && <button onClick={() => setShowAll((v) => !v)} className="mt-2 text-sm text-mauve hover:underline">{showAll ? 'Show less' : `Show all ${sessions.length}`}</button>}
      </Card>

      {/* ── Partner chemistry ── */}
      {partners.length > 0 && (
        <Card title={<span className="inline-flex items-center gap-2"><Users size={18} className="text-mauve" /> Partner chemistry</span>} subtitle="Win rate by doubles partner · most-played first" collapsible>
          <ul className="space-y-3">
            {partners.map((p) => (
              <li key={p.partner}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="min-w-0 truncate text-subtext1">{p.partner}</span>
                  <span className="shrink-0 text-overlay1">{p.sessions} {p.sessions === 1 ? 'session' : 'sessions'} · {p.games} games · <span style={{ color: cat('green') }}>{p.winPct}%</span></span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-surface0" role="img" aria-label={`${p.partner} win rate ${p.winPct}% over ${p.games} games`}>
                  <div className="h-full rounded-full" style={{ width: `${p.winPct}%`, background: cat('mauve') }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-overlay0">Add a partner when logging a doubles session to track your chemistry.</p>
        </Card>
      )}

      {/* ── Court / venue log ── */}
      {venues.length > 0 && (
        <Card title={<span className="inline-flex items-center gap-2"><MapPin size={18} className="text-teal" /> Courts &amp; venues</span>} subtitle="Games &amp; win % by where you play" collapsible>
          <ul className="divide-y divide-surface0">
            {venues.map((v) => (
              <li key={v.location} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0 truncate text-subtext1">{v.location}</span>
                <span className="flex shrink-0 items-center gap-2 text-overlay1">
                  {v.sessions} {v.sessions === 1 ? 'visit' : 'visits'} · {v.games} games
                  <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: cat('teal') + '22', color: cat('teal') }}>{v.winPct}%</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-overlay0">Set a Location when logging to see your home-court advantage.</p>
        </Card>
      )}

      {/* ── Opponent rivalry record book ── */}
      {opponents.length > 0 && (
        <Card title={<span className="inline-flex items-center gap-2"><Swords size={18} className="text-red" /> Rivalry record book</span>} subtitle="Head-to-head game record by opponent" collapsible>
          <ul className="divide-y divide-surface0">
            {opponents.map((o) => (
              <li key={o.opponent} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0 truncate text-subtext1">vs {o.opponent} <span className="text-overlay0">· {o.sessions} {o.sessions === 1 ? 'meeting' : 'meetings'}</span></span>
                <span className="flex shrink-0 items-center gap-2">
                  <span><span style={{ color: cat('green') }}>{o.gamesWon}</span>–<span style={{ color: cat('red') }}>{o.gamesLost}</span></span>
                  <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: cat(o.diff > 0 ? 'green' : o.diff < 0 ? 'red' : 'overlay0') + '22', color: cat(o.diff > 0 ? 'green' : o.diff < 0 ? 'red' : 'overlay0') }}>
                    {o.diff > 0 ? `+${o.diff}` : o.diff}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-overlay0">Name your Opponent(s) when logging to build a head-to-head book.</p>
        </Card>
      )}

      {/* ── Win% by opponent level (#478) ── */}
      {matchup.length > 0 && (
        <Card title={<span className="inline-flex items-center gap-2"><Gauge size={18} className="text-yellow" /> Performance by opponent level</span>} subtitle="Win % vs stronger, similar &amp; weaker fields" collapsible>
          <ul className="space-y-3">
            {matchup.map((m) => (
              <li key={m.bucket}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-subtext1">{m.label}</span>
                  <span className="text-overlay1">{m.games} games · <span style={{ color: cat('green') }}>{m.winPct}%</span></span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-surface0" role="img" aria-label={`${m.label} win rate ${m.winPct}% over ${m.games} games`}>
                  <div className="h-full rounded-full" style={{ width: `${m.winPct}%`, background: cat(m.bucket === 'stronger' ? 'red' : m.bucket === 'weaker' ? 'green' : 'yellow') }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-overlay0">Set a Level when logging to see a truer skill signal than raw win %.</p>
        </Card>
      )}

      {/* ── Win% by weekday (time-of-play performance) ── */}
      {weekdaysPlayed.length > 0 && (
        <Card title={<span className="inline-flex items-center gap-2"><CalendarRange size={18} className="text-blue" /> Performance by weekday</span>} subtitle="Win % &amp; games played by day of week" collapsible>
          <div className="grid grid-cols-7 gap-1.5">
            {weekdays.map((w) => {
              const has = w.games > 0
              return (
                <div key={w.day} className="rounded-md p-1.5 text-center" style={{ background: has ? cat('blue') + '14' : cat('surface0') }} title={has ? `${w.day}: ${w.gamesWon}/${w.games} games won · ${w.winPct}%` : `${w.day}: no games`}>
                  <div className="text-[10px] font-medium text-overlay1">{w.day}</div>
                  <div className="mt-0.5 text-sm font-semibold" style={{ color: has ? cat('blue') : cat('overlay0') }}>{has ? `${w.winPct}%` : '—'}</div>
                  <div className="text-[9px] text-overlay0">{has ? `${w.games}g` : ''}</div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* ── Point differential (close-game signal) ── */}
      {points.sessions > 0 && (
        <Card title={<span className="inline-flex items-center gap-2"><Target size={18} className="text-teal" /> Point differential</span>} subtitle={`Across ${points.sessions} ${points.sessions === 1 ? 'session' : 'sessions'} with logged points`} collapsible>
          <div className="grid grid-cols-3 gap-2">
            <StatTile compact label="Points for" value={points.pointsFor} color="green" />
            <StatTile compact label="Points against" value={points.pointsAgainst} color="red" />
            <StatTile compact label="Net" value={points.diff > 0 ? `+${points.diff}` : points.diff} color={points.diff > 0 ? 'green' : points.diff < 0 ? 'red' : 'overlay0'} />
          </div>
          <p className="mt-3 text-xs text-overlay1">Average margin <span style={{ color: cat(points.avgMargin >= 0 ? 'green' : 'red') }}>{points.avgMargin > 0 ? `+${points.avgMargin}` : points.avgMargin}</span> per session. Log Pts for / against to surface close-game trends beyond win %.</p>
        </Card>
      )}

      <Card title={<span className="inline-flex items-center gap-2"><Target size={18} className="text-mauve" /> Practice today & improve</span>} subtitle="A focus for today, plus a warm-up to start right" enlargeable={false}>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Today's rotating practice focus */}
          <div className="rounded-lg border border-surface0 bg-base p-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm font-medium text-text">{drill.name}</span>
              <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: cat('mauve') + '22', color: cat('mauve') }}>{drill.focus}</span>
            </div>
            <p className="text-xs text-overlay1">{drill.how}</p>
            <p className="mt-2 text-[11px] text-overlay0">New focus each day · log a session below after you drill it.</p>
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

      <Card title={<span className="inline-flex items-center gap-2"><ShieldPlus size={18} className="text-green" /> Play safe · physio & trainer notes</span>} subtitle="Injury-prevention basics for the court" collapsible>
        <ul className="space-y-2">
          {TIPS.map((x) => (
            <li key={x.t} className="border-t border-surface0 pt-2 text-sm first:border-t-0 first:pt-0">
              <p className="text-subtext1">{x.t}</p>
              <p className="text-xs text-overlay1">{x.d}</p>
            </li>
          ))}
        </ul>
      </Card>

      {/* ── Leagues & tournaments ── */}
      <Card title={<span className="inline-flex items-center gap-2"><Medal size={18} className="text-yellow" /> Leagues &amp; tournaments</span>} subtitle="Log competitive events · separate from casual sessions">
        <div className="mb-4 grid grid-cols-3 gap-2">
          <StatTile compact label="Events" value={events.length} color="mauve" />
          <StatTile compact label="Event record" value={`${evWins}–${evLosses}`} color="blue" />
          <StatTile compact label="Medals" value={medals} color="yellow" icon={<Trophy size={14} />} />
        </div>
        {/* log an event */}
        <div className="grid gap-2 rounded-lg border border-surface0 bg-base p-3 sm:grid-cols-2">
          <Input value={ev.name} onChange={(e) => setE({ name: e.target.value })} placeholder="Event name" aria-label="Event name" />
          <Input type="date" value={ev.date} onChange={(e) => setE({ date: e.target.value })} aria-label="Date" />
          <Segmented value={ev.kind} onChange={(v) => setE({ kind: v })} options={[{ value: 'tournament', label: 'Tournament' }, { value: 'league', label: 'League' }]} />
          <select value={ev.format} onChange={(e) => setE({ format: e.target.value as PickleballFormat })} aria-label="Format" className="rounded-md border border-input bg-background px-2 py-2 text-sm text-foreground">
            {PICKLE_FORMATS.map((fm) => <option key={fm.id} value={fm.id}>{fm.label}</option>)}
          </select>
          <Input value={ev.division} onChange={(e) => setE({ division: e.target.value })} placeholder="Division e.g. 3.5 Mixed" aria-label="Division" />
          <Input value={ev.placement} onChange={(e) => setE({ placement: e.target.value })} placeholder="Placement e.g. Gold / 2nd of 8" aria-label="Placement" />
          <Input type="number" value={ev.wins} onChange={(e) => setE({ wins: e.target.value })} placeholder="Wins" aria-label="Wins" />
          <Input type="number" value={ev.losses} onChange={(e) => setE({ losses: e.target.value })} placeholder="Losses" aria-label="Losses" />
          <Input value={ev.partner} onChange={(e) => setE({ partner: e.target.value })} placeholder="Partner (optional)" aria-label="Partner" className="sm:col-span-2" />
          <Button variant="primary" onClick={logEvent} className="sm:col-span-2">Log event</Button>
        </div>
        {/* event list */}
        {events.length > 0 && (
          <ul className="mt-3 divide-y divide-surface0">
            {events.map((e) => (
              <li key={e.id} className="group flex items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0">
                  <span className="text-subtext1">{e.name}</span>
                  <span className="text-overlay0"> · {prettyDay(e.date)} · {FORMAT_LABEL[e.format]}{e.division ? ` · ${e.division}` : ''}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {e.placement && <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: cat('yellow') + '22', color: cat('yellow') }}>{e.placement}</span>}
                  {(e.wins != null || e.losses != null) && <span className="text-overlay1">{e.wins ?? 0}–{e.losses ?? 0}</span>}
                  <button onClick={() => removePickleEvent(e.id)} aria-label="Remove event" className="text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red">×</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* ── Format playbook ── */}
      <Card title={<span className="inline-flex items-center gap-2"><ListChecks size={18} className="text-blue" /> Format playbook</span>} subtitle="How each league & tournament format works" collapsible>
        <ul className="grid gap-3 sm:grid-cols-2">
          {PICKLE_FORMATS.map((fm) => (
            <li key={fm.id} className="rounded-lg border border-surface0 bg-base p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-text">{fm.label}</span>
                <span className="text-[10px] text-overlay0">{fm.size}</span>
              </div>
              <p className="text-xs text-overlay1">{fm.how}</p>
            </li>
          ))}
        </ul>
      </Card>

      {/* ── 75-day 3.5 → 4.0 plan ── */}
      <Card title={<span className="inline-flex items-center gap-2"><Flame size={18} className="text-peach" /> 75-day plan · 3.5 → 4.0</span>} subtitle="A structured drill plan to hit 4.0-level benchmarks">
        {planDay === 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-surface1 p-4">
            <p className="text-sm text-subtext0">Commit to 75 days. ~8–12 hrs/week, ~65% drilling. Five phases: soft game → third-shot drop → transitions → net battles → assessment.</p>
            <Button variant="primary" onClick={() => setSettings({ pickleballPlanStart: today })}>Start the 75-day plan</Button>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="mb-1 flex justify-between text-xs text-overlay0"><span>Day {planDay} of {PLAN_TOTAL_DAYS}</span><span>{Math.round((planDay / PLAN_TOTAL_DAYS) * 100)}%</span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-surface0"><div className="h-full rounded-full" style={{ width: `${(planDay / PLAN_TOTAL_DAYS) * 100}%`, background: cat('peach') }} /></div>
              </div>
              <button onClick={() => setSettings({ pickleballPlanStart: undefined })} className="text-xs text-overlay0 hover:text-red">Reset</button>
            </div>
          </>
        )}
        <div className="mt-3 space-y-2">
          {PICKLE_PLAN.map((p, i) => {
            const active = i === activePhaseIdx
            const done = planDay > 0 && i < activePhaseIdx
            return (
              <div key={p.phase} className={`rounded-lg border p-3 ${active ? 'border-peach bg-peach/5' : 'border-surface0 bg-base'}`}>
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-medium" style={{ background: done ? cat('green') : active ? cat('peach') : cat('surface1'), color: cat('crust') }}>{done ? '✓' : p.phase}</span>
                  <span className="text-sm font-medium text-text">{p.title}</span>
                  <span className="text-[10px] text-overlay0">{p.days}</span>
                  {active && <span className="ml-auto rounded-full px-2 py-0.5 text-[10px]" style={{ background: cat('peach') + '22', color: cat('peach') }}>You’re here</span>}
                </div>
                <p className="mt-1.5 text-xs text-overlay1">{p.focus}</p>
                <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                  {p.drills.map((d) => (
                    <li key={d.name} className="text-xs"><span className="text-subtext1">{d.name}</span> <span className="text-overlay0">· {d.how}</span></li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px]" style={{ color: cat('green') }}>🎯 {p.goal}</p>
              </div>
            )
          })}
        </div>
        <details className="mt-3 rounded-lg border border-surface0 bg-base p-3">
          <summary className="cursor-pointer text-sm font-medium text-text">What separates a 3.5 from a 4.0</summary>
          <ul className="mt-2 space-y-1">
            {SKILLS_35_TO_40.map((s) => <li key={s} className="flex gap-1.5 text-xs text-overlay1"><span className="text-peach">•</span> {s}</li>)}
          </ul>
        </details>
      </Card>
    </Page>
  )
}

// History row with in-place editing (BUJO-201): correct a mistyped score/format/
// duration without delete-and-re-log.
function PickleRow({ p, onSave, onDelete }: {
  p: import('../lib/types').PickleballSession
  onSave: (patch: Partial<import('../lib/types').PickleballSession>) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [d, setD] = useState({ format: p.format, gamesWon: String(p.gamesWon), gamesLost: String(p.gamesLost), durationMin: p.durationMin != null ? String(p.durationMin) : '', notes: p.notes ?? '' })
  function save() {
    onSave({
      format: d.format,
      gamesWon: Number(d.gamesWon) || 0,
      gamesLost: Number(d.gamesLost) || 0,
      durationMin: d.durationMin ? Number(d.durationMin) : undefined,
      notes: d.notes.trim() || undefined,
    })
    setEditing(false)
  }
  if (editing) {
    return (
      <li className="space-y-2 py-2.5">
        <Segmented value={d.format} onChange={(v) => setD((c) => ({ ...c, format: v }))} options={[{ value: 'doubles', label: 'Doubles' }, { value: 'singles', label: 'Singles' }]} />
        <div className="grid grid-cols-3 gap-2">
          <label className="block text-xs text-subtext1">Won<Input type="number" value={d.gamesWon} onChange={(e) => setD((c) => ({ ...c, gamesWon: e.target.value }))} className="mt-1" /></label>
          <label className="block text-xs text-subtext1">Lost<Input type="number" value={d.gamesLost} onChange={(e) => setD((c) => ({ ...c, gamesLost: e.target.value }))} className="mt-1" /></label>
          <label className="block text-xs text-subtext1">Min<Input type="number" value={d.durationMin} onChange={(e) => setD((c) => ({ ...c, durationMin: e.target.value }))} className="mt-1" /></label>
        </div>
        <Textarea value={d.notes} onChange={(e) => setD((c) => ({ ...c, notes: e.target.value }))} placeholder="Notes" rows={2} />
        <div className="flex gap-2">
          <Button variant="primary" onClick={save} className="flex-1">Save</Button>
          <Button onClick={() => setEditing(false)} className="flex-1">Cancel</Button>
        </div>
      </li>
    )
  }
  return (
    <li className="group flex items-center justify-between gap-2 py-2 text-sm">
      <span className="text-subtext1">{prettyDay(p.date)} <span className="text-overlay0">· {p.format}{p.opponent ? ` · vs ${p.opponent}` : ''}{p.location ? ` · ${p.location}` : ''}</span></span>
      <span className="flex items-center gap-2">
        <span style={{ color: cat('green') }}>{p.gamesWon}</span>–<span style={{ color: cat('red') }}>{p.gamesLost}</span>
        <button onClick={() => { setD({ format: p.format, gamesWon: String(p.gamesWon), gamesLost: String(p.gamesLost), durationMin: p.durationMin != null ? String(p.durationMin) : '', notes: p.notes ?? '' }); setEditing(true) }} aria-label="Edit session" className="text-xs text-overlay0 opacity-0 group-hover:opacity-100 hover:text-mauve">Edit</button>
        <button onClick={onDelete} aria-label="Remove" className="text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red">×</button>
      </span>
    </li>
  )
}
