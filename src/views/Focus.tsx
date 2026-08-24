import { useJournal } from '../store'
import { Page } from '../components/shell/Page'
import { BandCell, BandRow, Band } from '../components/mod'
import { FocusWeek } from '../components/focus/FocusWeek'
import { FocusTimer } from '../components/focus/FocusTimer'
import { LogSession } from '../components/focus/LogSession'
import { FocusCharts } from '../components/focus/FocusCharts'
import { FocusBreakdowns } from '../components/focus/FocusBreakdowns'
import { TypingBand } from '../components/focus/TypingBand'
import { SessionHistory } from '../components/focus/SessionHistory'
import { todayISO } from '../lib/date'
import {
  avgWeighted, focusByWeekday, focusInsight, focusStreak, interruptionsTrend, longestSession,
  minutesByProject, minutesByWeekday, projectedWeeklyMinutes, topTags, weeklyCodingMinutes,
} from '../lib/focus'

/**
 * Focus — deep-work time: what this week looks like, a timer and a log, then
 * the charts, typing practice and the session history.
 *
 * Composition only. Every band is a file in `components/focus/`; the arithmetic
 * is `lib/focus.ts` and `lib/typing.ts`.
 *
 * Two default-collapsed folds are gone ("Focus analytics", "Typing") along with
 * a collapsible History. Nine cards in a masonry became six bands in a fixed
 * order, and nothing on the page is hidden behind a chevron any more — which
 * also means `npm run a11y` can finally see all of it.
 */
export function Focus() {
  const { data, addDevSession, updateDevSession, removeDevSession } = useJournal()
  const today = todayISO()
  const sessions = [...(data.devSessions ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1))

  return (
    <Page width="wide" className="gap-0 sm:gap-0">
      <FocusWeek
        weekMin={weeklyCodingMinutes(data, today)}
        projectedMin={projectedWeeklyMinutes(data, today)}
        streak={focusStreak(data, today)}
        avgFocus={avgWeighted(data, 'focus')}
        avgStress={avgWeighted(data, 'stress')}
        longest={longestSession(data)}
        insight={focusInsight(data)}
      />

      <Band>
        <BandRow>
          <BandCell className="basis-[20rem]">
            <LogSession onLog={addDevSession} />
          </BandCell>
          <BandCell className="basis-[18rem]">
            <FocusTimer />
          </BandCell>
        </BandRow>
      </Band>

      <FocusCharts data={data} today={today} />

      <FocusBreakdowns
        byWeekday={minutesByWeekday(data)}
        focusWd={focusByWeekday(data)}
        byProject={minutesByProject(data)}
        tags={topTags(data)}
        interruptions={interruptionsTrend(data, today, 14)}
        today={today}
      />

      <TypingBand />

      <SessionHistory sessions={sessions} onSave={updateDevSession} onDelete={removeDevSession} />
    </Page>
  )
}
