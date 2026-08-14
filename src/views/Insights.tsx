import { Barbell, BookOpen, Cake, FileText, Flame, Image, Minus, PersonSimpleRun, Smiley, Sparkle, Sun, TrendDown, TrendUp, Trophy, Warning } from '@/components/icons'
import type { Icon as IconGlyph } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { Card, Empty, Input } from '../components/ui'
import { Button } from '../components/ui/button'
import { cat } from '../lib/colors'
import { labelOf } from '../domain/activities'
import { currentStreak, longestStreak, search, taskCompletion } from '../lib/stats'
import { insights, moodImpactRanking, weeklyDigest, weeklyHabitTrend, digestRangeLabel, streakLeaderboard, habitConsistencyScore, habitMonthlyDeltas, bestWorstWeekday, weekdayWeekendSplit, metricVolatility, momentumIndicator, pickleballInsights, type PeriodTrend } from '../lib/correlations'
import { coachDigest } from '../lib/coach'
import { CountUp, Ring } from '../components/ui/ring'
import { Page } from '../components/shell/Page'
import { CardGrid, MasonryGrid } from '../components/shell/CardGrid'
import { useNav } from '../components/shell/nav'
import { useCursor } from '../components/shell/cursor'
import { prettyDay, prettyMonth } from '../lib/date'
import { TagManager } from '../components/TagManager'
import { WeeklyReview } from '../components/WeeklyReview'
// Insights carried a private copy of this collapsible section header — the
// same markup, minus the press affordance and the "show" hint. Three copies of
// CollapsibleSection were already consolidated once; this was a fourth.
import { QuietSection as Section } from '../components/CollapsibleSection'

