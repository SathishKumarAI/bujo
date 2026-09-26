import { MagnifyingGlass, Minus, Sparkle, TrendDown, TrendUp, Trophy, Warning } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { TrackerVisuals } from '../components/trackers/TrackerVisuals'
import { Card, Empty, Input, Segmented } from '../components/ui'
import { Button } from '../components/ui/button'
import { cat, onRaised } from '../lib/colors'
import { currentStreak, search, taskCompletion } from '../lib/stats'
import { insights, weeklyDigest, digestRangeLabel, momentumIndicator } from '../lib/correlations'
import { weeklyRadar } from '../lib/viz'
import { pace } from '../lib/pace'
import { coachDigest } from '../lib/coach'
import { PageLayout, StatBar } from '../components/page'
import { MasonryGrid } from '../components/shell/CardGrid'
import { useNav } from '../components/shell/nav'
import { useCursor } from '../components/shell/cursor'
import { prettyDay, todayISO} from '../lib/date'
import { WeeklyReview } from '../components/WeeklyReview'
import { DomainRail } from '../components/insights/DomainRail'
import { useStatsCards } from '../components/insights/StatsPanels'
import { CorrelationMatrixCard, HabitConsistencyCard, JournalVolumeCard, TaskTrendCard } from '../components/insights/NewCharts'
import { CARDS, DOMAINS, DOMAIN_BLURB, DOMAIN_LABEL, SORTS, sortResults, visibleCards, type Domain, type Sort } from '../lib/insightsFilter'

/**
 * INSIGHTS · one page, everything on it, and a row of controls that decides
 * what you are looking at.
 *
 * It used to be two tabs. **Insights** held six headings, fifty lines of text
 * and — on the page named Insights — **zero charts**. **Stats** held every plot
 * in the app behind seven `<Section defaultOpen={false}>` folds, so arriving
 * there showed you seven closed titles. Between them the app had roughly
 * twenty analytics surfaces and no way to see any of them without knowing
 * where to click.
 *
 * The folds are gone as a navigation device. The filter row in zone 2 is the
 * single mechanism now: six domain chips, a search that matches a card's
 * *measure* as well as its title, and a sort for the journal results. A fold
 * inside a filtered page is a second answer to "is this on screen", and the
 * closed one was the answer that lost.
 *
 * Zone 2 is still what you *do* here — run the weekly review, search, and
 * choose the view. Everything in zone 3 is a record being read back.
 *
 * **Merging the two pages reverses BUJO-281**, which split "what changed"
 * (Insights) from "the record" (Stats) — a real distinction, and the split was
 * a reasonable answer to it. It is not the answer that survived contact: a
 * second tab is only cheaper than a fold if people find it, and the charts on
 * the far side of this one had to be excavated. The distinction lives on as
 * `overview` versus the rest, which is a filter chip rather than a journey.
 */
