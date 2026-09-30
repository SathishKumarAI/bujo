import { cat, onRaised } from '../../lib/colors'

/**
 * LUTEAL LENGTH · the most clinically useful number a BBT chart produces.
 *
 * It was computed by the detection engine from the first commit and rendered
 * nowhere, which made it the highest-value thing the page knew and did not say.
 *
 * The luteal phase is the stable half — 11 to 17 days for most people, and it
 * barely moves between cycles. That stability is exactly why it is worth
 * showing: a *consistently* short one (under 10 days) is a recognised reason to
 * talk to a clinician, and it is invisible on a calendar because the cycle
 * length can look perfectly normal while the two halves are lopsided.
 *
 * The card says "worth mentioning", never "luteal phase defect". The threshold
 * is a prompt to ask someone qualified, not a finding — and it only appears
 * once at least two confirmed cycles support it, because one short luteal phase
 * is a normal thing that happens.
 */
export function LutealCard({ lengths }: { lengths: number[] }) {
  if (lengths.length === 0) {
    return (
      <p className="text-body text-fg-2">
        Once a temperature shift is confirmed and the next period arrives, the days between them
        are your luteal length — the steady half of the cycle. It needs one complete cycle with a
        shift to appear.
      </p>
    )
  }

  const avg = Math.round((lengths.reduce((a, b) => a + b, 0) / lengths.length) * 10) / 10
  const short = avg < 10 && lengths.length >= 2
  const span = lengths.length > 1 ? `${Math.min(...lengths)}–${Math.max(...lengths)}` : String(lengths[0])

  return (
    <div>
      <p className="flex items-baseline gap-2">
        <span className="num text-display font-medium text-fg-1">{avg}</span>
        <span className="text-body text-fg-2">days on average</span>
      </p>
      <p className="mt-1 text-label text-fg-2">
        From {lengths.length} confirmed cycle{lengths.length === 1 ? '' : 's'} · range {span} days
      </p>

      {/* One bar per cycle against a fixed 0–18, so a short phase reads short.
          Scaling to the observed range would make three near-identical cycles
          look dramatically different. */}
      <ul className="mt-3 space-y-1.5">
        {lengths.map((n, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-label text-fg-2">cycle {i + 1}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-pill" style={{ background: cat('surface0') }}>
              <span
                className="block h-full rounded-pill"
                style={{ width: `${Math.min(100, (n / 18) * 100)}%`, background: cat(n < 10 ? 'peach' : 'blue') }}
              />
            </span>
            <span className="w-10 shrink-0 text-right text-label tabular-nums text-fg-2">{n}d</span>
          </li>
        ))}
      </ul>

      <p className="mt-3 border-t border-line pt-2 text-label text-fg-2">
        Most people sit between 11 and 17 days, and it varies far less than the first half of the
        cycle — a longer cycle is usually a longer follicular phase, not a longer luteal one.
      </p>

      {short && (
        <p className="mt-2 text-label" style={{ color: onRaised('peach') }}>
          Yours is averaging under 10 days across {lengths.length} cycles. That is worth mentioning
          to a clinician — it is not a diagnosis, and this page cannot make one.
        </p>
      )}
    </div>
  )
}
