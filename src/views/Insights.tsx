import { Minus, Sparkle, TrendDown, TrendUp, Trophy, Warning } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { Card, Empty, Input } from '../components/ui'
import { Button } from '../components/ui/button'
import { cat } from '../lib/colors'
import { currentStreak, search, taskCompletion } from '../lib/stats'
import { insights, weeklyDigest, digestRangeLabel, momentumIndicator, pickleballInsights } from '../lib/correlations'
import { coachDigest } from '../lib/coach'
import { PageLayout, StatBar } from '../components/page'
import { CardGrid, MasonryGrid } from '../components/shell/CardGrid'
import { useNav } from '../components/shell/nav'
import { useCursor } from '../components/shell/cursor'
import { prettyDay } from '../lib/date'
import { WeeklyReview } from '../components/WeeklyReview'
// Insights carried a private copy of this collapsible section header — the
// same markup, minus the press affordance and the "show" hint. Three copies of
// CollapsibleSection were already consolidated once; this was a fourth.
import { QuietSection as Section } from '../components/CollapsibleSection'

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
  const pickle = pickleballInsights(data)

  return (
    <PageLayout
      tier={1180}
      /* Stacked: zone 3 is a masonry of analytics panels and a six-drawer
         cabinet, all of which want the full width. There is no narrow form
         here to justify the 62/38 split. */
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

      {/* The seven analytics drawers DO flow three across: collapsed they are
          50px strips, and stacked they read as a filing cabinet. */}
      <CardGrid>
      {/* 4) Correlations — deep read-only analytics, collapsed. */}
      {(found.length > 0 || momentum.length > 0) && (
        <Section stickyKey="insights.correlations" title="Correlations" subtitle="patterns & momentum">
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
        </Section>
      )}

      <p className="text-label text-fg-2">
        Task migration &amp; aging live in{' '}
        <Button variant="ghost" size="sm" onClick={() => nav('plan')} className="h-auto p-0">Plan →</Button>
      </p>

      {/* 7) Domain digests — compact, link-out, collapsed. */}
      {pickle.sessions > 0 && (
        <Section stickyKey="insights.digests" title="Domain digests" subtitle="cross-domain glances">
        <Card band title="Pickleball" subtitle="Your game at a glance" right={<Button variant="ghost" size="sm" onClick={() => nav('pickleball')} className="h-auto p-0 text-label">Open →</Button>}>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <PickStat label="Win rate" value={pickle.winRate == null ? '—' : `${Math.round(pickle.winRate * 100)}%`} />
            <PickStat label="Games this week" value={String(pickle.weekGames)} />
            <PickStat label="Play streak" value={`${pickle.playStreak}d`} />
            <PickStat
              label="Recent form"
              value={pickle.recentWinRate == null ? '—' : `${Math.round(pickle.recentWinRate * 100)}%`}
              // The formDir colour moved onto the arrow, where `PickStat`
              // derives it from `trend` with the same mapping. It used to tint
              // the figure too, which meant a flat run rendered "67%" in
              // `overlay0` — a number greyed to near-invisible for the crime of
              // not having changed.
              trend={pickle.formDir}
            />
          </ul>
          <p className="mt-3 border-t border-line pt-3 text-label text-fg-2">
            {pickle.sessions} session{pickle.sessions === 1 ? '' : 's'} logged · {pickle.doubles} doubles / {pickle.singles} singles.
          </p>
        </Card>
        </Section>
      )}

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

/**
 * A figure in a card's stat grid.
 *
 * The value is `fg-1`, never a per-instance accent — see the note on `Big`.
 * The trend arrow keeps its colour, because there the colour *is* the reading.
 */
function PickStat({ label, value, trend }: { label: string; value: string; trend?: 'up' | 'down' | 'flat' | null }) {
  const TrendIcon = trend === 'up' ? TrendUp : trend === 'down' ? TrendDown : Minus
  const trendColor = trend === 'up' ? 'green' : trend === 'down' ? 'red' : 'overlay0'
  return (
    <li className="rounded-none border border-line bg-ink-0 p-3">
      <div className="flex items-center justify-between">
        <span className="text-label text-fg-2">{label}</span>
        {trend && <AppIcon as={TrendIcon} size="sm" style={{ color: cat(trendColor) }} />}
      </div>
      <p className="mt-1 text-heading font-medium tabular-nums text-fg-1">{value}</p>
    </li>
  )
}
