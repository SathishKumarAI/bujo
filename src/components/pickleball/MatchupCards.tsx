import { Users, MapPin, Swords, Gauge } from 'lucide-react'
import { Card, Pill } from '../ui'
import { cat } from '../../lib/colors'
import type { PartnerStat, VenueStat, OpponentRecord, LevelBucket } from '../../lib/pickleball'

/** Partner chemistry · win rate by doubles partner. */
export function PartnerChemistryCard({ partners }: { partners: PartnerStat[] }) {
  return (
    <Card title={<span className="inline-flex items-center gap-2"><Users size={18} className="text-mauve" /> Partner chemistry</span>} subtitle="Win rate by doubles partner, most-played first" collapsible>
      <ul className="space-y-3">
        {partners.map((p) => (
          <li key={p.partner}>
            <div className="mb-1 flex items-baseline justify-between text-body">
              <span className="min-w-0 truncate text-fg-1">{p.partner}</span>
              <span className="shrink-0 text-fg-2">{p.sessions} {p.sessions === 1 ? 'session' : 'sessions'} · {p.games} games · <span style={{ color: cat('green') }}>{p.winPct}%</span></span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-ink-2" role="img" aria-label={`${p.partner} win rate ${p.winPct}% over ${p.games} games`}>
              <div className="h-full rounded-full" style={{ width: `${p.winPct}%`, background: cat('mauve') }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-caption text-fg-2">Add a partner when logging a doubles session to track your chemistry.</p>
    </Card>
  )
}

/** Courts & venues · games & win % by location. */
export function VenuesCard({ venues }: { venues: VenueStat[] }) {
  return (
    <Card title={<span className="inline-flex items-center gap-2"><MapPin size={18} className="text-teal" /> Courts &amp; venues</span>} subtitle="Games &amp; win % by where you play" collapsible>
      <ul className="divide-y divide-surface0">
        {venues.map((v) => (
          <li key={v.location} className="flex items-center justify-between gap-2 py-2 text-body">
            <span className="min-w-0 truncate text-fg-1">{v.location}</span>
            <span className="flex shrink-0 items-center gap-2 text-fg-2">
              {v.sessions} {v.sessions === 1 ? 'visit' : 'visits'} · {v.games} games
              <Pill color="teal" size="micro" className="px-2">{v.winPct}%</Pill>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-caption text-fg-2">Set a Location when logging to see your home-court advantage.</p>
    </Card>
  )
}

/** Rivalry record book · head-to-head game record by opponent. */
export function RivalryRecordCard({ opponents }: { opponents: OpponentRecord[] }) {
  return (
    <Card title={<span className="inline-flex items-center gap-2"><Swords size={18} className="text-red" /> Rivalry record book</span>} subtitle="Head-to-head game record by opponent" collapsible>
      <ul className="divide-y divide-surface0">
        {opponents.map((o) => (
          <li key={o.opponent} className="flex items-center justify-between gap-2 py-2 text-body">
            <span className="min-w-0 truncate text-fg-1">vs {o.opponent} <span className="text-fg-2">· {o.sessions} {o.sessions === 1 ? 'meeting' : 'meetings'}</span></span>
            <span className="flex shrink-0 items-center gap-2">
              <span><span style={{ color: cat('green') }}>{o.gamesWon}</span>–<span style={{ color: cat('red') }}>{o.gamesLost}</span></span>
              <Pill color={o.diff > 0 ? 'green' : o.diff < 0 ? 'red' : 'overlay0'} size="micro" className="px-2">
                {o.diff > 0 ? `+${o.diff}` : o.diff}
              </Pill>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-caption text-fg-2">Name your Opponent(s) when logging to build a head-to-head book.</p>
    </Card>
  )
}

/** Performance by opponent level (#478). */
export function LevelMatchupCard({ matchup }: { matchup: LevelBucket[] }) {
  return (
    <Card title={<span className="inline-flex items-center gap-2"><Gauge size={18} className="text-yellow" /> Performance by opponent level</span>} subtitle="Win % vs stronger, similar &amp; weaker fields" collapsible>
      <ul className="space-y-3">
        {matchup.map((m) => (
          <li key={m.bucket}>
            <div className="mb-1 flex justify-between text-body">
              <span className="text-fg-1">{m.label}</span>
              <span className="text-fg-2">{m.games} games · <span style={{ color: cat('green') }}>{m.winPct}%</span></span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-ink-2" role="img" aria-label={`${m.label} win rate ${m.winPct}% over ${m.games} games`}>
              <div className="h-full rounded-full" style={{ width: `${m.winPct}%`, background: cat(m.bucket === 'stronger' ? 'red' : m.bucket === 'weaker' ? 'green' : 'yellow') }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-caption text-fg-2">Set a Level when logging to see a truer skill signal than raw win %.</p>
    </Card>
  )
}
