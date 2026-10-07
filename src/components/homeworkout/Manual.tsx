import { useStickyState } from '../../lib/useStickyState'
import { SectionRail } from '../page'
import { VideoLink } from '../VideoLink'
import { onRaised } from '../../lib/colors'
import { FAMILY_LABEL, filterExercises, type Family } from '../../lib/homeExercises'
import { HOME_MANUAL, HOME_SAFETY, HOME_SOURCES, sourceById } from '../../lib/homeManual'
import { HOME_EQUIPMENT, HOME_GOALS, HOME_LEVERS, HOME_PRINCIPLES } from '../../lib/homeProgramming'

/**
 * ZONE 3 · the manual, as chapters behind a rail.
 *
 * Twelve chapters: the nine movement families, plus programming, kit and the
 * citation ledger. Twelve folds would be twelve grey titles and a page you hunt
 * through; `docs/PAGE-SHAPE.md` says past about four peer groups the group names
 * become navigation, and that is what this is. Same `SectionRail` as Insights,
 * Coaching and the pull-up manual.
 *
 * The family rows are rendered **from `HOME_MANUAL`**, not from a hand-written
 * list — the registry decides the chapters, so a family added to
 * `lib/homeExercises.ts` and given a chapter appears here with no edit. The
 * repo's own rule, after a page offered six filter chips over nine
 * differently-named groups.
 *
 * No "All" row. The chapters do not overlap, and all twelve at once is the long
 * page this replaces.
 *
 * **Known gate ceiling (COD-237).** A rail has no `aria-expanded`, so
 * `openFolds()` in `scripts/a11y-axe.mjs` cannot reach the eleven chapters it
 * does not open on, and the fold column will read 0 rather than 12. The rail is
 * still the right instrument; what is not allowed is letting that number read
 * as coverage. See the PR for what was probed by hand instead.
 */
const REFERENCE = [
  { id: 'programming', label: 'How to train' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'sources', label: 'Sources' },
] as const

const CHAPTERS = [
  ...HOME_MANUAL.map((c) => ({ id: c.family as string, label: FAMILY_LABEL[c.family] })),
  ...REFERENCE,
]

export function Manual() {
  const [chapter, setChapter] = useStickyState<string>(
    /* The push family first: it is the family with the most variations, the one
       everybody starts with, and the one people are most often wrong about. */
    'homeworkout.chapter', 'push', CHAPTERS.map((c) => c.id),
  )

  return (
    <section>
      <h2 className="mb-3 text-label text-fg-2">Manual</h2>
      {/* Container on the outer div, grid on the inner: an element cannot query
          itself. Phone column spelled out, or the chip row's min-content sizes
          the only implicit track and the page scrolls sideways. Both traps are
          in docs/PAGE-SHAPE.md and both have been hit here before.

          `@2xl` (42rem = 672px), not the `@4xl` (896px) the pull-up manual
          uses, and the difference is measured rather than preferred. **Zone 3
          at the 1180 tier is 722px** — the same number PAGE-SHAPE records for
          a review zone — so `@4xl` never fires there and the rail falls back
          to its phone chip row ON DESKTOP. With six chapters that is survivable;
          with twelve it was a **1085px strip inside a 730px box**, so a third
          of the chapters, Sources among them, were reachable only by
          horizontally scrolling a control nothing suggests you can scroll.
          At 672px the vertical rail fires in a 722px column: 192px of rail and
          a ~500px reading measure, which is the right trade for a chapter list
          you are meant to navigate. */}
      <div className="@container/page">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-3 @2xl/page:grid-cols-[12rem_minmax(0,1fr)]">
          <SectionRail
            label="Home workout manual chapters"
            groups={CHAPTERS.map((c) => ({ id: c.id, label: c.label }))}
            value={chapter}
            onChange={(id: string | null) => setChapter(id ?? 'push')}
            /* MUST match the grid breakpoint above. They disagreeing is worse
               than either alone: the grid hands the rail a 192px column and
               the rail, still on its own 896px threshold, fills it with a
               1085px horizontal strip. Found by measuring, not by reading. */
            railAt="2xl"
          />
          <div className="min-w-0">
            {chapter === 'programming' ? <Programming />
              : chapter === 'equipment' ? <Equipment />
                : chapter === 'sources' ? <Sources />
                  : <FamilyChapter family={chapter as Family} />}
          </div>
        </div>
      </div>
    </section>
  )
}

function Head({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline gap-x-3 border-b border-line pb-1.5">
      <h3 className="text-heading font-medium text-fg-1">{title}</h3>
      <p className="text-label text-fg-2">{blurb}</p>
    </div>
  )
}

function Cited({ ids, prefix }: { ids: readonly string[]; prefix: string }) {
  const rows = ids.flatMap((id) => sourceById(id) ?? [])
  if (rows.length === 0) return null
  return (
    <p className="text-label text-fg-2">
      {prefix}{' '}
      {rows.map((s, i) => (
        <span key={s.id}>
          {i > 0 && ' · '}
          <a href={s.url} target="_blank" rel="noreferrer">{s.publisher}</a>
        </span>
      ))}
    </p>
  )
}

