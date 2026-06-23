import { useState } from 'react'
import { FileText, Smile, Dumbbell, Image as ImageIcon, Flame, Cake, BookOpen, TrendingUp, TrendingDown, Minus, Sparkles, Trophy, AlertTriangle, CalendarDays, Sun, Activity, Repeat, Hourglass, type LucideIcon } from 'lucide-react'
import { useJournal } from '../store'
import { Card, Empty, Input } from '../components/ui'
import { cat } from '../lib/colors'
import { currentStreak, longestStreak, search, taskCompletion } from '../lib/stats'
import { insights, moodImpactRanking, weeklyDigest, weeklyHabitTrend, digestRangeLabel, streakLeaderboard, habitWeekdayPerformance, habitConsistencyScore, habitMonthlyDeltas, bestWorstWeekday, weekdayWeekendSplit, metricVolatility, momentumIndicator, migrationAnalytics, taskAging, pickleballInsights, type PeriodTrend } from '../lib/correlations'
import { coachDigest } from '../lib/coach'
import { CountUp, Ring } from '../components/Counter'
import { useNav } from '../components/shell/nav'
import { useCursor } from '../components/shell/cursor'
import { prettyDay, prettyMonth } from '../lib/date'
import { TagManager } from '../components/TagManager'
import { WeeklyReview } from '../components/WeeklyReview'

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

  // Task hygiene + cross-domain pickleball.
  const migration = migrationAnalytics(data)
  const aging = taskAging(data)
  const maxAging = Math.max(1, ...aging.buckets.map((b) => b.count))
  const pickle = pickleballInsights(data)

  // Habit deep-dives — anchored to your hottest build habit (top of the
  // streak leaderboard) so the weekday/consistency/month cards always have a
  // meaningful subject without a picker.
  const leaders = streakLeaderboard(data)
  const focusId = leaders[0]?.habitId
  const focusName = focusId ? `${leaders[0].emoji ? leaders[0].emoji + ' ' : ''}${leaders[0].name}` : ''
  const weekdayPerf = focusId ? habitWeekdayPerformance(data, focusId) : null
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
  if (bigWorkout) records.push({ label: 'Longest workout', value: `${bigWorkout.durationMin}m · ${bigWorkout.activity}` })
  if (pickBest) records.push({ label: 'Best pickleball', value: `${pickBest.gamesWon} wins · ${prettyDay(pickBest.date)}` })
  if (busiest) records.push({ label: 'Busiest day', value: `${busiest[1]} entries · ${prettyDay(busiest[0])}` })

  // Index: months that have any data + collections.
  const months = [...new Set([
    ...data.entries.filter((e) => e.date).map((e) => e.date.slice(0, 7)),
    ...data.monthly.map((m) => m.ym),
    ...data.metrics.map((m) => m.date.slice(0, 7)),
  ])].sort().reverse()

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div className="grid grid-cols-2 items-start gap-3 sm:gap-5 lg:grid-cols-4">
        <Big label="Current streak" value={streak} suffix="d" color="peach" trend={habitTrend} trendLabel="habits vs last week" onClick={() => nav('trackers')} />
        <Big label="Longest streak" value={best} suffix="d" color="mauve" onClick={() => nav('trackers')} />
        <Big label="Tasks done" value={tasks.pct} suffix="%" color="green" sub={`${tasks.done}/${tasks.total}`} ring max={100} onClick={() => nav('today')} />
        <Big label="Entries" value={data.entries.length} color="sky" onClick={() => nav('today')} />
      </div>

      {/* Actions first: the weekly ritual + search sit above the read-only analytics. */}
      <WeeklyReview />

      <div className="grid items-start gap-5 md:grid-cols-2">
        <Card title="Weekly digest" subtitle={digestRangeLabel(digest.from, digest.to)}>
          <ul className="space-y-1.5 text-sm">
            {digest.lines.map((l) => (
              <li key={l.label} className="flex items-center justify-between gap-2">
                <span className="text-subtext0">{l.label}</span>
                <strong className="text-text">{l.value}</strong>
              </li>
            ))}
          </ul>
          {(digest.win || digest.slip) && (
            <div className="mt-3 space-y-1.5 border-t border-surface0 pt-3 text-sm">
              {digest.win && (
                <p className="flex items-center gap-2">
                  <Trophy size={14} style={{ color: cat('green') }} />
                  <span className="text-subtext1">{digest.win}</span>
                </p>
              )}
              {digest.slip && (
                <p className="flex items-center gap-2">
                  <AlertTriangle size={14} style={{ color: cat('peach') }} />
                  <span className="text-subtext1">{digest.slip}</span>
                </p>
              )}
            </div>
          )}
        </Card>

        <Card title="Coach digest" subtitle="What to focus on next">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
            <Sparkles size={15} style={{ color: cat('mauve') }} />
            {coach.headline}
          </p>
          {coach.tips.length > 0 && (
            <ul className="space-y-2 text-sm">
              {coach.tips.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => nav(t.to as Parameters<typeof nav>[0])}
                    className="w-full rounded-lg border border-surface0 bg-base px-3 py-2 text-left hover:border-mauve"
                  >
                    <span className="font-medium text-text">{t.title}</span>
                    <span className="block text-xs text-overlay0">{t.detail}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {coach.insight && (
            <p className="mt-3 border-t border-surface0 pt-3 text-sm text-subtext1">
              <span className="mr-1.5 rounded px-1.5 py-0.5 text-xs" style={{ background: cat('surface0'), color: coach.insight.strength === 'strong' ? cat('mauve') : cat('subtext0') }}>
                r={coach.insight.r}
              </span>
              {coach.insight.text}
            </p>
          )}
        </Card>
      </div>

      {found.length > 0 && (
        <Card title="Patterns" subtitle="What your data is telling you">
          <ul className="space-y-2">
            {found.map((ins, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="rounded px-1.5 py-0.5 text-xs" style={{ background: cat('surface0'), color: ins.strength === 'strong' ? cat('mauve') : cat('subtext0') }}>
                  r={ins.r} · {ins.strength}
                </span>
                <span className="text-subtext1">{ins.text}</span>
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
              const Icon = m.dir === 'up' ? TrendingUp : m.dir === 'down' ? TrendingDown : Minus
              const color = m.dir === 'flat' ? 'overlay0' : good ? 'green' : 'red'
              return (
                <li key={m.key} className="rounded-xl border border-surface0 bg-base p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-subtext0">{m.label}</span>
                    <Icon size={14} style={{ color: cat(color) }} />
                  </div>
                  <p className="mt-1 text-lg font-bold tabular-nums text-text">{m.recent}<span className="text-xs text-overlay0">/10</span></p>
                  <p className="text-xs" style={{ color: cat(color) }} title={`based on ${m.recentDays} day${m.recentDays === 1 ? '' : 's'}`}>
                    {m.dir === 'flat' ? 'steady' : `${m.delta > 0 ? '+' : ''}${m.delta} vs last week`}
                  </p>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {(aging.open > 0 || migration.chronic.length > 0) && (
        <div className="grid items-start gap-5 md:grid-cols-2">
          {aging.open > 0 && (
            <Card title="Open task aging" subtitle={`${aging.open} open task${aging.open === 1 ? '' : 's'} · how long they've sat`}>
              <div className="flex items-end justify-between gap-2" style={{ height: 110 }} role="img" aria-label="Open tasks bucketed by age">
                {aging.buckets.map((b) => (
                  <div key={b.label} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[11px] font-semibold tabular-nums text-text">{b.count}</span>
                    <div className="flex w-full flex-1 items-end">
                      <div className="w-full rounded-t" style={{ height: `${Math.max(2, (b.count / maxAging) * 100)}%`, background: cat(b.color) }} title={`${b.count} task${b.count === 1 ? '' : 's'} aged ${b.label}`} />
                    </div>
                    <span className="text-[10px] text-overlay0">{b.label}</span>
                  </div>
                ))}
              </div>
              {aging.oldest && (
                <p className="mt-3 flex items-center gap-2 border-t border-surface0 pt-3 text-xs text-subtext1">
                  <Hourglass size={13} style={{ color: cat('peach') }} />
                  Oldest: <span className="text-text">{aging.oldest.text}</span> · {aging.oldest.age}d
                </p>
              )}
            </Card>
          )}

          {migration.chronic.length > 0 && (
            <Card title="Chronically deferred" subtitle="Tasks you keep carrying forward — do or drop">
              <ul className="space-y-2 text-sm">
                {migration.chronic.slice(0, 6).map((t) => (
                  <li key={t.id} className="flex items-center gap-2">
                    <span className="flex w-12 shrink-0 items-center justify-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold" style={{ background: cat('surface0'), color: cat('peach') }}>
                      <Repeat size={11} />{t.migrations}×
                    </span>
                    <span className="flex-1 truncate text-text" title={t.text}>{t.text}</span>
                    <span className="shrink-0 text-xs text-overlay0">{prettyDay(t.date)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-surface0 pt-3 text-xs text-overlay0">
                {migration.migratedChains} task{migration.migratedChains === 1 ? '' : 's'} migrated at least once · {migration.totalMigrations} carry-forward{migration.totalMigrations === 1 ? '' : 's'} total.
              </p>
            </Card>
          )}
        </div>
      )}

      {pickle.sessions > 0 && (
        <Card title="Pickleball" subtitle="Your game at a glance">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <PickStat label="Win rate" value={pickle.winRate == null ? '—' : `${Math.round(pickle.winRate * 100)}%`} color="green" />
            <PickStat label="Games this week" value={String(pickle.weekGames)} color="sky" />
            <PickStat label="Play streak" value={`${pickle.playStreak}d`} color="peach" />
            <PickStat
              label="Recent form"
              value={pickle.recentWinRate == null ? '—' : `${Math.round(pickle.recentWinRate * 100)}%`}
              color={pickle.formDir === 'up' ? 'green' : pickle.formDir === 'down' ? 'red' : 'overlay0'}
              trend={pickle.formDir}
            />
          </ul>
          <p className="mt-3 border-t border-surface0 pt-3 text-xs text-overlay0">
            {pickle.sessions} session{pickle.sessions === 1 ? '' : 's'} logged · {pickle.doubles} doubles / {pickle.singles} singles.
          </p>
        </Card>
      )}

      {(moodWd.best || split.habitWeekday != null || moodVol.band) && (
        <div className="grid items-start gap-5 md:grid-cols-2">
          {moodWd.best && moodWd.worst && (
            <Card title="Best & worst day" subtitle="When your mood runs brightest">
              <div className="mb-3 flex items-center gap-2 text-sm">
                <Sun size={15} style={{ color: cat('yellow') }} />
                <span className="text-subtext1">
                  Brightest on <strong className="text-text">{moodWd.best.label}</strong> ({moodWd.best.avg}/10),
                  dimmest on <strong className="text-text">{moodWd.worst.label}</strong> ({moodWd.worst.avg}/10).
                </span>
              </div>
              <div className="flex items-end justify-between gap-2" style={{ height: 100 }} role="img" aria-label="Average mood by weekday">
                {moodWd.rows.map((r) => (
                  <div key={r.weekday} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] tabular-nums text-subtext0">{r.avg == null ? '–' : r.avg}</span>
                    <div className="flex w-full flex-1 items-end">
                      <div className="w-full rounded-t" style={{ height: `${r.avg == null ? 2 : Math.max(2, (r.avg / 10) * 100)}%`, background: r.avg == null ? cat('surface0') : r.weekday === moodWd.best!.weekday ? cat('green') : r.weekday === moodWd.worst!.weekday ? cat('peach') : cat('surface1') }} title={r.days ? `${r.avg}/10 over ${r.days}d` : 'no data'} />
                    </div>
                    <span className="text-[10px] text-overlay0">{r.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {(split.habitWeekday != null || split.moodWeekday != null) && (
            <Card title="Weekday vs weekend" subtitle="How your week splits in two">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <SplitCol label="Weekdays" habit={split.habitWeekday} mood={split.moodWeekday} days={split.weekdayDays} />
                <SplitCol label="Weekends" habit={split.habitWeekend} mood={split.moodWeekend} days={split.weekendDays} />
              </div>
            </Card>
          )}

          {moodVol.band && (
            <Card title="Mood stability" subtitle={`Last ${moodVol.days} logged days · how steady you've felt`}>
              <p className="text-4xl font-extrabold" style={{ color: cat(moodVol.stability! >= 70 ? 'green' : moodVol.stability! >= 40 ? 'yellow' : 'peach') }}>
                {moodVol.stability}<span className="text-lg text-overlay0">/100</span>
              </p>
              <p className="mt-1 text-sm capitalize text-subtext1">
                <span className="mr-1.5 rounded px-1.5 py-0.5 text-xs" style={{ background: cat('surface0'), color: moodVol.band === 'steady' ? cat('green') : moodVol.band === 'volatile' ? cat('peach') : cat('subtext0') }}>{moodVol.band}</span>
                avg {moodVol.mean}/10 · swing ±{moodVol.sd}
              </p>
              <p className="mt-2 text-xs text-overlay0">Stability ignores the average — it measures how much your days swing, not how high they sit.</p>
            </Card>
          )}
        </div>
      )}

      {moodImpact.length > 0 && (
        <Card title="Habit mood impact" subtitle="How much each habit lifts your mood">
          <ul className="space-y-2">
            {moodImpact.map((h) => (
              <li key={h.habitId} className="flex items-center gap-2 text-sm">
                <span
                  className="w-14 shrink-0 rounded px-1.5 py-0.5 text-center text-xs font-semibold"
                  style={{ background: cat('surface0'), color: h.lift >= 0 ? cat('green') : cat('red') }}
                >
                  {h.lift >= 0 ? '+' : ''}{h.lift}
                </span>
                <span className="text-text">{h.emoji ? h.emoji + ' ' : ''}{h.name}</span>
                <span className="text-overlay0">
                  {h.doneMood} vs {h.skipMood} mood · {h.doneDays}d
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {leaders.length > 0 && (
        <Card title="Streak leaderboard" subtitle="Your hottest habits right now">
          <ul className="space-y-2">
            {leaders.slice(0, 8).map((l, i) => (
              <li key={l.habitId} className="flex items-center gap-2 text-sm">
                <span className="w-5 shrink-0 text-center text-overlay0">{i + 1}</span>
                <Flame size={14} style={{ color: cat(l.current > 0 ? 'peach' : 'overlay0') }} />
                <span className="flex-1 text-text">{l.emoji ? l.emoji + ' ' : ''}{l.name}</span>
                <span className="tabular-nums text-text" title="Current streak">{l.current}d</span>
                <span className="w-20 shrink-0 text-right text-xs text-overlay0" title="All-time best">best {l.best}d</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {focusId && weekdayPerf?.best && weekdayPerf.worst && (
        <div className="grid items-start gap-5 md:grid-cols-2">
          <Card title="Best & worst days" subtitle={`When ${focusName} sticks`}>
            <div className="mb-3 flex items-center gap-2 text-sm">
              <CalendarDays size={15} style={{ color: cat('green') }} />
              <span className="text-subtext1">
                Strongest on <strong className="text-text">{weekdayPerf.best.label}</strong> ({Math.round(weekdayPerf.best.rate! * 100)}%),
                weakest on <strong className="text-text">{weekdayPerf.worst.label}</strong> ({Math.round(weekdayPerf.worst.rate! * 100)}%).
              </span>
            </div>
            <div className="flex items-end justify-between gap-2" style={{ height: 110 }} role="img" aria-label={`Success rate of ${focusName} by weekday`}>
              {weekdayPerf.rows.map((r) => (
                <div key={r.weekday} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] tabular-nums text-subtext0">{r.rate == null ? '–' : Math.round(r.rate * 100) + '%'}</span>
                  <div className="flex w-full flex-1 items-end">
                    <div className="w-full rounded-t" style={{ height: `${r.rate == null ? 2 : Math.max(2, r.rate * 100)}%`, background: r.rate == null ? cat('surface0') : r.weekday === weekdayPerf.best!.weekday ? cat('green') : r.weekday === weekdayPerf.worst!.weekday ? cat('peach') : cat('surface1') }} title={r.scheduled ? `${r.done}/${r.scheduled} done` : 'never scheduled'} />
                  </div>
                  <span className="text-[10px] text-overlay0">{r.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Consistency score" subtitle={`${focusName} · recency-weighted, last 30 days`}>
            {focusScore == null ? (
              <Empty>Not enough scheduled days yet.</Empty>
            ) : (
              <>
                <p className="text-4xl font-extrabold" style={{ color: cat(focusScore >= 70 ? 'green' : focusScore >= 40 ? 'yellow' : 'peach') }}>{focusScore}<span className="text-lg text-overlay0">/100</span></p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface0">
                  <div className="h-full rounded-full" style={{ width: `${focusScore}%`, background: cat(focusScore >= 70 ? 'green' : focusScore >= 40 ? 'yellow' : 'peach') }} />
                </div>
                <p className="mt-2 text-xs text-overlay0">Recent days count more, so this tracks your momentum — not just a flat average.</p>
              </>
            )}
          </Card>
        </div>
      )}

      {focusId && monthly.some((m) => m.done > 0) && (
        <Card title="Month over month" subtitle={`${focusName} · completions per month`}>
          <div className="flex items-end justify-between gap-2" style={{ height: 130 }} role="img" aria-label={`Monthly completions of ${focusName} with month-over-month change`}>
            {monthly.map((m) => (
              <div key={m.ym} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] tabular-nums" style={{ color: m.delta > 0 ? cat('green') : m.delta < 0 ? cat('red') : cat('overlay0') }}>
                  {m.delta > 0 ? `+${m.delta}` : m.delta < 0 ? m.delta : '–'}
                </span>
                <span className="text-[11px] font-semibold tabular-nums text-text">{m.done}</span>
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t" style={{ height: `${Math.max(2, (m.done / maxMonthly) * 100)}%`, background: cat('mauve') }} title={`${m.label}: ${m.done} done`} />
                </div>
                <span className="text-[10px] text-overlay0">{m.label.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid items-start gap-5 md:grid-cols-2">
        <Card title="Year in review" subtitle="Your journal so far">
          <ul className="space-y-1.5 text-sm text-subtext1">
            <ReviewRow icon={FileText} color="sky" label="entries logged" value={data.entries.length} />
            <ReviewRow icon={Smile} color="green" label={`average mood${avgMood != null ? ' / 10' : ''}`} value={avgMood ?? '—'} />
            <ReviewRow icon={Dumbbell} color="teal" label="workouts" value={workouts} />
            <ReviewRow icon={ImageIcon} color="mauve" label="photos kept" value={photos} />
            <ReviewRow icon={Flame} color="peach" label="day longest streak" value={best} />
            <ReviewRow icon={Cake} color="pink" label="birthdays tracked" value={data.birthdays.length} />
          </ul>
        </Card>

        <Card title="Index" subtitle="Every month with entries">
          {months.length === 0 ? (
            <Empty>No months logged yet.</Empty>
          ) : (
            <ul className="grid grid-cols-2 gap-1 text-sm">
              {months.map((ym) => (
                <li key={ym}>
                  <button onClick={() => { setMonth(ym); nav('monthly') }} className="inline-flex w-full items-center gap-1.5 rounded px-1.5 py-0.5 text-left text-subtext1 hover:bg-surface0 hover:text-text">
                    <BookOpen size={14} style={{ color: cat('overlay1') }} /> {prettyMonth(ym)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {records.length > 0 && (
        <Card title="Personal records" subtitle="Your bests so far">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {records.map((r) => (
              <div key={r.label} className="rounded-xl border border-surface0 bg-base p-3">
                <p className="text-sm font-semibold text-text">{r.value}</p>
                <p className="text-xs text-overlay0">{r.label}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Search" subtitle="Find anything across your journal">
        <Input value={q} onChange={(e) => { setQ(e.target.value); setKind('all') }} placeholder="Search entries, memories, gratitude, workouts…" autoFocus />
        {q && kinds.length > 2 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {kinds.map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className="rounded-full px-2.5 py-0.5 text-xs capitalize"
                style={{ background: kind === k ? cat('mauve') : cat('surface0'), color: kind === k ? cat('crust') : cat('subtext1') }}
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
              <ul className="space-y-1 text-sm">
                {results.slice(0, 50).map((r, i) => (
                  <li key={i}>
                    <button
                      onClick={() => { if (r.date) { setDay(r.date); nav('today') } }}
                      disabled={!r.date}
                      className="flex w-full gap-2 rounded px-2 py-1 text-left hover:bg-surface0 disabled:cursor-default"
                    >
                      <span className="w-24 shrink-0 text-overlay0">{r.date ? prettyDay(r.date) : '—'}</span>
                      <span className="w-16 shrink-0 text-xs" style={{ color: cat('sapphire') }}>{r.kind}</span>
                      <span className="text-subtext1">{r.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      <TagManager />
    </div>
  )
}

function PickStat({ label, value, color, trend }: { label: string; value: string; color: string; trend?: 'up' | 'down' | 'flat' | null }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  return (
    <li className="rounded-xl border border-surface0 bg-base p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-subtext0">{label}</span>
        {trend && <TrendIcon size={13} style={{ color: cat(color) }} />}
      </div>
      <p className="mt-1 text-lg font-bold tabular-nums" style={{ color: cat(color) }}>{value}</p>
    </li>
  )
}

function SplitCol({ label, habit, mood, days }: { label: string; habit: number | null; mood: number | null; days: number }) {
  return (
    <div className="rounded-xl border border-surface0 bg-base p-3">
      <p className="mb-2 text-xs font-semibold text-subtext0">{label}</p>
      <p className="flex items-center gap-1.5 text-text">
        <Activity size={14} style={{ color: cat('mauve') }} />
        <strong className="tabular-nums">{habit == null ? '—' : Math.round(habit * 100) + '%'}</strong>
        <span className="text-xs text-overlay0">habits</span>
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-text">
        <Smile size={14} style={{ color: cat('green') }} />
        <strong className="tabular-nums">{mood == null ? '—' : `${mood}/10`}</strong>
        <span className="text-xs text-overlay0">mood</span>
      </p>
      {days > 0 && <p className="mt-1 text-[10px] text-overlay0">{days} scheduled day{days === 1 ? '' : 's'}</p>}
    </div>
  )
}

function ReviewRow({ icon: Icon, color, label, value }: { icon: LucideIcon; color: string; label: string; value: number | string }) {
  return (
    <li className="flex items-center gap-2">
      <Icon size={15} style={{ color: cat(color) }} />
      <strong className="text-text">{value}</strong>
      <span>{label}</span>
    </li>
  )
}

function Big({ label, value, color, sub, suffix = '', ring, max = 100, trend, trendLabel, onClick }: { label: string; value: number; color: string; sub?: string; suffix?: string; ring?: boolean; max?: number; trend?: PeriodTrend; trendLabel?: string; onClick?: () => void }) {
  const TrendIcon = trend?.dir === 'up' ? TrendingUp : trend?.dir === 'down' ? TrendingDown : Minus
  const trendColor = trend?.dir === 'up' ? 'green' : trend?.dir === 'down' ? 'red' : 'overlay0'
  return (
    <Card className={`flex flex-col items-center text-center ${onClick ? 'cursor-pointer hover:border-mauve' : ''}`} onClick={onClick}>
      {ring ? (
        <Ring value={value} max={max} color={color} suffix={suffix} />
      ) : (
        <div className="text-4xl font-extrabold" style={{ color: cat(color) }}>
          <CountUp value={value} suffix={suffix} />
        </div>
      )}
      <div className="mt-1 text-sm text-subtext0">{label}</div>
      {sub && <div className="text-xs text-overlay0">{sub}</div>}
      {trend && (
        <div className="mt-1 flex items-center gap-1 text-xs" style={{ color: cat(trendColor) }} title={trendLabel}>
          <TrendIcon size={13} />
          <span>{trend.dir === 'flat' ? 'flat' : `${trend.pct > 0 ? '+' : ''}${trend.pct}%`}</span>
        </div>
      )}
    </Card>
  )
}
