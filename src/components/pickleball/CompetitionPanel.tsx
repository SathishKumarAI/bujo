import { useState } from 'react'
import { CalendarDot, Gauge, Medal, Plus, Trophy } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { LineChart, Line, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useJournal } from '../../store'
import { Card, Empty, Input, Pill, Segmented, StatTile } from '../ui'
import { Button } from '../ui/button'
import { CardGrid } from '../shell/CardGrid'
import { DisclosureRow } from '../page'
import { cat, onRaised, rechartsTooltip } from '../../lib/colors'
import { todayISO, prettyDay } from '../../lib/date'
import { duprTrend, upcomingEvents } from '../../lib/pickleball'
import { PICKLE_FORMATS, FORMAT_LABEL } from '../../lib/pickleballPlan'
import type { PickleballFormat } from '../../lib/types'
import { notify } from '../../lib/notify'

const tip = rechartsTooltip

const evtBlankOf = () => ({ date: todayISO(), name: '', kind: 'tournament' as 'league' | 'tournament', format: 'pool-play' as PickleballFormat, division: '', wins: '', losses: '', placement: '', partner: '', notes: '' })

/** Tournament-day prep checklist, shown beside the countdown to an event. */
const PREP_CHECKLIST = [
  'Paddles (+ a backup) and fresh grip / overgrip tape',
  'Court shoes, extra socks, athletic tape',
  'Water + electrolytes; quick-energy snacks',
  'Sun: hat, sunglasses, sunscreen - or layers for cold',
  'Warm-up band, foam roller; ibuprofen / blister kit',
  'Know your start time, division & format; arrive 45 min early',
  'Mental routine: pre-point breath, one tactical intention',
]

/**
 * The `competition` panel - events, the DUPR trend, and league results.
 *
 * Its own file for the same reason as `TrendCharts`: it is 140 lines holding
 * two forms, and a form is edited on its own. Both forms sit behind the card
 * header's "+" because they are logged monthly at most, while the panel's
 * reason to exist is reading what they produced.
 */
export function CompetitionPanel() {
  const { data, addPickleEvent, removePickleEvent, logDupr, removeDupr } = useJournal()
  const today = todayISO()
  const [dupr, setDupr] = useState({ date: today, rating: '' })
  const [duprOpen, setDuprOpen] = useState(false)
  const [duprCardOpen, setDuprCardOpen] = useState(true)
  const [evOpen, setEvOpen] = useState(false)
  const [evCardOpen, setEvCardOpen] = useState(true)
  const [ev, setEv] = useState(evtBlankOf)
  const setE = (p: Partial<ReturnType<typeof evtBlankOf>>) => setEv((c) => ({ ...c, ...p }))
  const duprStats = duprTrend(data.settings)
  const upcoming = upcomingEvents(data, today)
  const events = [...(data.pickleballEvents ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1))
  const evWins = events.reduce((s, e) => s + (e.wins ?? 0), 0)
  const evLosses = events.reduce((s, e) => s + (e.losses ?? 0), 0)
  const medals = events.filter((e) => /gold|silver|bronze|1st|2nd|3rd/i.test(e.placement ?? '')).length

  function saveDupr() {
    const r = Number(dupr.rating)
    if (!dupr.rating || Number.isNaN(r) || r <= 0) return
    logDupr(dupr.date, r)
    setDupr({ date: todayISO(), rating: '' })
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

  return (
    <>
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
            {/* `DisclosureRow`, not a raw `<details>`.

                A `<summary>` carries no `aria-expanded`, and `openFolds()` in
                `scripts/a11y-axe.mjs` finds content by exactly that attribute —
                so this checklist had never been opened by the gate at any theme
                or viewport. It is the same trap the Coaching pass found in its
                session template, and this was the last `<details>` in `#main`
                on this page: the probe now reports 0. Folding something is not
                allowed to be a way of making a violation vanish. */}
            <DisclosureRow label="Tournament-day prep checklist">
              <ul className="space-y-1">
                {PREP_CHECKLIST.map((x) => (
                  <li key={x} className="flex gap-1.5 text-label text-fg-2"><span className="text-peach">•</span> {x}</li>
                ))}
              </ul>
            </DisclosureRow>
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
    </>
  )
}
