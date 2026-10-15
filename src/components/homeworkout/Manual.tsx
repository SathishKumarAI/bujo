import { VideoLink } from '../VideoLink'
import { onRaised } from '../../lib/colors'
import { FAMILY_LABEL, filterExercises, type Family } from '../../lib/homeExercises'
import { chapterFor, HOME_SAFETY, HOME_SOURCES, sourceById } from '../../lib/homeManual'
import { HOME_EQUIPMENT, HOME_GOALS, HOME_LEVERS, HOME_PRINCIPLES } from '../../lib/homeProgramming'

/**
 * ZONE 3 · the manual's chapters, as bodies. **This file no longer navigates.**
 *
 * It used to own a twelve-row `SectionRail` of its own — the nine movement
 * families plus programming, kit and the citations — sitting underneath three
 * peer sections that had no rail at all. Two navigations on one page, which is
 * the fault `components/homeworkout/Review.tsx` now fixes by having one bar for
 * the whole review zone.
 *
 * Where the twelve went:
 *
 * - the **nine family chapters** are a facet of the catalogue, not peers of
 *   "Sources" — `ExerciseLibrary` renders `FamilyChapter` when you pick a
 *   family, which is where you are standing when you want it;
 * - **programming, equipment and sources** became three rows of the one bar.
 *
 * Nothing inside a chapter changed. `Head` is still exported-by-use here
 * because each body draws its own title and blurb; the bar's own heading names
 * the ROW, and for the three reference rows those agree by design.
 */

export function Head({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline gap-x-3 border-b border-line pb-1.5">
      <h3 className="text-heading font-medium text-fg-1">{title}</h3>
      <p className="text-label text-fg-2">{blurb}</p>
    </div>
  )
}

export function Cited({ ids, prefix }: { ids: readonly string[]; prefix: string }) {
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

export function FamilyChapter({ family }: { family: Family }) {
  /* `chapterFor`, not a `.find` of our own. The helper existed in
     `lib/homeManual.ts` with no call site at all, which is the shape of a data
     module quietly going dead — this file had retyped its one line. */
  const c = chapterFor(family)
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

export function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-body text-fg-1">{title}</p>
      <ol className="mt-1 list-inside list-decimal space-y-1">
        {items.map((i) => <li key={i}>{i}</li>)}
      </ol>
    </div>
  )
}

export function Programming() {
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

export function Equipment() {
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

export function Sources() {
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