function FamilyChapter({ family }: { family: Family }) {
  const c = HOME_MANUAL.find((x) => x.family === family)
  if (!c) return null
  const moves = filterExercises({ family })

  return (
    <>
      <Head title={FAMILY_LABEL[family]} blurb={c.blurb} />
      <div className="space-y-4 text-label text-fg-2">
        <Block title="Set up" items={c.setup} />
        <Block title="Execute" items={c.execution} />
        <div>
          <p className="text-body text-fg-1">The mistake</p>
          <p className="mt-1">{c.mistake}</p>
        </div>
        <Block title="How to progress" items={c.progress} />

        <div>
          <p className="text-body text-fg-1">{moves.length} movement{moves.length === 1 ? '' : 's'} in this family</p>
          <ul className="mt-1 space-y-1">
            {moves.map((m) => (
              <li key={m.id} className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-fg-1">{m.name}</span>
                <span className="capitalize">{m.difficulty}</span>
                <VideoLink name={m.name} yt={m.yt} label="" size="sm" />
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-line pt-2">
          <Cited ids={c.sources} prefix="Programming claims above:" />
          {c.cueSources.length > 0
            ? <Cited ids={c.cueSources} prefix="Cues and the named error follow:" />
            : (
              /* An empty citation list is a real answer and it is printed. The
                 alternative is lending a guideline's authority to a cue it does
                 not support — the citation version of the `help ?? subtitle`
                 trap: it looks checked. */
              <p>No reachable authority publishes cues for these movements. What is above is standard coaching language, not a citation.</p>
            )}
          {c.cueNote && <p className="mt-1 italic">{c.cueNote}</p>}
        </div>
      </div>
    </>
  )
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-body text-fg-1">{title}</p>
      <ol className="mt-1 list-inside list-decimal space-y-1">
        {items.map((i) => <li key={i}>{i}</li>)}
      </ol>
    </div>
  )
}

function Programming() {
  return (
    <>
      <Head title="How to train" blurb="Sets, reps and rest — and how to get harder without a weight rack" />
      <div className="space-y-4 text-label text-fg-2">
        <table className="w-full text-left text-label">
          <caption className="sr-only">Sets, reps, rest and effort for each training goal, with the sources for each row.</caption>
          <thead>
            <tr className="text-fg-2">
              <th scope="col" className="py-1 pr-2 font-normal">Goal</th>
              <th scope="col" className="py-1 pr-2 font-normal">Sets</th>
              <th scope="col" className="py-1 pr-2 font-normal">Reps</th>
              <th scope="col" className="py-1 font-normal">Rest</th>
            </tr>
          </thead>
          <tbody>
            {HOME_GOALS.map((g) => (
              <tr key={g.id} className="border-t border-line align-top">
                <th scope="row" className="py-1.5 pr-2 text-left font-normal" style={{ color: onRaised('mauve') }}>{g.label}</th>
                <td className="py-1.5 pr-2">{g.sets}</td>
                <td className="py-1.5 pr-2">{g.reps}</td>
                <td className="py-1.5">{g.rest}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {HOME_GOALS.map((g) => (
          <div key={g.id} className="border-t border-line pt-2">
            <p className="text-body text-fg-1">{g.label}</p>
            <p className="mt-1">{g.aim}</p>
            <p className="mt-1"><span className="text-fg-1">How hard · </span>{g.effort}</p>
            <Cited ids={g.sources} prefix="Sources:" />
          </div>
        ))}

        <div className="border-t border-line pt-2">
          <p className="text-body text-fg-1">Progressing without adding weight</p>
          <p className="mt-1">
            Something has to go up over time, and at home the weight is the one thing that cannot.
            These are the levers you do have, roughly in the order to reach for them.
          </p>
          <ul className="mt-2 space-y-2">
            {HOME_LEVERS.map((l) => (
              <li key={l.name}><span className="text-fg-1">{l.name} · </span>{l.body}</li>
            ))}
          </ul>
          <Cited ids={['acsm', 'umbrella', 'tempo', 'rom', 'doseresponse']} prefix="Sources:" />
        </div>

        <div className="border-t border-line pt-2">
          <p className="text-body text-fg-1">Principles</p>
          <ul className="mt-2 space-y-2">
            {HOME_PRINCIPLES.map((p) => (
              <li key={p.name}><strong style={{ color: onRaised(p.color) }}>{p.name}:</strong> {p.body}</li>
            ))}
          </ul>
        </div>

        <div className="border-t border-line pt-2">
          <p className="text-body text-fg-1">Before you start</p>
          <p className="mt-1">{HOME_SAFETY.stop}</p>
          <p className="mt-1">{HOME_SAFETY.ask}</p>
          <Cited ids={HOME_SAFETY.sources} prefix="Wording from:" />
        </div>
      </div>
    </>
  )
}

function Equipment() {
  return (
    <>
      <Head title="Equipment" blurb="In the order it is worth buying — and the first entry is nothing" />
      <ul className="space-y-2 text-label text-fg-2">
        {HOME_EQUIPMENT.map((e) => (
          <li key={e.item} className="border-t border-line pt-2 first:border-t-0 first:pt-0">
            <span className="text-body text-fg-1">{e.item}</span>
            <p>{e.spec}</p>
            {e.url && <a href={e.url} target="_blank" rel="noreferrer">{e.item} · how to choose</a>}
          </li>
        ))}
      </ul>
    </>
  )
}

function Sources() {
  return (
    <>
      <Head title="Sources" blurb={`${HOME_SOURCES.length} references, every one fetched and reachable`} />
      <div className="space-y-3 text-label text-fg-2">
        <p>
          Every number and guideline in this manual traces to one of these, and each link was
          opened rather than remembered. What is <em>not</em> here is as deliberate: the much-quoted
          ACSM 2009 rep and rest table is paywalled, so it is not used — and no claim anywhere in
          this manual says a cue prevents an injury or that an error causes one, because none of
          these sources says that either. Every “why” here is mechanical.
        </p>
        <ul className="space-y-2">
          {HOME_SOURCES.map((s) => (
            <li key={s.id} className="border-t border-line pt-2">
              <a href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
              <p className="text-fg-2">{s.publisher}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
