import { CYCLE_MANUAL } from '../../lib/cycleManual'

/**
 * THE MANUAL · the Guide section as something readable rather than a shelf.
 *
 * A reading-width column and a table of contents, because nine sections of
 * prose in a card grid is a wall. `max-w-[52rem]` rather than the page tier: the
 * measure is what makes prose readable, and this is the only place on the page
 * that is prose rather than data.
 *
 * Every section carries a stable `id` so the `InfoTip` "Learn more" links land
 * somewhere. `scroll-mt` on each heading keeps a jumped-to section clear of the
 * sticky header — without it the heading lands underneath the bar and the
 * reader sees the second paragraph first.
 */
export function Manual() {
  return (
    <div className="mx-auto max-w-[52rem]">
      <nav aria-label="Guide contents" className="mb-5 border-b border-line pb-3">
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {CYCLE_MANUAL.map((s) => (
            <li key={s.id}>
              <a href={`#cycle-${s.id}`} className="text-label text-fg-2 underline underline-offset-2 hover:text-fg-1">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-6">
        {CYCLE_MANUAL.map((s) => (
          <section key={s.id} id={`cycle-${s.id}`} className="scroll-mt-[var(--header-h,4rem)]">
            <h3 className="font-display text-heading font-medium text-fg-1">{s.title}</h3>
            {s.body.map((p, i) => (
              <p key={i} className="mt-2 text-body text-fg-1">{p}</p>
            ))}
            {s.points && (
              <ul className="mt-3 space-y-1.5">
                {s.points.map((p, i) => (
                  <li key={i} className="flex gap-2 text-body text-fg-1">
                    <span aria-hidden className="text-fg-2">·</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
