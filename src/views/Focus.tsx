import { useJournal } from '../store'
import { Card } from '../components/ui'
import { PageLayout, SectionRail, StatBar, SummaryStrip } from '../components/page'
import { CardGrid, SPAN_2 } from '../components/shell/CardGrid'
import { useNav } from '../components/shell/nav'
import { useStickyState } from '../lib/useStickyState'
import { FocusTimer } from '../components/focus/FocusTimer'
import { LogSession } from '../components/focus/LogSession'
import { SessionHistory } from '../components/focus/SessionHistory'
import { TypingDrill, TypingStats } from '../components/focus/TypingBand'
import { FindingsList, InterruptionCost } from '../components/focus/Findings'
import {
  CumulativeLine, DayBars, DeepWorkGrid, DurationBars, InterruptionBars, ShareBars,
  TagQualityBars, WeekBars, WeekdayBars,
} from '../components/focus/FocusCharts'
import { todayISO } from '../lib/date'
import {
  avgWeighted, cumulativeHours, dailyCodingMinutes, deepWorkHeatmap, focusByDuration, focusByWeekday,
  focusFindings, focusStreak, formatMinutes, interruptionCost, interruptionsTrend, longestSession,
  minutesByProject, minutesByWeekday, projectedWeeklyMinutes, qualityByTag, topTags,
  weeklyCodingMinutes, weeklyVolume,
} from '../lib/focus'
import {
  FOCUS_CARDS, FOCUS_DEFAULT_GROUP, FOCUS_GROUPS, FOCUS_GROUP_BLURB, FOCUS_GROUP_LABEL, type FocusGroup,
} from '../lib/focusCards'

/**
 * FOCUS · deep-work time, on the three-zone contract, with a rail over the
 * analytics.
 *
 * **What it was.** Six bands in a fixed vertical order inside `shell/Page`:
 * the week's headline, a log form beside a timer, three charts, four
 * breakdowns, the typing tracker, and the session history. Measured on `main`,
 * `?demo=1`: `space-audit` **3.5 screens shipped / 3.5 open** at 1440 and
 * **5.7 / 5.7** at 390; `page-census` **0 folds · 0 charts · 1 column** at 1440.
 *
 * The unusual part is `open == shipped` with zero folds — nothing was hidden,
 * because there was nothing to hide it behind. That made it the one page on the
 * list a primitive could not fix, and `docs/NEXT-SESSION.md` carried it for
 * three stretches as "needs a decision, not a primitive". The decision is that
 * this page does three different jobs, and they were sharing one scroll:
 *
 * Zone 1 · four figures — this week, streak, average focus, longest block.
 * Zone 2 · **the timer, then the log form.** `styles/layout.css` puts the act
 *          column on the RIGHT above a 900px container, against DOM order and
 *          deliberately, so the timer is big and on the right for the same
 *          reason: it is what the page is *for*. Below the split it comes first,
 *          which is also right — you open Focus to start a block.
 * Zone 3 · **a rail over six groups** — This week, Rhythm, Depth, Projects &
 *          tools, Typing, Sessions. `lib/focusCards.ts` is the registry and
 *          `Focus.test.tsx` binds it to what renders, in both directions.
 *
 * **Not `tier={1440}` and not `stacked`**, which is the interesting constraint.
 * Both look like the obvious follow-up to a rail, because Insights uses both —
 * and both are measured losses on a page that has a real act column
 * (`docs/PAGE-WORKFLOW.md`: Cycle **+732px**, Recovery **1.7 → 3.3 screens**,
 * each measured *after* its rail landed). Insights has no act column to pay for;
 * this page's is a 240px timer and a nine-field form. The shell grows fluidly
 * past 1440 on its own (#293), which is where the extra width on a big monitor
 * comes from.
 *
 * **Reading of the brief, stated because it was ambiguous.** "Make this into
 * Insights-like pages, inside the Insights page" could mean moving this content
 * *into* `?view=insights`. It does not, here: Insights is already 24 cards over
 * six domains and absorbing a Pomodoro timer plus two log forms would break its
 * own contract (it has no act column), while `PRODUCT.md` ranks logging a
 * session as a daily task with its own destination in the nav. So Focus gets the
 * Insights *treatment* — registry, rail, contract test — and keeps its page. The
 * alternative is a real option and is named in the PR.
 */
