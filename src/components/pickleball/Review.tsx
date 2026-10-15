import { useState, type ReactNode } from 'react'
import { ArrowSquareOut, Barbell, CalendarDot, Gauge, Medal, Plus, Target, Trophy } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useJournal } from '../../store'
import { Card, Empty, Input, Pill, Segmented, StatTile, Textarea } from '../ui'
import { Button } from '../ui/button'
import { CardGrid } from '../shell/CardGrid'
import { LazyMount } from '../LazyMount'
import { useNav } from '../shell/nav'
import { CalendarHeatmap, SectionRail } from '../page'
import { cat, onRaised, rechartsTooltip } from '../../lib/colors'
import { todayISO, prettyDay, fromISODay } from '../../lib/date'
import {
  pickleTotals, winRateSeries, weeklyGames, formatStats, cumulativeGames, gamesByDay, partnerStats,
  venueStats, opponentRecords, rollingForm, winStreaks, pointDifferential, levelMatchup,
  weekdayPerformance, duprTrend, monthlyGames, winRateForecast, rpeLoad, pickleMilestones,
  pickleHours, scoringStats, upcomingEvents, playConsistency,
} from '../../lib/pickleball'
import { PICKLE_FORMATS, FORMAT_LABEL } from '../../lib/pickleballPlan'
import { ACADEMY_DRILLS, DRILL_FIXES } from '../../lib/pickleballAcademy'
import { PracticeTick } from '../coaching/PracticeTick'
import { PB_PANELS } from './panels'
import type { PickleballFormat } from '../../lib/types'
import { RecentFormCard, WinRateForecastCard, MilestonesCard, SessionIntensityCard } from './FormCards'
import { PartnerChemistryCard, VenuesCard, RivalryRecordCard, LevelMatchupCard } from './MatchupCards'
import { WeekdayPerformanceCard, PointDifferentialCard, TimeOnCourtCard, ScoringPerformanceCard, PlayConsistencyCard } from './SignalCards'
import { justCapturedProps, useJustCaptured } from '../CaptureReceipt'
import { PICKLEBALL_KEY } from '../../lib/recordKeys'
import { notify } from '../../lib/notify'

const tip = rechartsTooltip

/**
 * ZONE 3 - everything this page has recorded, behind ONE bar.
 *
 * It was four groups on a 13rem side rail, with the history list and a practice
 * card stranded up in the act: "what I did" sat beside the form while "what it
 * adds up to" sat below it, and the page had two navigations. Five rows now,
 * same instrument and same shape as `views/Pullups.tsx` and
 * `components/homeworkout/Review.tsx` - `railAt="never"`, a bar above the panel
 * at every width - so the three pages that record a sport are one page.
 *
 * Ordered for somebody who has just logged: Sessions first, because the first
 * question after logging is "did that land, and what does the week look like".
 * Competition last - a DUPR rating moves a few times a year.
 *
 * It reads the store directly rather than taking twenty aggregates as props.
 * Each is one pass over a list of sessions (see the no-`useMemo` note in
 * `lib/pickleball.ts`), and a prop list that long is a second place for two
 * components to disagree about what a number means.
 */
const evtBlankOf = () => ({ date: todayISO(), name: '', kind: 'tournament' as 'league' | 'tournament', format: 'pool-play' as PickleballFormat, division: '', wins: '', losses: '', placement: '', partner: '', notes: '' })

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
 * Renders its children only when their sub-section is the selected one.
 *
 * Module level and `active` as a prop, not a closure: a component declared
 * inside a render is a NEW component type every render, so React unmounts and
 * remounts its whole subtree — every chart would re-enter, every fold inside
 * it would snap shut, and eslint's `no-create-component-during-render` says so
 * before any of that is visible.
 */
function Facet({ of, active, children }: { of: string; active: string | null; children: ReactNode }) {
  return active == null || active === of ? <>{children}</> : null
}

