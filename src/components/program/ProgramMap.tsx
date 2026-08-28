import { cat, onAccent } from '../../lib/colors'
import type { ProgramState } from './useProgram'

/**
 * The whole program on one grid: every day of every block, what is finished,
 * where you are, and where the program says to go next.
 *
 * It replaces two rows of bare numbers — "Block 1 2 3" over "Day 1 2 3 4 5 6" —
 * which asked you to hold the pairing in your head and could not answer "how
 * much of block 2 is left" at all. A three-month plan's first question is
 * *where am I in it*, and a picker that only navigates does not answer it.
 *
 * Cells are `flex-1` with a floor rather than a fixed width, for the reason
 * `DayGrid` learned the hard way: a fixed cell in a fluid column either strands
 * the grid at a fraction of its container or overflows the phone. They divide
 * whatever they are given, and wrap when a row cannot hold six.
 */
export function ProgramMap({ s }: { s: ProgramState }) {
  const pct = s.totalDays === 0 ? 0 : Math.round((s.doneCount / s.totalDays) * 100)

  return (
    <section aria-label={`${s.p.name} progress`}>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 className="text-label text-fg-2">Program map</h2>
        <span className="num text-label text-fg-2">
          {s.doneCount}/{s.totalDays} days · {pct}%
        </span>
      </div>

      {/*
        A bar rather than a Ring: the question is "how far along the twelve
        weeks", which is a line, and a ring here would be the second circular
        progress control on a page that already has none to spare.
        `aria-hidden` because the figure beside it is the same fact in words —
        a progressbar role would make a screen reader read the number twice.
      */}
      <div aria-hidden className="rounded-pill mb-3 h-1.5 w-full overflow-hidden" style={{ background: cat('surface0') }}>
        <div className="rounded-pill h-full transition-[width] duration-500" style={{ width: `${pct}%`, background: cat('green') }} />
      </div>

      <div className="flex flex-col gap-2">
        {s.p.weeks.map((w) => (
          <div key={w.week}>
            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-label text-fg-1">{s.unit} {w.week}</span>
              {w.label && <span className="text-label text-fg-2">{w.label}</span>}
              {s.weekComplete(w.week) && <span className="text-label text-green">complete</span>}
            </div>
            <div className="flex flex-wrap gap-1">
              {w.days.map((d) => (
                <DayCell key={d.day} s={s} week={w.week} day={d.day} focus={d.focus} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function DayCell({ s, week, day, focus }: { s: ProgramState; week: number; day: number; focus: string }) {
  const complete = s.dayComplete(week, day)
  const selected = s.week === week && s.day === day
  const next = s.resume.week === week && s.resume.day === day

  // Three states, three channels. Selected fills with the accent; complete is a
  // green wash plus a tick; next is an outline plus a ▸. Colour alone was the
  // old picker's only signal, which fails the same way for a screen reader and
  // for anyone who cannot separate mauve from surface0 — so the mark and the
  // `aria-label` carry it too.
  //
  // `onAccent`, never `cat('crust')`: crust is near-white in the light themes,
  // so a hand-written foreground on a filled accent is correct in Mocha and
  // unreadable in Latte.
  const fill = selected ? cat('blue') : complete ? `${cat('green')}22` : cat('surface0')
  const fg = selected ? onAccent(cat('blue')) : complete ? cat('green') : cat('subtext1')

  const state = complete ? ', complete' : next ? ', next up' : ''
  return (
    <button
      onClick={() => s.goTo(week, day)}
      aria-pressed={selected}
      aria-label={`${s.unit} ${week}, day ${day}, ${focus}${state}`}
      // 3rem, so a six-day week still fits one row in a 324px phone column —
      // at 4.5rem it wrapped to five rows per block and the map cost 377px of
      // a page whose next section is the thing you came to tick off.
      className="min-w-[3rem] flex-1 rounded px-1.5 py-1 text-left transition-colors"
      style={{
        background: fill,
        color: fg,
        // The next-up day is outlined rather than filled: it is a suggestion,
        // and the page is allowed one filled control at a time.
        boxShadow: next && !selected ? `inset 0 0 0 1px ${cat('blue')}` : undefined,
      }}
    >
      {/* The number alone — the row above already says which block this is, and
          repeating "Day" in every cell is the width that stopped a week fitting
          one line. */}
      <span className="num block text-label">
        <span aria-hidden>{complete ? '✓ ' : next ? '▸ ' : ''}</span>
        <span aria-hidden>{day}</span>
      </span>
      {/*
        The focus name from `sm` up only.

        A phone gives a five-day week ~43px of content per cell, and
        "Conditioning" needs 60. Truncating it produced 30 clipped strings on
        Pull-ups against a gate that had been at zero, and wrapping does not
        help a single long word. Widening the cell is the other lever, and it
        costs the thing the map was made small for: at 5rem the eighteen-day
        hypertrophy grid goes back to 377px on a phone.

        So the phone cell is the day number, and the focus is one line below in
        the day header ("Push · day 1") — where it is legible rather than
        elided. Every cell still names it in full in `aria-label`.

        No `opacity` on it either. Fading a foreground that was solved against
        its background is how a 4.6:1 pair becomes 3.4:1 with nothing failing
        loudly; size carries the hierarchy instead.
      */}
      <span aria-hidden className="hidden text-micro leading-tight sm:block">{focus}</span>
    </button>
  )
}