export function Insights() {
  const { data } = useJournal()
  const nav = useNav()
  const { setDay, setMonth } = useCursor()
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('all')
  const streak = currentStreak(data)
  const best = longestStreak(data)
  const tasks = taskCompletion(data)
  const allResults = search(data, q)
  const kinds = ['all', ...new Set(allResults.map((r) => r.kind))]
  const results = kind === 'all' ? allResults : allResults.filter((r) => r.kind === kind)
  const found = insights(data)
  const moodImpact = moodImpactRanking(data)
  const digest = weeklyDigest(data)
  const habitTrend = weeklyHabitTrend(data)
  const coach = coachDigest(data)

  // Cross-domain mood/metric reads.
  const moodWd = bestWorstWeekday(data, 'mood')
  const split = weekdayWeekendSplit(data)
  const moodVol = metricVolatility(data, 'mood')
  const momentum = momentumIndicator(data)

  // Cross-domain pickleball.
  const pickle = pickleballInsights(data)

  // Habit deep-dives — anchored to your hottest build habit (top of the
  // streak leaderboard) so the weekday/consistency/month cards always have a
  // meaningful subject without a picker.
  const leaders = streakLeaderboard(data)
  const focusId = leaders[0]?.habitId
  const focusName = focusId ? `${leaders[0].emoji ? leaders[0].emoji + ' ' : ''}${leaders[0].name}` : ''
  const focusScore = focusId ? habitConsistencyScore(data, focusId) : null
  const monthly = focusId ? habitMonthlyDeltas(data, focusId) : []
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.done))

  // Year-in-review aggregates.
  const moods = data.metrics.map((m) => m.mood).filter((v): v is number => v != null)
  const avgMood = moods.length ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10 : null
  const workouts = data.workouts.length
  const photos = data.memories.filter((m) => m.photo).length + data.monthly.filter((m) => m.photo).length

  // Personal records · bests across domains.
  const bestMood = [...data.metrics].filter((m) => m.mood != null).sort((a, b) => (b.mood! - a.mood!))[0]
  const bigWorkout = [...data.workouts].filter((w) => w.durationMin).sort((a, b) => (b.durationMin! - a.durationMin!))[0]
  const pickBest = [...(data.pickleball ?? [])].sort((a, b) => b.gamesWon - a.gamesWon)[0]
  const entriesByDay = data.entries.reduce<Record<string, number>>((m, e) => { if (e.date) m[e.date] = (m[e.date] ?? 0) + 1; return m }, {})
  const busiest = Object.entries(entriesByDay).sort((a, b) => b[1] - a[1])[0]
  const records: { label: string; value: string }[] = []
  if (best > 0) records.push({ label: 'Longest streak', value: `${best} days` })
  if (bestMood?.mood != null) records.push({ label: 'Best mood', value: `${bestMood.mood}/10 · ${prettyDay(bestMood.date)}` })
  if (bigWorkout) records.push({ label: 'Longest workout', value: `${bigWorkout.durationMin}m · ${labelOf(bigWorkout.activity)}` })
  if (pickBest) records.push({ label: 'Best pickleball', value: `${pickBest.gamesWon} wins · ${prettyDay(pickBest.date)}` })
  if (busiest) records.push({ label: 'Busiest day', value: `${busiest[1]} entries · ${prettyDay(busiest[0])}` })

  // Index: months that have any data + collections.
  const months = [...new Set([
    ...data.entries.filter((e) => e.date).map((e) => e.date.slice(0, 7)),
    ...data.monthly.map((m) => m.ym),
    ...data.metrics.map((m) => m.date.slice(0, 7)),
  ])].sort().reverse()

  return (
    <Page width="wide">
      {/* 1) The ritual + search utility lead, above all read-only analytics. */}
      <WeeklyReview />

      <Card title="Search" subtitle="Find anything across your journal">
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
                className={`rounded-pill px-2.5 py-0.5 text-label capitalize transition-colors ${
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

      {/* 2) Big-stat row. */}
      <div className="grid grid-cols-2 items-start gap-3 sm:gap-5 lg:grid-cols-4">
        <Big label="Current streak" value={streak} suffix="d" trend={habitTrend} trendLabel="habits vs last week" onClick={() => nav('trackers')} />
        <Big label="Longest streak" value={best} suffix="d" onClick={() => nav('trackers')} />
        <Big label="Tasks done" value={tasks.pct} suffix="%" sub={`${tasks.done}/${tasks.total}`} ring max={100} onClick={() => nav('today')} />
        <Big label="Entries" value={data.entries.length} onClick={() => nav('today')} />
      </div>

      {/* 3) This-week digest — the cross-domain digest is what Insights is about. */}
      <MasonryGrid>
        <Card title="Weekly digest" subtitle={digestRangeLabel(digest.from, digest.to)}>
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

        <Card title="Coach digest" subtitle="What to focus on next">
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
                    className="w-full rounded-card border border-line bg-ink-0 px-3 py-2 text-left hover:border-mauve"
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
        <Card title="Patterns" subtitle="What your data is telling you">
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
        <Card title="Momentum" subtitle="Where each metric is trending vs. the week before">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {momentum.map((m) => {
              // Stress is inverted: a drop is good. Everything else: up is good.
              const good = m.key === 'stress' ? m.dir === 'down' : m.dir === 'up'
              const Icon = m.dir === 'up' ? TrendUp : m.dir === 'down' ? TrendDown : Minus
              const color = m.dir === 'flat' ? 'overlay0' : good ? 'green' : 'red'
              return (
                <li key={m.key} className="rounded-card border border-line bg-ink-0 p-3">
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

      {/* 5) Mood analytics — collapsed. */}
      {(moodWd.best || split.habitWeekday != null || moodVol.band) && (
        <Section stickyKey="insights.mood" title="Mood analytics" subtitle="weekday, split & stability">
        <MasonryGrid>
          {moodWd.best && moodWd.worst && (
            <Card title="Best & worst day" subtitle="When your mood runs brightest">
              <div className="mb-3 flex items-center gap-2 text-body">
                <AppIcon as={Sun} size="sm" style={{ color: cat('yellow') }} />
                <span className="text-fg-1">
                  Brightest on <strong className="text-fg-1">{moodWd.best.label}</strong> ({moodWd.best.avg}/10),
                  dimmest on <strong className="text-fg-1">{moodWd.worst.label}</strong> ({moodWd.worst.avg}/10).
                </span>
              </div>
              {/* `items-stretch`, not `items-end`. Cross-axis `end` sizes each
                  column to its own content — two lines of text, 34px — so the
                  `flex-1` bar track below got zero height and every bar in the
                  chart rendered at 0px. The row is 100px tall and drew nothing
                  but its numbers and its day labels. Stretched, the column
                  takes the row's full height and the track has something for
                  the percentage to resolve against. The bars still sit on the
                  baseline: that is the track's own `items-end`, one level in.
                  Six charts across four files had this exact bug. */}
              <div className="flex items-stretch justify-between gap-2" style={{ height: 100 }} role="img" aria-label="Average mood by weekday">
                {moodWd.rows.map((r) => (
                  <div key={r.weekday} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-micro tabular-nums text-fg-2">{r.avg == null ? '–' : r.avg}</span>
                    <div className="flex w-full flex-1 items-end">
                      <div className="w-full rounded-t" style={{ height: `${r.avg == null ? 2 : Math.max(2, (r.avg / 10) * 100)}%`, background: r.avg == null ? cat('surface0') : r.weekday === moodWd.best!.weekday ? cat('green') : r.weekday === moodWd.worst!.weekday ? cat('peach') : cat('surface1') }} title={r.days ? `${r.avg}/10 over ${r.days}d` : 'no data'} />
                    </div>
                    <span className="text-micro text-fg-2">{r.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {(split.habitWeekday != null || split.moodWeekday != null) && (
            <Card title="Weekday vs weekend" subtitle="How your week splits in two">
              <div className="grid grid-cols-2 gap-3 text-body">
                <SplitCol label="Weekdays" habit={split.habitWeekday} mood={split.moodWeekday} days={split.weekdayDays} />
                <SplitCol label="Weekends" habit={split.habitWeekend} mood={split.moodWeekend} days={split.weekendDays} />
              </div>
            </Card>
          )}

          {moodVol.band && (
            <Card title="Mood stability" subtitle={`Last ${moodVol.days} logged days, how steady you've felt`}>
              <p className="text-display font-medium" style={{ color: cat(moodVol.stability! >= 70 ? 'green' : moodVol.stability! >= 40 ? 'yellow' : 'peach') }}>
                {moodVol.stability}<span className="text-heading text-fg-2">/100</span>
              </p>
              <p className="mt-1 text-body capitalize text-fg-1">
                <span className="mr-1.5 rounded px-1.5 py-0.5 text-label" style={{ background: cat('surface0'), color: moodVol.band === 'steady' ? cat('green') : moodVol.band === 'volatile' ? cat('peach') : cat('subtext0') }}>{moodVol.band}</span>
                avg {moodVol.mean}/10 · swing ±{moodVol.sd}
              </p>
              <p className="mt-2 text-label text-fg-2">Stability ignores the average — it measures how much your days swing, not how high they sit.</p>
            </Card>
          )}
        </MasonryGrid>
        </Section>
      )}

      {/* 6) Habit analytics — collapsed. */}
      {(moodImpact.length > 0 || (focusId && focusScore != null) || (focusId && monthly.some((m) => m.done > 0))) && (
        <Section stickyKey="insights.habits" title="Habit analytics" subtitle="mood impact, consistency & trend">
      {moodImpact.length > 0 && (
        <Card title="Habit mood impact" subtitle="How much each habit lifts your mood">
          <ul className="space-y-2">
            {moodImpact.map((h) => (
              <li key={h.habitId} className="flex items-center gap-2 text-body">
                <span
                  className="w-14 shrink-0 rounded px-1.5 py-0.5 text-center text-label font-medium"
                  style={{ background: cat('surface0'), color: h.lift >= 0 ? cat('green') : cat('red') }}
                >
                  {h.lift >= 0 ? '+' : ''}{h.lift}
                </span>
                <span className="text-fg-1">{h.emoji ? h.emoji + ' ' : ''}{h.name}</span>
                <span className="text-fg-2">
                  {h.doneMood} vs {h.skipMood} mood · {h.doneDays}d
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {focusId && (
          <Card title="Consistency score" subtitle={`${focusName}, recency-weighted, last 30 days`}>
            {focusScore == null ? (
              <Empty>Not enough scheduled days yet.</Empty>
            ) : (
              <>
                <p className="text-display font-medium" style={{ color: cat(focusScore >= 70 ? 'green' : focusScore >= 40 ? 'yellow' : 'peach') }}>{focusScore}<span className="text-heading text-fg-2">/100</span></p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-pill bg-ink-2">
                  <div className="h-full rounded-pill" style={{ width: `${focusScore}%`, background: cat(focusScore >= 70 ? 'green' : focusScore >= 40 ? 'yellow' : 'peach') }} />
                </div>
                <p className="mt-2 text-label text-fg-2">Recent days count more, so this tracks your momentum — not just a flat average.</p>
              </>
            )}
          </Card>
      )}

      {focusId && monthly.some((m) => m.done > 0) && (
        <Card title="Month over month" subtitle={`${focusName}, completions per month`}>
          {/* `items-stretch` — see the note on the weekday chart above. */}
          <div className="flex items-stretch justify-between gap-2" style={{ height: 130 }} role="img" aria-label={`Monthly completions of ${focusName} with month-over-month change`}>
            {monthly.map((m) => (
              <div key={m.ym} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-micro tabular-nums" style={{ color: m.delta > 0 ? cat('green') : m.delta < 0 ? cat('red') : cat('overlay0') }}>
                  {m.delta > 0 ? `+${m.delta}` : m.delta < 0 ? m.delta : '–'}
                </span>
                <span className="text-caption font-medium tabular-nums text-fg-1">{m.done}</span>
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t" style={{ height: `${Math.max(2, (m.done / maxMonthly) * 100)}%`, background: cat('mauve') }} title={`${m.label}: ${m.done} done`} />
                </div>
                <span className="text-micro text-fg-2">{m.label.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
        </Section>
      )}

      {/* 7) Domain digests — compact, link-out, collapsed. */}
      {pickle.sessions > 0 && (
        <Section stickyKey="insights.digests" title="Domain digests" subtitle="cross-domain glances">
        <Card title="Pickleball" subtitle="Your game at a glance" right={<Button variant="ghost" size="sm" onClick={() => nav('pickleball')} className="h-auto p-0 text-label">Open →</Button>}>
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

      {/* 8) Lifetime — deep totals & navigation, collapsed. */}
      <Section stickyKey="insights.lifetime" title="Lifetime" subtitle="year in review, records & index">
      <MasonryGrid>
        <Card title="Year in review" subtitle="Your journal so far">
          <ul className="space-y-1.5 text-body text-fg-1">
            <ReviewRow icon={FileText} color="sky" label="entries logged" value={data.entries.length} />
            <ReviewRow icon={Smiley} color="green" label={`average mood${avgMood != null ? ' / 10' : ''}`} value={avgMood ?? '—'} />
            <ReviewRow icon={Barbell} color="teal" label="workouts" value={workouts} />
            <ReviewRow icon={Image} color="mauve" label="photos kept" value={photos} />
            <ReviewRow icon={Flame} color="peach" label="day longest streak" value={best} />
            <ReviewRow icon={Cake} color="pink" label="birthdays tracked" value={data.birthdays.length} />
          </ul>
        </Card>

        <Card title="Index" subtitle="Every month with entries">
          {months.length === 0 ? (
            <Empty>Log entries on a few days to fill in the index.</Empty>
          ) : (
            <ul className="grid grid-cols-2 gap-1 text-body">
              {months.map((ym) => (
                <li key={ym}>
                  <button onClick={() => { setMonth(ym); nav('monthly') }} className="inline-flex w-full items-center gap-1.5 rounded px-1.5 py-0.5 text-left text-fg-1 hover:bg-ink-2 hover:text-fg-1">
                    <AppIcon as={BookOpen} size="sm" style={{ color: cat('overlay1') }} /> {prettyMonth(ym)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </MasonryGrid>

      {records.length > 0 && (
        <Card title="Personal records" subtitle="Your bests so far">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {records.map((r) => (
              <div key={r.label} className="rounded-card border border-line bg-ink-0 p-3">
                <p className="text-body font-medium text-fg-1">{r.value}</p>
                <p className="text-label text-fg-2">{r.label}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
      </Section>

      {/* 9) Maintenance — collapsed at the bottom. */}
      <Section stickyKey="insights.tags" title="Tag manager" subtitle="merge, rename & retire tags">
        <TagManager />
      </Section>
      </CardGrid>
    </Page>
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
    <li className="rounded-card border border-line bg-ink-0 p-3">
      <div className="flex items-center justify-between">
        <span className="text-label text-fg-2">{label}</span>
        {trend && <AppIcon as={TrendIcon} size="sm" style={{ color: cat(trendColor) }} />}
      </div>
      <p className="mt-1 text-heading font-medium tabular-nums text-fg-1">{value}</p>
    </li>
  )
}

function SplitCol({ label, habit, mood, days }: { label: string; habit: number | null; mood: number | null; days: number }) {
  return (
    <div className="rounded-card border border-line bg-ink-0 p-3">
      <p className="mb-2 text-label font-medium text-fg-2">{label}</p>
      <p className="flex items-center gap-1.5 text-fg-1">
        <AppIcon as={PersonSimpleRun} size="sm" style={{ color: cat('mauve') }} />
        <strong className="tabular-nums">{habit == null ? '—' : Math.round(habit * 100) + '%'}</strong>
        <span className="text-label text-fg-2">habits</span>
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-fg-1">
        <AppIcon as={Smiley} size="sm" style={{ color: cat('green') }} />
        <strong className="tabular-nums">{mood == null ? '—' : `${mood}/10`}</strong>
        <span className="text-label text-fg-2">mood</span>
      </p>
      {days > 0 && <p className="mt-1 text-micro text-fg-2">{days} scheduled day{days === 1 ? '' : 's'}</p>}
    </div>
  )
}

function ReviewRow({ icon: Icon, color, label, value }: { icon: IconGlyph; color: string; label: string; value: number | string }) {
  return (
    <li className="flex items-center gap-2">
      <AppIcon as={Icon} size="sm" style={{ color: cat(color) }} />
      <strong className="text-fg-1">{value}</strong>
      <span>{label}</span>
    </li>
  )
}

/**
 * A headline figure at the top of the page.
 *
 * **The value is `fg-1`. There is no per-instance colour prop, on purpose.**
 *
 * These four tiles used to take one each: Current streak peach, Longest streak
 * mauve, Tasks done green, Entries sky — and the pickleball grid below cycled
 * the same four in the same order. The colour was a rotation, not a reading.
 * Nothing about "Entries" is sky, and a longest streak is not mauve for being
 * a record; the fifth tile would simply have started the cycle again.
 *
 * Four differently-coloured numbers side by side promise the reader four
 * different kinds of thing. All four are counts. So the colour was not merely
 * decorative — it was actively misleading, and it competed with the colour on
 * the same page that *does* carry a reading: the trend delta below each tile
 * (green up, red down, grey flat), the consistency score banded at 70 and 40,
 * the stability band, the habit-impact badges. Those all still colour, and they
 * are legible now that nothing shouts over them.
 *
 * The rule this page now follows: **a figure is `fg-1` unless its colour is
 * computed from its value.** If you cannot name the threshold, it does not get
 * a colour.
 */
function Big({ label, value, sub, suffix = '', ring, max = 100, trend, trendLabel, onClick }: { label: string; value: number; sub?: string; suffix?: string; ring?: boolean; max?: number; trend?: PeriodTrend; trendLabel?: string; onClick?: () => void }) {
  const TrendIcon = trend?.dir === 'up' ? TrendUp : trend?.dir === 'down' ? TrendDown : Minus
  const trendColor = trend?.dir === 'up' ? 'green' : trend?.dir === 'down' ? 'red' : 'overlay0'
  return (
    <Card className={`flex flex-col items-center text-center ${onClick ? 'cursor-pointer hover:border-mauve' : ''}`} onClick={onClick}>
      {ring ? (
        // The ring keeps a fill — a progress arc with no colour is not a
        // progress arc — but one fill for every ring, not one per call site.
        <Ring value={value} max={max} color="mauve" suffix={suffix} />
      ) : (
        <div className="text-display font-medium text-fg-1">
          <CountUp value={value} suffix={suffix} />
        </div>
      )}
      <div className="mt-1 text-body text-fg-2">{label}</div>
      {sub && <div className="text-label text-fg-2">{sub}</div>}
      {trend && (
        <div className="mt-1 flex items-center gap-1 text-label" style={{ color: cat(trendColor) }} title={trendLabel}>
          <AppIcon as={TrendIcon} size="sm" />
          <span>{trend.dir === 'flat' ? 'flat' : `${trend.pct > 0 ? '+' : ''}${trend.pct}%`}</span>
        </div>
      )}
    </Card>
  )
}
