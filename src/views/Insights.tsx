import { MagnifyingGlass, Minus, Sparkle, TrendDown, TrendUp, Trophy, Warning, X } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
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
import { prettyDay } from '../lib/date'
import { WeeklyReview } from '../components/WeeklyReview'
import { StatsPanels } from '../components/insights/StatsPanels'
import { CorrelationMatrixCard, HabitConsistencyCard, JournalVolumeCard, TaskTrendCard } from '../components/insights/NewCharts'
import { CARDS, DOMAINS, DOMAIN_LABEL, SORTS, sortResults, visibleCards, type Domain, type Sort } from '../lib/insightsFilter'

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
  /* Empty means "all". A chip row where deselecting the last one blanks the
     page teaches people not to touch it. */
  const [active, setActive] = useState<Set<Domain>>(new Set())

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

  const visible = visibleCards(active, q)
  const show = (id: string) => visible.has(id)
  const filtering = active.size > 0 || q.trim().length > 0

  function toggle(d: Domain) {
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(d)) next.delete(d)
      else next.add(d)
      return next
    })
  }

  return (
    <PageLayout
      tier={1180}
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

        {/* The domain row. Every card on the page belongs to exactly one of
            these, and the counts are the point: a chip that says 6 tells you
            what is down there, which is the thing seven closed folds never
            did. Selection state takes the accent WASH, not the accent fill —
            same rule as Segmented and the result chips below. */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {DOMAINS.map((d) => {
            const on = active.has(d)
            const n = CARDS.filter((c) => c.domain === d && visible.has(c.id)).length
            return (
              <button
                key={d}
                onClick={() => toggle(d)}
                aria-pressed={on}
                className={`rounded-pill px-2.5 py-1 text-label transition-colors ${
                  on ? 'bg-brand-wash font-medium text-brand-text' : 'bg-ink-2 text-fg-2 hover:text-fg-1'
                }`}
              >
                {DOMAIN_LABEL[d]} <span className="tabular-nums opacity-70">{n}</span>
              </button>
            )
          })}
          {filtering && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setActive(new Set()); setQ(''); setKind('all') }}
              className="inline-flex h-auto items-center gap-1 px-2 py-1 text-label"
            >
              <AppIcon as={X} size="sm" /> Clear
            </Button>
          )}
        </div>

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
      zone3={<>
      {visible.size === 0 ? (
        <Empty>
          Nothing matches “{q}” on this page. Clear the query, or pick a different domain above.
        </Empty>
      ) : (
      <>
      <MasonryGrid>
        {show('digest') && (
        <Card band title="Weekly digest" subtitle={digestRangeLabel(digest.from, digest.to)}>
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
        </Card>
        )}

        {show('coach') && (
        <Card band title="Coach digest" subtitle="What to focus on next">
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
        </Card>
        )}

        {show('patterns') && found.length > 0 && (
          <Card band title="Patterns" subtitle="What your data is telling you">
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
          </Card>
        )}

        {show('matrix') && <CorrelationMatrixCard />}

        {show('momentum') && momentum.length > 0 && (
          <Card band title="Momentum" subtitle="Where each metric is trending vs. the week before">
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
          </Card>
        )}

        {show('entryvolume') && <JournalVolumeCard />}
        {show('consistency') && <HabitConsistencyCard />}
        {show('taskstrend') && <TaskTrendCard />}
      </MasonryGrid>

      {/* Every chart the app has. This was the Stats tab; the markup is
          unchanged and each block is gated on the same filter. */}
      <StatsPanels show={show} />

      <p className="text-label text-fg-2">
        Task migration &amp; aging live in{' '}
        <Button variant="ghost" size="sm" onClick={() => nav('plan')} className="h-auto p-0">Plan →</Button>
      </p>
      </>
      )}
      </>}
    />
  )
}
