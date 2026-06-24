import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useJournal } from '../store'
import { monthDays, prettyMonth } from '../lib/date'
import { Card, Input } from '../components/ui'
import { Page, useCursor } from '../components/shell/Page'
import { cat } from '../lib/colors'

const FLAGS = ['period', 'spotting', 'ovulation', 'pms', 'cramps']

export function Cycle() {
  const { data, setCycle } = useJournal()
  const { month: ym } = useCursor()
  const unit = data.settings.tempUnit
  const days = monthDays(ym)

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
    <Page>
      <Card title="Daily entry" subtitle="Tap a day to log temperature and flags">
        <div className="overflow-x-auto">
          <table className="text-xs">
            <tbody>
              {days.map((d) => {
                const c = data.cycle.find((x) => x.date === d)
                return (
                  <tr key={d} className="border-b border-surface0">
                    <td className="py-1 pr-3 text-overlay0">{Number(d.slice(8))}</td>
                    <td className="pr-3">
                      <Input
                        type="number"
                        step="0.1"
                        value={c?.temp ?? ''}
                        onChange={(e) => setCycle(d, { temp: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder={`°${unit}`}
                        className="w-20 py-1"
                      />
                    </td>
                    <td className="flex flex-wrap gap-1 py-1">
                      {FLAGS.map((f) => {
                        const on = (c?.flags ?? []).includes(f)
                        return (
                          <button
                            key={f}
                            onClick={() => toggleFlag(d, f)}
                            className="rounded-full px-2 py-0.5"
                            style={{ background: on ? cat('red') : cat('surface0'), color: on ? cat('crust') : cat('subtext0') }}
                          >
                            {f}
                          </button>
                        )
                      })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title="Cycle & temperature"
        subtitle="A private, neutral chart. Read “Taking Charge of Your Fertility” to interpret."
      >
        <p className="mb-2 text-xs text-overlay0">{prettyMonth(ym)} · basal temperature (°{unit})</p>
        <div className="h-56 w-full" role="img" aria-label={`Line chart of basal temperature across ${prettyMonth(ym)} (°${unit})`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid stroke={cat('surface0')} strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke={cat('overlay0')} fontSize={11} />
              <YAxis domain={['auto', 'auto']} stroke={cat('overlay0')} fontSize={11} />
              <Tooltip contentStyle={{ background: '#181825', border: '1px solid #313244', borderRadius: 8, color: '#cdd6f4' }} />
              <Line type="monotone" dataKey="temp" stroke={cat('maroon')} dot={{ r: 2 }} connectNulls strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </Page>
  )
}
