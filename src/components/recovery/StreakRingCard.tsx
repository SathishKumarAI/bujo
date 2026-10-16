import type { ReactNode } from 'react'
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
export function StreakRingCard({ stats, relapsedToday, startedOn, bare = false, aside }: {
  stats: Stats
  relapsedToday: boolean
  startedOn: string
  /**
   * Render without the `Card` wrapper, for a host that already is one.
   *
   * Zone 1 is a bordered block, and this inside it was a card in a card with
   * two borders and two paddings. It is also where the ring now LIVES: the
   * hero and the `StatBar` above it were saying the same three things — days
   * clean, personal best, next milestone — once as a 160px ring and once as a
   * row of figures, in two different zones. Reported as "get them all into one
   * card on the left side, I need to waste the space", and the duplication is
   * the reason the space was being wasted.
   */
  bare?: boolean
  /**
   * Rendered inside the ring's own text column, not under the whole hero.
   *
   * The facts that survived the merge sat in a full-width row beneath, so zone
   * 1 was `ring (128) + text (150) + facts (56)` stacked — **280px** — while
   * the ring's right-hand column had room to spare at 1,180px wide. Inside, the
   * block is `max(ring, text + facts)` instead of their sum.
   */
  aside?: ReactNode
}) {
  const next = stats.next
  const ringColor = relapsedToday ? cat('red') : cat('mauve')
  const body = (<>
      {/* 128px on a phone, 160 from `sm`. The ring stacks above its text there,
          so every pixel of it is a pixel of scroll in front of the act below —
          and the act below is the one this page most wants to be frequent. 32px
          of hero buys 32px of headroom for "Log this urge" above the fold, at a
          size that is still the largest thing on the screen. The SVG fills its
          box rather than carrying a second copy of the number. */}
      {/* BESIDE, NOT ABOVE, in the zone-1 hero.

          `flex-col` until `sm` is right for a card in a 424px act column and
          wrong for the top bar: stacking the ring over its text made the block
          **338px on a 390px phone**, which is 40% of the viewport before you
          have read a word of the record. Side by side at every width, with a
          112px ring on a narrow screen, it is a strip. The card form keeps the
          stack — it has a column, not a page width. */}
      <div className={bare
        ? 'flex flex-row items-center gap-3 sm:gap-5'
        : 'flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5'}>
        <div className={`relative grid shrink-0 place-items-center ${bare ? 'h-28 w-28 sm:h-32 sm:w-32' : 'h-32 w-32 sm:h-40 sm:w-40'}`}>
          <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
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
        <div className={bare ? 'min-w-0 flex-1 text-left' : 'flex-1 text-center sm:text-left'}>
          <div className="inline-flex items-center gap-1.5 text-body text-fg-1"><Icon as={Shield} size="sm" style={{ color: ringColor }} /> Your main streak · since {prettyDay(startedOn)}</div>
          {/* The "other urges are logged below" sentence is gone in the zone-1
              hero: every tracked thing now has its OWN streak card in the
              review, so the page shows what this used to have to explain. It
              stays on the card form, which has no such neighbour. */}
          {!bare && <p className="mt-0.5 text-label text-fg-2">The ring &amp; ladder track this one streak. Other urges (smoking, scrolling…) are logged + planned below.</p>}
          {relapsedToday && (
            <div className="mt-1.5 rounded-card p-2 text-left text-label" style={{ background: cat('red') + '12', border: `1px solid ${cat('red')}44` }}>
              <span className="inline-flex items-center gap-1 font-medium" style={{ color: onRaised('red') }}><Icon as={X} size="sm" /> Reset today · and that’s okay.</span>
              <p className="mt-0.5 text-fg-1">You didn’t lose everything: your <strong style={{ color: onRaised('green') }}>{stats.totalClean} total clean days</strong> and <strong style={{ color: onRaised('peach') }}>{stats.best}-day best</strong> are kept. One slip is a stumble, not a restart · log the reason below and keep going.</p>
            </div>
          )}
          {next ? (
            <>
              <p className={`${bare ? 'mt-2' : 'mt-3'} text-body text-fg-2`}>
                Next: <span className="font-medium" style={{ color: onRaised('teal') }}>{next.label}</span> · <span className="text-fg-2">{stats.daysToNext} day{stats.daysToNext === 1 ? '' : 's'} to go</span>
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-pill bg-ink-2">
                <div className="h-full rounded-pill transition-[width] duration-500" style={{ width: `${stats.progressPct}%`, background: cat('teal') }} />
              </div>
              {!bare && <p className="mt-2 text-label text-fg-2 italic">“{next.benefit}”</p>}
            </>
          ) : (
            <p className="mt-3 text-body" style={{ color: onRaised('peach') }}>Every milestone cleared. You’re writing your own ladder now.</p>
          )}
          {aside}
        </div>
      </div>
  </>)
  return bare ? body : <Card hideInfo className="glow-mauve">{body}</Card>
}
