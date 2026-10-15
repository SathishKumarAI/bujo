import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useJournal } from '../../store'
import { Card, Empty } from '../ui'
import { PanelGrid } from './PanelGrid'
import { CalendarHeatmap } from '../page'
import { cat, onRaised, rechartsTooltip } from '../../lib/colors'
import { todayISO } from '../../lib/date'
import { pickleTotals, winRateSeries, weeklyGames, formatStats, cumulativeGames, gamesByDay, monthlyGames } from '../../lib/pickleball'
import { Facet } from './Facet'

const tip = rechartsTooltip

/**
 * The `trends` panel - seven charts under two sub-sections, Winning and Volume.
 *
 * Its own file because `Review.tsx` was 790 lines and this is 130 of them with
 * one subject: a chart is edited for its axes and its colours, never at the
 * same time as a rail row is added. The `Facet` wrappers are the sub-section
 * filter; `active` is passed in rather than read from a context so the chip row
 * and the cards cannot drift apart.
 */
export function TrendCharts({ activeFacet }: { activeFacet: string | null }) {
  const { data } = useJournal()
  const today = todayISO()
  const all = pickleTotals(data)
  const trend = winRateSeries(data)
  const weeks = weeklyGames(data, 8, today)
  const wl = [{ name: 'Won', value: all.gamesWon, color: 'green' }, { name: 'Lost', value: all.gamesLost, color: 'red' }]
  const formats = formatStats(data)
  const cum = cumulativeGames(data)
  const months = monthlyGames(data, 6, today)
  const monthsPlayed = months.some((m) => m.games > 0)
  /* Through the Body cluster's `CalendarHeatmap`: a real <table> with weekday
     row headers and per-cell focus, bucketed by QUARTILE over the non-zero
     days. The grid it replaced scaled linearly against the busiest day, so one
     tournament Saturday flattened every ordinary session to the lightest step -
     the shape of the habit was the one thing the visual could not show. */
  const heat = [...gamesByDay(data)].map(([date, value]) => ({ date, value }))

  return (
    <PanelGrid>
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
    </PanelGrid>
  )
}
