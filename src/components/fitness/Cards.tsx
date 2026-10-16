import { CalendarBlank, CalendarCheck, ChartBar, Medal, SquaresFour } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card, StatTile } from '../ui'
import { BarList, type BarRow } from '../page'
import { onRaised } from '../../lib/colors'
import { prettyDay } from '../../lib/date'
import { displayDistance } from '../../lib/units'
import type { ActivityBest, ActivityShare, Cadence, Milestone, WeekLoad, WeekdayLoad } from '../../lib/fitnessReview'
import type { DistanceUnit } from '../../lib/types'

/**
 * The Fitness review's read-only cards.
 *
 * WHAT THIS FILE OWNS: how one aggregate from `lib/fitnessReview.ts` is drawn.
 * WHAT IT DOES NOT OWN: which card is on screen (`Review.tsx`), the arithmetic
 * (`lib/fitnessReview.ts`), or the record itself (`History.tsx`).
 *
 * Every comparison here is `BarList` rather than a grid of tiles, which is
 * `docs/REUSABLE-PATTERNS.md` §21 — seven weekday cells inside a 353px card
 * gave `100%` a 44px box and wrapped the week 4+3 on a phone. Every figure that
 * is grouped by something is a button into the sessions behind it (§20): the
 * cards are read-only and the rows under them are where Edit and × live.
 */

/* ── Volume ───────────────────────────────────────────────────────────────── */

/**
 * Minutes per seven-day block, the last block ending today.
 *
 * **It is scaled against the biggest block, and it carries no target**, which
 * is a correction of the first draft and the more interesting half of this
 * card. The obvious move was a three-step ramp against `fitnessGoalMin` — and
 * it put a red bar on a perfectly good week, because the two numbers are not
 * the same currency. `weeklyActiveMinutes` (the 150-minute target in zone 1,
 * in Goals and in `lib/coach.ts`) counts EVERY activity, lifting and
 * pickleball included; this card counts the sessions of ONE mode. On the demo
 * journal that is **578 minutes this week against a 123-minute bar** — a 4.7x
 * disagreement between two figures on one screen, where only the scope
 * differed. Same family as the recovery ledger dividing urges by minutes: both
 * sides of a comparison need the same currency, and a unit — or here a scope —
 * is part of it.
 *
 * So the subtitle names the scope, the bars compare the blocks with each
 * other, and the target stays in zone 1 where the number it judges is the one
 * it was set for.
 */
export function WeeklyLoadCard({ rows, scope }: {
  rows: WeekLoad[]
  /** What this mode's sessions are, for the subtitle — "Cardio sessions". */
  scope: string
}) {
  const max = Math.max(1, ...rows.map((r) => r.minutes))
  const bars: BarRow[] = rows.map((r) => ({
    // The weekday is dropped from the label: `prettyDay` gives "Fri, Aug 15",
    // which needs ~86px, and the label column is 56px — measured as eight rows
    // all reading "Fri, Aug…", a column of identical ellipses. The block always
    // starts on the same weekday anyway, so the weekday carries no information
    // here at all.
    label: prettyDay(r.start).replace(/^\w+,\s*/, ''),
    pct: (r.minutes / max) * 100,
    value: r.sessions > 0 ? `${r.minutes}m` : null,
    note: r.sessions > 0 ? `${r.sessions}×` : '',
    tone: 'teal',
    announce: `Week from ${prettyDay(r.start)}: ${r.minutes} minutes across ${r.sessions} ${r.sessions === 1 ? 'session' : 'sessions'}`,
  }))
  const trained = rows.filter((r) => r.sessions > 0).length
  return (
    <Card
      band
      title={<span className="inline-flex items-center gap-2"><Icon as={ChartBar} size="md" className="text-teal" /> Minutes per week</span>}
      subtitle={`${scope} only · seven-day blocks ending today · ${trained} of ${rows.length} with a session`}
      collapsible
    >
      <BarList rows={bars} labelWidth="w-14" />
    </Card>
  )
}

/** How regularly you train — and honest about not knowing yet. */
export function CadenceCard({ cadence, noun }: { cadence: Cadence; noun: string }) {
  const { avgGap, longestGap, daysSinceLast, daysTrained, activeWeeks, weeks, weekStreak } = cadence
  return (
    <Card
      band
      title={<span className="inline-flex items-center gap-2"><Icon as={CalendarCheck} size="md" className="text-green" /> Cadence</span>}
      subtitle="How regularly you get out"
      collapsible
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile compact label="Days trained" value={daysTrained} />
        <StatTile compact label={`Active wks / ${weeks}`} value={activeWeeks} />
        <StatTile compact label="Week streak" value={weekStreak} />
        {/* `—`, not 0. An average gap of zero would mean you trained twice on
            every day you trained at all; what it really means is that nothing
            has been logged, and the sentence below says which. */}
        <StatTile compact label="Avg gap" value={avgGap != null ? `${avgGap}d` : '—'} />
      </div>
      <p className="mt-3 text-label text-fg-2">
        {daysSinceLast == null
          ? `Nothing logged yet — one ${noun} is enough to start a cadence.`
          : daysSinceLast === 0
            ? `You trained today.`
            : `Last ${noun} ${daysSinceLast} ${daysSinceLast === 1 ? 'day' : 'days'} ago.`}
        {/* THE SAMPLE IS TEXT, NOT A TOOLTIP. An arrow beats a tooltip, and on
            a phone the tooltip does not exist at all — which is how the
            momentum-indicator bug in CLAUDE.md stayed invisible while
            comparing a two-day window against a seven-day one. */}
        {avgGap != null
          ? ` Across ${daysTrained} training days your cadence is about every ${avgGap} days, and the longest gap was ${longestGap}.`
          : ` Four training days and this card can state a cadence; it will not guess one from ${daysTrained}.`}
      </p>
    </Card>
  )
}

