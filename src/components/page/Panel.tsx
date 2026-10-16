import { Fragment, type ReactNode } from 'react'

// Panel furniture for a `SectionRail` page — the named-item card, the grid it
// sits in, the term/detail list inside it, and the quiet rating pill.
//
// WHAT THIS FILE OWNS: the shape of a reference panel's contents.
// WHAT IT DOES NOT OWN: the rail itself (`SectionRail`), the page frame
// (`PageLayout`), or anything that knows what a pull-up or a push-up is.
//
// Lifted out of `views/Pullups.tsx`, where it was written, the moment Home
// Workout needed the same four pieces — its manual panels were the SAME five
// shapes the docstring below describes, one page later. A second copy is how
// two pages come to disagree about what a card is, and the pull-up page's own
// history is the argument: what it fixed was five local answers to one
// question.

/**
 * ── The five reference panels share three pieces ──────────────────────────
 *
 * Form, Principles, Formats, Progressions and Equipment were five different
 * answers to the same question — two used `border-t` separated `<li>`s, one
 * used `space-y-3` bare `<div>`s, one put its two facts in a run-on sentence
 * with two colons in it, and one wrote its name and body as
 * `<strong>Name:</strong> body`. They hold the same shape of thing: a named
 * item, an optional figure beside the name, and a short body. One card, used
 * five times, is also what makes the two-column grid safe to apply once.
 */
export function PanelGrid({ children }: { children: ReactNode }) {
  /*
    `@lg` = 512px of CONTAINER. The review column is 678px while the window is
    1440, so `CardGrid`'s viewport `md:`/`2xl:` steps would put three 210px
    columns in it, and `MasonryGrid` breaks at `@3xl` (768px) and would do
    nothing at all here. Both failures are in CLAUDE.md, from opposite sides.
    The container is `@container/page`, declared by `Review` above.
  */
  return <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 @lg/page:grid-cols-2">{children}</ul>
}

export function PanelCard({
  title, right, titleColor, children,
}: {
  title: string
  /** A figure that belongs beside the name — a duration, a video link, an index. */
  right?: ReactNode
  /** An inline accent for the title only; `PULLUP_PRINCIPLES` carries one each. */
  titleColor?: string
  children: ReactNode
}) {
  return (
    /*
      `group`, because a card that holds a record holds a `.reveal` control.
      `.reveal` (index.css) is `opacity: 0` on a hover-capable device and comes
      back on `.group:hover` — so a × inside a card with no `.group` ancestor is
      invisible on a desktop until it is TABBED to, and visible on a phone,
      which is the opposite of the intent. Both history pages ship one: Home
      Workout's delete and now Fitness's. The fix belongs here rather than on
      each card's markup, for the reason the class itself records — 24 controls
      across 18 files once got this wrong one call site at a time.

      Safe to add: nothing rendered inside a `PanelCard` anywhere in the app
      uses an unnamed `group-hover:`; Pull-ups' one instance is the named
      `group/rep`, which this cannot capture.
    */
    <li className="group flex flex-col rounded-card border border-line bg-ink-1 p-3">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <h3 className="text-body font-medium text-fg-1" style={titleColor ? { color: titleColor } : undefined}>{title}</h3>
        {right && <span className="shrink-0">{right}</span>}
      </div>
      {children}
    </li>
  )
}

/** Term and detail, aligned down the card. A `<dl>` because that is what two
 *  labelled facts are, and a grid because the default flow puts the detail on
 *  its own line and loses the column. */
export function DefList({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="mt-2 grid grid-cols-[2.9rem_minmax(0,1fr)] gap-x-2 gap-y-0.5 border-t border-line pt-2 text-label">
      {rows.map(([term, detail]) => (
        <Fragment key={term}>
          <dt className="text-fg-2">{term}</dt>
          <dd className="text-fg-1">{detail}</dd>
        </Fragment>
      ))}
    </dl>
  )
}

/** A rating, as a quiet pill. No accent: fourteen cards of coloured tags is the
 *  six-colour stats row DESIGN.md argues against, and neither rating is a
 *  warning — they are both just facts about the session. */
export function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-pill bg-ink-2 px-2 py-0.5 text-label text-fg-2">{children}</span>
}
