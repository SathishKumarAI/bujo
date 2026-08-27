import { ArrowSquareOut, ArrowsClockwise, Barbell, CalendarDot, ChartBar, Gauge, ListChecks, Medal, PersonSimpleRun, ShieldPlus, Sword, Target, Trophy } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useJournal } from '../store'
import { Card, Empty, Input, Pill, Segmented, StatTile, Textarea } from '../components/ui'
import { Button } from '../components/ui/button'
import { Page } from '../components/shell/Page'
import { CardGrid } from '../components/shell/CardGrid'
import { cat, rechartsTooltip } from '../lib/colors'
import { todayISO, prettyDay, addDays, fromISODay, WEEKDAYS } from '../lib/date'
import { pickleTotals, winRateSeries, weeklyGames, playStreak, formatStats, cumulativeGames, gamesByDay, partnerStats, venueStats, opponentRecords, rollingForm, winStreaks, pointDifferential, levelMatchup, weekdayPerformance, duprTrend, monthlyGames, winRateForecast, rpeLoad, pickleMilestones, pickleHours, scoringStats, upcomingEvents, playConsistency } from '../lib/pickleball'
import { PICKLE_FORMATS, FORMAT_LABEL } from '../lib/pickleballPlan'
import type { PickleballFormat } from '../lib/types'
import { Section } from '../components/pickleball/Section'
import { RecentFormCard, WinRateForecastCard, MilestonesCard, SessionIntensityCard } from '../components/pickleball/FormCards'
import { PartnerChemistryCard, VenuesCard, RivalryRecordCard, LevelMatchupCard } from '../components/pickleball/MatchupCards'
import { WeekdayPerformanceCard, PointDifferentialCard, TimeOnCourtCard, ScoringPerformanceCard, PlayConsistencyCard } from '../components/pickleball/SignalCards'

const tip = rechartsTooltip
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

/** Tournament-day prep checklist · shown alongside the countdown to an event. */
const PREP_CHECKLIST = [
  'Paddles (+ a backup) and fresh grip / overgrip tape',
  'Court shoes, extra socks, athletic tape',
  'Water + electrolytes; quick-energy snacks',
  'Sun: hat, sunglasses, sunscreen — or layers for cold',
  'Warm-up band, foam roller; ibuprofen / blister kit',
  'Know your start time, division & format; arrive 45 min early',
  'Mental routine: pre-point breath, one tactical intention',
]

/** Reputable external coaching / rules resources (open in a new tab). */
const RESOURCES = [
  { name: 'USA Pickleball · official rules & how-to', url: 'https://usapickleball.org' },
  { name: 'The Dink · drills, strategy & news', url: 'https://www.thedinkpickleball.com' },
]

