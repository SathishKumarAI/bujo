import { Activity, Flame, Trophy, TrendingUp, TrendingDown, Minus, Gauge, Award, HeartPulse } from 'lucide-react'
import { Card, StatTile } from '../ui'
import { cat } from '../../lib/colors'
import type { RollingForm, WinRateForecast, PickleMilestone, RpeLoad } from '../../lib/pickleball'

/** Recent form / momentum strip with win-streak chips (#323). */
export function RecentFormCard({ form, streaks }: { form: RollingForm; streaks: { longest: number; current: number } }) {
  return (
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
  )
}

/** Win-rate forecast & rating readiness (#133). */
export function WinRateForecastCard({ forecast }: { forecast: WinRateForecast }) {
  return (
    <Card title={<span className="inline-flex items-center gap-2"><TrendingUp size={18} className="text-green" /> Win-rate forecast</span>} subtitle="Projected from your session win-% trend">
      <div className="grid grid-cols-3 gap-2">
        <StatTile compact label="Current win %" value={`${forecast.current}%`} color="green" />
        <StatTile compact label="Projected" value={forecast.projected != null ? `${forecast.projected}%` : '—'} color={forecast.direction === 'up' ? 'green' : forecast.direction === 'down' ? 'red' : 'overlay0'} icon={forecast.direction === 'up' ? <TrendingUp size={14} /> : forecast.direction === 'down' ? <TrendingDown size={14} /> : <Minus size={14} />} />
        <StatTile compact label="Per-session" value={`${forecast.slope > 0 ? '+' : ''}${forecast.slope}`} color={forecast.slope > 0 ? 'green' : forecast.slope < 0 ? 'red' : 'overlay0'} />
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-surface0 pt-3">
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: cat(forecast.readiness === 'ready' ? 'green' : forecast.readiness === 'consolidating' ? 'yellow' : 'sky') + '22', color: cat(forecast.readiness === 'ready' ? 'green' : forecast.readiness === 'consolidating' ? 'yellow' : 'sky') }}>
          <Gauge size={13} /> {forecast.readiness === 'ready' ? 'Ready to level up' : forecast.readiness === 'consolidating' ? 'Consolidating' : 'Building'}
        </span>
        <p className="text-xs text-overlay1">{forecast.readiness === 'ready' ? 'You’re winning enough to test a higher level.' : forecast.readiness === 'consolidating' ? 'Holding ~50% — keep grooving consistency.' : 'Stack wins; aim to nudge your trend upward.'}</p>
      </div>
    </Card>
  )
}

/** Pickleball milestones progress bars (#161). */
export function MilestonesCard({ milestones }: { milestones: PickleMilestone[] }) {
  return (
    <Card title={<span className="inline-flex items-center gap-2"><Award size={18} className="text-yellow" /> Milestones</span>} subtitle="Next badges to unlock from your sessions" collapsible>
      <ul className="space-y-3">
        {milestones.map((m) => (
          <li key={m.id}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-subtext1">{m.label}{m.done && <span className="ml-1.5 text-green">✓</span>}</span>
              <span className="text-overlay1">{Math.min(m.current, m.target)} / {m.target}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface0" role="img" aria-label={`${m.label}: ${m.current} of ${m.target}`}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (m.current / m.target) * 100)}%`, background: cat(m.done ? 'green' : 'yellow') }} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/** Session intensity / training load from RPE (#566). */
export function SessionIntensityCard({ load }: { load: RpeLoad }) {
  return (
    <Card title={<span className="inline-flex items-center gap-2"><HeartPulse size={18} className="text-red" /> Session intensity</span>} subtitle={`From RPE on ${load.sessions} ${load.sessions === 1 ? 'session' : 'sessions'}`} collapsible>
      <div className="grid grid-cols-3 gap-2">
        <StatTile compact label="Avg RPE" value={load.avg} color={load.label === 'very hard' ? 'red' : load.label === 'hard' ? 'peach' : load.label === 'moderate' ? 'yellow' : 'green'} />
        <StatTile compact label="Hardest" value={load.hardest} color="red" />
        <StatTile compact label="7-day load" value={load.weekLoad} color="mauve" />
      </div>
      <p className="mt-3 text-xs text-overlay1">Typical effort feels <span style={{ color: cat(load.label === 'very hard' ? 'red' : load.label === 'hard' ? 'peach' : load.label === 'moderate' ? 'yellow' : 'green') }}>{load.label}</span>. Load = RPE × games over the last 7 days — watch for spikes after rest. Log RPE 1–10 per session to track it.</p>
    </Card>
  )
}
