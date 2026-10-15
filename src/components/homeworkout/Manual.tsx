import type { ReactNode } from 'react'
import { VideoLink } from '../VideoLink'
import { PanelGrid, PanelCard, DefList, Tag } from '../page'
import { buyingGuideUrl } from '../../lib/video'
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
      {/* Four ordered lists and a paragraph, as four cards. It was a
          `space-y-4` run of bare divs, each with its own bold line on top —
          one of the five shapes `components/page/Panel.tsx` was extracted to
          replace, and the reason the chapter read as an undifferentiated wall. */}
      <PanelGrid>
        <PanelCard title="Set up" right={<Tag>{c.setup.length} steps</Tag>}>
          <Steps items={c.setup} />
        </PanelCard>
        <PanelCard title="Execute" right={<Tag>{c.execution.length} steps</Tag>}>
          <Steps items={c.execution} />
        </PanelCard>
        <PanelCard title="The mistake">
          <p className="text-label text-fg-2">{c.mistake}</p>
        </PanelCard>
        <PanelCard title="How to progress" right={<Tag>{c.progress.length} steps</Tag>}>
          <Steps items={c.progress} />
        </PanelCard>
      </PanelGrid>

      <h4 className="mt-5 mb-2 text-label text-fg-2">
        {moves.length} movement{moves.length === 1 ? '' : 's'} in this family
      </h4>
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-2 @lg/page:grid-cols-2">
        {moves.map((m) => (
          <li key={m.id} className="flex flex-wrap items-baseline gap-x-2 rounded-card bg-ink-2 px-3 py-2 text-label text-fg-2">
            <span className="text-fg-1">{m.name}</span>
            <span className="capitalize">{m.difficulty}</span>
            <span className="ml-auto"><VideoLink name={m.name} yt={m.yt} label="" size="sm" /></span>
          </li>
        ))}
      </ul>

      <div className="mt-4 border-t border-line pt-2 text-label text-fg-2">
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
    </>
  )
}

/** An ordered list inside a card. Was `Block`, which also drew its own title —
 *  the card draws the title now, so this is the list alone. */
function Steps({ items }: { items: string[] }) {
  return (
    <ol className="mt-1 list-inside list-decimal space-y-1 text-label text-fg-2">
      {items.map((i) => <li key={i} className="pl-5 -indent-5">{i}</li>)}
    </ol>
  )
}

/** A labelled run of cards inside a panel. Not navigation — a heading. */
function SubHead({ children }: { children: ReactNode }) {
  return <h4 className="mt-5 mb-2 text-label text-fg-2 first:mt-0">{children}</h4>
}

