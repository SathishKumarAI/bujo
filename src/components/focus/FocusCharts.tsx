import { useState } from 'react'
import { cat } from '../../lib/colors'
import { formatMinutes } from '../../lib/focus'

/**
 * The Focus page's chart bodies — marks only, no headings and no cards.
 *
 * It used to be three charts wrapped in a `Band` with its own `<h2>`s, and
 * `FocusBreakdowns.tsx` was four more in the same shape. Both are gone: the
 * review zone is a rail over `lib/focusCards.ts` now, so a chart's title,
 * subtitle and box belong to the `Card` the registry places it in. What is left
 * here is the part that draws.
 *
 * **Two mark primitives, six charts.** `Bar` is a labelled row; `ColumnChart` is
 * a vertical series over time. The 14-day minutes chart and the interruptions
 * chart were previously the same eleven lines of markup written twice — a
 * `flex items-end` row of `flex-1` divs with a `bg-brand` special case for
 * today — which is the sort of duplication that drifts by one class and then
 * reads as two different charts.
 *
 * Every mark is plain DOM or one inline `<svg>`. Recharts is loaded on this page
 * already (the WPM trend), and it is still not worth it for fourteen bars.
 */

/**
 * One labelled bar: name, track, figure.
 *
 * `share` is the fraction of the track to fill and the caller decides what it is
 * a fraction OF — that distinction is load-bearing. Minutes are normalised
 * against the largest row, because "which project got the most" is a comparison
 * within the chart. A focus score is normalised against **10**, because 0–10 is
 * an absolute scale and re-basing it on the best row turns "8.5 and 8.1" into a
 * full bar beside a half-empty one.
 */
export function Bar({
  label,
  value,
  share,
  accent = false,
  dim = false,
  title,
  aside,
}: {
  label: string
  value: string
  share: number
  accent?: boolean
  /** Too few observations to read as a result — the row states its figure quietly. */
  dim?: boolean
  title?: string
  /**
   * A second figure, in its own column.
   *
   * This is how a row carries two measures without a second y-axis. A dual-axis
   * chart is the one chart mistake worth naming outright: two scales in one
   * frame invite "the lines cross, so something changed", which is an artefact
   * of the scaling and not a fact about the data. The bar encodes one measure;
   * the other is a number you read.
   */
  aside?: string
}) {
  return (
    <div
      className={`grid items-center gap-3 py-1 text-label ${aside == null ? 'grid-cols-[5.5rem_1fr_3.5rem]' : 'grid-cols-[5.5rem_1fr_3.5rem_3.25rem]'}`}
      title={title}
    >
      <span className="truncate text-fg-2">{label}</span>
      <span className="block h-2.5 rounded-pill bg-ink-2">
        <span
          className={`block h-full rounded-pill ${accent ? 'bg-brand' : 'bg-fg-1'}`}
          style={{ width: `${Math.round(Math.max(0, Math.min(1, share)) * 100)}%`, opacity: dim ? 0.4 : 1 }}
        />
      </span>
      <span className="num text-right text-fg-2">{value}</span>
      {aside != null && <span className="num text-right text-fg-1">{aside}</span>}
    </div>
  )
}

export interface Column {
  key: string
  /** Shown under the bar when `ticks` is set; always in the tooltip. */
  label: string
  value: number
  /** What the tooltip and the accessible name say for this bar. */
  text: string
  accent?: boolean
  /** No observation here, as opposed to an observation of zero. */
  absent?: boolean
}

/**
 * A vertical series: one bar per period, oldest on the left.
 *
 * `absent` and `value: 0` are drawn differently and the difference matters —
 * a day with no session logged is not a day you did nothing measurable, and the
 * accessible name says which. A 2px stub keeps an empty bar's hit target and its
 * position readable; an absent one draws nothing at all.
 *
 * `ticks` labels the axis on a stride rather than on every bar: twelve week
 * labels in a 351px column overlap into a grey smear, and a chart whose axis is
 * unreadable is a chart with no axis.
 */
