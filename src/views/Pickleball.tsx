import { ArrowSquareOut, ArrowsClockwise, Barbell, CalendarDot, ChartBar, Gauge, Medal, PersonSimpleRun, Plus, Sword, Target, Trophy } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useJournal } from '../store'
import { Card, Empty, Input, Pill, Segmented, StatTile, Textarea } from '../components/ui'
import { ChipPick, DayPick, Stepper } from '../components/ui/quickpick'
import { durationOptions } from '../components/ui/quickpick.options'
import { Button } from '../components/ui/button'
import { Page } from '../components/shell/Page'
import { CardGrid, MasonryGrid, SPAN_2 } from '../components/shell/CardGrid'
import { LazyMount } from '../components/LazyMount'
import { useStickyState } from '../lib/useStickyState'
import { CalendarHeatmap, DisclosureRow, StatBar, SectionRail } from '../components/page'
import { cat, onRaised, rechartsTooltip } from '../lib/colors'
import { todayISO, prettyDay, fromISODay, addDays } from '../lib/date'
import { pickleTotals, winRateSeries, weeklyGames, playStreak, formatStats, cumulativeGames, gamesByDay, partnerStats, venueStats, opponentRecords, rollingForm, winStreaks, pointDifferential, levelMatchup, weekdayPerformance, duprTrend, monthlyGames, winRateForecast, rpeLoad, pickleMilestones, pickleHours, scoringStats, upcomingEvents, playConsistency } from '../lib/pickleball'
import { PICKLE_FORMATS, FORMAT_LABEL } from '../lib/pickleballPlan'
import type { PickleballFormat } from '../lib/types'
import { RecentFormCard, WinRateForecastCard, MilestonesCard, SessionIntensityCard } from '../components/pickleball/FormCards'
import { PartnerChemistryCard, VenuesCard, RivalryRecordCard, LevelMatchupCard } from '../components/pickleball/MatchupCards'
import { WeekdayPerformanceCard, PointDifferentialCard, TimeOnCourtCard, ScoringPerformanceCard, PlayConsistencyCard } from '../components/pickleball/SignalCards'
import { justCapturedProps, useJustCaptured } from '../components/CaptureReceipt'
import { PICKLEBALL_KEY } from '../lib/recordKeys'
import { notify } from '../lib/notify'

const tip = rechartsTooltip
/**
 * `blank` is a FUNCTION, not a constant.
 *
 * It was `const blank = { date: todayISO(), ... }` evaluated once when the
 * module loaded — so the default date was whatever day the tab was opened.
 * Leave the app open overnight and every session logs to yesterday, and the
 * field resets to yesterday after each save. The correct pattern was already
 * in this file at the DUPR form (`setDupr({ date: todayISO(), ... })`) and in
 * `page/draft.ts`'s `emptyDraft`; only these two constants missed it.
 */
/**
 * The form holds its numbers as STRINGS, because an empty field is `''` and not
 * `0` — a distinction this file already depends on (`gamesWon: ''` must not log
 * a 0-0 session). `Stepper` and `ChipPick` speak numbers, so this is the seam.
 * `Number('')` is 0, which is exactly the bug, hence the explicit empty check.
 */
const numOrUndef = (v: string): number | undefined => (v.trim() === '' ? undefined : Number(v))

const blankOf = () => ({ date: todayISO(), format: 'doubles' as 'singles' | 'doubles', gamesWon: '', gamesLost: '', durationMin: '', partner: '', rpe: '', notes: '', opponent: '', location: '', level: '', pointsFor: '', pointsAgainst: '', scoring: '' as '' | '11' | '15' | '21' | 'rally21' })
const evtBlankOf = () => ({ date: todayISO(), name: '', kind: 'tournament' as 'league' | 'tournament', format: 'pool-play' as PickleballFormat, division: '', wins: '', losses: '', placement: '', partner: '', notes: '' })

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

