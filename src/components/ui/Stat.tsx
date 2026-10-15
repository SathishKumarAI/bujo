import type { ReactNode } from 'react'
import { cat } from '../../lib/colors'

/**
 * A number, with the range that makes it mean something.
 *
 * ── Why this exists ────────────────────────────────────────────────────────
 *
 * Measured across 14 views at `bf8dbda`: the app printed **1,414 numbers as
 * plain text against 98 visual encodings — 14.43 to 1**. Five views encoded
 * nothing at all. Fitness printed 249 numbers and drew zero shapes; Insights,
 * the analytics destination, answered 91 printed numbers with one chart.
 *
 * That ratio is the whole of "it doesn't tell me anything". A number alone is
 * a fact. A number against its range is information. `377 / 150 min` on
 * Fitness means you beat the week's target by two and a half times, and the
 * old markup said it in the same voice it used for a date.
 *
 * ── The rule this component enforces ───────────────────────────────────────
 *
 * **A number gets a shape when it has a range, and not otherwise.** Decoration
 * applied to a number with nothing to compare against is worse than plain
 * text: it implies a scale that does not exist. So the encoding is chosen from
 * what the caller can actually supply —
 *
 *   `of`      a target or a total   → a track, which can overflow
 *   `history` a series              → a sparkline
 *   `ramp`    a run of day states   → a ramp
 *   none of them                    → the figure alone, honestly
 *
 * ── `null` is not zero ─────────────────────────────────────────────────────
 *
 * `value={null}` renders an em dash, never `0`. CLAUDE.md records what the
 * other choice costs: `count ? sum / count : 0` made "no data" and "you scored
 * zero" the same pixel, and a trend opened with `0% · 0%` for two months that
 * had not happened yet. Every path here keeps them apart, and
 * `stat.test.tsx` asserts it.
 *
 * ── The figure does not count up, and that is a decision ──────────────────
 *
 * `Ring` uses `useCountUp`, and the obvious move was to reuse it here. Two
 * reasons not to, and the test found the first one:
 *
 *   1. **A counting figure reads `0` on the first frame.** This app's single
 *      most expensive class of bug is "no data" and "zero" looking alike, and
 *      a stat strip that opens on a row of zeros commits it on every page
 *      load — briefly, convincingly, and in the leftmost position where a
 *      number is read from.
 *   2. **Four to eight of these sit in one strip.** One ring filling is a
 *      flourish; eight numbers racing at once is a slot machine, and the ask
 *      was for meaning, not motion.
 *
 * The life is in the shape, which is static and true. The number is true
 * immediately. `Ring` keeps its count-up, where a single figure animating
 * alongside a filling arc is the whole gesture.
 *
 * ── No hex in this file, deliberately ──────────────────────────────────────
 *
 * Colours come from `cat()` so all five themes move together and
 * `npm run contrast` keeps guarding them. Note that `npm run design` greps the
 * source for a literal colour and cannot tell a comment from a call site — so
 * there is no hex here even in prose.
 */

/** Token name, as `lib/colors.ts` spells it. */
type Tone = 'mauve' | 'blue' | 'green' | 'peach' | 'red' | 'teal' | 'yellow' | 'pink' | 'fg-2'

const TONE_FALLBACK: Tone = 'mauve'

/**
 * A filled track, which may overflow its own end.
 *
 * Overflow is the case that matters and the one a naive `width: pct%` gets
 * wrong: clamped at 100% a bar says "target met" for 150 of 150 and for 377 of
 * 150 identically, which is exactly the information the user wanted. Past the
 * target the fill saturates and a second, quieter segment shows how far past —
 * so "met" and "doubled" are different pictures.
 */
export function Track({
  value,
  max,
  tone = TONE_FALLBACK,
  height = 6,
}: {
  value: number
  max: number
  tone?: Tone
  height?: number
}) {
  const safeMax = max > 0 ? max : 1
  const ratio = value / safeMax
  const filled = Math.max(0, Math.min(1, ratio))
  // How much of the bar the overflow gets: capped so a 10x week does not make
  // the first 100% invisible.
  const over = Math.max(0, Math.min(1, ratio - 1))
  return (
    <div
      aria-hidden
      className="flex w-full overflow-hidden rounded-pill"
      style={{ height, background: cat('surface0') }}
    >
      <div style={{ width: `${filled * 100}%`, background: cat(tone), borderRadius: 999 }} />
      {over > 0 ? (
        <div style={{ width: `${over * 100}%`, background: cat(tone), opacity: 0.35, borderRadius: 999 }} />
      ) : null}
    </div>
  )
}

/**
 * A series, as bars. The last value is emphasised because it is the one the
 * figure beside it is showing — without that, a sparkline and its own headline
 * number look like two unrelated facts.
 *
 * Heights are scaled against the series max rather than against zero when the
 * series never approaches zero, so a flat-but-high run still reads as flat.
 */
export function Spark({
  values,
  tone = TONE_FALLBACK,
  height = 26,
}: {
  values: readonly (number | null)[]
  tone?: Tone
  height?: number
}) {
  const real = values.filter((v): v is number => v != null)
  if (real.length === 0) return null
  const hi = Math.max(...real)
  const lo = Math.min(...real)
  const span = hi - lo || 1
  const last = values.length - 1
  return (
    <div aria-hidden className="flex w-full items-end gap-[2px]" style={{ height }}>
      {values.map((v, i) => {
        // A gap in the series is a gap, not a zero-height bar at the floor.
        if (v == null) {
          return <span key={i} className="flex-1 rounded-[1px]" style={{ height: 2, background: cat('surface1') }} />
        }
        const h = 0.22 + 0.78 * ((v - lo) / span)
        return (
          <span
            key={i}
            className="flex-1 rounded-[1px]"
            style={{ height: `${h * 100}%`, background: cat(tone), opacity: i === last ? 1 : 0.5 }}
          />
        )
      })}
    </div>
  )
}

