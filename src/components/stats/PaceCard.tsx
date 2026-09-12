import { useJournal } from '../../store'
import { Card } from '../ui'
import { cat } from '../../lib/colors'
import { prettyMonth } from '../../lib/date'
import { pace, type Span } from '../../lib/pace'

/**
 * Time left · how much of the month and the year is still yours, and whether
 * the days you have spent were logged.
 *
 * The rest of Stats reads the journal backwards — what you did. This one reads
 * it forwards: the only figure on the page you can still change is the number
 * of days that have not happened yet. It renders **open**, beside the other
 * lifetime cards, because a fold would hide the one thing here that expires.
 *
 * All arithmetic lives in `lib/pace.ts`; this file only decides what it looks
 * like.
 */
export function PaceCard() {
  const { data } = useJournal()
  const p = pace(data)

  return (
    <Card band title="Time left" subtitle="What is still on the board, and the pace you are keeping">
      <div className="space-y-4">
        <SpanRow label={prettyMonth(p.month.ym)} span={p.month} fill="teal" />
        <SpanRow label={String(p.year.year)} span={p.year} fill="mauve" />
      </div>
      <p className="mt-4 border-t border-line pt-3 text-label text-fg-2">
        Week <span className="tabular-nums text-fg-1">{p.week.index}</span> of {p.week.total} ·{' '}
        <span className="tabular-nums text-fg-1">{p.week.left}</span> week{p.week.left === 1 ? '' : 's'} left this year.
      </p>
    </Card>
  )
}

/**
 * One period as a stacked proportion bar: logged · spent-but-empty · still left.
 *
 * Three segments rather than a plain progress bar, because "60% of the month is
 * gone" and "you logged 7 of those days" are different facts and the gap
 * between them is the whole point. The segments are proportions of the period,
 * not a timeline — logged days are not contiguous — so the caption carries the
 * numbers and the bar only carries the shape.
 */
function SpanRow({ label, span, fill }: { label: string; span: Span; fill: string }) {
  const pct = (n: number) => `${(n / span.total) * 100}%`
  const spent = span.past + 1 // today is under way
  const missed = Math.max(0, Math.min(spent, span.total) - span.logged)

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-body text-fg-1">{label}</span>
        <span className="text-body tabular-nums text-fg-1">
          <strong>{span.left}</strong> <span className="text-fg-2">of {span.total} days left</span>
        </span>
      </div>

      <div
        className="mt-1.5 flex h-2 w-full overflow-hidden rounded-none bg-ink-2"
        role="img"
        aria-label={`${label}: ${span.left} of ${span.total} days left, ${span.logged} of the ${spent} days so far logged`}
      >
        <div className="h-full" style={{ width: pct(span.logged), background: cat(fill) }} />
        <div className="h-full" style={{ width: pct(missed), background: cat('surface2') }} />
      </div>

      <p className="mt-1.5 text-label text-fg-2">
        <span className="tabular-nums">{span.logged}</span> of the{' '}
        <span className="tabular-nums">{spent}</span> day{spent === 1 ? '' : 's'} so far logged
        {span.projected != null && (
          <> · on pace for <span className="tabular-nums text-fg-1">{span.projected}</span> of {span.total}</>
        )}
      </p>
    </div>
  )
}