/**
 * The four questions this page's record answers, as a rail.
 *
 * They were four `CollapsibleSection`s rendering at once — 3.9 screens of
 * fourteen stat cards and seven charts. Four peers, each a different
 * question about the same sport, is a table of contents.
 *
 * Order is how often you reach for them after logging a session, which is
 * what the page above this is for. Competition last: events and DUPR are a
 * monthly concern, not a post-session one.
 */
const PB_GROUPS = [
  { id: 'competition', label: 'Competition & rating', blurb: 'Events, DUPR rating and league results, separate from casual play', icon: Medal, color: 'yellow' },
  { id: 'performance', label: 'Performance', blurb: 'Form, streaks, effort and how regularly you get on court', icon: PersonSimpleRun, color: 'sky' },
  { id: 'trends', label: 'Trends & volume', blurb: 'Win rate over time, games per week & month, where the habit sits', icon: ChartBar, color: 'teal' },
  { id: 'matchups', label: 'Opponents, partners & venues', blurb: 'Who you win with, who you lose to, and where', icon: Sword, color: 'red' }
] as const

export function Pickleball() {
  const { data, addPickleball, updatePickleball, removePickleball, addPickleEvent, removePickleEvent, setSettings, logDupr, removeDupr } = useJournal()
  const [dupr, setDupr] = useState({ date: todayISO(), rating: '' })
  // The page had three always-open log forms — session, DUPR, event — each
  // ending in its own wide tonal button. Three controls at primary weight is
  // three primary actions, which is none: nothing tells a first-time visitor
  // that logging a session is the thing this page is for. DUPR and events are
  // logged monthly at most, so they sit behind a header "+" and the reveal
  // saves with a ghost button. "Log session" stays the one wide control.
  // Both cards are also collapsible, so the fold is driven from here: hitting
  // "+" on a card the user had collapsed would otherwise reveal a form inside a
  // hidden body and read as a dead button.
  const [duprOpen, setDuprOpen] = useState(false)
  const [duprCardOpen, setDuprCardOpen] = useState(true)
  const [evOpen, setEvOpen] = useState(false)
  const [evCardOpen, setEvCardOpen] = useState(true)
  const duprStats = duprTrend(data.settings)
  function saveDupr() {
    const r = Number(dupr.rating)
    if (!dupr.rating || Number.isNaN(r) || r <= 0) return
    logDupr(dupr.date, r)
    setDupr({ date: todayISO(), rating: '' })
  }
  const [f, setF] = useState(blankOf)
  const set = (p: Partial<ReturnType<typeof blankOf>>) => setF((c) => ({ ...c, ...p }))
  const [ev, setEv] = useState(evtBlankOf)
  const setE = (p: Partial<ReturnType<typeof evtBlankOf>>) => setEv((c) => ({ ...c, ...p }))
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
    // A session with a duration and no score is a real session — the sport's
    // one required field is `durationMin`, and the voice path files exactly
    // that. Requiring a score here was the same bug the parser had, in the
    // form: you could not hand-log "played for 40 minutes, didn't keep score".
    if (!f.gamesWon && !f.gamesLost && !f.durationMin) { notify.info('Nothing to log yet', 'A session needs a score or how long you played.'); return }
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
    setF(blankOf())
  }
  function logEvent() {
    if (!ev.name.trim()) { notify.info('Name the event', 'A league or tournament needs a name to find it by.'); return }
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
    setEv(evtBlankOf())
  }
  function repeatLast() {
    const last = sessions[0]
    if (last) setF({ ...blankOf(), date: today, format: last.format, durationMin: String(last.durationMin ?? ''), partner: last.partner ?? '', location: last.location ?? '', level: last.level ?? '', scoring: last.scoring ?? '' })
  }

  const wl = [{ name: 'Won', value: all.gamesWon, color: 'green' }, { name: 'Lost', value: all.gamesLost, color: 'red' }]
  const formats = formatStats(data)
  const cum = cumulativeGames(data)
  const byDay = gamesByDay(data)
  // Read-only rivalry / chemistry / venue aggregates over logged sessions.
  const partners = partnerStats(data)
  const venues = venueStats(data)
  /**
   * The log form's Partner and Location chips.
   *
   * Same two stat tables the analytics below already use, capped at six so the
   * chip row does not become the form. They are sorted by games played, so the
   * person you play every week is the first chip rather than the alphabetically
   * luckiest.
   */
  const recentPartners = partners.slice(0, 6).map((p) => p.partner)
  const recentVenues = venues.slice(0, 6).map((v) => v.location)
  const yesterday = addDays(todayISO(), -1)
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
  // Play-frequency heatmap. Renders through the Body cluster's `CalendarHeatmap`
  // rather than a local grid: that primitive is a real <table> with weekday row
  // headers and per-cell focus, and it buckets by QUARTILE over the non-zero
  // days. The grid this replaced scaled linearly against the busiest day, so a
  // single tournament Saturday flattened every ordinary session to the lightest
  // step — the shape of the habit was the one thing the visual could not show.
  // 6mo, not 3mo. With a fluid grid the window sets the cell size as well as
  // the span, and thirteen columns across a 580px card come out at **35.5px** —
  // that is a month calendar, not a heatmap. Twenty-six lands at 18.4px, which
  // is the density the grid is drawn for. 3mo is still one click away.
  const [heatWeeks, setHeatWeeks] = useState(26)
  /* Sticky, because the four folds each were — losing that would be a
     regression dressed as a redesign. Defaults to Performance: it is the
     read you want straight after logging a session, which is what the act
     above this is for. */
  const [group, setGroup] = useStickyState<string>(
    'pickleball.group', 'performance', PB_GROUPS.map((g) => g.id),
  )
  const currentGroup = PB_GROUPS.find((g) => g.id === group) ?? PB_GROUPS[1]
  const heat = [...byDay].map(([date, value]) => ({ date, value }))

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
              {wl.map((x) => <span key={x.name} style={{ color: onRaised(x.color) }}>● {x.name} {x.value}</span>)}
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
                  <span className="text-fg-2">{fm.games} games · <span style={{ color: onRaised('green') }}>{fm.winPct}%</span></span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-pill bg-ink-2" role="img" aria-label={`${fm.format} win rate ${fm.winPct}%`}>
                  <div className="h-full rounded-pill" style={{ width: `${fm.winPct}%`, background: cat(fm.format === 'doubles' ? 'mauve' : 'teal') }} />
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
      <Card band title={<>Heatmap <span className="inline-flex items-center gap-2 text-label text-fg-2"><Icon as={ChartBar} size="sm" /> {heatWeeks === 13 ? '3mo' : heatWeeks === 26 ? '6mo' : '1yr'}</span></>} subtitle={`Last ${heatWeeks} weeks, darker = more games`} enlargeable>
        <div className="mb-2 flex items-center gap-3">
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
        {/* `fluid`, because the window above is a user control: at 13 weeks a
            fixed 11px cell measured **202px inside 580px** — the worst ratio in
            the app — and at 52 it overflows into a scrollbar. Dividing the card
            means the 3mo/6mo/1yr toggle changes the density of one grid rather
            than the length of a stub. */}
        <CalendarHeatmap
          weeks={heatWeeks}
          fluid
          data={heat}
          unit="games"
          label={`Pickleball games per day over the last ${heatWeeks} weeks`}
        />
      </Card>
    </CardGrid>
  )

  /**
   * The record, in one box, at the TOP.
   *
   * It was the last card on the page, under a comment reading "moved to bottom
   * as requested by user (BUJO-XXX)" — a placeholder ticket id, so the request
   * it cites cannot be checked. Measured, the page is 3.7 screens on desktop
   * and 5.4 on a phone, which makes "your record at a glance" the one card
   * nobody arrives at. A summary is the thing you read before deciding whether
   * to read the rest; it goes first or it does not earn its title.
   */
  const atAGlance = (
    <>
      {/* ONE BAR, NOT A CARD.

          This was a titled card wrapping four `StatTile`s, a "this week"
          sentence, a goal field and a progress bar — 259px on desktop and 308px
          on a phone to say four numbers. `StatBar` is what the rest of the app
          uses for exactly this (thirteen views; Pickleball was never one of
          them) and it is capped at 64px with hairline dividers.

          The four facts are the four that were here. The weekly goal stays,
          because it is the one line that changes what you do today, but as a
          single row under the bar rather than a card section of its own. */}
      <StatBar
        facts={[
          { label: 'Sessions', value: all.sessions },
          { label: 'Games', value: all.games },
          { label: 'Win %', value: `${all.winPct}%` },
          { label: 'Day streak', value: streak },
        ]}
      />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-line pb-3 text-label text-fg-2">
        <span>
          This week <span className="num text-fg-1">{week.games}</span> games
          {goal > 0 && <> of <span className="num text-fg-1">{goal}</span></>}
          {' · '}
          <span className="num" style={{ color: onRaised('green') }}>{week.winPct}%</span> won
          {goal > 0 && week.games >= goal && ' ✓'}
        </span>
        {goal > 0 && (
          <span aria-hidden className="h-1.5 w-24 overflow-hidden rounded-pill bg-ink-2">
            <span
              className="block h-full rounded-pill"
              style={{ width: `${Math.min(100, (week.games / goal) * 100)}%`, background: cat(week.games >= goal ? 'green' : 'teal') }}
            />
          </span>
        )}
        <label className="ml-auto inline-flex items-center gap-1.5 text-fg-1">
          Weekly goal
          <Input
            type="number"
            value={goal || ''}
            onChange={(e) => setSettings({ pickleballGoalGames: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="—"
            className="w-14 py-0.5 text-right"
          />
        </label>
      </div>
    </>
  )

  return (
    <Page width="wide" className="gap-0 sm:gap-0">
      {/* Summary, then the thing you came to do, then everything that reads
          back what you did.

          The comment here used to claim "three across instead of one tall
          stack — this page was 4.2 screens". It was still 4.1 when measured,
          because the claim only ever applied to THIS grid: the thirteen
          analytics cards below sat in a local `Section` that laid its children
          out `flex-col`, so each one spanned the full 1,180px to hold about
          180px of content. Fixed by deleting that component in favour of
          `CollapsibleSection` + `MasonryGrid`; see the groups below. */}
      {atAGlance}
      <CardGrid>
        <Card band className={SPAN_2} title="Log a session" right={sessions.length ? <Button variant="secondary" onClick={repeatLast} className="press-3d inline-flex items-center gap-1"><Icon as={ArrowsClockwise} size="sm" /> Repeat last</Button> : undefined}>
        {/* TAP, DON'T TYPE.

            This was fourteen controls of which twelve were free text or a bare
            number input — the most-used form in the app asking you to type "60"
            and "3.5" after every game. Converted to the `quickpick` primitives
            (#241) on the same reasoning as the rest of that pass: the answer is
            nearly always one of a handful, and a keyboard on a phone at the side
            of a court is the worst possible input device.

            Partner and Location read their chips from `partnerStats` and
            `venueStats`, which are already computed on this page for the
            analytics below and are **sorted by how often you play** — so the
            chips are your actual partners and courts, in the order you use
            them, rather than a list somebody invented. Both keep a free-text
            field beside them for the first time and the one-off.

            Points for/against stay typed on purpose: they are arbitrary numbers
            in 0–21 with no common values, so chips would be a list of twenty-two
            and a Stepper would be eleven taps. A control is only an improvement
            if it is fewer actions than typing. */}
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
          <DayPick value={f.date} onChange={(d) => set({ date: d })} today={todayISO()} yesterday={yesterday} />

          <ChipPick
            label="Format"
            value={f.format}
            onChange={(v) => set({ format: v })}
            options={[{ value: 'doubles', label: 'Doubles' }, { value: 'singles', label: 'Singles' }]}
          />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Stepper label="Games won" value={numOrUndef(f.gamesWon)} onChange={(v) => set({ gamesWon: v == null ? '' : String(v) })} max={30} placeholder="0" />
            <Stepper label="Games lost" value={numOrUndef(f.gamesLost)} onChange={(v) => set({ gamesLost: v == null ? '' : String(v) })} max={30} placeholder="0" />
          </div>

          <ChipPick
            label="On court for"
            tone="teal"
            value={numOrUndef(f.durationMin) ?? null}
            onChange={(v) => set({ durationMin: String(v) })}
            options={durationOptions([30, 45, 60, 90, 120])}
            after={
              <Input
                type="number"
                value={f.durationMin}
                onChange={(e) => set({ durationMin: e.target.value })}
                placeholder="Other"
                aria-label="Minutes on court"
                className="w-20 py-1"
              />
            }
          />

          <ChipPick
            label="Effort (RPE)"
            tone="peach"
            value={numOrUndef(f.rpe) ?? null}
            onChange={(v) => set({ rpe: String(v) })}
            options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({ value: n, label: String(n) }))}
            hint="1 easy · 10 everything you had"
          />

          <div className="grid gap-3 sm:grid-cols-2">
          {f.format === 'doubles' && (
            <ChipPick
              label="Partner"
              value={f.partner || null}
              onChange={(v) => set({ partner: f.partner === v ? '' : v })}
              options={recentPartners.map((n) => ({ value: n, label: n }))}
              after={
                <Input
                  value={f.partner}
                  onChange={(e) => set({ partner: e.target.value })}
                  placeholder="Someone else"
                  aria-label="Partner"
                  className="w-36 py-1"
                />
              }
            />
          )}

          <ChipPick
            label="Location"
            tone="teal"
            value={f.location || null}
            onChange={(v) => set({ location: f.location === v ? '' : v })}
            options={recentVenues.map((n) => ({ value: n, label: n }))}
            after={
              <Input
                value={f.location}
                onChange={(e) => set({ location: e.target.value })}
                placeholder="Somewhere else"
                aria-label="Location"
                className="w-36 py-1"
              />
            }
          />
          </div>

          {/* The half you fill less than half the time.

              `DisclosureRow` and not a `<details>`: it renders `aria-expanded`,
              which is what `npm run a11y` clicks to open a fold before it
              scans. A `<details>` would keep these four controls out of the
              accessibility gate entirely — the COD-93 trap, arriving by a new
              route. It is also the page's only disclosure, which is that
              component's stated rule.

              Tap-to-log costs vertical space — chips are taller than the grid
              of number inputs they replaced, and this form grew the page by
              0.4 screens. Folding the optional half is where that comes back,
              without putting a keyboard back in the fast path. */}
          <DisclosureRow label="Level, scoring, points & opponents">
            <ChipPick
              label="Level"
              tone="teal"
              value={f.level || null}
              onChange={(v) => set({ level: v })}
              options={['2.5', '3.0', '3.5', '4.0', '4.5', '5.0'].map((l) => ({ value: l, label: l }))}
            />

            <ChipPick
              label="Scoring"
              tone="teal"
              value={f.scoring || null}
              onChange={(v) => set({ scoring: v })}
              options={[
                { value: '11' as const, label: 'to 11' },
                { value: '15' as const, label: 'to 15' },
                { value: '21' as const, label: 'to 21' },
                { value: 'rally21' as const, label: 'rally 21' },
              ]}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input type="number" value={f.pointsFor} onChange={(e) => set({ pointsFor: e.target.value })} placeholder="Pts for" aria-label="Points for" />
              <Input type="number" value={f.pointsAgainst} onChange={(e) => set({ pointsAgainst: e.target.value })} placeholder="Pts against" aria-label="Points against" />
            </div>
            <Input value={f.opponent} onChange={(e) => set({ opponent: e.target.value })} placeholder="Opponent(s) (optional)" aria-label="Opponents" />
          </DisclosureRow>
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

      {/* ── Improve · rotating practice focus + warm-up; reference content folded
            below logging, collapsed. ── */}
      <Card band title={<span className="inline-flex items-center gap-2"><Icon as={Target} size="md" className="text-mauve" /> Practice today & improve</span>} subtitle="A focus for today, plus a warm-up to start right" collapsible>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Today's rotating practice focus */}
          <div className="rounded-card bg-ink-2 p-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-body font-medium text-fg-1">{drill.name}</span>
              <Pill color="mauve" size="micro" className="px-2">{drill.focus}</Pill>
            </div>
            <p className="text-label text-fg-2">{drill.how}</p>
            <p className="mt-2 text-label text-fg-2">New focus each day, log a session below after you drill it.</p>
          </div>
          {/* Warm-up checklist */}
          <div className="rounded-card bg-ink-2 p-3">
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

      {/* ── COMPETITION & RATING ──────────────────────────────────────────
            Three cards that had been sitting in the top grid beside "Log a
            session", which is the one thing you open this page to do. They
            are not that: a DUPR rating moves a few times a year, a league is
            logged after an event, and the countdown only exists when an event
            exists. Grouping them here leaves the top of the page as the daily
            loop — log, review, practise — and puts the occasional work one
            heading below it rather than interleaved with it. ── */}
      {/* ── The review, as four groups behind a rail. ──

          They were four `CollapsibleSection`s. Three shipped open and one —
          every chart on the page — shipped shut, which is the fix in #271;
          the folds themselves are what was left over. A fold is right for
          one aside inside a page about something else. Four peers, each
          answering a different question about the same sport, is a table of
          contents, and this page is 3.9 screens because all of them render
          at once.

          Same `SectionRail` as Insights and Coaching's manual. No "All" row:
          the four do not overlap, and "all of them" is the page this
          replaces. ── */}
      <section className="mt-2">
        <h2 className="mb-3 text-label text-fg-2">The record</h2>
        {/* Container on the outer div, grid on the inner: an element cannot
            query itself. Phone column spelled out, or the chip row's
            min-content sizes the only implicit track and the page scrolls
            sideways. Both in docs/PAGE-SHAPE.md. */}
        <div className="@container/page">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-3 @4xl/page:grid-cols-[13rem_minmax(0,1fr)]">
          <SectionRail
            label="Pickleball record"
            groups={PB_GROUPS.map((g) => ({ id: g.id, label: g.label }))}
            value={group}
            onChange={(id: string | null) => setGroup(id ?? 'performance')}
          />
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-baseline gap-x-3 border-b border-line pb-1.5">
              <h3 className="flex items-center gap-2 font-display text-heading font-medium text-fg-1">
                <Icon as={currentGroup.icon} size="md" style={{ color: onRaised(currentGroup.color) }} />
                {currentGroup.label}
              </h3>
              <p className="text-label text-fg-2">{currentGroup.blurb}</p>
            </div>
            {group === 'competition' && (<>
        <MasonryGrid>
        {/* ── Tournament prep countdown (#345) · conditional top status,
              surfaces only when events exist; collapsed. ── */}
        {upcoming.length > 0 && (
          <Card band title={<span className="inline-flex items-center gap-2"><Icon as={CalendarDot} size="md" className="text-peach" /> Upcoming events</span>} subtitle="Countdown &amp; a tournament-day prep checklist" collapsible>
            <ul className="mb-3 space-y-2">
              {upcoming.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2 rounded-card border p-2.5" style={{ borderColor: e.soon ? cat('peach') : cat('surface0'), background: e.soon ? cat('peach') + '0d' : cat('base') }}>
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
            <details className="rounded-card bg-ink-2 p-3">
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
        <Card enlargeable
          band
          title={<span className="inline-flex items-center gap-2"><Icon as={Gauge} size="md" className="text-mauve" /> DUPR rating</span>}
          subtitle="Log your DUPR over time, watch the trend climb"
          collapsible
          open={duprCardOpen}
          onOpenChange={setDuprCardOpen}
          right={
            <Button variant="ghost" size="icon-sm" onClick={() => { setDuprOpen((o) => !o); setDuprCardOpen(true) }} aria-expanded={duprOpen} aria-label="Log a DUPR rating">
              <Icon as={Plus} size="sm" />
            </Button>
          }
        >
          {duprOpen && (
            <div className="mb-3 flex flex-wrap items-end gap-2 bg-ink-2 p-3">
              <label className="block text-label text-fg-1">Date<Input type="date" value={dupr.date} onChange={(e) => setDupr((c) => ({ ...c, date: e.target.value }))} className="mt-1" /></label>
              <label className="block text-label text-fg-1">Rating<Input type="number" step="0.01" inputMode="decimal" value={dupr.rating} onChange={(e) => setDupr((c) => ({ ...c, rating: e.target.value }))} placeholder="e.g. 3.75" aria-label="DUPR rating" className="mt-1 w-28" /></label>
              <Button variant="ghost" size="sm" onClick={saveDupr}>Save rating</Button>
            </div>
          )}
          {duprStats.points.length === 0 ? (
            <Empty>No DUPR ratings logged yet · use + in the header to start the trend.</Empty>
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
                      <span className="font-medium tabular-nums" style={{ color: onRaised('mauve') }}>{p.rating}</span>
                      <Button variant="ghost" size="icon-sm" onClick={() => removeDupr(p.date)} aria-label={`Remove rating from ${p.date}`} className="text-fg-2 reveal hover:text-red">×</Button>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
        {/* ── Leagues & tournaments · secondary event logging, grouped beside the
              DUPR tracker and collapsed. ── */}
        <Card
          band
          title={<span className="inline-flex items-center gap-2"><Icon as={Medal} size="md" className="text-yellow" /> Leagues &amp; tournaments</span>}
          subtitle="Log competitive events, separate from casual sessions"
          collapsible
          open={evCardOpen}
          onOpenChange={setEvCardOpen}
          right={
            <Button variant="ghost" size="icon-sm" onClick={() => { setEvOpen((o) => !o); setEvCardOpen(true) }} aria-expanded={evOpen} aria-label="Log an event">
              <Icon as={Plus} size="sm" />
            </Button>
          }
        >
          <div className="mb-4 grid grid-cols-3 gap-2">
            <StatTile compact label="Events" value={events.length} />
            <StatTile compact label="Event record" value={`${evWins}–${evLosses}`} />
            <StatTile compact label="Medals" value={medals} color="yellow" icon={<Icon as={Trophy} size="sm" />} />
          </div>
          {/* log an event */}
          {evOpen && (
          <div className="grid gap-2 rounded-card bg-ink-2 p-3 sm:grid-cols-2">
            <Input value={ev.name} onChange={(e) => setE({ name: e.target.value })} placeholder="Event name" aria-label="Event name" />
            <Input type="date" value={ev.date} onChange={(e) => setE({ date: e.target.value })} aria-label="Date" />
            <Segmented value={ev.kind} onChange={(v) => setE({ kind: v })} options={[{ value: 'tournament', label: 'Tournament' }, { value: 'league', label: 'League' }]} />
            <select value={ev.format} onChange={(e) => setE({ format: e.target.value as PickleballFormat })} aria-label="Format" className="rounded-control border border-ctl-ring bg-ink-2 px-2 py-2 text-body text-foreground">
              {PICKLE_FORMATS.map((fm) => <option key={fm.id} value={fm.id}>{fm.label}</option>)}
            </select>
            <Input value={ev.division} onChange={(e) => setE({ division: e.target.value })} placeholder="Division e.g. 3.5 Mixed" aria-label="Division" />
            <Input value={ev.placement} onChange={(e) => setE({ placement: e.target.value })} placeholder="Placement e.g. Gold / 2nd of 8" aria-label="Placement" />
            <Input type="number" value={ev.wins} onChange={(e) => setE({ wins: e.target.value })} placeholder="Wins" aria-label="Wins" />
            <Input type="number" value={ev.losses} onChange={(e) => setE({ losses: e.target.value })} placeholder="Losses" aria-label="Losses" />
            <Input value={ev.partner} onChange={(e) => setE({ partner: e.target.value })} placeholder="Partner (optional)" aria-label="Partner" className="sm:col-span-2" />
            <div className="flex justify-end sm:col-span-2"><Button variant="ghost" size="sm" onClick={logEvent}>Save event</Button></div>
          </div>
          )}
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
                    <Button variant="ghost" size="icon-sm" onClick={() => removePickleEvent(e.id)} aria-label="Remove event" className="text-fg-2 reveal hover:text-red">×</Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        </MasonryGrid>
            </>)}
            {group === 'performance' && (<>
        {/* "Form & momentum" and "Deeper signals" were two headings over one
            question — how am I playing. Nine cards in one masonry balance into
            even columns; four and five in separate groups could not, and each
            group cost a heading to say something the cards already said. */}
        <MasonryGrid>
        {form.results.length > 0 && <RecentFormCard form={form} streaks={streaks} />}
        {forecast.ready && <WinRateForecastCard forecast={forecast} />}
        <MilestonesCard milestones={milestones} />
        {load.sessions > 0 && <SessionIntensityCard load={load} />}
        
        {weekdaysPlayed.length > 0 && <WeekdayPerformanceCard weekdays={weekdays} />}
        {points.sessions > 0 && <PointDifferentialCard points={points} />}
        {hours.timedSessions > 0 && <TimeOnCourtCard hours={hours} />}
        {scoring.length > 0 && <ScoringPerformanceCard scoring={scoring} />}
        {consistency.daysPlayed > 0 && <PlayConsistencyCard consistency={consistency} />}
        
        </MasonryGrid>
            </>)}
            {group === 'trends' && (<>
        <LazyMount minHeight={500}>{charts}</LazyMount>
            </>)}
            {group === 'matchups' && (<>
        <MasonryGrid>
        {partners.length > 0 && <PartnerChemistryCard partners={partners} />}
        {venues.length > 0 && <VenuesCard venues={venues} />}
        {opponents.length > 0 && <RivalryRecordCard opponents={opponents} />}
        {matchup.length > 0 && <LevelMatchupCard matchup={matchup} />}
        </MasonryGrid>
            </>)}
          </div>
        </div>
        </div>
      </section>

      {/* "Play safe" and the format playbook lived here as two more cards on
          an already 4-screen page. Both are reference reading, not session
          logging — they are in Coaching's Manual now, beside the knee-rehab
          and shot guides they belong with. */}
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
  // Above the `editing` early return: a row can be captured and then opened for
  // an edit, and a hook called only on one of those paths is a different hook
  // order on each render.
  const justNew = useJustCaptured().has(PICKLEBALL_KEY(p.id))
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
          <Button variant="secondary" onClick={() => setEditing(false)} className="press-3d flex-1">Cancel</Button>
        </div>
      </li>
    )
  }
  return (
    <li {...justCapturedProps(justNew)} className={`group flex items-center justify-between gap-2 py-2 text-body ${justNew ? 'just-captured' : ''}`}>
      {/* `durationMin` was stored and never rendered, so a session logged by
          voice — where the duration is usually the ONLY fact given — showed as
          "doubles 0–0" and looked empty. It is the sport's required field
          (`domain/activities.ts`), so it reads before the optional ones. */}
      <span className="text-fg-1">{prettyDay(p.date)} <span className="text-fg-2">· {p.format}{p.durationMin ? ` · ${p.durationMin} min` : ''}{p.partner ? ` · with ${p.partner}` : ''}{p.opponent ? ` · vs ${p.opponent}` : ''}{p.location ? ` · ${p.location}` : ''}</span></span>
      <span className="flex items-center gap-2">
        <span style={{ color: onRaised('green') }}>{p.gamesWon}</span>–<span style={{ color: onRaised('red') }}>{p.gamesLost}</span>
        <Button variant="ghost" size="sm" onClick={() => { setD({ format: p.format, gamesWon: String(p.gamesWon), gamesLost: String(p.gamesLost), durationMin: p.durationMin != null ? String(p.durationMin) : '', notes: p.notes ?? '' }); setEditing(true) }} aria-label="Edit session" className="text-fg-2 reveal hover:text-mauve">Edit</Button>
        <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label="Remove" className="text-fg-2 reveal hover:text-red">×</Button>
      </span>
    </li>
  )
}