/**
 * A run of days as a ramp — darkest at the far end, so a long streak reads as
 * something built rather than as a row of identical squares.
 *
 * Takes booleans because that is what a streak is: each day either counted or
 * it did not. A missed day breaks the ramp visibly, which is the point.
 */
export function Ramp({
  days,
  tone = TONE_FALLBACK,
  height = 10,
}: {
  days: readonly boolean[]
  tone?: Tone
  height?: number
}) {
  const n = days.length || 1
  return (
    <div aria-hidden className="flex w-full gap-[2px]" style={{ height }}>
      {days.map((on, i) => (
        <span
          key={i}
          className="flex-1 rounded-[1px]"
          style={{
            background: on ? cat(tone) : cat('surface0'),
            // Ramp only the days that counted; a miss stays flat and dim.
            opacity: on ? 0.3 + 0.7 * ((i + 1) / n) : 1,
          }}
        />
      ))}
    </div>
  )
}

export interface StatProps {
  /** The quiet name of the thing. */
  label: ReactNode
  /** The figure. `null` means no data and renders an em dash, never zero. */
  value: number | null
  /** Target or total. Supplying it is what earns a track. */
  of?: number | null
  /** A series. Supplying it is what earns a sparkline. */
  history?: readonly (number | null)[]
  /** A run of day states. Supplying it is what earns a ramp. */
  ramp?: readonly boolean[]
  /** Appended to the figure with no space, e.g. a percent sign. */
  suffix?: string
  /** One line under the encoding. Say what the number means, not what it is. */
  note?: ReactNode
  /** Change against the previous period. Sign decides the arrow and the tone. */
  delta?: number | null
  /** How a positive delta should read. Down is better for stress or lapses. */
  deltaGood?: 'up' | 'down'
  tone?: Tone
  /** Decimal places for the figure. */
  decimals?: number
  /** Raise it onto the act plane. Off by default — most stats are read, not used. */
  raised?: boolean
  /**
   * This is THE answer to the question the page asks.
   *
   * Renders at `--text-answer` (40px, 2.67x body) in the display face, which
   * is the one step above everything else. Measured at `bf8dbda`: the largest
   * text on 12 of 14 views was the 22px page title — the view's own name —
   * and nothing rendered above 26px anywhere. Largest over body was 1.47x,
   * which is not a hierarchy.
   *
   * **One per page.** A page with two answers has none, and the step stops
   * meaning anything the second time it is used. If two figures are competing
   * for it, the page is asking two questions and wants splitting.
   */
  answer?: boolean
  className?: string
}

/**
 * The whole point: one component that decides its own encoding from what it
 * was given, so a view cannot print a bare number by accident and cannot
 * decorate one that has nothing to compare against.
 */
export function Stat({
  label,
  value,
  of,
  history,
  ramp,
  suffix = '',
  note,
  delta,
  deltaGood = 'up',
  tone = TONE_FALLBACK,
  decimals = 0,
  raised = false,
  answer = false,
  className = '',
}: StatProps) {
  const known = value != null && Number.isFinite(value)
  const hasRange = of != null && of > 0
  const over = known && hasRange && value > of

  // Which encoding, in priority order. A caller that supplies two gets the
  // more specific one: a target says more than a trend about where you stand.
  const shape = !known ? null
    : hasRange ? 'track'
      : ramp && ramp.length > 0 ? 'ramp'
        : history && history.length > 1 ? 'spark'
          : null

  const deltaUp = delta != null && delta > 0
  const deltaTone = delta == null || delta === 0 ? 'fg-2'
    : (deltaUp ? deltaGood === 'up' : deltaGood === 'down') ? 'green' : 'peach'

  return (
    <div
      className={[
        'flex min-w-0 flex-col gap-2',
        raised ? 'rounded-card border border-line bg-ink-2 p-3 shadow-raise' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={`${answer ? 'text-answer' : 'text-display'} font-display leading-none tabular-nums`}
          style={{ color: cat(known ? tone : 'overlay0') }}
        >
          {known ? `${value.toFixed(decimals)}${suffix}` : '—'}
        </span>
        {hasRange && known ? (
          <span className="shrink-0 text-label tabular-nums text-fg-3">
            {over ? 'of' : '/'} {of.toLocaleString()}
          </span>
        ) : delta != null && delta !== 0 ? (
          <span className="shrink-0 text-label tabular-nums" style={{ color: cat(deltaTone) }}>
            {deltaUp ? '↑' : '↓'} {Math.abs(delta).toFixed(decimals)}
          </span>
        ) : null}
      </div>

      {shape === 'track' && known && hasRange ? <Track value={value} max={of} tone={tone} /> : null}
      {shape === 'spark' && history ? <Spark values={history} tone={tone} /> : null}
      {shape === 'ramp' && ramp ? <Ramp days={ramp} tone={tone} /> : null}

      <span className="text-label leading-snug text-fg-2">{label}</span>
      {note ? <span className="text-micro leading-snug text-fg-3">{note}</span> : null}
    </div>
  )
}

/**
 * A row of stats that stays a row.
 *
 * `auto-fit` with a floor rather than a fixed column count: the same strip
 * holds four stats on a desktop and two on a phone without a breakpoint, and
 * `minmax(0, 1fr)` is spelled out because a bare `1fr` track sizes to its
 * widest item's min-content and drags every sibling with it — the implicit
 * track trap recorded in CLAUDE.md, which put sixteen controls off the right
 * edge of Stats.
 */
export function StatRow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`grid gap-4 ${className}`}
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(9rem, 100%), 1fr))' }}
    >
      {children}
    </div>
  )
}
