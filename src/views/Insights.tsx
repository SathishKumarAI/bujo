import { Minus, Sparkle, TrendDown, TrendUp, Trophy, Warning } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { Card, Empty, Input } from '../components/ui'
import { Button } from '../components/ui/button'
import { cat } from '../lib/colors'
import { currentStreak, search, taskCompletion } from '../lib/stats'
import { insights, weeklyDigest, digestRangeLabel, momentumIndicator } from '../lib/correlations'
import { coachDigest } from '../lib/coach'
import { PageLayout, StatBar } from '../components/page'
import { CardGrid, MasonryGrid } from '../components/shell/CardGrid'
import { useNav } from '../components/shell/nav'
import { useCursor } from '../components/shell/cursor'
import { prettyDay } from '../lib/date'
import { WeeklyReview } from '../components/WeeklyReview'
// No `QuietSection` import any more: Insights has no folds. It used to carry a
// private copy of that collapsible header too — the same markup, minus the
// press affordance and the "show" hint — which was the fourth copy of a
// component that had already been consolidated once.

export function Insights() {
  const { data } = useJournal()
  const nav = useNav()
  const { setDay } = useCursor()
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('all')
  const streak = currentStreak(data)
  const tasks = taskCompletion(data)
  const allResults = search(data, q)
  const kinds = ['all', ...new Set(allResults.map((r) => r.kind))]
  const results = kind === 'all' ? allResults : allResults.filter((r) => r.kind === kind)
  const found = insights(data)
  const digest = weeklyDigest(data)
  const coach = coachDigest(data)
  const momentum = momentumIndicator(data)

  return (
    <PageLayout
      tier={1180}
      /* Stacked: zone 3 is four full-width read-backs. There is no narrow form
         here to justify the 62/38 split. (It used to say "and a six-drawer
         cabinet" — the drawers are gone, BUJO-281.) */
      stacked
      zone1={
        <StatBar
          facts={[
            { label: 'current streak', value: `${streak}d`, onClick: () => nav('trackers') },
            { label: 'tasks done', value: `${tasks.pct}%`, onClick: () => nav('today') },
            { label: 'entries', value: data.entries.length, onClick: () => nav('today') },
          ]}
        />
      }
      /* Zone 2 is what you *do* on a page that is otherwise entirely read-only:
         run the weekly review, and search. Everything below zone 2 is a record
         being read back. */
      zone2={<>
      <WeeklyReview />

      <Card band title="Search" subtitle="Find anything across your journal">
        <Input value={q} onChange={(e) => { setQ(e.target.value); setKind('all') }} placeholder="Search entries, memories, gratitude, workouts…" />
        {q && kinds.length > 2 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {kinds.map((k) => (
              // A filter chip is selection state, so it takes the accent wash
              // rather than the accent fill — same rule as Segmented and the
              // First-meal pills. These render only after you type a query,
              // which is why the accent sweep over default state never saw them.
              <button
                key={k}
                onClick={() => setKind(k)}
                aria-pressed={kind === k}
                className={`rounded-none px-2.5 py-0.5 text-label capitalize transition-colors ${
                  kind === k ? 'bg-brand-wash font-medium text-brand' : 'bg-ink-2 text-fg-2 hover:text-fg-1'
                }`}
              >
                {k}{k !== 'all' ? ` (${allResults.filter((r) => r.kind === k).length})` : ''}
              </button>
            ))}
          </div>
        )}
        {q && (
          <div className="mt-3">
            {results.length === 0 ? (
              <Empty>No matches for “{q}”.</Empty>
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
                      <span className="w-16 shrink-0 text-label" style={{ color: cat('sapphire') }}>{r.kind}</span>
                      <span className="text-fg-1">{r.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>
      </>}
      zone3={<>
      {/* The four-`Big` stat row is gone; zone 1 carries three of its facts as
          a bar. "Longest streak" is not one of them — it was already printed in
          Personal records under Lifetime, so the row's fourth tile was a
          duplicate of a card further down the same page. The completion ring
          went with it, on the rule Fitness's conversion set: a ring is a fifth
          accent appearance even when it is neutral, and the ratio it drew is
          already the number beside it. */}

      {/* This-week digest — the cross-domain digest is what Insights is about. */}
      <MasonryGrid>
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
                  <AppIcon as={Trophy} size="sm" style={{ color: cat('green') }} />
                  <span className="text-fg-1">{digest.win}</span>
                </p>
              )}
              {digest.slip && (
                <p className="flex items-center gap-2">
                  <AppIcon as={Warning} size="sm" style={{ color: cat('peach') }} />
                  <span className="text-fg-1">{digest.slip}</span>
                </p>
              )}
            </div>
          )}
        </Card>

        <Card band title="Coach digest" subtitle="What to focus on next">
          <p className="mb-3 flex items-center gap-2 text-body font-medium text-fg-1">
            <AppIcon as={Sparkle} size="sm" style={{ color: cat('mauve') }} />
            {coach.headline}
          </p>
          {coach.tips.length > 0 && (
            <ul className="space-y-2 text-body">
              {coach.tips.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => nav(t.to as Parameters<typeof nav>[0])}
                    className="w-full rounded-none border border-line bg-ink-0 px-3 py-2 text-left hover:border-mauve"
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
      </MasonryGrid>

      {/* Patterns and Momentum are open. They were behind a "Correlations"
          drawer, which put the two things the app worked out that you did not
          already know — the whole reason this page exists — one click further
          away than the analytics that have now left for Stats. A page with
          nothing hidden also stops teaching people that anything might be. */}
      <CardGrid>
      {found.length > 0 && (
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

      {momentum.length > 0 && (
        <Card band title="Momentum" subtitle="Where each metric is trending vs. the week before">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {momentum.map((m) => {
              // Stress is inverted: a drop is good. Everything else: up is good.
              const good = m.key === 'stress' ? m.dir === 'down' : m.dir === 'up'
              const Icon = m.dir === 'up' ? TrendUp : m.dir === 'down' ? TrendDown : Minus
              const color = m.dir === 'flat' ? 'overlay0' : good ? 'green' : 'red'
              return (
                <li key={m.key} className="rounded-none border border-line bg-ink-0 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-label text-fg-2">{m.label}</span>
                    <AppIcon as={Icon} size="sm" style={{ color: cat(color) }} />
                  </div>
                  <p className="mt-1 text-heading font-medium tabular-nums text-fg-1">{m.recent}<span className="text-label text-fg-2">/10</span></p>
                  <p className="text-label" style={{ color: cat(color) }} title={`based on ${m.recentDays} day${m.recentDays === 1 ? '' : 's'}`}>
                    {m.dir === 'flat' ? 'steady' : `${m.delta > 0 ? '+' : ''}${m.delta} vs last week`}
                  </p>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <p className="text-label text-fg-2">
        Task migration &amp; aging live in{' '}
        <Button variant="ghost" size="sm" onClick={() => nav('plan')} className="h-auto p-0">Plan →</Button>
      </p>

      {/* The Pickleball domain digest was here. Deleted rather than moved
          (BUJO-281): all four of its figures are on the Pickleball page and
          better there — win rate, day streak and recent form as tiles, and
          "This week: N games" with a goal bar instead of a bare count. It was
          also the only domain that had one, which made it an accretion rather
          than a feature: there was never a fitness or reading digest beside
          it. A link-out glance is not what changed and not what to do next. */}

      {/* Mood analytics, Habit analytics and Lifetime moved to Stats
          (BUJO-281). Insights answers what changed and what to do next;
          a weekday average, a completion history and a lifetime total are
          the record, which is what Stats is. They went into Stats existing
          Mood views / Habits folds rather than beside them. */}
      {/* Tag manager used to be a seventh drawer here. It moved to Settings →
          Data (BUJO-281): it is the only thing on this page that *changes*
          anything — renaming a tag rewrites every entry carrying it — and a
          bulk edit filed under "Insights" is filed by where it was built, not
          by what it does. */}
      </CardGrid>
      </>}
    />
  )
}
