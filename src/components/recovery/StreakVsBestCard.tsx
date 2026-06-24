import { Trophy, RotateCcw, Target, AlertTriangle } from 'lucide-react'
import { Card } from '../ui'
import { cat } from '../../lib/colors'
import { prettyDay } from '../../lib/date'
import type { streakVsBest, comebackStatus, paceToRecord } from '../../lib/urge'

type VsBest = ReturnType<typeof streakVsBest>
type Comeback = ReturnType<typeof comebackStatus>
type Pace = ReturnType<typeof paceToRecord>

/**
 * Current-run-vs-personal-best ghost bar, plus comeback, pace-to-record and
 * record-approach escalation callouts. Pure presentation; all values derived
 * upstream and passed in.
 */
export function StreakVsBestCard({
  vsBest,
  comeback,
  pace,
  approachCopy,
}: {
  vsBest: VsBest
  comeback: Comeback
  pace: Pace
  approachCopy: { color: string; text: string } | null
}) {
  return (
    <Card title="Current vs your best" subtitle={vsBest.isRecord ? 'You’re writing a new record right now' : `${vsBest.daysToBeat} day${vsBest.daysToBeat === 1 ? '' : 's'} to match your best`} help="The faint bar is your longest streak ever; the solid bar is your current run climbing toward it. Once it fills, you’re in record territory.">
      <div className="relative h-4 overflow-hidden rounded-full" style={{ background: cat('surface0') }}>
        {/* ghost = personal best (full width reference) */}
        <div className="absolute inset-0 rounded-full" style={{ background: cat('peach') + '2e' }} />
        {/* solid = current run, proportional to best */}
        <div className="relative h-full rounded-full transition-[width] duration-500"
          style={{ width: `${vsBest.pct}%`, background: vsBest.isRecord ? cat('green') : cat('mauve') }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span style={{ color: vsBest.isRecord ? cat('green') : cat('mauve') }}><span className="font-semibold">{vsBest.current}</span>d now</span>
        <span className="text-overlay1 inline-flex items-center gap-1"><Trophy size={12} style={{ color: cat('peach') }} /> best {vsBest.best}d</span>
      </div>
      {comeback.isComeback && (
        <div className="mt-3 inline-flex w-full items-center gap-2 rounded-lg p-2.5 text-sm" style={{ background: cat('green') + '14', border: `1px solid ${cat('green')}44` }}>
          <RotateCcw size={16} style={{ color: cat('green') }} className="shrink-0" />
          <span className="text-subtext0"><span className="font-semibold" style={{ color: cat('green') }}>Comeback unlocked.</span> This run beats your last streak ({comeback.prevStreak}d) by <strong style={{ color: cat('green') }}>{comeback.by} day{comeback.by === 1 ? '' : 's'}</strong> · the slip didn’t win.</span>
        </div>
      )}
      {/* Pace-to-record projection (#298) · concrete calendar target */}
      {!pace.alreadyRecord && pace.matchDate && (
        <div className="mt-3 inline-flex w-full items-center gap-2 rounded-lg p-2.5 text-xs" style={{ background: cat('mauve') + '12', border: `1px solid ${cat('mauve')}33` }}>
          <Target size={15} style={{ color: cat('mauve') }} className="shrink-0" />
          <span className="text-subtext0">Stay clean and you’ll <strong style={{ color: cat('mauve') }}>match your best on {prettyDay(pace.matchDate)}</strong> · a new record the very next day ({pace.beatDate && prettyDay(pace.beatDate)}). {pace.daysToMatch} day{pace.daysToMatch === 1 ? '' : 's'} away.</span>
        </div>
      )}
      {/* Record-approach escalation (#321) · the cost of slipping rises near your best */}
      {approachCopy && (
        <div className="mt-3 inline-flex w-full items-center gap-2 rounded-lg p-2.5 text-xs" style={{ background: cat(approachCopy.color) + '14', border: `1px solid ${cat(approachCopy.color)}44` }}>
          <AlertTriangle size={15} style={{ color: cat(approachCopy.color) }} className="shrink-0" />
          <span className="text-subtext0">{approachCopy.text}</span>
        </div>
      )}
    </Card>
  )
}