/* ── Mix ──────────────────────────────────────────────────────────────────── */

/** Which activities this mode actually consists of. Each row opens its sessions. */
export function ActivityMixCard({ rows, unit, onPick }: {
  rows: ActivityShare[]
  unit: DistanceUnit
  onPick?: (activity: string) => void
}) {
  const top = rows[0]
  const bars: BarRow[] = rows.map((r) => ({
    label: r.label,
    pct: r.share,
    value: `${r.share}%`,
    note: `${r.sessions}×`,
    tone: 'sky',
    onPick: onPick ? () => onPick(r.activity) : undefined,
    announce: `${r.label}: ${r.sessions} ${r.sessions === 1 ? 'session' : 'sessions'}, ${r.minutes} minutes${r.distanceKm > 0 ? `, ${displayDistance(r.distanceKm, unit)} ${unit}` : ''} — show these sessions`,
  }))
  return (
    <Card
      band
      title={<span className="inline-flex items-center gap-2"><Icon as={SquaresFour} size="md" className="text-sky" /> By activity</span>}
      subtitle={top ? `Mostly ${top.label} · ${top.share}% of your sessions` : 'Which activities you log'}
      collapsible
    >
      <BarList rows={bars} labelWidth="w-20" />
    </Card>
  )
}

/** Minutes by day of the week, all seven. Each day opens its sessions. */
export function WeekdayLoadCard({ rows, onPick }: {
  rows: WeekdayLoad[]
  onPick?: (day: string) => void
}) {
  const max = Math.max(1, ...rows.map((r) => r.minutes))
  const trained = rows.filter((r) => r.sessions > 0)
  const best = trained.length ? trained.reduce((a, b) => (b.minutes > a.minutes ? b : a)) : null
  const bars: BarRow[] = rows.map((r) => ({
    label: r.day,
    pct: (r.minutes / max) * 100,
    value: r.sessions > 0 ? `${r.minutes}m` : null,
    note: r.sessions > 0 ? `${r.sessions}×` : '',
    tone: 'teal',
    onPick: onPick ? () => onPick(r.day) : undefined,
    announce: r.sessions > 0
      ? `${r.day}: ${r.sessions} ${r.sessions === 1 ? 'session' : 'sessions'}, ${r.minutes} minutes, ${r.avgMin} on average — show these sessions`
      : `${r.day}: nothing logged`,
  }))
  return (
    <Card
      band
      title={<span className="inline-flex items-center gap-2"><Icon as={CalendarBlank} size="md" className="text-blue" /> By day of the week</span>}
      subtitle={best ? `Heaviest on ${best.day} · ${best.minutes} min across ${best.sessions} ${best.sessions === 1 ? 'session' : 'sessions'}` : 'Minutes by weekday'}
      collapsible
    >
      <BarList rows={bars} />
    </Card>
  )
}

/* ── Bests ────────────────────────────────────────────────────────────────── */

/**
 * The registry's headline stat per activity — pace for a run, distance for a
 * cycle, duration for yoga.
 *
 * A list and not a `BarList`, because the values are not comparable: a pace in
 * min/km and a distance in km share no axis, and a bar implies they do.
 */
export function BestsCard({ bests }: { bests: ActivityBest[] }) {
  return (
    <Card
      band
      title={<span className="inline-flex items-center gap-2"><Icon as={Medal} size="md" className="text-yellow" /> Best per activity</span>}
      subtitle={`${bests.length} ${bests.length === 1 ? 'activity' : 'activities'} with a best worth stating`}
      collapsible
    >
      <ul className="divide-y divide-surface0">
        {bests.map((b) => (
          <li key={b.activity} className="flex items-baseline justify-between gap-3 py-2">
            <span className="min-w-0">
              <span className="text-body text-fg-1">{b.label}</span>
              <span className="ml-2 text-label text-fg-2">{b.stat}</span>
            </span>
            <span className="num shrink-0 text-body font-medium" style={{ color: onRaised('yellow') }}>{b.value}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-label text-fg-2">
        Each activity is judged on the stat it is actually about — a run on pace, a cycle on distance, yoga on how long you held it.
      </p>
    </Card>
  )
}

/** The next round number for each total. The floor of the next-step sentence. */
export function MilestonesCard({ milestones }: { milestones: Milestone[] }) {
  const bars: BarRow[] = milestones.map((m) => ({
    label: m.label.replace(/ .*/, ''),
    pct: (m.current / m.next) * 100,
    value: `${m.current}/${m.next}`,
    note: m.unit === 'sessions' ? '' : m.unit,
    tone: 'mauve',
    announce: `${m.label}: ${m.current} of ${m.next} ${m.unit}`,
  }))
  return (
    <Card
      band
      title={<span className="inline-flex items-center gap-2"><Icon as={Medal} size="md" className="text-mauve" /> Next milestones</span>}
      subtitle="Round numbers, not targets you were set"
      collapsible
    >
      <BarList rows={bars} labelWidth="w-16" />
    </Card>
  )
}