export function Focus() {
  const { data, addDevSession, updateDevSession, removeDevSession } = useJournal()
  const nav = useNav()
  const today = todayISO()
  const sessions = [...(data.devSessions ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1))

  /* Which zone-3 group is on screen. Sticky, so returning to the page returns to
     the subject you were reading — `allowed` is the registry, so a renamed group
     cannot resurrect from a stale localStorage key. */
  const [group, setGroup] = useStickyState<FocusGroup>('focus.group', FOCUS_DEFAULT_GROUP, FOCUS_GROUPS)

  const weekMin = weeklyCodingMinutes(data, today)
  const projected = projectedWeeklyMinutes(data, today)
  const longest = longestSession(data)
  const findings = focusFindings(data, today)
  const cost = interruptionCost(data)
  const bands = focusByDuration(data)
  const byProject = minutesByProject(data)
  const tags = topTags(data)
  const tagQuality = qualityByTag(data)
  const cum = cumulativeHours(data)
  const interruptions = interruptionsTrend(data, today, 14)

  /**
   * Zone 3's thirteen cards, by the id `lib/focusCards.ts` knows each under.
   *
   * A record because the rail renders one group and the rest must not be in the
   * DOM, and because `Focus.test.tsx` reads the rendered `data-card` set back
   * against the registry in both directions. A card whose data cannot support it
   * yields `null` and the renderer skips it, so an absent card never leaves a
   * heading over nothing — and the rail counts with the same predicate, so a
   * count cannot promise a card that is not there.
   *
   * Which cards take the full row is the registry's `wide` flag, applied to the
   * `data-card` wrapper below: the wrapper is the grid item, so `SPAN_2` on the
   * `Card` inside it does nothing at all.
   */
  const cards: Record<string, React.ReactNode> = {
    findings: (
      <Card band title="What the log says" subtitle="Read off your own sessions — nothing here is advice" hideInfo>
        <FindingsList findings={findings} />
      </Card>
    ),

    days14: (
      <Card band title="Coding minutes" subtitle="Last 14 days · today is the accent bar" hideInfo>
        <DayBars series={dailyCodingMinutes(data, today, 14)} today={today} />
      </Card>
    ),

    cumulative: cum.length >= 2 ? (
      <Card band title="Cumulative hours" subtitle={`${cum[cum.length - 1].hours}h all-time, over ${cum.length} days`} hideInfo>
        <CumulativeLine cum={cum} />
      </Card>
    ) : null,

    weeks12: (
      <Card band title="Week by week" subtitle="Rolling 7-day totals — the reading a 14-day chart cannot give" hideInfo>
        <WeekBars weeks={weeklyVolume(data, today, 12)} />
      </Card>
    ),

    weekday: (
      <Card band title="By weekday" subtitle="When you put the hours in, and when the work is any good" hideInfo>
        <WeekdayBars byWeekday={minutesByWeekday(data)} focusWd={focusByWeekday(data)} />
      </Card>
    ),

    heatmap: (
      <Card band title="Deep-work days" subtitle="Daily minutes, last 26 weeks" hideInfo>
        <DeepWorkGrid heat={deepWorkHeatmap(data, today, 26)} />
      </Card>
    ),

    /* The two cards that did not exist. The page offered a 15/25/50 Pomodoro and
       said nothing about which of them works for the person pressing it, and it
       plotted how often interruptions happen without ever saying whether they
       mattered. Both readings come out of data the page already held. */
    duration: bands.some((b) => b.count > 0) ? (
      <Card band title="How long is a good block" subtitle="Focus score by session length — your own answer to the timer" hideInfo>
        <DurationBars bands={bands} />
      </Card>
    ) : null,

    interruptions: interruptions.some((d) => d.count > 0) ? (
      <Card band title="Interruptions" subtitle="How often they happen, and what they cost" hideInfo>
        <InterruptionBars trend={interruptions} today={today} />
        <InterruptionCost cost={cost} />
      </Card>
    ) : null,

    projects: byProject.length > 0 ? (
      <Card band title="By project" subtitle="Total deep-work minutes" hideInfo>
        <ShareBars rows={byProject.map((p) => ({ label: p.project, min: p.min }))} />
      </Card>
    ) : null,

    tags: tags.length > 0 ? (
      <Card band title="Languages & tools" subtitle="Where the hours go, against where the depth is" hideInfo>
        <TagQualityBars rows={tagQuality} />
      </Card>
    ) : null,

    typingdrill: (
      <Card band title="Typing practice" subtitle="Speed and accuracy drills" hideInfo>
        <TypingDrill />
      </Card>
    ),

    typingstats: (
      <Card band enlargeable title="Speed & accuracy" subtitle="Best, average, this week, and the 14-day trend" hideInfo>
        <TypingStats />
      </Card>
    ),

    history: (
      <Card
        band
        title="History"
        subtitle={`${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'}, editable in place`}
        hideInfo
      >
        <SessionHistory sessions={sessions} onSave={updateDevSession} onDelete={removeDevSession} />
      </Card>
    ),
  }

  /** What the selected group renders, and what the rail counts. Same predicate
   *  for both, so a card that yields nothing can never leave a heading over an
   *  empty grid or a rail row promising a card that is not there. */
  const idsIn = (g: FocusGroup) => FOCUS_CARDS.filter((c) => c.group === g && cards[c.id])
  const shown = idsIn(group)

  return (
    <PageLayout
      tier={1180}
      zone1={
        <StatBar
          facts={[
            { label: 'this week', value: formatMinutes(weekMin) },
            { label: 'day streak', value: `${focusStreak(data, today)}d` },
            { label: 'avg focus', value: `${avgWeighted(data, 'focus')}/10` },
            /* The fourth fact is the one that is not a total. `projectedWeeklyMinutes`
               returns null once the week is fully elapsed or nothing is logged, and
               the longest session is the fallback rather than a fake projection —
               `count ? x : 0` in orientation-bar form. */
            projected != null && projected > weekMin
              ? { label: 'on pace for', value: formatMinutes(projected) }
              : { label: 'longest block', value: longest ? formatMinutes(longest.durationMin) : '—' },
          ]}
        />
      }
      zone2={
        <>
          {/* THE TIMER IS FIRST, and on a wide screen that puts it at the top of
              the right-hand column. It is the page's primary control and the
              thing you came to start; the form below it is what you use when the
              block is already over. */}
          <Card band title="Timer" subtitle="Work, break, repeat — a finished block logs itself" hideInfo>
            <FocusTimer />
          </Card>

          <Card band title="Log a session" subtitle="Coding or deep-work time, however you spent it" hideInfo>
            <LogSession
              onLog={addDevSession}
              // The same two tables the breakdowns read, so the chips are the
              // projects and tags you actually use, in the order you use them.
              // "(no project)" is a bucket label, not a project.
              recentProjects={byProject.map((p) => p.project).filter((p) => p !== '(no project)')}
              recentTags={topTags(data, 8).map((t) => t.tag)}
            />
          </Card>
        </>
      }
      zone3={
        <>
          <SummaryStrip items={[
            { label: 'Sessions logged', value: sessions.length, empty: sessions.length === 0 },
            { label: 'All-time', value: cum.length ? `${cum[cum.length - 1].hours}h` : '—', empty: cum.length === 0 },
            { label: 'Avg stress', value: sessions.length ? `${avgWeighted(data, 'stress')}/10` : '—', empty: sessions.length === 0 },
          ]} />

          {/* `@container/page` on the OUTER div and the grid on the inner one: an
              element cannot query itself, so putting both on one div means the
              two-column rail layout never fires. And the phone column is spelled
              out because a grid with no `grid-template-columns` gets a single
              implicit `auto` track sized to its widest item's min-content — a
              chip row makes that wider than the viewport and scrolls the whole
              page sideways. Both traps are in docs/PAGE-SHAPE.md and both were
              hit on the first call site of every rail so far. */}
          <div className="@container/page mt-4">
            <div className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-3 @4xl/page:grid-cols-[11rem_minmax(0,1fr)]">
              {/* No "All" row: the six groups do not overlap and there is no
                  search on this page to cross them, so All could only offer the
                  5.7-screen phone page this replaces. */}
              <SectionRail
                label="Focus sections"
                groups={FOCUS_GROUPS.map((g) => ({ id: g, label: FOCUS_GROUP_LABEL[g], count: idsIn(g).length }))}
                value={group}
                onChange={(id) => setGroup((id as FocusGroup | null) ?? FOCUS_DEFAULT_GROUP)}
              />
              <div className="min-w-0">
                <section data-domain={group}>
                  <div className="mb-3 flex flex-wrap items-baseline gap-x-3 border-b border-line pb-1.5">
                    <h2 className="text-heading font-medium text-fg-1">{FOCUS_GROUP_LABEL[group]}</h2>
                    <p className="text-label text-fg-2">{FOCUS_GROUP_BLURB[group]}</p>
                    <span className="num ml-auto text-label text-fg-3">{shown.length}</span>
                  </div>
                  {/* Two columns is the ceiling, and it is a correction rather
                      than a preference: `CardGrid` asks the *viewport*, so at
                      1600 its `2xl:grid-cols-3` fires inside this 722px split
                      column and resolves to three tracks of ~227px. `MasonryGrid`
                      is not the alternative — it breaks on its container at
                      768px, so at 722 it silently draws one column. */}
                  <CardGrid className="2xl:grid-cols-2">
                    {shown.map((c) => (
                      <div key={c.id} data-card={c.id} className={c.wide ? `min-w-0 ${SPAN_2}` : 'min-w-0'}>
                        {cards[c.id]}
                      </div>
                    ))}
                  </CardGrid>
                </section>
              </div>
            </div>
          </div>

          {/* Outside the rail. Mood and sleep are the other half of every finding
              on this page and they live on another one; a pointer behind a row
              you have to select is a pointer nobody follows. */}
          <p className="text-label text-fg-2">
            Focus against mood and sleep lives in{' '}
            <button onClick={() => nav('insights')} className="text-brand-text underline decoration-line underline-offset-2 hover:decoration-current">
              Insights →
            </button>
          </p>
        </>
      }
    />
  )
}
