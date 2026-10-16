import { cat, onRaised } from '../../lib/colors'

/**
 * A COMPARISON OF MORE THAN ABOUT FIVE THINGS · one bar per row.
 *
 * WHAT THIS FILE OWNS: the row geometry of a comparison — label, track, figure,
 * sample — and the rule that the colour goes on the BAR.
 * WHAT IT DOES NOT OWN: the card around it, what the rows mean, or where the
 * numbers came from.
 *
 * `docs/REUSABLE-PATTERNS.md` §21 is the measurement: seven 44px cells inside a
 * 353px card, each holding a weekday, a percentage and a games count — `100%`
 * alone needs 38px, so the figure *was* the cell, and four-up on a phone
 * wrapped a week into 4+3, which loses the one shape a week has. A bar per row
 * reads at **348px and at 702px** with no breakpoint.
 *
 * Written as a component on its fourth caller. `WeekdayPerformanceCard`,
 * `ScoringPerformanceCard` and `LevelMatchupCard` each hand-rolled this row,
 * and Fitness needs three more — which is the point in this repo's history
 * where a class named for one call site gets reused by the third (`.week-in` →
 * `.settle-in`). Pickleball's three are deliberately left alone for now: they
 * render identically today and migrating them is a diff with no measurement
 * behind it.
 *
 * **The colour is a ramp on the track's fill, never a ground under the text.**
 * A tinted background under a percentage is the accent-on-wash trap CLAUDE.md
 * has measured at 3.64:1; a bar is a graphic at 3:1 and the figure stays a
 * solved foreground (`onRaised`). Three steps at most, never a gradient —
 * nobody can read a value off a continuous ramp.
 *
 * **An empty row still draws its track.** A rest day is a visible gap in the
 * week; dropping the row makes "nothing on Monday" and "no Monday" the same
 * picture, and only one of those is true.
 */
export interface BarRow {
  /** Drawn in the fixed left column. Keep it to about five characters. */
  label: string
  /** Fill, 0–100 of the track. */
  pct: number
  /** The figure. `null` draws an em dash, which is "nothing here", not zero. */
  value: string | null
  /** A quieter second figure — the sample behind the bar ("4 sessions", "3/5"). */
  note?: string
  /** Accent token for the fill. One token for a volume ramp, three for a score. */
  tone?: string
  /** Opens the entries behind this row. Omit and the row is not interactive. */
  onPick?: () => void
  /**
   * The full sentence, for the accessible name and the hover title.
   *
   * Required when `onPick` is set: the row draws `Thu`, and a button announcing
   * "Thu" is `USER-CONTROL.md` rule 4 — a shortened label is a shortened name
   * unless it is said somewhere.
   */
  announce?: string
}

export function BarList({ rows, labelWidth = 'w-10' }: {
  rows: BarRow[]
  /** Tailwind width for the label column — `w-14` for a date, `w-10` for a day. */
  labelWidth?: string
}) {
  return (
    <ul className="space-y-1">
      {rows.map((r) => {
        const tone = r.tone ?? 'teal'
        const has = r.value != null
        const body = (
          <>
            <span className={`${labelWidth} shrink-0 truncate text-label text-fg-2`}>{r.label}</span>
            <span aria-hidden className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-pill bg-ink-2">
              {has && r.pct > 0 && (
                <span className="block h-full rounded-pill" style={{ width: `${Math.max(3, Math.min(100, r.pct))}%`, background: cat(tone) }} />
              )}
            </span>
            {/*
              THE LEADING SPACES ARE LOAD-BEARING, and they are inside the
              spans rather than between them.

              `gap-2` is layout, not text: with nothing between these three
              spans the row PAINTS as "Oct 16+232023", and no accessible name
              reading "Oct 16 +23 2023 — Fri, Oct 16: 2023 kcal…" can contain
              that. A `{' '}` between the spans would fix the text and add a
              fourth flex item to a row whose columns are measured; a leading
              space inside a `text-right` span is absorbed at the left edge and
              moves nothing.

              Third instance in one day, after the rail's "All24" and a
              heading's "Log what you ateTap to hide". Two adjacent spans paint
              one word — it is invisible in the JSX and obvious the moment you
              read `textContent`.
            */}
            <span
              className="num w-14 shrink-0 text-right text-label font-medium"
              style={{ color: has ? onRaised(tone) : cat('overlay0') }}
            >
              {' '}{r.value ?? '—'}
            </span>
            {/* `subtext0`, not `overlay0` at 10px: the quiet-neutral pairing is
                2.57:1 and is one of the sixteen violations the armed a11y gate
                found. `text-fg-2` resolves to the solved token. */}
            <span className="num w-16 shrink-0 text-right text-micro text-fg-2">{' '}{r.note ?? ''}</span>
          </>
        )
        /*
          THE NAME HAS TO CONTAIN WHAT THE ROW DRAWS.

          A pickable row is a BUTTON, and `label-content-name-mismatch` (WCAG
          2.5.3) compares its accessible name against the painted text — which
          here is three spans with no text node between them: `Oct 16`, `+23`
          and `2023` paint as **"Oct 16 +23 2023"** once the browser has laid
          them out. A hand-written `announce` ("Thu, Oct 16: 2023 kcal, 23 over
          the 2000 target — open this day") says MORE and says it better, and
          contains none of it.

          So the drawn text leads and the sentence follows. Announcing more is
          fine; announcing something else is not — a speech-input user says
          what they can see.

          Found by `npm run a11y:panels` and by nothing else: these rows live
          on rail rows (`nutrition/Trend`, `fitness/Mix`, `pickleball/Results`)
          that the main a11y gate never opens, so **32 violations across four
          pages** survived the sweep that fixed 137 of them this morning. The
          COD-237 blind spot, demonstrated.
        */
        const drawn = [r.label, r.value ?? '—', r.note].filter(Boolean).join(' ')
        const spoken = r.announce
          ? (r.announce.toLowerCase().includes(drawn.toLowerCase()) ? r.announce : `${drawn} — ${r.announce}`)
          : r.label
        return (
          <li key={r.label}>
            {r.onPick && has ? (
              <button
                type="button"
                onClick={r.onPick}
                className="flex w-full items-center gap-2 rounded-control px-1 py-0.5 text-left transition-colors hover:bg-ink-2"
                aria-label={spoken}
                title={r.announce}
              >
                {body}
              </button>
            ) : (
              <span className="flex w-full items-center gap-2 px-1 py-0.5" title={r.announce}>
                {body}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
