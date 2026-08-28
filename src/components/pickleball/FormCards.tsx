import { Flame, Gauge, Heartbeat, Medal, Minus, PersonSimpleRun, TrendDown, TrendUp, Trophy } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card, Pill, StatTile } from '../ui'
import { cat, washStyle } from '../../lib/colors'
import type { RollingForm, WinRateForecast, PickleMilestone, RpeLoad } from '../../lib/pickleball'

/** Recent form / momentum strip with win-streak chips (#323). */
export function RecentFormCard({ form, streaks }: { form: RollingForm; streaks: { longest: number; current: number } }) {
  return (
    <Card band title={<span className="inline-flex items-center gap-2"><Icon as={PersonSimpleRun} size="md" className="text-sky" /> Recent form</span>} subtitle={`Last ${form.results.length} ${form.results.length === 1 ? 'session' : 'sessions'}, newest first`}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1" role="img" aria-label={`Recent form: ${form.wins} won, ${form.losses} lost, ${form.draws} drawn`}>
          {form.results.map((r, i) => {
            const c = r === 'W' ? 'green' : r === 'L' ? 'red' : 'overlay0'
            return <span key={i} className="grid h-6 w-6 place-items-center rounded-none text-caption font-medium" style={washStyle(c)}>{r}</span>
          })}
        </div>
        <span className="text-body text-fg-2"><span style={{ color: cat('green') }}>{form.wins}W</span> · <span style={{ color: cat('red') }}>{form.losses}L</span>{form.draws ? ` · ${form.draws}D` : ''} · <span style={{ color: cat('green') }}>{form.winPct}%</span></span>
        {form.momentum !== 'flat' && (
          <Pill color={form.momentum === 'up' ? 'green' : 'red'} size="caption" className="ml-auto">
            {form.momentum === 'up' ? <Icon as={TrendUp} size="sm" /> : <Icon as={TrendDown} size="sm" />}
            {form.momentum === 'up' ? 'Trending up' : 'In a slump'}
          </Pill>
        )}
        {form.momentum === 'flat' && <span className="ml-auto inline-flex items-center gap-1 text-caption text-fg-2"><Icon as={Minus} size="sm" /> Steady</span>}
      </div>
      {(streaks.longest > 0 || streaks.current > 0) && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3 text-label text-fg-2">
          {streaks.current > 0 && <Pill color="peach"><Icon as={Flame} size="sm" /> {streaks.current}-session win streak</Pill>}
          <Pill color="mauve"><Icon as={Trophy} size="sm" /> Longest: {streaks.longest}</Pill>
        </div>
      )}
    </Card>
  )
}

/** Win-rate forecast & rating readiness (#133). */
export function WinRateForecastCard({ forecast }: { forecast: WinRateForecast }) {
  return (
    <Card band title={<span className="inline-flex items-center gap-2"><Icon as={TrendUp} size="md" className="text-green" /> Win-rate forecast</span>} subtitle="Projected from your session win-% trend">
      <div className="grid grid-cols-3 gap-2">
        <StatTile compact label="Current win %" value={`${forecast.current}%`} />
        <StatTile compact label="Projected" value={forecast.projected != null ? `${forecast.projected}%` : '—'} color={forecast.direction === 'up' ? 'green' : forecast.direction === 'down' ? 'red' : 'overlay0'} icon={forecast.direction === 'up' ? <Icon as={TrendUp} size="sm" /> : forecast.direction === 'down' ? <Icon as={TrendDown} size="sm" /> : <Icon as={Minus} size="sm" />} />
        <StatTile compact label="Per-session" value={`${forecast.slope > 0 ? '+' : ''}${forecast.slope}`} />
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
        <Pill color={forecast.readiness === 'ready' ? 'green' : forecast.readiness === 'consolidating' ? 'yellow' : 'sky'} className="px-2.5 py-1 font-medium">
          <Icon as={Gauge} size="sm" /> {forecast.readiness === 'ready' ? 'Ready to level up' : forecast.readiness === 'consolidating' ? 'Consolidating' : 'Building'}
        </Pill>
        <p className="text-label text-fg-2">{forecast.readiness === 'ready' ? 'You’re winning enough to test a higher level.' : forecast.readiness === 'consolidating' ? 'Holding ~50% — keep grooving consistency.' : 'Stack wins; aim to nudge your trend upward.'}</p>
      </div>
    </Card>
  )
}

/** Pickleball milestones progress bars (#161). */
export function MilestonesCard({ milestones }: { milestones: PickleMilestone[] }) {
  return (
    <Card band title={<span className="inline-flex items-center gap-2"><Icon as={Medal} size="md" className="text-yellow" /> Milestones</span>} subtitle="Next badges to unlock from your sessions" collapsible>
      <ul className="space-y-3">
        {milestones.map((m) => (
          <li key={m.id}>
            <div className="mb-1 flex justify-between text-body">
              <span className="text-fg-1">{m.label}{m.done && <span className="ml-1.5 text-green">✓</span>}</span>
              <span className="text-fg-2">{Math.min(m.current, m.target)} / {m.target}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-none bg-ink-2" role="img" aria-label={`${m.label}: ${m.current} of ${m.target}`}>
              <div className="h-full rounded-none" style={{ width: `${Math.min(100, (m.current / m.target) * 100)}%`, background: cat(m.done ? 'green' : 'yellow') }} />
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
    <Card band title={<span className="inline-flex items-center gap-2"><Icon as={Heartbeat} size="md" className="text-red" /> Session intensity</span>} subtitle={`From RPE on ${load.sessions} ${load.sessions === 1 ? 'session' : 'sessions'}`} collapsible>
      <div className="grid grid-cols-3 gap-2">
        <StatTile compact label="Avg RPE" value={load.avg} />
        <StatTile compact label="Hardest" value={load.hardest} />
        <StatTile compact label="7-day load" value={load.weekLoad} />
      </div>
      <p className="mt-3 text-label text-fg-2">Typical effort feels <span style={{ color: cat(load.label === 'very hard' ? 'red' : load.label === 'hard' ? 'peach' : load.label === 'moderate' ? 'yellow' : 'green') }}>{load.label}</span>. Load = RPE × games over the last 7 days — watch for spikes after rest. Log RPE 1–10 per session to track it.</p>
    </Card>
  )
}
