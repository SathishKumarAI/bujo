import { cat, onRaised } from '../../lib/colors'
import type { PhaseBand } from '../../lib/cycleInsights'
import { Abbr } from '../Abbr'

/**
 * OVULATION, LAID OUT IN TIME · what it is, and how it differs from the phases
 * either side of it.
 *
 * The complaint this answers was two questions in one breath: which colour is
 * which, and "what is or what do they do in ovulation, and how to differentiate
 * between ovulation and the other categories". `FlagLegend` answers the first.
 * The second is not a definition problem — the wheel already names the phase and
 * the guide already describes it — it is an **overlap** problem: the fertile
 * window starts days before ovulation and ends after it, the LH surge comes
 * before, the temperature step comes after, and all four sit inside one narrow
 * stretch of a bar that is also labelled "follicular" then "luteal". That is a
 * shape, and a paragraph cannot hold it.
 *
 * **Why not extend `CycleWheel`.** The wheel's job is "where am I now", and it
 * is periodic on purpose — a ring has no before and after, which is precisely
 * what this has to show ("LH predicts, temperature confirms"). Hanging three
 * more markers on it would cost the wheel the one glance it currently answers
 * and still not put the two signals in order. So: linear, and small.
 *
 * Inline SVG, no dependency. Presentation only — it takes the same `phaseBands`
 * the wheel does, so the boundaries here and there cannot disagree.
 */
export function FertileWindow({ bands, length }: {
  bands: PhaseBand[]
  /** Cycle length the bands were built for. */
  length: number
}) {
  const W = 360
  const H = 128
  const PAD = 12
  /** Day boundary → x. `0` is the start of day 1, `length` the end of the last. */
  const x = (d: number) => PAD + (d / length) * (W - PAD * 2)

  const ov = bands.find((b) => b.id === 'ovulation')
  // Derived from the band, not re-computed: `phaseBands` already placed the
  // window relative to the *next* period, and doing that arithmetic twice is
  // how the wheel and this diagram come to disagree by a day.
  const ovDay = ov ? Math.round((ov.from + ov.to) / 2) : Math.max(1, length - 14)
  // The fertile window: the five days before ovulation through the day after.
  // Sperm survive up to seven days (NHS), which is why it opens well before.
  const fertileFrom = Math.max(1, ovDay - 5)
  const fertileTo = Math.min(length, ovDay + 1)

  const tick = (d: number) => d % 5 === 0 || d === 1

  return (
    <>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        style={{ maxWidth: 440 }}
        role="img"
        aria-label={
          `Cycle timeline of about ${length} days. The fertile window runs day ${fertileFrom} to day ${fertileTo}; `
          + `ovulation is estimated around day ${ovDay}. An LH surge comes 24 to 36 hours before it and predicts it; `
          + `basal temperature steps up the day after and confirms it.`
        }
      >
        {/* Fertile window, above the bar: a bracket rather than a fill, because
            it spans phases and a fill would read as a fifth phase. */}
        <g stroke={cat('blue')} strokeWidth={1.5} fill="none">
          <path d={`M ${x(fertileFrom - 1)} 26 v -8 H ${x(fertileTo)} v 8`} />
        </g>
        <text x={x(fertileFrom - 1)} y={12} fontSize={9} fill={cat('subtext0')}>
          fertile window · ~6 days
        </text>

        {/* The phases, same widths and hues as the wheel. */}
        {bands.map((b) => (
          <rect
            key={b.id}
            x={x(b.from - 1)}
            y={30}
            width={Math.max(1, x(b.to) - x(b.from - 1))}
            height={20}
            rx={2}
            fill={cat(b.color)}
            /* 0.6, measured rather than guessed: at 0.45 the menstrual red read
               as brown and the four hues stopped matching the swatches in the
               legend, which is the one job the bar has besides showing width. */
            opacity={b.id === 'ovulation' ? 1 : 0.6}
          />
        ))}

        {/* Ovulation: one day, marked through the whole diagram, because every
            other mark here is positioned relative to it. */}
        <line
          x1={x(ovDay - 0.5)} y1={18} x2={x(ovDay - 0.5)} y2={104}
          stroke={cat('green')} strokeWidth={1} strokeDasharray="3 3"
        />
        <text x={x(ovDay - 0.5)} y={62} fontSize={9} textAnchor="middle" fill={onRaised('green')}>
          ovulation
        </text>

        {/* The two signals, in the order they happen: LH before, temperature
            after. The whole point of the diagram is that they are not the same
            event and neither one is "ovulation day". */}
        <g fontSize={9} fill={cat('subtext0')}>
          {/* Label to the LEFT of its marker and the marker left of the
              ovulation line, because that is where the surge is in time — and
              because a label running rightwards from here crosses the dashed
              line it is defined against. */}
          <path d={`M ${x(ovDay - 1.5) - 4} 74 l 4 -6 l 4 6 z`} fill={cat('peach')} />
          <text x={x(ovDay - 1.5) - 12} y={74} textAnchor="end" fill={onRaised('peach')}>LH surge · predicts</text>

          {/* A step, not a curve: the reading sits low, then sits high. */}
          <path
            d={`M ${x(0)} 98 H ${x(ovDay)} V 86 H ${x(length)}`}
            fill="none" stroke={cat('maroon')} strokeWidth={1.5}
          />
          <text x={x(ovDay) + 6} y={112} fill={onRaised('maroon')}>temperature step · confirms</text>
        </g>

        {/* Day axis. Every fifth day plus day 1 — thirty numbers in 336px is a
            grey blur and the bar is read by position. */}
        <g fontSize={8} fill={cat('subtext0')}>
          {Array.from({ length }, (_, i) => i + 1).filter(tick).map((d) => (
            <text key={d} x={x(d - 0.5)} y={124} textAnchor="middle" className="num">{d}</text>
          ))}
        </g>
      </svg>

      <dl className="mt-3 space-y-1.5 text-label text-fg-2">
        <div>
          <dt className="inline font-medium text-fg-1">Ovulation is one day, not a phase. </dt>
          <dd className="inline">
            The egg is released, and the two halves either side are named around that single event.
            The page says <em>window</em> because the day itself can only be placed within a day or
            two, after the fact.
          </dd>
        </div>
        <div>
          <dt className="inline font-medium text-fg-1">Two signals, in this order. </dt>
          <dd className="inline">
            An <Abbr term="LH">LH</Abbr> surge comes 24–36h <em>before</em>, so a test predicts;{' '}
            <Abbr term="BBT">temperature</Abbr> steps up the day <em>after</em> and stays up, so
            this page confirms and never forecasts. <Abbr term="CM">Mucus</Abbr> turning clear and
            stretchy is the sign needing no test.
          </dd>
        </div>
        <div>
          <dt className="inline font-medium text-fg-1">The window is wider than the event. </dt>
          <dd className="inline">
            Sperm survive several days, so it is already open while the chart still looks like an
            ordinary follicular morning. Days counted forward from release are{' '}
            <Abbr term="DPO">DPO</Abbr>.
          </dd>
        </div>
      </dl>
    </>
  )
}
