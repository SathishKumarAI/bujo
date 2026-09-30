import { cat, onRaised } from '../../lib/colors'
import { FEELINGS, PHASE_HORMONES, type FeelingSeries } from '../../lib/cycleFeelings'

const HUE: Record<string, string> = {
  drive: 'pink',
  mood: 'green',
  energy: 'peach',
  cravings: 'yellow',
}

/**
 * DESIRE, MOOD, ENERGY, CRAVINGS · four signals on one axis.
 *
 * The question people open a cycle app with and rarely get answered: *is this
 * me, or is this my cycle?* Four rows, four phases, read left to right — the
 * shape is legible in one look, which is the whole requirement. Numbers are
 * there for anyone who wants them, but nobody has to read one to see that the
 * pink row spikes in the middle.
 *
 * **A matrix, not four line charts.** Four separate charts is four axes to
 * learn and four scales to compare by eye; one grid with a shared 1–5 scale
 * makes the comparison positional, which is the cheapest reading there is.
 * It is a real `<table>` for the same reason the pattern grid is.
 *
 * **Bars are drawn against a fixed 1–5, not against the observed range.** A
 * normalised scale would turn a flat 3.1 / 3.2 / 3.0 / 3.3 into a dramatic
 * swing, which is the single most misleading thing this card could do to
 * someone trying to understand their own body.
 *
 * **The hormone column is a separate claim and says so.** The app has no blood
 * test: what it has is a timing claim from physiology, plus what you logged
 * then. Merging them would let "oestrogen peaks here" borrow the authority of
 * "your drive averaged 4.1 here", and only one of those was measured.
 */
export function FeelingsCard({ series }: { series: FeelingSeries[] }) {
  const phases = series[0]?.phases ?? []
  const anyData = series.some((s) => s.phases.some((p) => p.value != null))

  if (!anyData) {
    return (
      <p className="text-body text-fg-2">
        Rate drive, mood or energy on a few days and this shows whether they move with your cycle.
        Three rated days in a phase is where it starts reporting.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="How you feel by cycle phase">
        <table className="w-full border-collapse" style={{ minWidth: 420 }}>
          <caption className="sr-only">
            Average drive, mood, energy and craving frequency in each cycle phase, on a 1 to 5 scale.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="w-24 pb-2 text-left text-micro font-normal text-fg-2">Signal</th>
              {phases.map((p) => (
                <th key={p.phase} scope="col" className="pb-2 text-left text-micro font-normal text-fg-2">
                  {p.phase}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {series.map((s) => (
              <tr key={s.key}>
                <th scope="row" className="py-1.5 pr-3 text-left text-label font-normal">
                  <span style={{ color: onRaised(HUE[s.key]) }}>{s.label}</span>
                </th>
                {s.phases.map((p) => (
                  <td key={p.phase} className="py-1.5 pr-3 align-middle">
                    <Meter value={p.value} hue={HUE[s.key]} isShare={s.key === 'cravings'} />
                    <span className="sr-only">
                      {s.label}, {p.phase}:{' '}
                      {p.value == null
                        ? `not enough rated days (${p.n} of ${p.days})`
                        : s.key === 'cravings'
                          ? `a craving on ${Math.round(p.value * 100)} percent of days`
                          : `${p.value} out of 5`}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-label text-fg-2">
        Bars run on a fixed 1–5 scale, so a flat row is genuinely flat. A phase with fewer than
        three rated days is left blank rather than averaged.
      </p>

      {/* The physiology, kept visibly separate from the measurements. */}
      <div className="border-t border-line pt-4">
        <h4 className="text-body font-medium text-fg-1">What is happening underneath</h4>
        <p className="mt-1 text-label text-fg-2">
          General physiology, not a reading of your data — this app measures temperature and what
          you log, never hormones.
        </p>
        <dl className="mt-3 space-y-3">
          {PHASE_HORMONES.map((h) => (
            <div key={h.phase}>
              <dt className="text-label font-medium" style={{ color: onRaised(phaseHue(h.phase)) }}>{h.phase}</dt>
              <dd className="text-label text-fg-2">
                <span className="text-fg-1">{h.hormones}</span> {h.felt}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

/** Matches the phase hues `phaseOf` assigns, so the two cards agree on screen. */
function phaseHue(phase: string): string {
  if (phase === 'Menstrual') return 'red'
  if (phase === 'Follicular') return 'teal'
  if (phase === 'Ovulation window') return 'green'
  return 'blue'
}

function Meter({ value, hue, isShare }: { value: number | null; hue: string; isShare: boolean }) {
  if (value == null) {
    return <span className="text-micro text-fg-3" aria-hidden>—</span>
  }
  // Cravings arrive as a 0–1 share; everything else as 1–5. Both render against
  // their own full scale so the row heights mean the same thing.
  const pct = isShare ? value * 100 : (value / 5) * 100
  return (
    <span aria-hidden className="flex items-center gap-2">
      <span className="h-2 min-w-16 flex-1 overflow-hidden rounded-pill" style={{ background: cat('surface0') }}>
        <span className="block h-full rounded-pill" style={{ width: `${pct}%`, background: cat(hue) }} />
      </span>
      <span className="w-8 shrink-0 text-right text-micro tabular-nums text-fg-2">
        {isShare ? `${Math.round(value * 100)}%` : value.toFixed(1)}
      </span>
    </span>
  )
}

export { FEELINGS }
