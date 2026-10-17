import { CalendarBlank, CheckCircle, Drop, Sparkle, Target, Thermometer, Warning } from '@/components/icons'
import type { Icon as Glyph } from '@/components/icons'
import type { CycleStep } from '../../lib/cycleInsights'

/**
 * URGENCY PER RULE, as a table rather than two ternaries inside the JSX.
 *
 * `Record<CycleStep['id'], …>` is the point: `tsc` then proves every rule has
 * a tone and a glyph, which an inline object literal indexed by `step.id`
 * does not — it would have returned `undefined` for a rule added later, and
 * `cat(undefined)` paints **mauve** rather than failing. That fallback is in
 * CLAUDE.md as the trap that tinted a whole calendar the colour meaning "you
 * trained".
 *
 * In its own module because a component file that also exports constants
 * breaks fast refresh, and because this is the file a test wants: the
 * demo journal lands on `steady`, so the other six have never been *drawn* by
 * any gate, and a typo in one of them would be invisible at every theme and
 * width. A branch the seed never takes cannot fail.
 */
export const STEP_TONE: Record<CycleStep['id'], string> = {
  first: 'mauve', late: 'peach', due: 'peach', stale: 'yellow', fertile: 'teal', young: 'teal', steady: 'green',
}

export const STEP_ICON: Record<CycleStep['id'], Glyph> = {
  first: Sparkle, late: Warning, due: Drop, stale: Thermometer, fertile: Target, young: CalendarBlank, steady: CheckCircle,
}
