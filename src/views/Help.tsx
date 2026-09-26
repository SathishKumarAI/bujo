import { ArrowRight, MagnifyingGlass } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import { useMemo, useState } from 'react'
import { Card, Empty, Input, Pill } from '../components/ui'
import { Button } from '../components/ui/button'
import { PageLayout } from '../components/page/PageLayout'
import { StatBar } from '../components/page/StatBar'
import { SectionRail } from '../components/page/SectionRail'
import { useNav } from '../components/shell/nav'
import { BULLET_LEGEND } from '../lib/bullets'
import { onRaised } from '../lib/colors'
import { GUIDE, TUTORIALS, guideByGroup, searchGuide, type GuideCard, type Tutorial } from '../lib/guide'
import { glossaryByDomain, GLOSSARY } from '../lib/glossary'

/**
 * GUIDE · the page a stuck user opens.
 *
 * This was 1,127px of hand-written prose in one card — no search, no anchors,
 * no links out, and it named fifteen of the app's twenty-four screens. Every
 * finding in `docs/pages/help.md` traces to the same cause: the page carried
 * its own copy of what each screen does, so it drifted from the app and there
 * was nothing to notice. All of that prose now lives in `lib/guide.ts`, keyed
 * off `VIEW_CHROME` and `SECTIONS`, with a test that fails when a view is added
 * without a guide entry.
 *
 * The three-zone contract bends slightly here and it is worth naming how. This
 * page records nothing, so zone 3 is not "what you have recorded" — it is the
 * reference body: the bullet grammar, then the searchable catalogue. Zone 2 is
 * still the act, and the act on a guide is **start**, not read.
 */