// History row with in-place editing (BUJO-201): correct a mistyped score/format/
// duration without delete-and-re-log.
function PickleRow({ p, onSave, onDelete }: {
  p: import('../../lib/types').PickleballSession
  onSave: (patch: Partial<import('../../lib/types').PickleballSession>) => void
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


export function PickleballReview({ panel, onPanel }: {
  /**
   * Which row is open.
   *
   * Lifted to the view rather than held here, because zone 1's "what to do
   * next" row is a shortcut INTO a panel ("10 days since you last played →
   * Performance") and a button that cannot reach the state it names is a
   * button that lies. One owner, passed down; the view persists it.
   */
  panel: string
  onPanel: (id: string) => void
}) {
  const nav = useNav()
  const { data, updatePickleball, removePickleball, addPickleEvent, removePickleEvent, logDupr, removeDupr } = useJournal()
  const today = todayISO()
  const sessions = [...(data.pickleball ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1))

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
  // Not sticky, and not in the URL: a sub-section is a narrowing you do while
  // reading, not a place you return to. Sticky it would be, on a page you open
  // a week later, four cards you cannot find and no memory of hiding them.
  const [facet, setFacet] = useState<string | null>(null)
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

  const [ev, setEv] = useState(evtBlankOf)
  const setE = (p: Partial<ReturnType<typeof evtBlankOf>>) => setEv((c) => ({ ...c, ...p }))
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

  const all = pickleTotals(data)
  const trend = winRateSeries(data)
  const weeks = weeklyGames(data, 8, today)
  const wl = [{ name: 'Won', value: all.gamesWon, color: 'green' }, { name: 'Lost', value: all.gamesLost, color: 'red' }]
  const formats = formatStats(data)
  const cum = cumulativeGames(data)
  const byDay = gamesByDay(data)
  /* The play-frequency heatmap renders through the Body cluster's
     `CalendarHeatmap`: a real <table> with weekday row headers and per-cell
     focus, bucketed by QUARTILE over the non-zero days. The grid it replaced
     scaled linearly against the busiest day, so one tournament Saturday
     flattened every ordinary session to the lightest step - the shape of the
     habit was the one thing the visual could not show. */
  const heat = [...byDay].map(([date, value]) => ({ date, value }))
  // Read-only rivalry / chemistry / venue aggregates over logged sessions.
  const partners = partnerStats(data)
  const venues = venueStats(data)
  const opponents = opponentRecords(data)
  // Read-only form / streak / point / matchup / weekday signals.
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
  // Read-only time-on-court, scoring split, consistency & event signals.
  const hours = pickleHours(data, 30, today)
  const scoring = scoringStats(data)
  const consistency = playConsistency(data, 8, today)
  const upcoming = upcomingEvents(data, today)
  // Leagues & tournaments.
  const events = [...(data.pickleballEvents ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1))
  const evWins = events.reduce((s, e) => s + (e.wins ?? 0), 0)
  const evLosses = events.reduce((s, e) => s + (e.losses ?? 0), 0)
  const medals = events.filter((e) => /gold|silver|bronze|1st|2nd|3rd/i.test(e.placement ?? '')).length
  // Deterministic daily rotation, over the academy's twenty-one drills.
  const drill = ACADEMY_DRILLS[(fromISODay(today).getDate() + fromISODay(today).getMonth() * 3) % ACADEMY_DRILLS.length]

  const current = PB_PANELS.find((p) => p.id === panel) ?? PB_PANELS[0]

  /*
   * SUB-SECTIONS, FOR THE TWO GROUPS BIG ENOUGH TO NEED THEM.
   *
   * A rail row that opens nine cards is a wall with a nicer door. Performance
   * holds nine and Trends seven, and inside each the cards answer two or three
   * different questions — "how am I playing" is not "how hard was it" is not
   * "am I turning up". Competition (3) and Opponents (4) get no chip row: a
   * sub-navigation over four things costs more than it saves, which is the
   * same arithmetic that keeps `count` off a rail whose groups hold prose.
   *
   * `has` is the single source for BOTH the chip and the card. The obvious
   * shape — a chip list beside the render conditions — is the hand-written id
   * list resolved against another source that this repo has been bitten by
   * three times (`BottomNav`'s `PRIMARY`, `view-ids.mjs`, the `VIEWS` list),
   * and it fails the same way: a chip that selects nothing, or a card that no
   * chip can reach. One boolean, two readers.
   */
  const has = {
    recentForm: form.results.length > 0,
    forecast: forecast.ready,
    milestones: true,
    intensity: load.sessions > 0,
    weekday: weekdaysPlayed.length > 0,
    points: points.sessions > 0,
    hours: hours.timedSessions > 0,
    scoring: scoring.length > 0,
    consistency: consistency.daysPlayed > 0,
    winTrend: true,
    winLoss: true,
    perWeek: true,
    perMonth: monthsPlayed,
    byFormat: true,
    cumulative: true,
    heatmap: true,
  }
  /** card → sub-section, for every card that lives under a chip row. */
  const FACET_OF: Record<keyof typeof has, string> = {
    recentForm: 'form', forecast: 'form', points: 'form', scoring: 'form',
    intensity: 'effort', hours: 'effort',
    weekday: 'cadence', consistency: 'cadence',
    milestones: 'badges',
    winTrend: 'winning', winLoss: 'winning', byFormat: 'winning',
    perWeek: 'volume', perMonth: 'volume', cumulative: 'volume', heatmap: 'volume',
  }
  const FACET_LABELS: Record<string, string> = {
    form: 'How I am playing', effort: 'How hard', cadence: 'Turning up', badges: 'Badges',
    winning: 'Winning', volume: 'Volume',
  }
  const FACETS_BY_GROUP: Record<string, string[]> = {
    performance: ['form', 'effort', 'cadence', 'badges'],
    trends: ['winning', 'volume'],
  }
  // Counted from `has`, so a sub-section with nothing in it is not offered.
  const facetRows = (FACETS_BY_GROUP[panel] ?? [])
    .map((id) => ({
      id,
      label: FACET_LABELS[id],
      count: (Object.keys(has) as (keyof typeof has)[]).filter((k) => FACET_OF[k] === id && has[k]).length,
    }))
    .filter((f) => f.count > 0)
  const groupCount = facetRows.reduce((a, f) => a + f.count, 0)
  // A facet from the group you just left must not hide every card in this one.
  const activeFacet = facetRows.some((f) => f.id === facet) ? facet : null


  const charts = (
    <CardGrid>
      <Facet of="winning" active={activeFacet}>
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
      </Facet>
      <Facet of="winning" active={activeFacet}>
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
      </Facet>
      <Facet of="volume" active={activeFacet}>
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
      </Facet>
      {monthsPlayed && (
        <Facet of="volume" active={activeFacet}>
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
        </Facet>
      )}
      <Facet of="winning" active={activeFacet}>
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
      </Facet>
      <Facet of="volume" active={activeFacet}>
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
      </Facet>
      {/* `ranges`, like every other heatmap in the app.
          This card had its own 3mo/6mo/1yr toggle, which is three ways of
          looking at a year and no way of looking at this week — the thing
          asked for across every heatmap: *"I want to focus more on this month
          and this week, why should I focus on yearly."* Swapping the bespoke
          control for the shared one also deletes the `heatWeeks` state, the
          title badge that restated it and the fixed-span subtitle. */}
      <Facet of="volume" active={activeFacet}>
      <Card band title="Heatmap" subtitle="Darker = more games" enlargeable>
        <CalendarHeatmap
          ranges
          storageKey="pickleball"
          fluid
          data={heat}
          unit="games"
          label="Pickleball games per day"
        />
      </Card>
      </Facet>
    </CardGrid>
  )

  return (
      <section className="mt-2">
        <h2 className="mb-3 text-label text-fg-2">The record</h2>
      {/* ── ONE DRILL, THE SYMPTOM IT CURES, AND A TICK. ──

            This was "Practice today & improve": a drill, a five-line warm-up
            and two links, 2×2 inside a card — a second page about how to play
            on the page where you record that you played.

            Three things changed and each is a rule from
            `docs/REUSABLE-PATTERNS.md`:

            §12, the drill says WHAT IT FIXES. `DRILL_FIXES` is keyed on the
            group and written as the complaint you arrive with ("your dinks sit
            up and get attacked"), which is the only sentence that can tell you
            whether today's drill is your problem. A name and a how never could.

            §13, it is a TICK and not an instruction. `PracticeTick` writes the
            day into `settings.practiceLog` under the same key Coaching uses, so
            drilling it here and drilling it there are one record — which they
            could not have been while this page's drill names existed nowhere
            else.

            And the warm-up is gone rather than shortened: it is Coaching's
            `prep` chapter, eight minutes of it, and two copies of a safety
            instruction is the worse failure mode of the two. The row below
            says where it went. ── */}
      <Card band title={<span className="inline-flex items-center gap-2"><Icon as={Target} size="md" className="text-mauve" /> Today&apos;s focus</span>} subtitle="One drill, picked for today · tick it when you have done it" collapsible>
        <div className="rounded-card bg-ink-2 p-3">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-body font-medium text-fg-1">{drill.name}</span>
            <Pill color="mauve" size="micro" className="px-2">{drill.skill}</Pill>
            <PracticeTick kind="drill" name={drill.name} className="ml-auto" />
          </div>
          <p className="text-label text-fg-2">{drill.how}</p>
          {/* The complaint, not the category. Rendered only when the group has
              one — a lookup that silently returns undefined is the trap
              `pickleballAcademy.test.ts` guards, and an empty line here would
              read as a missing sentence rather than as an absent key. */}
          {DRILL_FIXES[drill.skill] && (
            <p className="mt-2 text-label text-fg-1">
              <span className="text-fg-2">Fixes · </span>{DRILL_FIXES[drill.skill]}
            </p>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-3">
          <Button variant="ghost" onClick={() => nav('coaching')} className="h-auto gap-1.5 p-0 text-label text-fg-1 hover:no-underline">
            <Icon as={Barbell} size="sm" className="text-green" />
            Warm-up, {ACADEMY_DRILLS.length} drills &amp; the 12-week program
          </Button>
          {RESOURCES.map((r) => (
            <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-label text-blue hover:underline">
              {r.name} <Icon as={ArrowSquareOut} size="sm" />
            </a>
          ))}
        </div>
      </Card>

        {/* A BAR ACROSS THE TOP, NOT A COLUMN DOWN THE SIDE.

            The rail was a 13rem column, which cost the panel beside it 208px
            plus a 2rem gap — measured, **870px of an 1180px shell** — and that
            is the number that had the review zone resolving to one column at
            1440 (see the `CardGrid` swap one commit back). As a bar the panel
            is the full width and the four rows read left to right, which is
            how a table of contents over four peers is read when it fits on one
            line. Same component, same state: `railAt="never"` keeps the chip
            row at every width and **wraps** rather than scrolling sideways,
            which matters here because "Opponents, partners & venues" is a long
            row and a strip that scrolls with nothing advertising it is how
            three of eight chapters went missing on Pull-ups.

            Not sticky — `SectionRail`'s own note: a bar that sticks paints over
            the panel it switches, and hiding it on scroll is COD-202, where the
            phone's only navigation slid out of frame and a gate declared the
            page retired having scanned nothing. */}
        <div className="@container/page">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-y-3">
          <SectionRail
            label="Pickleball record"
            groups={PB_PANELS.map((g) => ({ id: g.id, label: g.label }))}
            value={panel}
            onChange={(id: string | null) => { onPanel(id ?? 'sessions'); setFacet(null) }}
            railAt="never"
          />
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-baseline gap-x-3 border-b border-line pb-1.5">
              <h3 className="flex items-center gap-2 text-heading font-medium text-fg-1">
                <Icon as={current.icon} size="md" style={{ color: onRaised(current.color) }} />
                {current.label}
              </h3>
              <p className="text-label text-fg-2">{current.blurb}</p>
            </div>
            {/* THE SUB-SECTIONS · only where the group is big enough to need
                them, and every chip counted from the same `has` the cards
                render from, so a chip can never select an empty panel.

                The selected chip takes the GROUP's colour in its border and
                its ground, with `fg-1` text — never the accent as text on a
                wash of itself, which measured 3.64–4.40 across latte and dawn
                on `ChipPick` and is the calibration trap in CLAUDE.md. */}
            {facetRows.length > 1 && (
              <div className="mb-3 flex flex-wrap items-center gap-1.5" role="group" aria-label={`${current.label} sub-sections`}>
                <button
                  type="button"
                  onClick={() => setFacet(null)}
                  aria-pressed={activeFacet == null}
                  className={`rounded-pill border px-2.5 py-0.5 text-label transition-colors active:scale-95 ${activeFacet == null ? 'text-fg-1' : 'border-line bg-ink-2 text-fg-2 hover:border-line-strong hover:text-fg-1'}`}
                  style={activeFacet == null ? { borderColor: cat(current.color), background: cat(current.color) + '1f' } : undefined}
                >
                  All <span className="num text-fg-2">{groupCount}</span>
                </button>
                {facetRows.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFacet(f.id)}
                    aria-pressed={activeFacet === f.id}
                    className={`rounded-pill border px-2.5 py-0.5 text-label transition-colors active:scale-95 ${activeFacet === f.id ? 'text-fg-1' : 'border-line bg-ink-2 text-fg-2 hover:border-line-strong hover:text-fg-1'}`}
                    style={activeFacet === f.id ? { borderColor: cat(current.color), background: cat(current.color) + '1f' } : undefined}
                  >
                    {f.label} <span className="num text-fg-2">{f.count}</span>
                  </button>
                ))}
              </div>
            )}
            {panel === 'sessions' && (<>
      <Card band title="History" subtitle="Tap Edit to fix a score, × to remove" collapsible>
        {/* FIVE ROWS, AND THE REST SCROLLS.

            It was eight rows and a "Show all 23" button, so the card was
            either 8 rows tall or 23 — and at 23 it pushed everything under
            it down a screen and a half. A history is a thing you glance at
            and occasionally dig through; neither of those wants a button
            that changes the page's height.

            `max-h` on the list with the rows all present: five are visible,
            the rest are one flick away, and the card is the same height
            whichever you are doing. 5 × 45px measured, plus a few pixels so
            the sixth row is half-visible — a clean bottom edge reads as the
            end of the list, which is the thing that made the old button
            necessary.

            `tabIndex` and a name because it scrolls: a scrollable region
            that cannot be focused is unreachable by keyboard, and
            `npm run a11y` fails it as a serious `scrollable-region-focusable`
            (it caught exactly this on the Cycle symptom table). */}
        {sessions.length === 0 ? (
          <Empty>Log a session above to start your record.</Empty>
        ) : (
          <div
            className={sessions.length > 5 ? 'max-h-[15rem] overflow-y-auto pr-1' : undefined}
            tabIndex={sessions.length > 5 ? 0 : undefined}
            role={sessions.length > 5 ? 'group' : undefined}
            aria-label={sessions.length > 5 ? `All ${sessions.length} sessions, scrollable` : undefined}
          >
            <ul className="divide-y divide-surface0">
              {sessions.map((p) => (
                <PickleRow key={p.id} p={p} onSave={(patch) => updatePickleball(p.id, patch)} onDelete={() => removePickleball(p.id)} />
              ))}
            </ul>
          </div>
        )}
        {sessions.length > 5 && (
          <p className="mt-2 text-label text-fg-2">Showing 5 of {sessions.length} · scroll for the rest</p>
        )}
      </Card>
            </>)}
            {panel === 'competition' && (<>
        <CardGrid>
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
        </CardGrid>
            </>)}
            {panel === 'performance' && (<>
        {/* "Form & momentum" and "Deeper signals" were two headings over one
            question — how am I playing. Nine cards in one masonry balance into
            even columns; four and five in separate groups could not, and each
            group cost a heading to say something the cards already said. */}
        <CardGrid>
        <Facet of="form" active={activeFacet}>{has.recentForm && <RecentFormCard form={form} streaks={streaks} />}</Facet>
        <Facet of="form" active={activeFacet}>{has.forecast && <WinRateForecastCard forecast={forecast} />}</Facet>
        <Facet of="badges" active={activeFacet}><MilestonesCard milestones={milestones} /></Facet>
        <Facet of="effort" active={activeFacet}>{has.intensity && <SessionIntensityCard load={load} />}</Facet>
        <Facet of="cadence" active={activeFacet}>{has.weekday && <WeekdayPerformanceCard weekdays={weekdays} />}</Facet>
        <Facet of="form" active={activeFacet}>{has.points && <PointDifferentialCard points={points} />}</Facet>
        <Facet of="effort" active={activeFacet}>{has.hours && <TimeOnCourtCard hours={hours} />}</Facet>
        <Facet of="form" active={activeFacet}>{has.scoring && <ScoringPerformanceCard scoring={scoring} />}</Facet>
        <Facet of="cadence" active={activeFacet}>{has.consistency && <PlayConsistencyCard consistency={consistency} />}</Facet>
        
        </CardGrid>
            </>)}
            {panel === 'trends' && (<>
        <LazyMount minHeight={500}>{charts}</LazyMount>
            </>)}
            {panel === 'matchups' && (<>
        <CardGrid>
        {partners.length > 0 && <PartnerChemistryCard partners={partners} />}
        {venues.length > 0 && <VenuesCard venues={venues} />}
        {opponents.length > 0 && <RivalryRecordCard opponents={opponents} />}
        {matchup.length > 0 && <LevelMatchupCard matchup={matchup} />}
        </CardGrid>
            </>)}
          </div>
        </div>
        </div>
      </section>
  )
}