export function Pickleball() {
  const { data, addPickleball, updatePickleball, removePickleball, addPickleEvent, removePickleEvent, setSettings, logDupr, removeDupr } = useJournal()
  const [dupr, setDupr] = useState({ date: todayISO(), rating: '' })
  const duprStats = duprTrend(data.settings)
  function saveDupr() {
    const r = Number(dupr.rating)
    if (!dupr.rating || Number.isNaN(r) || r <= 0) return
    logDupr(dupr.date, r)
    setDupr({ date: todayISO(), rating: '' })
  }
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
  // Read-only monthly volume / forecast / load / milestone signals.
  const months = monthlyGames(data, 6, today)
  const monthsPlayed = months.some((m) => m.games > 0)
  const forecast = winRateForecast(data)
  const load = rpeLoad(data, 7, today)
  const milestones = pickleMilestones(data)
  // Read-only time-on-court, scoring split, consistency & event-prep signals.
  const hours = pickleHours(data, 30, today)
  const scoring = scoringStats(data)
  const consistency = playConsistency(data, 8, today)
  const upcoming = upcomingEvents(data, today)
  const goal = data.settings.pickleballGoalGames ?? 0
  // 13-week play-frequency heatmap.
  // BUJO-280b: Add 1-year heatmap toggle (like Stats Activity card)
  const [heatWeeks, setHeatWeeks] = useState(13)
  const WEEKS = heatWeeks
  const hStart = addDays(today, -(WEEKS * 7 - 1))
  const hPad = fromISODay(hStart).getDay()
  const maxDay = Math.max(1, ...byDay.values())

  // ── Leagues & tournaments ──
  const events = [...(data.pickleballEvents ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1))
  const evWins = events.reduce((s, e) => s + (e.wins ?? 0), 0)
  const evLosses = events.reduce((s, e) => s + (e.losses ?? 0), 0)
  const medals = events.filter((e) => /gold|silver|bronze|1st|2nd|3rd/i.test(e.placement ?? '')).length

  // Charts are grouped into one collapsed "Charts" section in the main column
  // (formerly a right rail) so the seven visualizations don't strand on mobile
  // and the primary logging + coaching content stays uncluttered.
  const charts = (
    <CardGrid>
      <Card band title="Win-rate trend" subtitle="Win % per session" enlargeable>
        {trend.length < 2 ? <Empty>Log a couple of sessions to see the trend.</Empty> : (
          <div className="h-44" role="img" aria-label="Line chart of win percentage per session over time">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid stroke={cat('surface0')} strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke={cat('overlay0')} fontSize={11} />
                <YAxis domain={[0, 100]} stroke={cat('overlay0')} fontSize={11} />
                <Tooltip contentStyle={tip()} />
                <Line type="monotone" dataKey="winPct" stroke={cat('green')} dot={{ r: 2 }} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
      <Card band title="Win / loss" subtitle="All games played" enlargeable>
        {all.games === 0 ? <Empty>Log a session to see your win record.</Empty> : (
          <div className="h-44" role="img" aria-label={`Donut of ${all.gamesWon} games won and ${all.gamesLost} lost`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={wl} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2}>
                  {wl.map((x) => <Cell key={x.name} fill={cat(x.color)} />)}
                </Pie>
                <Tooltip contentStyle={tip()} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-3 text-label">
              {wl.map((x) => <span key={x.name} style={{ color: cat(x.color) }}>● {x.name} {x.value}</span>)}
            </div>
          </div>
        )}
      </Card>
      <Card band title="Games per week" subtitle="Last 8 weeks" enlargeable>
        <div className="h-40" role="img" aria-label="Bar chart of pickleball games played per week over the last 8 weeks">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeks.map((g, i) => ({ wk: `w${i + 1}`, games: g }))} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid stroke={cat('surface0')} vertical={false} />
              <XAxis dataKey="wk" stroke={cat('overlay0')} fontSize={11} />
              <YAxis stroke={cat('overlay0')} fontSize={11} />
              <Tooltip contentStyle={tip()} cursor={{ fill: cat('surface0') }} />
              <Bar dataKey="games" fill={cat('teal')} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      {monthsPlayed && (
        <Card band title="Games per month" subtitle="Last 6 months, win % in tooltip" enlargeable>
          <div className="h-40" role="img" aria-label="Bar chart of pickleball games played per calendar month over the last 6 months">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months.map((m) => ({ m: m.label.slice(0, 3), games: m.games, winPct: m.winPct }))} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid stroke={cat('surface0')} vertical={false} />
                <XAxis dataKey="m" stroke={cat('overlay0')} fontSize={11} />
                <YAxis stroke={cat('overlay0')} fontSize={11} />
                <Tooltip contentStyle={tip()} cursor={{ fill: cat('surface0') }} formatter={(v, n) => [n === 'winPct' ? `${v}%` : `${v}`, n === 'winPct' ? 'Win %' : 'Games'] as [string, string]} />
                <Bar dataKey="games" fill={cat('mauve')} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
      <Card band title="By format" subtitle="Singles vs doubles, games & win %" enlargeable>
        {formats.length === 0 ? <Empty>Log a session to compare singles and doubles.</Empty> : (
          <ul className="space-y-3">
            {formats.map((fm) => (
              <li key={fm.format}>
                <div className="mb-1 flex justify-between text-body">
                  <span className="capitalize text-fg-1">{fm.format}</span>
                  <span className="text-fg-2">{fm.games} games · <span style={{ color: cat('green') }}>{fm.winPct}%</span></span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-none bg-ink-2" role="img" aria-label={`${fm.format} win rate ${fm.winPct}%`}>
                  <div className="h-full rounded-none" style={{ width: `${fm.winPct}%`, background: cat(fm.format === 'doubles' ? 'mauve' : 'teal') }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card band title="Cumulative games" subtitle={`${all.games} played all-time`} enlargeable>
        {cum.length < 2 ? <Empty>Log a couple of sessions.</Empty> : (
          <div className="h-40" role="img" aria-label={`Line chart of cumulative pickleball games, reaching ${all.games}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cum} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid stroke={cat('surface0')} strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke={cat('overlay0')} fontSize={11} />
                <YAxis stroke={cat('overlay0')} fontSize={11} />
                <Tooltip contentStyle={tip()} />
                <Line type="monotone" dataKey="games" stroke={cat('blue')} dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
      <Card band title={<>Heatmap <span className="inline-flex items-center gap-2 text-label text-fg-2"><Icon as={ChartBar} size="sm" /> {heatWeeks === 13 ? '3mo' : heatWeeks === 26 ? '6mo' : '1yr'}</span></>} subtitle={`Last ${heatWeeks / 7 === 1 ? heatWeeks : heatWeeks / 7} weeks, darker = more games`} enlargeable>
        <div className="flex items-center gap-3 mb-2">
          <Segmented
            value={heatWeeks}
            onChange={setHeatWeeks}
            options={[
              { value: 13, label: '3mo' },
              { value: 26, label: '6mo' },
              { value: 52, label: '1yr' },
            ]}
          />
        </div>
        <div className="overflow-x-auto">
          <div
            className="grid grid-flow-col gap-1"
            style={{ gridTemplateRows: `repeat(7, 0.7rem)` }}
            role="img"
            aria-label={`Heatmap of pickleball games played per day over the last ${heatWeeks} weeks`}
          >
            {Array.from({ length: hPad }).map((_, i) => <span key={`p${i}`} />)}
            {Array.from({ length: WEEKS * 7 }).map((_, i) => {
              const d = addDays(hStart, i)
              const g = byDay.get(d) ?? 0
              return (
                <span
                  key={d}
                  title={`${d}: ${g} games`}
                  className="h-2.5 w-2.5 rounded-[2px]"
                  style={{
                    background:
                      g === 0
                        ? cat('surface0')
                        : `color-mix(in srgb, ${cat('teal')} ${Math.round(30 + (g / maxDay) * 70)}%, ${cat('surface1')})`,
                  }}
                />
              )
            })}
          </div>
        </div>
        <div className="mt-1 text-center text-micro text-fg-2">
          {WEEKDAYS[1]}–{WEEKDAYS[0]} · ${heatWeeks} weeks
        </div>
      </Card>
    </CardGrid>
  )

  // Compact "At a glance" summary moved to bottom as requested by user (BUJO-XXX)
  const atAGlance = (
    <Card band title="At a glance" subtitle="Your pickleball record in one compact box">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile compact label="Sessions" value={all.sessions} />
        <StatTile compact label="Games" value={all.games} />
        <StatTile compact label="Win %" value={`${all.winPct}%`} color="green" icon={<Icon as={Trophy} size="sm" />} />
        <StatTile compact label="Day streak" value={streak} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-body">
        <span className="text-fg-2">This week: <span className="text-fg-1">{week.games}</span> games · <span style={{ color: cat('green') }}>{week.winPct}%</span> won</span>
        <label className="ml-auto inline-flex items-center gap-1.5 text-fg-1">
          Weekly goal
          <Input type="number" value={goal || ''} onChange={(e) => setSettings({ pickleballGoalGames: e.target.value ? Number(e.target.value) : undefined })} placeholder="—" className="w-16 py-1 text-right" />
          <span className="text-label text-fg-2">games</span>
        </label>
      </div>
      {goal > 0 && (
        <div className="mt-2">
          <div className="h-2.5 overflow-hidden rounded-none bg-ink-2">
            <div className="h-full rounded-none" style={{ width: `${Math.min(100, (week.games / goal) * 100)}%`, background: cat(week.games >= goal ? 'green' : 'teal') }} />
          </div>
          <p className="mt-1 text-label text-fg-2">{week.games} of {goal} games this week{week.games >= goal ? ' ✓' : ''}</p>
        </div>
      )}
    </Card>
  )

  return (
    <Page width="wide" className="gap-0 sm:gap-0">
      {/* Three across instead of one tall stack. This page was 4.2 screens over
          twelve blocks, and most of them — the record, the log form, DUPR —
          never needed the full width. */}
      <CardGrid>
        {/* ── DATA-FIRST LAYOUT: Log session and history first (primary data entities) ── */}
        <Card band title="Log a session" right={sessions.length ? <Button variant="secondary" onClick={repeatLast} className="press-3d inline-flex items-center gap-1"><Icon as={ArrowsClockwise} size="sm" /> Repeat last</Button> : undefined}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-body text-fg-1">Date<Input type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} className="mt-1" /></label>
          <div><p className="mb-1 text-body text-fg-1">Format</p><Segmented value={f.format} onChange={(v) => set({ format: v })} options={[{ value: 'doubles', label: 'Doubles' }, { value: 'singles', label: 'Singles' }]} /></div>
          <label className="block text-body text-fg-1">Games won<Input type="number" value={f.gamesWon} onChange={(e) => set({ gamesWon: e.target.value })} placeholder="0" className="mt-1" /></label>
          <label className="block text-body text-fg-1">Games lost<Input type="number" value={f.gamesLost} onChange={(e) => set({ gamesLost: e.target.value })} placeholder="0" className="mt-1" /></label>
          <Input type="number" value={f.durationMin} onChange={(e) => set({ durationMin: e.target.value })} placeholder="Minutes" aria-label="Minutes" />
          <Input type="number" value={f.rpe} onChange={(e) => set({ rpe: e.target.value })} placeholder="RPE 1–10" aria-label="RPE" />
          {f.format === 'doubles' && <Input value={f.partner} onChange={(e) => set({ partner: e.target.value })} placeholder="Partner (optional)" />}
          <Input value={f.opponent} onChange={(e) => set({ opponent: e.target.value })} placeholder="Opponent(s) (optional)" />
          <Input value={f.location} onChange={(e) => set({ location: e.target.value })} placeholder="Location" aria-label="Location" />
          <Input value={f.level} onChange={(e) => set({ level: e.target.value })} placeholder="Level e.g. 3.5" aria-label="Level" />
          <Input type="number" value={f.pointsFor} onChange={(e) => set({ pointsFor: e.target.value })} placeholder="Pts for" aria-label="Points for" />
          <Input type="number" value={f.pointsAgainst} onChange={(e) => set({ pointsAgainst: e.target.value })} placeholder="Pts against" aria-label="Points against" />
          <select value={f.scoring} onChange={(e) => set({ scoring: e.target.value as typeof f.scoring })} aria-label="Scoring" className="rounded-none border border-input bg-background px-2 py-2 text-body text-foreground">
            <option value="">Scoring</option>
            <option value="11">to 11</option>
            <option value="15">to 15</option>
            <option value="21">to 21</option>
            <option value="rally21">rally 21</option>
          </select>
        </div>
        <Textarea value={f.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="How did it go?" rows={2} className="mt-3" />
        <Button variant="secondary" onClick={log} className="press-3d mt-3 w-full">Log session</Button>
      </Card>

      <Card band title="History" subtitle="Tap Edit to fix a score, × to remove" collapsible>
        {sessions.length === 0 ? (
          <Empty>Log a session above to start your record.</Empty>
        ) : (
          <ul className="divide-y divide-surface0">
            {(showAll ? sessions : sessions.slice(0, 8)).map((p) => (
              <PickleRow key={p.id} p={p} onSave={(patch) => updatePickleball(p.id, patch)} onDelete={() => removePickleball(p.id)} />
            ))}
          </ul>
        )}
        {sessions.length > 8 && <button onClick={() => setShowAll((v) => !v)} className="mt-2 text-body text-mauve hover:underline">{showAll ? 'Show less' : `Show all ${sessions.length}`}</button>}
      </Card>

      {/* ── Tournament prep countdown (#345) · conditional top status,
            surfaces only when events exist; collapsed. ── */}
      {upcoming.length > 0 && (
        <Card band title={<span className="inline-flex items-center gap-2"><Icon as={CalendarDot} size="md" className="text-peach" /> Upcoming events</span>} subtitle="Countdown &amp; a tournament-day prep checklist" collapsible>
          <ul className="mb-3 space-y-2">
            {upcoming.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 rounded-none border p-2.5" style={{ borderColor: e.soon ? cat('peach') : cat('surface0'), background: e.soon ? cat('peach') + '0d' : cat('base') }}>
                <span className="min-w-0">
                  <span className="text-body font-medium text-fg-1">{e.name}</span>
                  <span className="block truncate text-label text-fg-2">{prettyDay(e.date)} · {FORMAT_LABEL[e.format]}{e.division ? ` · ${e.division}` : ''}</span>
                </span>
                <Pill color={e.soon ? 'peach' : 'mauve'} className="px-2.5 py-1 font-medium">
                  {e.daysUntil === 0 ? 'Today' : e.daysUntil === 1 ? 'Tomorrow' : `${e.daysUntil} days`}
                </Pill>
              </li>
            ))}
          </ul>
          <details className="rounded-none border border-line bg-ink-0 p-3">
            <summary className="cursor-pointer text-body font-medium text-fg-1">Tournament-day prep checklist</summary>
            <ul className="mt-2 space-y-1">
              {PREP_CHECKLIST.map((x) => (
                <li key={x} className="flex gap-1.5 text-label text-fg-2"><span className="text-peach">•</span> {x}</li>
              ))}
            </ul>
          </details>
        </Card>
      )}

      {/* ── DUPR rating tracker ── */}
      <Card band title={<span className="inline-flex items-center gap-2"><Icon as={Gauge} size="md" className="text-mauve" /> DUPR rating</span>} subtitle="Log your DUPR over time, watch the trend climb" collapsible>
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <label className="block text-label text-fg-1">Date<Input type="date" value={dupr.date} onChange={(e) => setDupr((c) => ({ ...c, date: e.target.value }))} className="mt-1" /></label>
          <label className="block text-label text-fg-1">Rating<Input type="number" step="0.01" inputMode="decimal" value={dupr.rating} onChange={(e) => setDupr((c) => ({ ...c, rating: e.target.value }))} placeholder="e.g. 3.75" aria-label="DUPR rating" className="mt-1 w-28" /></label>
          <Button variant="secondary" onClick={saveDupr} className="press-3d">Log rating</Button>
        </div>
        {duprStats.points.length === 0 ? (
          <Empty>No DUPR ratings logged yet · add one above to start the trend.</Empty>
        ) : (
          <>
            <div className="mb-3 grid grid-cols-3 gap-2">
              <StatTile compact label="Latest" value={duprStats.latest ?? '—'} />
              <StatTile compact label="Best" value={duprStats.best ?? '—'} color="green" icon={<Icon as={Trophy} size="sm" />} />
              <StatTile compact label="Change" value={duprStats.change > 0 ? `+${duprStats.change}` : duprStats.change} />
            </div>
            {duprStats.points.length >= 2 && (
              <div className="h-40" role="img" aria-label={`Line chart of DUPR rating over time, latest ${duprStats.latest}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={duprStats.points.map((p) => ({ date: p.date.slice(5), rating: p.rating }))} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid stroke={cat('surface0')} strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke={cat('overlay0')} fontSize={11} />
                    <YAxis domain={['dataMin - 0.2', 'dataMax + 0.2']} stroke={cat('overlay0')} fontSize={11} />
                    <Tooltip contentStyle={tip()} />
                    <Line type="monotone" dataKey="rating" stroke={cat('mauve')} dot={{ r: 2 }} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <ul className="mt-3 divide-y divide-surface0">
              {[...duprStats.points].reverse().slice(0, 8).map((p) => (
                <li key={p.date} className="group flex items-center justify-between gap-2 py-1.5 text-body">
                  <span className="text-fg-1">{prettyDay(p.date)}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium tabular-nums" style={{ color: cat('mauve') }}>{p.rating}</span>
                    <Button variant="ghost" size="icon-sm" onClick={() => removeDupr(p.date)} aria-label={`Remove rating from ${p.date}`} className="text-fg-2 opacity-0 group-hover:opacity-100 hover:text-red">×</Button>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {/* ── Leagues & tournaments · secondary event logging, grouped beside the
            DUPR tracker and collapsed. ── */}
      <Card band title={<span className="inline-flex items-center gap-2"><Icon as={Medal} size="md" className="text-yellow" /> Leagues &amp; tournaments</span>} subtitle="Log competitive events, separate from casual sessions" collapsible>
        <div className="mb-4 grid grid-cols-3 gap-2">
          <StatTile compact label="Events" value={events.length} />
          <StatTile compact label="Event record" value={`${evWins}–${evLosses}`} />
          <StatTile compact label="Medals" value={medals} color="yellow" icon={<Icon as={Trophy} size="sm" />} />
        </div>
        {/* log an event */}
        <div className="grid gap-2 rounded-none border border-line bg-ink-0 p-3 sm:grid-cols-2">
          <Input value={ev.name} onChange={(e) => setE({ name: e.target.value })} placeholder="Event name" aria-label="Event name" />
          <Input type="date" value={ev.date} onChange={(e) => setE({ date: e.target.value })} aria-label="Date" />
          <Segmented value={ev.kind} onChange={(v) => setE({ kind: v })} options={[{ value: 'tournament', label: 'Tournament' }, { value: 'league', label: 'League' }]} />
          <select value={ev.format} onChange={(e) => setE({ format: e.target.value as PickleballFormat })} aria-label="Format" className="rounded-none border border-input bg-background px-2 py-2 text-body text-foreground">
            {PICKLE_FORMATS.map((fm) => <option key={fm.id} value={fm.id}>{fm.label}</option>)}
          </select>
          <Input value={ev.division} onChange={(e) => setE({ division: e.target.value })} placeholder="Division e.g. 3.5 Mixed" aria-label="Division" />
          <Input value={ev.placement} onChange={(e) => setE({ placement: e.target.value })} placeholder="Placement e.g. Gold / 2nd of 8" aria-label="Placement" />
          <Input type="number" value={ev.wins} onChange={(e) => setE({ wins: e.target.value })} placeholder="Wins" aria-label="Wins" />
          <Input type="number" value={ev.losses} onChange={(e) => setE({ losses: e.target.value })} placeholder="Losses" aria-label="Losses" />
          <Input value={ev.partner} onChange={(e) => setE({ partner: e.target.value })} placeholder="Partner (optional)" aria-label="Partner" className="sm:col-span-2" />
          <Button variant="secondary" onClick={logEvent} className="press-3d sm:col-span-2">Log event</Button>
        </div>
        {/* event list */}
        {events.length > 0 && (
          <ul className="mt-3 divide-y divide-surface0">
            {events.map((e) => (
              <li key={e.id} className="group flex items-center justify-between gap-2 py-2 text-body">
                <span className="min-w-0">
                  <span className="text-fg-1">{e.name}</span>
                  <span className="text-fg-2"> · {prettyDay(e.date)} · {FORMAT_LABEL[e.format]}{e.division ? ` · ${e.division}` : ''}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {e.placement && <Pill color="yellow" size="micro" className="px-2">{e.placement}</Pill>}
                  {(e.wins != null || e.losses != null) && <span className="text-fg-2">{e.wins ?? 0}–{e.losses ?? 0}</span>}
                  <Button variant="ghost" size="icon-sm" onClick={() => removePickleEvent(e.id)} aria-label="Remove event" className="text-fg-2 opacity-0 group-hover:opacity-100 hover:text-red">×</Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* ── Improve · rotating practice focus + warm-up; reference content folded
            below logging, collapsed. ── */}
      <Card band title={<span className="inline-flex items-center gap-2"><Icon as={Target} size="md" className="text-mauve" /> Practice today & improve</span>} subtitle="A focus for today, plus a warm-up to start right" collapsible>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Today's rotating practice focus */}
          <div className="rounded-none border border-line bg-ink-0 p-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-body font-medium text-fg-1">{drill.name}</span>
              <Pill color="mauve" size="micro" className="px-2">{drill.focus}</Pill>
            </div>
            <p className="text-label text-fg-2">{drill.how}</p>
            <p className="mt-2 text-caption text-fg-2">New focus each day, log a session below after you drill it.</p>
          </div>
          {/* Warm-up checklist */}
          <div className="rounded-none border border-line bg-ink-0 p-3">
            <p className="mb-1.5 inline-flex items-center gap-1.5 text-body font-medium text-fg-1"><Icon as={Barbell} size="sm" className="text-green" /> Warm up first</p>
            <ul className="space-y-1">
              {WARMUP.map((w) => (
                <li key={w} className="flex gap-1.5 text-label text-fg-2"><span className="text-green">•</span> {w}</li>
              ))}
            </ul>
          </div>
        </div>
        {/* External resources */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3">
          <span className="text-label text-fg-2">Learn more:</span>
          {RESOURCES.map((r) => (
            <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-label text-blue hover:underline">
              {r.name} <Icon as={ArrowSquareOut} size="sm" />
            </a>
          ))}
        </div>
      </Card>

      </CardGrid>

      {/* ── SECONDARY analytics · grouped under collapsible sections so the
            primary logging + history UI above stays uncluttered. All analytics
            groups default collapsed so open analytics don't dominate the view. ── */}
      <Section
        title="Form & momentum"
        icon={<Icon as={PersonSimpleRun} size="md" className="text-sky" />}
        hint="Recent form · forecast · milestones · intensity"
      >
        {form.results.length > 0 && <RecentFormCard form={form} streaks={streaks} />}
        {forecast.ready && <WinRateForecastCard forecast={forecast} />}
        <MilestonesCard milestones={milestones} />
        {load.sessions > 0 && <SessionIntensityCard load={load} />}
      </Section>

      <Section
        title="Opponents, partners & venues"
        icon={<Icon as={Sword} size="md" className="text-red" />}
        hint="Chemistry · courts · rivalries · level matchups"
      >
        {partners.length > 0 && <PartnerChemistryCard partners={partners} />}
        {venues.length > 0 && <VenuesCard venues={venues} />}
        {opponents.length > 0 && <RivalryRecordCard opponents={opponents} />}
        {matchup.length > 0 && <LevelMatchupCard matchup={matchup} />}
      </Section>

      <Section
        title="Deeper signals"
        icon={<Icon as={ChartBar} size="md" className="text-blue" />}
        hint="Weekday · points · time · scoring · consistency"
      >
        {weekdaysPlayed.length > 0 && <WeekdayPerformanceCard weekdays={weekdays} />}
        {points.sessions > 0 && <PointDifferentialCard points={points} />}
        {hours.timedSessions > 0 && <TimeOnCourtCard hours={hours} />}
        {scoring.length > 0 && <ScoringPerformanceCard scoring={scoring} />}
        {consistency.daysPlayed > 0 && <PlayConsistencyCard consistency={consistency} />}
      </Section>

      {/* ── Charts · the seven ex-rail visualizations, grouped into one collapsed
            section so they don't strand on mobile. ── */}
      <Section
        title="Charts"
        icon={<Icon as={ChartBar} size="md" className="text-teal" />}
        hint="Trends · volume · heatmap · tap ⛶ to enlarge"
      >
        {charts}
      </Section>

      <CardGrid>
      <Card band title={<span className="inline-flex items-center gap-2"><Icon as={ShieldPlus} size="md" className="text-green" /> Play safe · physio & trainer notes</span>} subtitle="Injury-prevention basics for the court" collapsible>
        <ul className="space-y-2">
          {TIPS.map((x) => (
            <li key={x.t} className="border-t border-line pt-2 text-body first:border-t-0 first:pt-0">
              <p className="text-fg-1">{x.t}</p>
              <p className="text-label text-fg-2">{x.d}</p>
            </li>
          ))}
        </ul>
      </Card>

      {/* ── Format playbook ── */}
      <Card band title={<span className="inline-flex items-center gap-2"><Icon as={ListChecks} size="md" className="text-blue" /> Format playbook</span>} subtitle="How each league & tournament format works" collapsible>
        <ul className="grid gap-3 sm:grid-cols-2">
          {PICKLE_FORMATS.map((fm) => (
            <li key={fm.id} className="rounded-none border border-line bg-ink-0 p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-body font-medium text-fg-1">{fm.label}</span>
                <span className="text-micro text-fg-2">{fm.size}</span>
              </div>
              <p className="text-label text-fg-2">{fm.how}</p>
            </li>
          ))}
        </ul>
      </Card>

      {/* ── At a glance compact summary card at bottom of primary column (BUJO-XXX) ── */}
      {atAGlance}

      </CardGrid>
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
          <label className="block text-label text-fg-1">Won<Input type="number" value={d.gamesWon} onChange={(e) => setD((c) => ({ ...c, gamesWon: e.target.value }))} className="mt-1" /></label>
          <label className="block text-label text-fg-1">Lost<Input type="number" value={d.gamesLost} onChange={(e) => setD((c) => ({ ...c, gamesLost: e.target.value }))} className="mt-1" /></label>
          <label className="block text-label text-fg-1">Min<Input type="number" value={d.durationMin} onChange={(e) => setD((c) => ({ ...c, durationMin: e.target.value }))} className="mt-1" /></label>
        </div>
        <Textarea value={d.notes} onChange={(e) => setD((c) => ({ ...c, notes: e.target.value }))} placeholder="Notes" rows={2} />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={save} className="press-3d flex-1">Save</Button>
          <Button variant="secondary" onClick={() => setEditing(false)} className="press-3d flex-1 rounded-none">Cancel</Button>
        </div>
      </li>
    )
  }
  return (
    <li className="group flex items-center justify-between gap-2 py-2 text-body">
      <span className="text-fg-1">{prettyDay(p.date)} <span className="text-fg-2">· {p.format}{p.opponent ? ` · vs ${p.opponent}` : ''}{p.location ? ` · ${p.location}` : ''}</span></span>
      <span className="flex items-center gap-2">
        <span style={{ color: cat('green') }}>{p.gamesWon}</span>–<span style={{ color: cat('red') }}>{p.gamesLost}</span>
        <Button variant="ghost" size="sm" onClick={() => { setD({ format: p.format, gamesWon: String(p.gamesWon), gamesLost: String(p.gamesLost), durationMin: p.durationMin != null ? String(p.durationMin) : '', notes: p.notes ?? '' }); setEditing(true) }} aria-label="Edit session" className="text-fg-2 opacity-0 group-hover:opacity-100 hover:text-mauve">Edit</Button>
        <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label="Remove" className="text-fg-2 opacity-0 group-hover:opacity-100 hover:text-red">×</Button>
      </span>
    </li>
  )
}
