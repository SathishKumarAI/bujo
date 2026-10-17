import { CYCLE_PHASES } from '../../lib/cycleGuide'
import { onRaised } from '../../lib/colors'
import { Pill } from '../ui'

/**
 * FOOD BY PHASE · what the cravings tend to be, what is worth eating, and who
 * said so.
 *
 * Asked for from the gym: "what kind of food they need to have in what phase",
 * formatted so anyone can read it. So it is long-form typography rather than
 * a grid of tiles — `.prose-doc` is the app's GitHub-pages-style prose block,
 * already in `index.css` for exactly this and previously with no call site.
 *
 * **No markdown runtime and no hand-rolled parser.** The content is structured
 * data in `lib/cycleGuide.ts` (`cravings`, `eat`, `sources` per phase) and this
 * renders it as real elements, which is the same trade the Help page's guide
 * makes: a parser would be a dependency plus an escaping bug in exchange for
 * markup this file already writes.
 *
 * It reads `CYCLE_PHASES` and holds no content of its own — deliberately, and
 * `cycleGuide.test.ts` pins the counts. This repo has lost eleven workout
 * formats to a pass that retyped a data module inline instead of importing it,
 * with every gate green, and a page of plausible-looking food advice is exactly
 * the kind of thing nobody would notice going stale.
 *
 * The training line is `tip`, reused rather than restated: one opinion per
 * phase about whether it suits hard sessions, written once.
 */
export function PhaseNutrition() {
  return (
    /* Two columns from `sm` up, one on a phone, spelled out — the same shape
       the four-phases fold beside it already uses. Not decoration: four
       independent sections in one column measured 1,380px open on a desktop and
       the page's "open" number is read as seriously as its shipped one. Each
       cell keeps `.prose-doc`'s own 56ch measure, so the columns are the width
       control and nothing here overrides it. */
    <div className="grid grid-cols-[minmax(0,1fr)] gap-x-6 sm:grid-cols-2">
      <p className="prose-doc sm:col-span-2">
        Cravings are a <em>tendency</em>, not a schedule — the useful move is to check these
        against your own log rather than to plan around them. Every dietary claim below is one a
        published health body makes, with the page it came from linked underneath.
      </p>

      {CYCLE_PHASES.map((ph) => (
        <section key={ph.id} className="prose-doc">
          <h3 className="flex flex-wrap items-center gap-2">
            <span style={{ color: onRaised(ph.color) }}>{ph.name}</span>
            <Pill color={ph.color} size="micro" className="px-2">{ph.days}</Pill>
          </h3>
          {/* Three labelled lists, not three paragraphs. Before the split
              the luteal `eat` was a **456-character** paragraph carrying four
              pieces of advice and two citations; `.prose-doc`'s 56ch measure
              made it eight lines of unbroken text in a reference card nobody
              reads twice. Rendering the array directly would have painted the
              points concatenated, which is why this changed with the data. */}
          <Block label="Cravings" items={ph.cravings} />
          <Block label="Worth eating" items={ph.eat} />
          <Block label="Training" items={ph.tip} />
          <p className="text-label">
            {ph.sources.length === 1 ? 'Source: ' : 'Sources: '}
            {ph.sources.map((s, i) => (
              <span key={s.url}>
                {i > 0 && ' · '}
                <a href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
              </span>
            ))}
          </p>
        </section>
      ))}
    </div>
  )
}

/**
 * One heading and its points, inside `.prose-doc`.
 *
 * `<ul>` rather than a run of `<p>`: the heading says what the list is and
 * the points are peers of each other, which is a list — and `.prose-doc`
 * already styles one. The label is a `<strong>` on its own line so the eye
 * can skip a whole block it does not want, which is the thing a paragraph
 * makes impossible.
 */
function Block({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <>
      <p className="points-label"><strong className="font-medium text-fg-1">{label}</strong></p>
      <ul className="points-list">
        {items.map((t) => <li key={t}>{t}</li>)}
      </ul>
    </>
  )
}
