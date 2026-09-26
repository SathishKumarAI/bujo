import type { ReactNode } from 'react'

/**
 * A reference block — a heading and a hairline, not a box.
 *
 * "Cards are objects, not sections": a raised card says *this thing has its own
 * state and its own actions*. Recovery's three reference blocks — the coping
 * techniques, the milestone ladder, the reset log — have none. They are text
 * and a list, and the chrome was telling the reader they were interactive.
 *
 * The five cards that remain on this page do own actions (urge surfing, the
 * reset form, per-addiction streaks, the commitment contract, trigger plans),
 * so Recovery stays over the two-raised-card cap on purpose. The contract
 * anticipates exactly one page in a cluster whose subject really is a
 * collection of separately-actionable objects, and an abstinence tracker is
 * that page. Dissolving a real object into a section to hit a number would cost
 * more than the number is worth.
 */
export function RefBlock({ title, subtitle, children }: { title: ReactNode; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <h3 className="flex flex-wrap items-baseline gap-x-2 border-b border-line pb-1 text-body font-medium text-fg-1">
        {title}
        {subtitle && <span className="text-label font-normal text-fg-2">{subtitle}</span>}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  )
}