export function Programming() {
  return (
    <>
      <Head title="How to train" blurb="Sets, reps and rest — and how to get harder without a weight rack" />

      {/* `HOME_GOALS` used to render TWICE on this panel: once as a four-column
          table of Goal/Sets/Reps/Rest, then again underneath as three prose
          blocks carrying aim, effort and sources. Reported as "a lot of
          duplicates", correctly.

          The table was the worse half, and not only because it repeated: those
          three fields are SENTENCES, not figures — `reps` for hypertrophy is
          forty words — so a four-column table of them is a wall of text wearing
          a table's clothes. One card per goal, with the sentences in the
          term/detail list that is actually shaped for them. */}
      <SubHead>By goal</SubHead>
      <PanelGrid>
        {HOME_GOALS.map((g) => (
          <PanelCard key={g.id} title={g.label}>
            <p className="text-label text-fg-2">{g.aim}</p>
            <DefList rows={[['Sets', g.sets], ['Reps', g.reps], ['Rest', g.rest], ['Effort', g.effort]]} />
            <div className="mt-2 border-t border-line pt-2">
              <Cited ids={g.sources} prefix="Sources:" />
            </div>
          </PanelCard>
        ))}
      </PanelGrid>

      <SubHead>Progressing without adding weight</SubHead>
      <p className="mb-2 text-label text-fg-2">
        Something has to go up over time, and at home the weight is the one thing that cannot.
        These are the levers you do have, roughly in the order to reach for them.
      </p>
      <PanelGrid>
        {HOME_LEVERS.map((l, i) => (
          <PanelCard key={l.name} title={l.name} right={<Tag>{i + 1}</Tag>}>
            <p className="text-label text-fg-2">{l.body}</p>
          </PanelCard>
        ))}
      </PanelGrid>
      <div className="mt-2">
        <Cited ids={['acsm', 'umbrella', 'tempo', 'rom', 'doseresponse']} prefix="Sources:" />
      </div>

      <SubHead>Principles</SubHead>
      <PanelGrid>
        {HOME_PRINCIPLES.map((pr) => (
          /* The accent moves to the card title, the way the pull-up principles
             do — it was a `<strong>Name:</strong> body` run-on, which is one of
             the five shapes `components/page/Panel.tsx` exists to replace. */
          <PanelCard key={pr.name} title={pr.name} titleColor={onRaised(pr.color)}>
            <p className="text-label text-fg-2">{pr.body}</p>
          </PanelCard>
        ))}
      </PanelGrid>

      <SubHead>Before you start</SubHead>
      <PanelGrid>
        <PanelCard title="Stop if">
          <p className="text-label text-fg-2">{HOME_SAFETY.stop}</p>
        </PanelCard>
        <PanelCard title="Ask first if">
          <p className="text-label text-fg-2">{HOME_SAFETY.ask}</p>
          <div className="mt-2 border-t border-line pt-2">
            <Cited ids={HOME_SAFETY.sources} prefix="Wording from:" />
          </div>
        </PanelCard>
      </PanelGrid>
    </>
  )
}

export function Equipment() {
  return (
    <>
      <Head title="Equipment" blurb="In the order it is worth buying — and the first entry is nothing" />
      {/* Every row carries a link now. Measured before this change: one of the
          eight rows had a `url`, so seven rendered no link at all — which is
          what "the URLs in equipment are not working" turned out to mean. Both
          pinned URLs answered 200. `buyingGuideUrl` builds a search for the
          rest, the same rule `videoUrl` already follows, because a pinned page
          rots and a search always lands. */}
      <PanelGrid>
        {HOME_EQUIPMENT.map((e, i) => (
          <PanelCard key={e.item} title={e.item} right={<Tag>{e.noBuy ? 'free' : i}</Tag>}>
            <p className="text-label text-fg-2">{e.spec}</p>
            {!e.noBuy && (
              /* Inline, not a bordered footer row: eight cards each paying a
                 border and two paddings for one link cost 0.44 phone screens
                 on their own. */
              <p className="mt-1.5 text-label">
                <a href={buyingGuideUrl(e.item, e.url)} target="_blank" rel="noreferrer">How to choose one</a>
              </p>
            )}
          </PanelCard>
        ))}
      </PanelGrid>
    </>
  )
}

export function Sources() {
  return (
    <>
      <Head title="Sources" blurb={`${HOME_SOURCES.length} references, every one fetched and reachable`} />
      <p className="mb-3 text-label text-fg-2">
        Every number and guideline in this manual traces to one of these, and each link was
        opened rather than remembered. What is <em>not</em> here is as deliberate: the much-quoted
        ACSM 2009 rep and rest table is paywalled, so it is not used — and no claim anywhere in
        this manual says a cue prevents an injury or that an error causes one, because none of
        these sources says that either. Every “why” here is mechanical.
      </p>
      {/* NOT `PanelGrid`. A source is one link and one publisher, and giving
          each of thirty-one its own bordered card measured **5.44 desktop
          screens and 10.95 on a phone** against 2.50 / 4.72 for the list it
          replaced — more than twice the page for the same thirty-one facts.
          Two columns of two-line rows instead: the card is the right shape for
          a named item with a body, and these have no body. */}
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-x-6 gap-y-0 @lg/page:grid-cols-2">
        {HOME_SOURCES.map((src) => (
          <li key={src.id} className="border-t border-line py-2 text-label">
            <a href={src.url} target="_blank" rel="noreferrer">{src.label}</a>
            <span className="block text-fg-2">{src.publisher}</span>
          </li>
        ))}
      </ul>
    </>
  )
}
