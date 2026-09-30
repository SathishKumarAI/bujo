import { Card } from '../ui'
import { CardGrid } from '../shell/CardGrid'
import { BBT_RULES, TRACKING_TIPS } from '../../lib/cycleGuide'
import { CYCLE_MANUAL } from '../../lib/cycleManual'

/**
 * THE GUIDE · one card per subject, points inside, no paragraphs.
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
 * **`CardGrid`, not a hand-rolled grid.** It asks the viewport, which is right
 * here — these cards are reference and their width should follow the screen
 * rather than the page split. The nested-card ban in the craft floor is why
 * the points are a `<dl>` inside one card rather than nine small cards inside a
 * container.
 *
 * Two sections render existing data modules rather than restating them:
 * `BBT_RULES` and `TRACKING_TIPS` already held the temperature technique and
 * the what-to-log reasons as their own cards. Writing the same advice here
 * would have been a third copy of some of it, so the manual reads those modules
 * and the two cards retired. The modules keep a consumer — an export nobody
 * imports is the trap that cost `views/Pullups.tsx` eleven workout formats.
 */
export function Manual() {
  return (
    <div>
      {/* The contents row is a real nav, not decoration: nine cards is more
          than fits a phone screen and the InfoTips link into them by id. */}
      <nav aria-label="Guide contents" className="mb-4 flex flex-wrap gap-x-4 gap-y-1 border-b border-line pb-3">
        {CYCLE_MANUAL.map((s) => (
          <a
            key={s.id}
            href={`#cycle-${s.id}`}
            className="text-label text-fg-2 underline underline-offset-2 hover:text-fg-1"
          >
            {s.title}
          </a>
        ))}
      </nav>

      <CardGrid>
        {CYCLE_MANUAL.map((s) => (
          <div key={s.id} id={`cycle-${s.id}`} className="scroll-mt-[var(--header-h,4rem)]">
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
        ))}
      </CardGrid>
    </div>
  )
}
