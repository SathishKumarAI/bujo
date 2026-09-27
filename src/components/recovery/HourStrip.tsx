import { cat, onAccent } from '../../lib/colors'
import type { urgeHourHistogram } from '../../lib/urge'

type HourHist = ReturnType<typeof urgeHourHistogram>

/**
 * The 24-hour urge clock — twelve columns, two rows, one cell per hour.
 *
 * Extracted from `HighRiskHoursCard`, which was its only renderer, because the
 * per-addiction panel needs the same clock over a filtered log. A second copy
 * would have been a second copy of the contrast decision below, and this app
 * has already written that exact pairing wrong four times.
 *
 * `hue` is a parameter but there is **no categorical use of it**: the pooled
 * card and every per-addiction card all draw `peach`, because they are all the
 * same measure (urges) and identity is carried by the card's own title. COD-116
 * is open against colouring ten series by index on this page; one hue plus a
 * label is the instrument a ten-category chart actually wants.
 */
export function HourStrip({
  hourHist,
  label,
  hue = 'peach',
}: {
  hourHist: HourHist
  /** The sentence a screen reader gets for the whole grid. */
  label: string
  hue?: string
}) {
  return (
    <div>
      <div className="grid grid-cols-12 gap-1" role="img" aria-label={label}>
        {hourHist.map((h) => (
          <div key={h.hour} title={`${h.count} urge${h.count === 1 ? '' : 's'} around ${((h.hour % 12) === 0 ? 12 : h.hour % 12)}${h.hour < 12 ? 'am' : 'pm'}`}
            className="grid aspect-square place-items-center rounded text-micro"
            style={{
              background: h.count > 0 ? cat(hue) + Math.round(38 + h.heat * 217).toString(16).padStart(2, '0') : cat('surface0'),
              // `overlay0` on the empty-cell `surface0` measured **2.57:1** at
              // 10px — the same pairing, the same number and the same cause as
              // the Stats mood calendar, which is the fourth time this exact
              // combination has been written in this app. `crust` is the
              // light-on-saturated half; applying its partner to the *neutral*
              // background is the mistake each time. `subtext0` is the next
              // step up, still clearly quieter than a hot cell, and clears 4.5
              // in all five themes.
              //
              // Only the four `hour % 6 === 0` cells print a digit, so this hid
              // behind two labels — 12pm and 6pm, whenever those hours had no
              // urges logged.
              color: h.heat > 0.5 ? onAccent(cat(hue)) : cat('subtext0'),
            }}>
            {h.hour % 6 === 0 ? h.hour : ''}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-micro text-fg-2"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span></div>
    </div>
  )
}
