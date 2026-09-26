import { Shield, X } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card } from '../ui'
import { cat, onRaised } from '../../lib/colors'
import { prettyDay } from '../../lib/date'
import type { streakStats } from '../../lib/streak'

type Stats = ReturnType<typeof streakStats>

// SVG ring geometry.
const R = 54
const C = 2 * Math.PI * R

/**
 * The hero ring · days clean against the next milestone.
 *
 * Stays a card and stays first on this page: the streak IS the object here, and
 * the ring is the only accent-filled thing in zone 2 — there is no primary
 * button competing with it, because logging an urge and logging a reset are two
 * different commitments and neither outranks the other.
 */
export function StreakRingCard({ stats, relapsedToday, startedOn }: {
  stats: Stats
  relapsedToday: boolean
  startedOn: string
}) {
  const next = stats.next
  const ringColor = relapsedToday ? cat('red') : cat('mauve')
  return (
    <Card band hideInfo className="glow-mauve">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative grid h-40 w-40 shrink-0 place-items-center">
          <svg width="160" height="160" viewBox="0 0 128 128" className="-rotate-90">
            <circle cx="64" cy="64" r={R} fill="none" stroke={cat('surface0')} strokeWidth="9" />
            <circle cx="64" cy="64" r={R} fill="none" stroke={ringColor} strokeWidth="9" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C - (C * stats.progressPct) / 100}
              style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1)' }} />
          </svg>
          <div className="absolute text-center">
            <div className="text-display font-medium leading-none" style={{ color: ringColor }}>{stats.current}</div>
            <div className="mt-1 text-caption tracking-wide text-fg-2 uppercase">days clean</div>
          </div>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 text-body text-fg-1"><Icon as={Shield} size="sm" style={{ color: ringColor }} /> Your main streak · since {prettyDay(startedOn)}</div>
          <p className="mt-0.5 text-label text-fg-2">The ring &amp; ladder track this one streak. Other urges (smoking, scrolling…) are logged + planned below.</p>
          {relapsedToday && (
            <div className="mt-1.5 rounded-card p-2 text-left text-label" style={{ background: cat('red') + '12', border: `1px solid ${cat('red')}44` }}>
              <span className="inline-flex items-center gap-1 font-medium" style={{ color: onRaised('red') }}><Icon as={X} size="sm" /> Reset today · and that’s okay.</span>
              <p className="mt-0.5 text-fg-1">You didn’t lose everything: your <strong style={{ color: onRaised('green') }}>{stats.totalClean} total clean days</strong> and <strong style={{ color: onRaised('peach') }}>{stats.best}-day best</strong> are kept. One slip is a stumble, not a restart · log the reason below and keep going.</p>
            </div>
          )}
          {next ? (
            <>
              <p className="mt-3 text-body text-fg-2">
                Next: <span className="font-medium" style={{ color: onRaised('teal') }}>{next.label}</span> · <span className="text-fg-2">{stats.daysToNext} day{stats.daysToNext === 1 ? '' : 's'} to go</span>
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-pill bg-ink-2">
                <div className="h-full rounded-pill transition-[width] duration-500" style={{ width: `${stats.progressPct}%`, background: cat('teal') }} />
              </div>
              <p className="mt-2 text-label text-fg-2 italic">“{next.benefit}”</p>
            </>
          ) : (
            <p className="mt-3 text-body" style={{ color: onRaised('peach') }}>Every milestone cleared. You’re writing your own ladder now.</p>
          )}
        </div>
      </div>
    </Card>
  )
}
