import { useEffect, useRef } from 'react'
import { Card } from '../ui'
import { CardDeck } from '../page'
import { BBT_RULES, TRACKING_TIPS } from '../../lib/cycleGuide'
import { CYCLE_MANUAL } from '../../lib/cycleManual'

/**
 * THE GUIDE · one card per subject, points inside, no paragraphs — and one
 * card ON SCREEN at a time.
 *
 * The first version of this was a reading column of prose. Wrong surface: the
 * product is **Operate** (see `PRODUCT.md`) — someone opens this page to do
 * something, on a phone, in the evening. A person checking what a disturbed
 * reading means wants the line that answers it, not the third sentence of a
 * paragraph.
 *
 * So: a card per subject, a one-line intro, then discrete points with a bolded
 * label you can scan down. The label is the index; the text is the answer.
 *
 * ── Why it is a `CardDeck` and no longer a grid ─────────────────────────
 *
 * Nine cards in a `CardGrid`, inside a `Card`, inside a rail row, with their
 * own contents `<nav>` above them. Measured at `?demo=1`: this component was
 * **3,483px at 1440 and 5,435px on a phone** — 6.4 phone screens for one card,
 * and the single worst panel on the page by a factor of four. The Guide row
 * holding it came to **11,050px / 13.09 phone screens**.
 *
 * Two faults, and the second is the one no pixel count can see. The length is
 * the obvious one. The other is that the row carried **three navigations** —
 * the rail, this contents list, and the scroll — for one subject;
 * `docs/PAGE-SHAPE.md`'s rule is that a review zone has one. The deck is both
 * answers at once: it shows one section, keeps the other eight a swipe away,
 * and its count/arrows/dots ARE the contents list, so the `<nav>` went with
 * the grid rather than being kept beside a second way to do the same thing.
 *
 * Two sections render existing data modules rather than restating them:
 * `BBT_RULES` and `TRACKING_TIPS` already held the temperature technique and
 * the what-to-log reasons as their own cards. Writing the same advice here
 * would have been a third copy of some of it, so the manual reads those modules
 * and the two cards retired. The modules keep a consumer — an export nobody
 * imports is the trap that cost `views/Pullups.tsx` eleven workout formats.
 */
export function Manual({ section }: {
  /**
   * Scroll this section into the deck, by `CYCLE_MANUAL` id.
   *
   * This is what `InfoTip`'s "Learn more" has always wanted: `lib/cycleHelp.ts`
   * carries **18** `more:` targets and `InfoTip` has always taken an `onMore`
   * prop, and **no call site has ever passed one**, so not one of those links
   * has ever rendered. A dead field is found by grepping the FIELD, never the
   * module — this module was imported, rendered and plainly alive the whole
   * time. And `cycleHelp.test.ts` was green on it throughout, correctly: it
   * asserts every `more:` target RESOLVES to a section here, which says
   * nothing about whether anything links to one. The journey is covered in
   * `views/Cycle.test.tsx` instead, which is where it was missing.
   */
  section?: string | null
}) {
  const ids = useRef(new Map<string, HTMLElement>())

  useEffect(() => {
    if (!section) return
    // `inline: 'center'` is the one that moves a snap scroller; `block` is
    // kept to 'nearest' so a jump inside the deck does not also yank the page.
    // `?.scrollIntoView?.` — jsdom does not implement it, and shimming a
    // browser API into the test environment to satisfy a scroll is contorting
    // the app to make a test pass. The journey is what the test is about.
    ids.current.get(section)?.scrollIntoView?.({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [section])

  return (
    <CardDeck
      label="Manual cards"
      items={CYCLE_MANUAL.map((s) => ({
        key: s.id,
        title: s.title,
        node: (
          <div
            id={`cycle-${s.id}`}
            ref={(el) => { if (el) ids.current.set(s.id, el); else ids.current.delete(s.id) }}
            className="scroll-mt-[var(--header-h,4rem)]"
          >
            <Card band title={s.title} subtitle={s.intro} hideInfo>
              <dl className="space-y-2">
                {s.points.map((p) => (
                  <div key={p.label}>
                    <dt className="text-body font-medium text-fg-1">{p.label}</dt>
                    <dd className="text-label text-fg-2">{p.text}</dd>
                  </div>
                ))}
              </dl>

              {/* The two data modules, rendered where their subject lives. */}
              {s.id === 'taking-your-temperature' && (
                <ol className="mt-3 space-y-1.5 border-t border-line pt-3">
                  {BBT_RULES.map((r, i) => (
                    <li key={i} className="flex gap-2 text-label text-fg-2">
                      <span className="shrink-0 tabular-nums text-fg-1">{i + 1}.</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ol>
              )}
              {s.id === 'getting-started' && (
                <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
                  {TRACKING_TIPS.map((t) => (
                    <li key={t.what} className="text-label">
                      <span className="text-fg-1">{t.what}</span>
                      <span className="text-fg-2"> — {t.why}</span>
                    </li>
                  ))}
                </ul>
              )}

              {s.takeaway && (
                <p className="mt-3 border-t border-line pt-3 text-body text-fg-1">{s.takeaway}</p>
              )}
            </Card>
          </div>
        ),
      }))}
    />
  )
}
