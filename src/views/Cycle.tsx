import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useState } from 'react'
import { Flower, NotePencil, ShieldWarning, Thermometer } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../store'
import { monthDays, prettyDay, prettyMonth, todayISO } from '../lib/date'
import { Card, Input, Pill } from '../components/ui'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { Page, useCursor } from '../components/shell/Page'
import { cat, rechartsTooltip, onAccent } from '../lib/colors'
import { avgCycleLength, cycleDay, nextPeriodEstimate, phaseOf } from '../lib/cycleInsights'
import { BBT_RULES, CYCLE_DISCLAIMER, CYCLE_PHASES, TRACKING_TIPS } from '../lib/cycleGuide'

/**
 * Every flag used to fill `red` when on — five chips, one colour, so a row
 * read as "something is marked" without saying what. One hue per flag makes
 * the dots on the day list legible without opening the day.
 */
const FLAGS: { id: string; color: string }[] = [
  { id: 'period', color: 'red' },
  { id: 'spotting', color: 'maroon' },
  { id: 'ovulation', color: 'green' },
  { id: 'pms', color: 'mauve' },
  { id: 'cramps', color: 'peach' },
]

export function Cycle() {
  const { data, setCycle } = useJournal()
  const { month: ym } = useCursor()
  const unit = data.settings.tempUnit
  const days = monthDays(ym)
  const today = todayISO()

  // "Tap a day to log" — one editor for the selected day; the month behind it
  // as a readable list, never thirty copies of the controls.
  const [selected, setSelected] = useState(() => (days.includes(today) ? today : days[0]))
  const sel = days.includes(selected) ? selected : days[0]
  const selEntry = data.cycle.find((x) => x.date === sel)

  // Orientation, derived from the log. All four are null until the log can
  // answer — a fake "day 0" would be the count?x:0 trap.
  const day = cycleDay(data.cycle, today)
  const length = avgCycleLength(data.cycle)
  const phase = day != null ? phaseOf(day, length) : null
  const nextPeriod = nextPeriodEstimate(data.cycle, today)

  const chartData = days.map((d) => {
    const c = data.cycle.find((x) => x.date === d)
    return { day: Number(d.slice(8)), temp: c?.temp }
  })

  function toggleFlag(date: string, flag: string) {
    const cur = data.cycle.find((c) => c.date === date)?.flags ?? []
    const next = cur.includes(flag) ? cur.filter((f) => f !== flag) : [...cur, flag]
    setCycle(date, { flags: next })
  }

  /** One compact row per day. Period days carry the red wash so the month
   *  reads like a heatmap — where the period fell is visible from across the
   *  room, which is the one question a cycle calendar exists to answer. */
  const dayRow = (d: string) => {
    const c = data.cycle.find((x) => x.date === d)
    const isToday = d === today
    const isSel = d === sel
    const isPeriod = (c?.flags ?? []).includes('period')
    return (
      <li key={d}>
        <button
          onClick={() => setSelected(d)}
          aria-current={isToday ? 'date' : undefined}
          className="flex w-full items-center gap-3 border-b border-line px-2 py-1.5 text-left text-label hover:bg-ink-2"
          style={isSel ? { background: cat('mauve') + '22' } : isPeriod ? { background: cat('red') + '22' } : undefined}
        >
          <span className={`w-6 num ${isToday ? 'font-semibold text-fg-1' : 'text-fg-2'}`}>{Number(d.slice(8))}</span>
          <span className="num w-16 text-fg-1">{c?.temp != null ? `${c.temp}°` : ''}</span>
          <span className="flex items-center gap-1">
            {FLAGS.filter((f) => (c?.flags ?? []).includes(f.id)).map((f) => (
              <span key={f.id}>
                <span aria-hidden className="inline-block h-2 w-2 rounded-[2px]" style={{ background: cat(f.color) }} />
                <span className="sr-only">{f.id}</span>
              </span>
            ))}
          </span>
        </button>
      </li>
    )
  }

  return (
    <Page className="gap-0 sm:gap-0">
      <Card band title="Daily entry" subtitle="Tap a day to log temperature and flags">
        {/* Where the log says you are. Estimates by construction — the phase
            and the next-period date lean on the personal average — and worded
            as such. Nothing renders until a period day anchors the count. */}
        {day != null && phase && (
          <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-body text-fg-1">
            <span>Cycle day <span className="num font-medium">{day}</span></span>
            <Pill color={phase.color} size="micro" className="px-2">{phase.label} · estimate</Pill>
            {nextPeriod && <span className="text-label text-fg-2">next period ~{prettyDay(nextPeriod)}{length ? ` · ${length}-day avg` : ''}</span>}
          </p>
        )}

        {/* The selected day's editor — the only place controls render. */}
        <div className="mb-3 border border-line bg-ink-0 p-3">
          <p className="mb-2 text-body font-medium text-fg-1">
            {prettyDay(sel)}
            {sel === today && <span className="ml-2 text-label font-normal text-fg-2">today</span>}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="number"
              step="0.1"
              value={selEntry?.temp ?? ''}
              onChange={(e) => setCycle(sel, { temp: e.target.value ? Number(e.target.value) : undefined })}
              placeholder={`°${unit}`}
              aria-label={`Basal temperature on ${prettyDay(sel)} (°${unit})`}
              className="w-24 py-1"
            />
            {FLAGS.map((f) => {
              const on = (selEntry?.flags ?? []).includes(f.id)
              return (
                <button
                  key={f.id}
                  onClick={() => toggleFlag(sel, f.id)}
                  aria-pressed={on}
                  className="rounded-none px-2 py-1 text-label"
                  style={{
                    background: on ? cat(f.color) : cat('surface0'),
                    color: on ? onAccent(cat(f.color)) : cat('subtext0'),
                  }}
                >
                  {f.id}
                </button>
              )
            })}
          </div>
        </div>

        {/* The month in two halves, side by side — days 1–15 and 16–end. One
            31-row column made the reader scroll to compare the start of the
            month with the end of it; split, a whole cycle's shape (period
            early, PMS late) fits one glance. Stacks back to one column on a
            phone. */}
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          <div>
            <p className="mb-1 border-b border-line pb-1 text-micro text-fg-2">Days 1–15</p>
            <ul>{days.slice(0, 15).map(dayRow)}</ul>
          </div>
          <div>
            <p className="mb-1 border-b border-line pb-1 text-micro text-fg-2">Days 16–{days.length}</p>
            <ul>{days.slice(15).map(dayRow)}</ul>
          </div>
        </div>
      </Card>

      <Card band
        title="Cycle & temperature"
        subtitle="A private, neutral chart. Read “Taking Charge of Your Fertility” to interpret."
      >
        <p className="mb-2 text-label text-fg-2">{prettyMonth(ym)} · basal temperature (°{unit})</p>
        <div className="h-56 w-full" role="img" aria-label={`Line chart of basal temperature across ${prettyMonth(ym)} (°${unit})`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid stroke={cat('surface0')} strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke={cat('overlay0')} fontSize={11} />
              <YAxis domain={['auto', 'auto']} stroke={cat('overlay0')} fontSize={11} />
              <Tooltip contentStyle={rechartsTooltip()} />
              <Line type="monotone" dataKey="temp" stroke={cat('maroon')} dot={{ r: 2 }} connectNulls strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ── Guide · the same shelf the training pages keep: what the phases
          are, how to take a temperature the chart can use, what to log.
          Static reference (lib/cycleGuide, counts pinned by its test). ── */}
      <section className="mt-4 flex flex-col gap-3">
        <h2 className="text-label text-fg-2">Guide</h2>

        <CollapsibleSection
          variant="quiet" defaultOpen={false} stickyKey="cycle.phases"
          icon={Flower} color="mauve"
          title="The four phases"
          subtitle="What each one is, how it can feel, what helps"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {CYCLE_PHASES.map((ph) => (
              <div key={ph.id} className="rounded-none border border-line bg-ink-0 p-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-body font-medium" style={{ color: cat(ph.color) }}>{ph.name}</span>
                  <Pill color={ph.color} size="micro" className="px-2">{ph.days}</Pill>
                </div>
                <p className="text-label text-fg-2">{ph.what}</p>
                <p className="mt-1 text-label text-fg-2"><span className="font-medium text-fg-1">How it can feel:</span> {ph.feel}</p>
                <p className="mt-1 text-label text-fg-2"><span className="font-medium" style={{ color: cat('green') }}>Helps:</span> {ph.tip}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-label text-fg-2">Day ranges assume the textbook 28 days — 21–35 is a normal range, and the estimate above uses your logged average once two periods anchor it.</p>
        </CollapsibleSection>

        <CollapsibleSection
          variant="quiet" defaultOpen={false} stickyKey="cycle.bbt"
          icon={Thermometer} color="maroon"
          title="Basal temperature, done right"
          subtitle="Five rules that make the chart readable"
        >
          <ol className="space-y-1.5">
            {BBT_RULES.map((r, i) => (
              <li key={i} className="flex gap-2 text-label text-fg-2">
                <span className="shrink-0 font-medium text-mauve">{i + 1}.</span> {r}
              </li>
            ))}
          </ol>
        </CollapsibleSection>

        <CollapsibleSection
          variant="quiet" defaultOpen={false} stickyKey="cycle.logging"
          icon={NotePencil} color="teal"
          title="What to log & why"
          subtitle="The flags above, and what each one buys you"
        >
          <ul className="grid gap-2 sm:grid-cols-2">
            {TRACKING_TIPS.map((t) => (
              <li key={t.what} className="rounded-none border border-line bg-ink-0 p-2.5">
                <p className="text-body font-medium text-fg-1">{t.what}</p>
                <p className="text-label text-fg-2">{t.why}</p>
              </li>
            ))}
          </ul>
        </CollapsibleSection>

        <p className="inline-flex items-start gap-1.5 rounded-none bg-red/10 p-2 text-label text-fg-2">
          <Icon as={ShieldWarning} size="sm" className="mt-0.5 shrink-0 text-red" /> {CYCLE_DISCLAIMER}
        </p>
      </section>
    </Page>
  )
}
