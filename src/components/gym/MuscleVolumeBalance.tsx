import { Icon } from '@/components/Icon'
import { Target } from '@/components/icons'
import { Card, Empty } from '../ui'
import { cat, onRaised } from '../../lib/colors'
import { muscleNames } from '../../lib/muscles'
import { MUSCLE_SET_LANDMARK, type MuscleLoad } from '../../lib/fitness'

/**
 * WEEKLY LOAD PER MUSCLE, AGAINST THE BAND IT IS SUPPOSED TO BE IN.
 *
 * WHAT THIS FILE OWNS: how the week's per-muscle load reads.
 * WHAT IT DOES NOT OWN: the count (`weeklyMuscleLoad`) or the landmark.
 *
 * ── Two things were wrong, and one of them was the number ─────────────────
 *
 * Reported as *"improve the UI of this page, it's not looking good"*, with the
 * card pasted in: twelve rows reading Traps 66, Lats 61, Biceps 46 … against a
 * stated target of 10–20, under a three-dot colour legend. Nine of the twelve
 * were red.
 *
 * **The number first, because a prettier wrong card is still wrong.** It was
 * `weeklySetsPerMuscle`, which adds a whole set to every muscle a lift
 * touches — so one deadlift set was a set for traps, lats, glutes, hamstrings
 * and quads, and no muscle could land inside a 10–20 band in any week with
 * real training in it. It now reads `weeklyMuscleLoad`, where **an assist
 * counts half** — the convention the landmark is stated in (COD-330).
 *
 * **Then the drawing.** Three changes, each removing something:
 *
 * | Was | Now | Why |
 * |---|---|---|
 * | A three-colour legend (`● below 10 ● in range ● over 20`) | The band is **drawn** on every track | A legend is a lookup table for a picture. If the target zone is on the bar, "in range" is a position, not a colour you have to decode |
 * | Every bar coloured by zone — nine of twelve red | One accent; only the **under-trained** rows carry a tone | Being over 20 on one muscle is information, not an error, and a wall of red says "everything is broken" about a good week |
 * | The legend was the only summary | A sentence: "9 in range · 2 under · 1 over" | That is what the legend was trying to be, said in words, in the subtitle where the finding belongs |
 *
 * The scale runs to the band's top plus a margin, not to the biggest value, so
 * the band keeps the same position on every row and the rows stay comparable;
 * anything past the end draws a cap marker and its real figure beside it.
 *
 * Two columns once there is room, `@container` rather than a viewport query:
 * this card sits in a grid cell whose width is the page split's decision. At
 * ~350px it stays one column; at full row it splits. Measured on the original:
 * eleven muscles in one list gave each bar 606px to encode 1-to-20, so a "5"
 * painted 151px and left 455px empty, eleven times.
 */
export function MuscleVolumeBalance({ load, sets, unroled, setFocusEx }: {
  load: MuscleLoad[]
  /** Working sets behind the figures, for the subtitle. */
  sets: number
  /** How many of them had no curated roles and were counted all-primary. */
  unroled: number
  setFocusEx: (e: string | null) => void
}) {
  const { min, max } = MUSCLE_SET_LANDMARK
  const named = load
    .map((c) => ({ ...c, name: muscleNames([c.muscle])[0] }))
    .filter((c) => c.name)

  /* The scale is the BAND plus a quarter, not the biggest value: a scale that
     follows the data moves the band on every re-render, and a band that moves
     is not a reference. */
  const scaleMax = max * 1.25
  const under = named.filter((c) => c.load < min)
  const over = named.filter((c) => c.load > max)
  const inRange = named.length - under.length - over.length

  const verdict = named.length === 0
    ? 'Hard sets per muscle this week, an assist counting half'
    : `${inRange} in range · ${under.length} under ${min} · ${over.length} over ${max}`
          + (unroled > 0 ? ` · ${Math.round((unroled / Math.max(1, sets)) * 100)}% of sets estimated` : '')

  return (
    <Card
      band
      collapsible
      title={<span className="inline-flex items-center gap-2"><Icon as={Target} size="md" className="text-mauve" /> Muscle balance</span>}
      subtitle={verdict}
    >
      {named.length === 0 ? (
        <Empty>Log some working sets this week to see your per-muscle volume.</Empty>
      ) : (
        <div className="@container">
          <div className="grid gap-x-6 gap-y-1.5 @lg:grid-cols-2">
            {[named.slice(0, Math.ceil(named.length / 2)), named.slice(Math.ceil(named.length / 2))]
              .filter((half) => half.length > 0)
              .map((half, i) => (
                <ul key={i} className="grid grid-cols-[auto_1fr_auto] content-start gap-y-1.5">
                  {half.map((c) => {
                    const low = c.load < min
                    const high = c.load > max
                    const pct = Math.min(100, (c.load / scaleMax) * 100)
                    return (
                      <li key={c.muscle} className="col-span-3 grid grid-cols-subgrid items-center gap-x-2 text-body">
                        <button
                          onClick={() => setFocusEx(c.name)}
                          className="max-w-48 truncate text-left text-fg-1"
                          title={`${c.name}: ${c.direct} direct and ${c.indirect} assisting ${c.indirect === 1 ? 'set' : 'sets'} this week · focus the muscle map`}
                        >
                          {c.name}
                        </button>
                        <div className="relative h-3.5 overflow-hidden rounded-pill bg-ink-2">
                          {/* THE BAND, drawn. Everything else on the row is
                              read against it, which is what makes the legend
                              unnecessary. */}
                          <div
                            className="absolute inset-y-0 border-x"
                            style={{
                              left: `${(min / scaleMax) * 100}%`,
                              width: `${((max - min) / scaleMax) * 100}%`,
                              background: cat('green') + '1f',
                              borderColor: cat('green') + '4d',
                            }}
                          />
                          {/* The load. One accent — under-trained is the only
                              state that is a finding, so it is the only one
                              that gets a tone. */}
                          <div
                            className="absolute inset-y-0 left-0 rounded-pill"
                            style={{ width: `${pct}%`, background: low ? cat('peach') : cat('mauve') }}
                          />
                          {/* Past the end of the scale: a cap, so the row does
                              not pretend the bar stops where the track does. */}
                          {high && c.load > scaleMax && (
                            <div className="absolute inset-y-0 right-0 w-1" style={{ background: cat('mauve') }} />
                          )}
                        </div>
                        <span
                          className="num min-w-9 text-right font-medium"
                          style={{ color: low ? onRaised('peach') : 'var(--color-fg-1)' }}
                        >
                          {c.load}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              ))}
          </div>
          {/* What the shaded zone IS, once, instead of a dot per state. */}
          <p className="mt-3 text-micro text-fg-2">
            The shaded zone is {min}–{max} sets a week, the hypertrophy landmark. A set counts once for the muscle doing the work and half for a muscle assisting
            {unroled > 0 ? ', and an exercise with no role data is counted all-primary' : ''}.
          </p>
        </div>
      )}
    </Card>
  )
}