export function Help() {
  const nav = useNav()
  const [query, setQuery] = useState('')
  const [track, setTrack] = useState(TUTORIALS[0].id)

  const results = useMemo(() => searchGuide(query), [query])
  const searching = query.trim().length > 0
  /* Every group, with its live count — the rail's rows. Computed from the
     search results, so a query renumbers the rail rather than emptying it. */
  const allGroups = useMemo(() => guideByGroup(results), [results])
  /* One group at a time, `null` for All. Defaults to the first — landing on
     all twenty-five features is the 10.9-screen page this replaces. */
  const [group, setGroup] = useState<string | null>(guideByGroup()[0]?.id ?? null)
  /* A query crosses groups. Searching "backup" while the rail sits on Body
     must find it — the whole reason the search exists is to reach a feature
     whose section you do not remember. Same rule as Insights. */
  const groups = useMemo(
    () => (searching || !group ? allGroups : allGroups.filter((g) => g.id === group)),
    [allGroups, group, searching],
  )
  const tutorial = TUTORIALS.find((t) => t.id === track) ?? TUTORIALS[0]

  return (
    <PageLayout
      /* Stays split at 1180, and that is a measured choice against the
         obvious alternative. `stacked` + `tier={1440}` gives the rail a real
         vertical column (container 1344 instead of 722) and costs **0.7
         screens**: 1.3 shipped becomes 2.0. At 1.3 screens there is no
         scrolling left for a vertical rail to save, so the horizontal chip
         row is the cheaper shape — it filters exactly the same way. */
      tier={1180}
      zone1={
        <StatBar
          facts={[
            { label: 'Features', value: searching ? `${results.length} / ${GUIDE.length}` : String(GUIDE.length) },
            { label: 'Tutorials', value: String(TUTORIALS.length) },
            {
              label: 'Your journal',
              value: 'This device only — back it up',
              prose: true,
              onClick: () => nav('settings'),
            },
          ]}
        />
      }
      zone2={<StartHere tutorial={tutorial} tracks={TUTORIALS} onTrack={setTrack} onGo={nav} />}
      zone3={
        <div className="space-y-4">
          <Bullets />
          <Glossary />
          <Card
            band
            title="Every feature"
            subtitle="What it is, why it exists, and the first three things to do"
            hideInfo
            right={
              <div className="relative w-full max-w-[16rem] sm:w-64">
                <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-fg-2">
                  <AppIcon as={MagnifyingGlass} size="sm" />
                </span>
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="backup · habit · macros…"
                  aria-label="Search the guide"
                  className="pl-8"
                />
              </div>
            }
          >
            {results.length === 0 ? (
              <Empty
                icon={MagnifyingGlass}
                hint="Try one word rather than a sentence — the search wants every word to match."
                action={{ label: 'Clear the search', onClick: () => setQuery('') }}
              >
                Nothing in the guide matches “{query}”
              </Empty>
            ) : (
              /* A RAIL, NOT A WALL.

                 Twenty-five features, every one a fold, all on the page at
                 once: measured **4.5 screens shipped and 10.9 with the folds
                 open** — the longest page in the app, on the page a stuck
                 user opens. Six groups already existed as `<h3>`s inside it,
                 which is a table of contents pretending to be a heading.

                 Container on the outer div, grid on the inner (an element
                 cannot query itself), and the phone column spelled out (an
                 implicit `auto` track sizes to the chip row and scrolls the
                 page sideways). Both in docs/PAGE-SHAPE.md. */
              <div className="@container/page">
              <div className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-3 @4xl/page:grid-cols-[11rem_minmax(0,1fr)]">
                <SectionRail
                  label="Guide sections"
                  groups={allGroups.map((g) => ({ id: g.id, label: g.label, count: g.cards.length }))}
                  value={searching ? null : group}
                  onChange={(id) => { setGroup(id); setQuery('') }}
                  allCount={results.length}
                />
                <div className="min-w-0 space-y-5">
                  {groups.map((g) => (
                    <section key={g.id} data-guide-group={g.id} aria-label={g.label}>
                      <h3 className="mb-2 text-micro tracking-wider text-fg-2 uppercase">
                        {g.label} · {g.cards.length}
                      </h3>
                      <div className="space-y-2">
                        {g.cards.map((c) => (
                          // Remounted when the search turns on or off so a hit
                          // opens itself: a result you still have to click is a
                          // search that has only narrowed the same long scroll.
                          <Feature key={`${c.view}-${searching}`} card={c} open={searching} onGo={nav} />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
              </div>
            )}
          </Card>
        </div>
      }
    />
  )
}

/** Zone 2. Pick a track, then work its steps — each one opens where it happens. */
function StartHere({
  tutorial,
  tracks,
  onTrack,
  onGo,
}: {
  tutorial: Tutorial
  tracks: Tutorial[]
  onTrack: (id: string) => void
  onGo: (view: GuideCard['view']) => void
}) {
  return (
    <Card band title="Start here" subtitle={tutorial.blurb} hideInfo>
      {/* Not `Segmented`: three labels of this length are unreadable in a
          segmented control at 380px, and this is a list of documents rather
          than a mode the page is in. */}
      <div role="tablist" aria-label="Tutorials" className="mb-3 flex flex-col gap-1">
        {tracks.map((t) => {
          const on = t.id === tutorial.id
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              onClick={() => onTrack(t.id)}
              // The selected row is `ink-2` + `shadow-raise`, which is the
              // idiom `SectionTabs` already uses for an active tab — not
              // `ink-3`. `ink-3` is 24% of the foreground over the card and
              // `fg-2` on it measures **4.07:1**, which `npm run a11y` caught
              // on the effort label in four themes at once. The ground moved
              // out from under the small text; the fix is the ground.
              className={`flex items-baseline justify-between gap-2 rounded-card px-3 py-2 text-left transition-colors ${
                on ? 'bg-ink-2 text-foreground shadow-raise' : 'text-fg-2 hover:bg-ink-2 hover:text-fg-1'
              }`}
            >
              <span className="text-body font-medium">{t.title}</span>
              <span className="shrink-0 text-caption text-fg-2">{t.effort}</span>
            </button>
          )
        })}
      </div>

      <ol className="space-y-3">
        {tutorial.steps.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span
              className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-pill text-micro font-medium"
              style={{ background: 'var(--color-surface1)', color: onRaised('mauve') }}
              aria-hidden
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-body font-medium text-fg-1">{s.title}</p>
              <p className="mt-0.5 text-label leading-relaxed text-fg-2">{s.body}</p>
              {s.to && (
                <Button
                  variant="ghost"
                  onClick={() => onGo(s.to as GuideCard['view'])}
                  className="mt-1 h-auto justify-start gap-1 p-0 text-label text-blue"
                >
                  Open it <AppIcon as={ArrowRight} size="sm" />
                </Button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  )
}

/**
 * One feature, folded.
 *
 * Collapsed it shows the name and the *why* — one sentence, which is what makes
 * a list of twenty-four scannable. The what and the how are behind the fold,
 * and search forces it open.
 */
function Feature({ card, open, onGo }: { card: GuideCard; open: boolean; onGo: (view: GuideCard['view']) => void }) {
  return (
    <Card
      collapsible
      defaultCollapsed={!open}
      hideInfo
      title={card.navLabel}
      subtitle={card.why}
      right={card.navLabel !== card.title ? <Pill tone="muted" size="caption">{card.title}</Pill> : undefined}
    >
      <p className="text-body leading-relaxed text-fg-2">{card.what}</p>
      <p className="mt-3 mb-1.5 text-micro tracking-wider text-fg-2 uppercase">How to use it</p>
      <ol className="space-y-1.5">
        {card.how.map((step, i) => (
          <li key={step} className="flex gap-2.5 text-label leading-relaxed text-fg-1">
            <span className="shrink-0 font-mono text-fg-2" aria-hidden>{i + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <Button onClick={() => onGo(card.view)} variant="secondary" size="sm" className="mt-3 gap-1.5">
        Open {card.navLabel} <AppIcon as={ArrowRight} size="sm" />
      </Button>
    </Card>
  )
}

/**
 * The bullet grammar. Pinned above the catalogue because it is the single
 * most-looked-up thing on this page and it used to sit in the lower half.
 */
function Bullets() {
  return (
    <Card band title="The bullets" subtitle="Rapid logging, the whole grammar" hideInfo>
      <p className="mb-3 text-body text-fg-1">
        On <strong>Today</strong>, type into the add bar and press Enter. Start a line with a letter
        to choose the kind, and click the glyph on any task to cycle its status.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {BULLET_LEGEND.map((b) => (
          <li key={b.label} className="flex items-center gap-3 rounded-card bg-ink-2 px-3 py-1.5 text-body">
            <span className="w-5 text-center font-mono" style={{ color: onRaised('mauve') }}>{b.glyph}</span>
            <span className="text-fg-1">{b.label}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 rounded-card bg-ink-0 p-3 text-body text-fg-2">
        <p className="font-medium text-fg-1">Quick-capture prefixes</p>
        <p className="mt-1">
          <code>t</code> task · <code>e</code> event · <code>n</code> note · <code>*</code> important ·{' '}
          <code>^</code> memory · <code>#tag</code> to tag.
        </p>
        <p className="mt-1 text-fg-2">
          So <code>* t book the campsite #travel</code> logs an important task tagged travel.
        </p>
      </div>
    </Card>
  )
}

/**
 * THE ABBREVIATIONS · the whole list, in the one place that is meant to be read.
 *
 * The inline ⓘ marker (`components/Abbr.tsx`) answers "what does this word on
 * this chip mean" at the moment it is asked. This answers the other question —
 * "what does this app expect me to already know" — which is the one someone
 * being *shown* the app asks, and it cannot be answered by twenty tooltips
 * scattered across nine screens.
 *
 * Both read `src/data/glossary.json`. Nothing here is written down twice; the
 * page and the tooltip cannot disagree about what a word means. Collapsed by
 * default because Help measured 1.1 shipped / 1.5 open and the whole point of
 * last stretch's rail was to stop that number climbing — a reference list is
 * exactly the thing a fold is for.
 */
function Glossary() {
  const all = glossaryByDomain()
  /* One domain at a time, `null` for All — the same rail the feature catalogue
     above uses, for the same measured reason. Twenty definitions in one column
     took Help's open height from 1.5 to **3.3 desktop screens and 6.8 on a
     phone**; five peer groups is exactly the shape `docs/PAGE-WORKFLOW.md` says
     to put on a rail. Defaults to Cycle because that is the domain that produced
     the request — landing on all twenty is landing on the wall. */
  const [domain, setDomain] = useState<string | null>(all[0]?.domain ?? null)
  const groups = domain ? all.filter((g) => g.domain === domain) : all
  return (
    <Card
      band
      collapsible
      defaultCollapsed
      title="The abbreviations"
      subtitle={`${GLOSSARY.length} shorthand terms the app uses, spelled out`}
      hideInfo
    >
      {/* Container outside, grid inside — an element cannot query itself — and
          the phone column spelled out, because an implicit `auto` track sizes to
          the rail's widest chip and scrolls the page sideways. Both in
          docs/PAGE-SHAPE.md. */}
      <div className="@container/page">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-3 @4xl/page:grid-cols-[11rem_minmax(0,1fr)]">
        <SectionRail
          label="Glossary domains"
          groups={all.map((g) => ({ id: g.domain, label: g.label, count: g.terms.length }))}
          value={domain}
          onChange={setDomain}
          allCount={GLOSSARY.length}
        />
      <div className="min-w-0 space-y-4">
        {groups.map((g) => (
          <section key={g.domain} aria-label={g.label}>
            <h3 className="mb-2 text-micro tracking-wider text-fg-2 uppercase">
              {g.label} · {g.terms.length}
            </h3>
            {/* A definition list, because that is what this is: `dt`/`dd` gives a
                screen reader the term-to-meaning relationship that a two-column
                grid of `div`s only implies. The grid is spelled out at both
                widths — an implicit track would size to the longest definition
                and drag its sibling column with it. */}
            <dl className="grid grid-cols-[minmax(0,1fr)] gap-x-6 gap-y-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              {g.terms.map((t) => (
                <div key={t.term} className="contents">
                  <dt className="text-body font-medium text-fg-1">
                    {t.term}
                    <span className="ml-2 font-normal text-fg-2">{t.expansion}</span>
                  </dt>
                  <dd className="mb-2 text-label text-fg-2 sm:mb-0">
                    {t.long}
                    {t.source && (
                      <>
                        {' '}
                        <a href={t.source.url} target="_blank" rel="noreferrer" className="underline hover:text-fg-1">
                          {t.source.label}
                        </a>
                      </>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
      </div>
      </div>
    </Card>
  )
}