export function ColumnChart({
  bars,
  height = 96,
  ariaLabel,
  ticks = false,
  tickEvery = 1,
}: {
  bars: Column[]
  height?: number
  ariaLabel: string
  ticks?: boolean
  tickEvery?: number
}) {
  const max = Math.max(1, ...bars.map((b) => b.value))
  return (
    <div>
      <div
        className="flex items-end gap-1.5"
        style={{ height }}
        role="img"
        aria-label={`${ariaLabel}: ${bars.map((b) => b.text).join(', ')}`}
      >
        {bars.map((b) => (
          <div key={b.key} className="flex h-full flex-1 items-end" title={b.text}>
            <div
              className={`w-full rounded-t-[3px] ${b.accent ? 'bg-brand' : 'bg-fg-1'}`}
              style={{ height: b.absent ? 0 : `${Math.max(2, (b.value / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      {ticks && (
        <div className="mt-1.5 flex gap-1.5 text-micro text-fg-2" aria-hidden>
          {bars.map((b, i) => (
            <span key={b.key} className="num flex-1 text-center">
              {i % tickEvery === 0 ? b.label : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Minutes or focus by weekday, and the toggle between them.
 *
 * One chart with two modes rather than two charts, because "when do I put the
 * hours in" and "when is the work any good" are two questions about one axis and
 * putting them side by side invites reading one as the other. The mode lives
 * here: it is the chart's own state and no other card on the page reads it.
 *
 * The fallback is deliberate — a mode whose metric has no data shows the one
 * that does, rather than an empty chart under a pressed button.
 */
export function WeekdayBars({
  byWeekday,
  focusWd,
}: {
  byWeekday: { day: number; label: string; min: number }[]
  focusWd: { day: number; label: string; avg: number; count: number }[]
}) {
  const [mode, setMode] = useState<'volume' | 'quality'>('volume')
  const hasVolume = byWeekday.some((w) => w.min > 0)
  const hasQuality = focusWd.some((w) => w.count > 0)
  const showQuality = mode === 'quality' ? hasQuality : !hasVolume && hasQuality

  const maxWd = Math.max(1, ...byWeekday.map((w) => w.min))
  const bestFocus = Math.max(0, ...focusWd.map((w) => w.avg))

  return (
    <>
      <div className="mb-3 flex gap-4 text-label">
        {(['volume', 'quality'] as const).map((m) => {
          const on = showQuality ? m === 'quality' : m === 'volume'
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              aria-pressed={on}
              className={`min-h-11 border-b-2 capitalize ${on ? 'border-brand text-fg-1' : 'border-transparent text-fg-2 hover:text-brand-text'}`}
            >
              {m}
            </button>
          )
        })}
        <span className="ml-auto self-center text-label text-fg-2">
          {showQuality ? 'avg focus' : 'total minutes'}
        </span>
      </div>
      {showQuality
        ? focusWd.map((w) => (
            <Bar
              key={w.day}
              label={w.label}
              value={w.count ? `${w.avg}/10` : '—'}
              /* Against 10, not against the best day: 0–10 is an absolute
                 scale and re-basing it would make a 7.9 look like a failure
                 next to an 8.1. */
              share={w.avg / 10}
              dim={w.count === 0}
              accent={w.avg === bestFocus && w.avg > 0}
              title={`${w.label}: ${w.count ? `${w.avg}/10 across ${w.count} session${w.count === 1 ? '' : 's'}` : 'no sessions'}`}
            />
          ))
        : byWeekday.map((w) => (
            <Bar
              key={w.day}
              label={w.label}
              value={formatMinutes(w.min)}
              share={w.min / maxWd}
              dim={w.min === 0}
              accent={w.min === maxWd && w.min > 0}
            />
          ))}
    </>
  )
}

/**
 * Focus score by session length — the page's answer to its own timer.
 *
 * A band with fewer than two sessions is dimmed rather than dropped: the gap in
 * the ladder is information ("you have never worked a short block"), and hiding
 * the row would make the remaining bands look like the whole range.
 */
export function DurationBars({
  bands,
}: {
  bands: { label: string; avg: number | null; count: number; minutes: number }[]
}) {
  const best = Math.max(0, ...bands.filter((b) => b.count >= 2).map((b) => b.avg ?? 0))
  return (
    <>
      {bands.map((b) => (
        <Bar
          key={b.label}
          label={b.label}
          /* `'—'` and not `'0/10'`. A band nobody has worked in has no score,
             and printing a zero says the work was bad rather than absent. */
          value={b.avg == null ? '—' : `${b.avg}/10`}
          share={(b.avg ?? 0) / 10}
          dim={b.count < 2}
          accent={b.avg != null && b.avg === best && b.count >= 2}
          title={`${b.label}: ${b.count ? `${b.count} session${b.count === 1 ? '' : 's'}, ${formatMinutes(b.minutes)}` : 'none logged'}`}
        />
      ))}
      <p className="mt-3 text-label text-fg-2">
        Averaged within each band, so the length is held still rather than being what is measured.
        Bands under two sessions are dimmed.
      </p>
    </>
  )
}

/** Minutes per row against the largest row — a comparison inside the chart. */
export function ShareBars({ rows }: { rows: { label: string; min: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.min))
  return (
    <>
      {rows.map((r) => (
        <Bar key={r.label} label={r.label} value={formatMinutes(r.min)} share={r.min / max} accent={r.min === max} />
      ))}
    </>
  )
}

/**
 * Where the hours go against where the depth is.
 *
 * Two measures per tag, and deliberately **not** a dual-axis chart: minutes are
 * the bar, the focus score is the figure beside it. Two y-scales in one frame is
 * the single most common charting mistake and the reading it invites — "the
 * lines cross, so something happened" — is an artefact of the scaling.
 */
export function TagQualityBars({ rows }: { rows: { tag: string; min: number; avg: number | null; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.min))
  return (
    <>
      <div className="mb-2 grid grid-cols-[5.5rem_1fr_3.5rem_3.25rem] gap-3 text-caption uppercase tracking-wide text-fg-2">
        <span>tag</span>
        <span />
        <span className="text-right">time</span>
        <span className="text-right">focus</span>
      </div>
      {rows.map((r) => (
        <Bar
          key={r.tag}
          label={r.tag}
          value={formatMinutes(r.min)}
          aside={r.avg == null ? '—' : `${r.avg}`}
          share={r.min / max}
          accent={r.min === max}
          title={`${r.tag}: ${formatMinutes(r.min)} across ${r.count} session${r.count === 1 ? '' : 's'}${r.avg == null ? '' : `, focus ${r.avg}/10`}`}
        />
      ))}
      <p className="mt-3 text-label text-fg-2">
        Focus is duration-weighted and out of 10, so a long shallow session cannot be outvoted by a
        short good one.
      </p>
    </>
  )
}

/** Minutes per day over the last fortnight. Today carries the accent. */
export function DayBars({ series, today }: { series: { date: string; min: number }[]; today: string }) {
  return (
    <ColumnChart
      ariaLabel="Coding minutes per day over the last 14 days"
      bars={series.map((s) => ({
        key: s.date,
        label: s.date.slice(8),
        value: s.min,
        text: `${s.date}: ${formatMinutes(s.min)}`,
        accent: s.date === today,
      }))}
    />
  )
}

/**
 * Minutes per rolling week over the last quarter — the reading the 14-day chart
 * structurally cannot give. Newest bar is the current week and carries the
 * accent, which is also the honest caveat: it is the only bar that is not done.
 */
export function WeekBars({ weeks }: { weeks: { start: string; end: string; label: string; min: number }[] }) {
  return (
    <ColumnChart
      ariaLabel="Total deep-work minutes per rolling week, oldest first"
      ticks
      tickEvery={2}
      bars={weeks.map((w, i) => ({
        key: w.start,
        label: w.label,
        value: w.min,
        text: `week of ${w.start}: ${formatMinutes(w.min)}`,
        accent: i === weeks.length - 1,
      }))}
    />
  )
}

/** Average interruptions per session over the last fortnight. */
export function InterruptionBars({
  trend,
  today,
}: {
  trend: { date: string; avg: number; count: number }[]
  today: string
}) {
  return (
    <ColumnChart
      height={64}
      ariaLabel="Average interruptions per session over the last 14 days"
      bars={trend.map((d) => ({
        key: d.date,
        label: d.date.slice(8),
        value: d.avg,
        // "no session" and "a session with none" are different facts and the
        // old chart said the same thing for both (a 0%-height bar).
        text: d.count ? `${d.date}: ${d.avg} average` : `${d.date}: no session`,
        absent: d.count === 0,
        accent: d.date === today,
      }))}
    />
  )
}

/** Running all-time hours. One polyline; a library for this would be absurd. */
export function CumulativeLine({ cum }: { cum: { date: string; hours: number }[] }) {
  const W = 600
  const H = 120
  const cumMax = cum.length ? cum[cum.length - 1].hours || 1 : 1
  const points = cum
    .map((c, i) => `${(i / Math.max(1, cum.length - 1)) * W},${H - (c.hours / cumMax) * H}`)
    .join(' ')
  return (
    <div className="w-full" role="img" aria-label={`Cumulative coding hours, reaching ${cum[cum.length - 1].hours} hours`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-28 w-full">
        <polyline points={points} fill="none" stroke={cat('text')} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  )
}

/**
 * Six months of days, GitHub-style. Sequential — one hue, light to dark — which
 * is the only correct encoding for a magnitude and the one it already used.
 */
export function DeepWorkGrid({
  heat,
}: {
  heat: { cells: { date: string; min: number; weekday: number; level: number }[]; max: number }
}) {
  if (heat.max <= 0) return <p className="text-label text-fg-3">Nothing logged yet — the grid fills in one day at a time.</p>
  const fill = (level: number) => ({
    background: level === 0 ? cat('surface0') : cat('mauve'),
    opacity: level === 0 ? 1 : 0.25 + (level / 4) * 0.75,
  })
  return (
    <>
      <div className="overflow-x-auto" tabIndex={0} role="group" aria-label="Deep-work heatmap, scrollable">
        <div
          className="grid w-max gap-[3px]"
          style={{ gridTemplateRows: 'repeat(7, 11px)', gridAutoFlow: 'column', gridAutoColumns: '11px' }}
          role="img"
          aria-label={`Daily coding minutes over the last 26 weeks, busiest day ${heat.max} minutes`}
        >
          {heat.cells.map((c) => (
            <div key={c.date} title={`${c.date}: ${formatMinutes(c.min)}`} style={{ gridRow: c.weekday + 1, ...fill(c.level) }} />
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 text-micro text-fg-3">
        <span>less</span>
        {[0, 1, 2, 3, 4].map((lv) => (
          <span key={lv} className="size-2.5 rounded-[2px]" style={fill(lv)} />
        ))}
        <span>more</span>
      </div>
    </>
  )
}
