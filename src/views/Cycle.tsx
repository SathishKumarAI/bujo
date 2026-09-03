import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useState } from 'react'
import { useJournal } from '../store'
import { monthDays, prettyDay, prettyMonth, todayISO } from '../lib/date'
import { Card, Input } from '../components/ui'
import { Page, useCursor } from '../components/shell/Page'
import { cat, rechartsTooltip, onAccent } from '../lib/colors'

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

  // "Tap a day to log" — the copy was always day-first, but the card rendered
  // every day's editor at once: 30 rows × (a temp input + five toggle chips)
  // is 180 controls, a wall in which today is indistinguishable from the 3rd.
  // One editor for the selected day, and the month behind it as a compact,
  // readable list. Selection is view state, not journal state.
  const [selected, setSelected] = useState(() => (days.includes(today) ? today : days[0]))
  // The month cursor can move under the selection; snap back into the month.
  const sel = days.includes(selected) ? selected : days[0]
  const selEntry = data.cycle.find((x) => x.date === sel)

  const chartData = days.map((d) => {
    const c = data.cycle.find((x) => x.date === d)
    return { day: Number(d.slice(8)), temp: c?.temp }
  })

  function toggleFlag(date: string, flag: string) {
    const cur = data.cycle.find((c) => c.date === date)?.flags ?? []
    const next = cur.includes(flag) ? cur.filter((f) => f !== flag) : [...cur, flag]
    setCycle(date, { flags: next })
  }

  return (
    <Page className="gap-0 sm:gap-0">
      <Card band title="Daily entry" subtitle="Tap a day to log temperature and flags">
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

        {/* The month, one compact row per day. A row is a button that moves the
            editor; logged values render as text and colour-coded dots (named
            for assistive tech), not as thirty copies of the controls. */}
        <ul className="max-h-96 overflow-y-auto">
          {days.map((d) => {
            const c = data.cycle.find((x) => x.date === d)
            const isToday = d === today
            const isSel = d === sel
            return (
              <li key={d}>
                <button
                  onClick={() => setSelected(d)}
                  aria-current={isToday ? 'date' : undefined}
                  className="flex w-full items-center gap-3 border-b border-line px-2 py-1.5 text-left text-label hover:bg-ink-2"
                  style={isSel ? { background: cat('mauve') + '22' } : undefined}
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
          })}
        </ul>
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
    </Page>
  )
}