export function Insights() {
  const { data } = useJournal()
  const nav = useNav()
  const { setDay } = useCursor()
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('all')
  const [sort, setSort] = useState<Sort>('newest')
  /* One domain at a time, `null` for All — the rail is single-select.
     It was a multi-select chip row whose empty state meant "all", which is
     the right shape for chips and the wrong one for navigation: a rail you
     can put into a state that shows everything AND a state that shows
     nothing has two meanings for one control. */
  const [active, setActive] = useState<Domain | null>(DOMAINS[0])

  const streak = currentStreak(data)
  const tasks = taskCompletion(data)
  const allResults = search(data, q)
  const kinds = ['all', ...new Set(allResults.map((r) => r.kind))]
  const matching = kind === 'all' ? allResults : allResults.filter((r) => r.kind === kind)
  const results = sortResults(matching, sort)
  const found = insights(data)
  const digest = weeklyDigest(data)
  const coach = coachDigest(data)
  const momentum = momentumIndicator(data)

  // The four figures the retired Stats page carried in its own stat bar, read
  // off the same helpers it used rather than averaged a second time here.
  const radar = weeklyRadar(data)
  const radarAt = (axis: string) => radar.find((r) => r.axis === axis)?.value
  const left = pace(data)

  /* A query crosses domains. Searching for "sleep debt" while the rail sits
     on Records must not return nothing — the search is how you find a card
     whose domain you do not remember, which is the whole reason it exists. */
  const searching = q.trim().length > 0
  const visible = visibleCards(searching || !active ? new Set<Domain>() : new Set([active]), q)
  const show = (id: string) => visible.has(id)
  const filtering = searching

  /** Cards a domain would show under the current query — the rail's counts. */
  function countOf(d: Domain) {
    return CARDS.filter((c) => c.domain === d && visibleCards(new Set([d]), q).has(c.id) && all[c.id]).length
  }

  /**
   * Every card on this page, by the id the registry knows it under.
   *
   * Half of them come from `useStatsCards` (one hook, one shared closure —
   * the month cursor, the heatmap range, the enlarge modal) and half are
   * built here. A card whose data cannot support it yields `null` rather than
   * an empty box; the renderer below skips those, so an absent card never
   * leaves a heading over nothing.
   */
  const stats = useStatsCards()
  const all: Record<string, React.ReactNode> = {
    ...stats.cards,
    digest: (<Card band title="Weekly digest" subtitle={digestRangeLabel(digest.from, digest.to)}>
  <ul className="space-y-1.5 text-body">
    {digest.lines.map((l) => (
      <li key={l.label} className="flex items-center justify-between gap-2">
        <span className="text-fg-2">{l.label}</span>
        <strong className="text-fg-1">{l.value}</strong>
      </li>
    ))}
  </ul>
  {(digest.win || digest.slip) && (
    <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-body">
      {digest.win && (
        <p className="flex items-center gap-2">
          <AppIcon as={Trophy} size="sm" style={{ color: onRaised('green') }} />
          <span className="text-fg-1">{digest.win}</span>
        </p>
      )}
      {digest.slip && (
        <p className="flex items-center gap-2">
          <AppIcon as={Warning} size="sm" style={{ color: onRaised('peach') }} />
          <span className="text-fg-1">{digest.slip}</span>
        </p>
      )}
    </div>
  )}
</Card>),
    coach: (<Card band title="Coach digest" subtitle="What to focus on next">
  <p className="mb-3 flex items-center gap-2 text-body font-medium text-fg-1">
    <AppIcon as={Sparkle} size="sm" style={{ color: onRaised('mauve') }} />
    {coach.headline}
  </p>
  {coach.tips.length > 0 && (
    <ul className="space-y-2 text-body">
      {coach.tips.map((t) => (
        <li key={t.id}>
          <button
            onClick={() => nav(t.to as Parameters<typeof nav>[0])}
            className="w-full rounded-control bg-ink-2 px-3 py-2 text-left hover:border-mauve"
          >
            <span className="font-medium text-fg-1">{t.title}</span>
            <span className="block text-label text-fg-2">{t.detail}</span>
          </button>
        </li>
      ))}
    </ul>
  )}
  {coach.insight && (
    <p className="mt-3 border-t border-line pt-3 text-body text-fg-1">
      <span className="mr-1.5 rounded px-1.5 py-0.5 text-label" style={{ background: cat('surface0'), color: coach.insight.strength === 'strong' ? cat('mauve') : cat('subtext0') }}>
        r={coach.insight.r}
      </span>
      {coach.insight.text}
    </p>
  )}
</Card>),
    patterns: found.length > 0 ? (<Card band title="Patterns" subtitle="What your data is telling you">
  <ul className="space-y-2">
    {found.map((ins, i) => (
      <li key={i} className="flex items-center gap-2 text-body">
        <span className="rounded px-1.5 py-0.5 text-label" style={{ background: cat('surface0'), color: ins.strength === 'strong' ? cat('mauve') : cat('subtext0') }}>
          r={ins.r} · {ins.strength}
        </span>
        <span className="text-fg-1">{ins.text}</span>
      </li>
    ))}
  </ul>
</Card>) : null,
    matrix: <CorrelationMatrixCard />,
    momentum: momentum.length > 0 ? (<Card band title="Momentum" subtitle="Where each metric is trending vs. the week before">
  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {momentum.map((m) => {
      // Stress is inverted: a drop is good. Everything else: up is good.
      const good = m.key === 'stress' ? m.dir === 'down' : m.dir === 'up'
      const Icon = m.dir === 'up' ? TrendUp : m.dir === 'down' ? TrendDown : Minus
      const color = m.dir === 'flat' ? 'overlay0' : good ? 'green' : 'red'
      return (
        <li key={m.key} className="rounded-card bg-ink-2 p-3">
          <div className="flex items-center justify-between">
            <span className="text-label text-fg-2">{m.label}</span>
            <AppIcon as={Icon} size="sm" style={{ color: onRaised(color) }} />
          </div>
          <p className="mt-1 text-heading font-medium tabular-nums text-fg-1">{m.recent}<span className="text-label text-fg-2">/10</span></p>
          <p className="text-label" style={{ color: onRaised(color) }} title={`based on ${m.recentDays} day${m.recentDays === 1 ? '' : 's'}`}>
            {m.dir === 'flat' ? 'steady' : `${m.delta > 0 ? '+' : ''}${m.delta} vs last week`}
          </p>
        </li>
      )
    })}
  </ul>
</Card>) : null,
    entryvolume: <JournalVolumeCard />,
    consistency: <HabitConsistencyCard />,
    taskstrend: <TaskTrendCard />,
    habitgrids: <TrackerVisuals data={data} today={todayISO()} />,
  }

  return (
    <PageLayout
      /* The dashboard tier. Twenty-three analytics cards in a masonry whose
         third column needs a 1280px container — at 1180 this page drew two
         columns on a 1440 screen with ~260px unused beside it. */
      tier={1440}
      /* Stacked: zone 3 is a full-width grid of read-backs. There is no narrow
         form here to justify the 62/38 split. */
      stacked
      zone1={
        /* FOUR facts, and the cap is load-bearing rather than stylistic:
            `StatBar` slices to four and warns only in DEV, so the fifth is
            dropped on the floor of a production build with nothing on screen
            to say so. Merging two pages' bars gave seven candidates and the
            first draft passed five — the rendered-output diff is what caught
            it, not the build.

            The three that did not make it are all still on this page: mood,
            sleep and habits are the week radar's own axes, and the entry count
            is in Lifetime. A stat bar is the figures you would otherwise go
            looking for, not a summary of the page under it. */
        <StatBar
          facts={[
            { label: 'current streak', value: `${streak}d`, onClick: () => nav('trackers') },
            { label: 'tasks done', value: `${tasks.pct}%`, onClick: () => nav('today') },
            { label: 'mood · 7d', value: `${radarAt('Mood') ?? 0}/10` },
            /* The one fact here that is not a record: everything else on this
               page is over, and this is what is left of the month. */
            { label: 'left · this month', value: `${left.month.left}d` },
          ]}
        />
      }
      zone2={<>
      <WeeklyReview />

      <Card band title="Find & filter" subtitle="One query over the journal and over this page">
        <div className="relative">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-2">
            <AppIcon as={MagnifyingGlass} size="sm" />
          </span>
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setKind('all') }}
            placeholder="Search entries, workouts, or a measure — “sleep debt”, “streak”, “r”…"
            aria-label="Search the journal and this page"
            className="pl-8"
          />
        </div>

        {/* The domain chips are gone from here. Domain selection is the rail
            beside zone 3 now — it was a filter, and a filter that decides
            which of six subjects you are looking at is navigation. Search
            stays in zone 2, because searching IS an act. */}
        {filtering && (
          <p className="mt-2 text-label text-fg-2">
            Showing <strong className="text-fg-1">{visible.size}</strong> of {CARDS.length} panels
            {q.trim() && <> · {allResults.length} journal match{allResults.length === 1 ? '' : 'es'} for “{q}”</>}
          </p>
        )}

        {q && (
          <div className="mt-3 border-t border-line pt-3">
            {allResults.length > 0 && (
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                {kinds.length > 2 && kinds.map((k) => (
                  <button
                    key={k}
                    onClick={() => setKind(k)}
                    aria-pressed={kind === k}
                    className={`rounded-pill px-2.5 py-0.5 text-label capitalize transition-colors ${
                      kind === k ? 'bg-brand-wash font-medium text-brand-text' : 'bg-ink-2 text-fg-2 hover:text-fg-1'
                    }`}
                  >
                    {k}{k !== 'all' ? ` (${allResults.filter((r) => r.kind === k).length})` : ''}
                  </button>
                ))}
                {/* `search()` returns hits in whatever order it walked the
                    store — neither chronological nor grouped — so twenty
                    results meant reading twenty dates to place them. */}
                <span className="ml-auto">
                  <Segmented
                    value={sort}
                    onChange={setSort}
                    options={SORTS.map((s) => ({ value: s, label: s === 'kind' ? 'By type' : s === 'newest' ? 'Newest' : 'Oldest' }))}
                  />
                </span>
              </div>
            )}
            {results.length === 0 ? (
              <Empty>No journal entries match “{q}”. The panel filter above may still have hits.</Empty>
            ) : (
              <ul className="space-y-1 text-body">
                {results.slice(0, 50).map((r, i) => (
                  <li key={i}>
                    <button
                      onClick={() => { if (r.date) { setDay(r.date); nav('today') } }}
                      disabled={!r.date}
                      className="flex w-full gap-2 rounded px-2 py-1 text-left hover:bg-ink-2 disabled:cursor-default"
                    >
                      <span className="w-24 shrink-0 text-fg-2">{r.date ? prettyDay(r.date) : '—'}</span>
                      <span className="w-16 shrink-0 text-label" style={{ color: onRaised('sapphire') }}>{r.kind}</span>
                      <span className="text-fg-1">{r.text}</span>
                    </button>
                  </li>
                ))}
                {results.length > 50 && (
                  <li className="px-2 pt-1 text-label text-fg-2">…and {results.length - 50} more. Narrow the query or pick a type.</li>
                )}
              </ul>
            )}
          </div>
        )}
      </Card>
      </>}
      zone3={
        <>
          {/* ZONE 3 · the six domains the registry names, in its order, one
              heading each.

              It was nine groups under four mechanisms: a bare `MasonryGrid`
              with no heading at all (eight cards), three loose cards inside
              `StatsPanels`' own grid, six `QuietSection` folds titled from a
              different vocabulary ("This week", "Sleep & mood", "Mood views",
              "Fitness stats", "Tasks", "Habits"), and a seventh
              `CollapsibleSection` in this file **also titled "Habits"**. The
              chip row above offered six domain names that appeared nowhere in
              any of it. Measured: seven screens of masonry with the useful
              charts scattered through it.

              Now the chips and the headings are the same six words, and every
              card is under exactly one of them — enforced by the test in
              `insightsFilter.test.ts`, which asserts the rendered map and the
              registry hold the same ids. That test did not exist; the
              registry's docstring claimed it did. */}
          {/* @container/page — the rail folds to a chip row on its OWN width,
              not the window's. Declared on this wrapper rather than on the
              rail, because an element cannot query itself (that one collapsed
              a desktop grid to one column with nothing failing). */}
          {/* Two divs, and the split is load-bearing. An element cannot query
              itself, so `@container/page` and `@4xl/page:grid-cols-…` on one
              div means the grid never fires — the rail read the container
              (it is a child, so it matched) and went vertical while its
              parent stayed a single column, stacking a full-width list of
              six domains above the pane. The comment warning about this was
              already written two lines down. */}
          <div className="@container/page">
          {/* `grid-cols-[minmax(0,1fr)]` spelled out for the phone. With no
              base template the grid gets ONE implicit `auto` track sized to
              its widest item's min-content — the rail is a seven-chip row, so
              the track came out 426px inside a 390px viewport and the whole
              page scrolled sideways (body scrollWidth 491). The rail's own
              `overflow-x-auto` cannot save it: the track overflows, not the
              item. Same trap `CardGrid` carries a paragraph about. */}
          <div className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-3 @4xl/page:grid-cols-[11rem_minmax(0,1fr)]">
          <DomainRail
            value={active}
            onChange={(d) => { setActive(d); setQ('') }}
            countOf={countOf}
            total={CARDS.filter((c) => visibleCards(new Set<Domain>(), q).has(c.id) && all[c.id]).length}
            filtering={filtering}
            onClear={() => { setQ(''); setKind('all') }}
          />
          <div className="min-w-0">
          {visible.size === 0 ? (
            <Empty>
              Nothing matches “{q}” on this page. Clear the query, or pick a different domain in the rail.
            </Empty>
          ) : (
            DOMAINS.map((d) => {
              const ids = CARDS.filter((c) => c.domain === d && show(c.id) && all[c.id])
              if (ids.length === 0) return null
              return (
                <section key={d} data-domain={d} className="mb-6 last:mb-0">
                  <div className="mb-3 flex flex-wrap items-baseline gap-x-3 border-b border-line pb-1.5">
                    <h2 className="font-display text-heading font-medium text-fg-1">{DOMAIN_LABEL[d]}</h2>
                    <p className="text-label text-fg-2">{DOMAIN_BLURB[d]}</p>
                    <span className="num ml-auto text-label text-fg-3">{ids.length}</span>
                  </div>
                  <MasonryGrid>
                    {ids.map((c) => <div key={c.id} data-card={c.id}>{all[c.id]}</div>)}
                  </MasonryGrid>
                </section>
              )
            })
          )}
          </div>
          </div>
          </div>
          {stats.modal}
          <p className="text-label text-fg-2">
            Task migration &amp; aging live in{' '}
            <Button variant="ghost" size="sm" onClick={() => nav('plan')} className="h-auto p-0">Plan →</Button>
          </p>
        </>
      }
    />
  )
}
