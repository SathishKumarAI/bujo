import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { CalendarHeatmap, EmptyFrame, SectionRail, StatGrid, SummaryStrip } from '../page'
import { onRaised } from '../../lib/colors'
import { WEEKDAYS, fromISODay, todayISO } from '../../lib/date'
import { bestOf, totalTime } from '../../domain/sessions'
import { labelOf, type Mode } from '../../domain/activities'
import {
  activityMix, bestsByActivity, cadence, fitnessMilestones, weekdayLoad, weeklyLoad,
} from '../../lib/fitnessReview'
import { ShowMore } from '../ShowMore'
import { useCappedList } from '../../lib/useCappedList'
import { FITNESS_PANELS } from './panels'
import { FitnessHistory } from './History'
import { ActivityMixCard, BestsCard, CadenceCard, MilestonesCard, WeekdayLoadCard, WeeklyLoadCard } from './Cards'
import type { DistanceUnit, Workout } from '../../lib/types'

/**
 * ZONE 3 · everything this mode has recorded, behind ONE bar.
 *
 * WHAT THIS FILE OWNS: which row is on screen, the drill-down filter, and
 * which cards each row holds.
 * WHAT IT DOES NOT OWN: the arithmetic (`lib/fitnessReview.ts`), the record
 * (`History.tsx`), or any card's internals (`Cards.tsx`).
 *
 * It was a flat stack of two sections — History, then an "Analytics" heading
 * over three tiles and a heatmap — measuring **553px in a 678px column** under
 * a **705px** log form, with nothing between them and no way to ask a question
 * of the record. Four rows now, same instrument and same shape as
 * `views/Pullups.tsx`, `components/homeworkout/Review.tsx` and
 * `components/pickleball/Review.tsx`, so the four pages that record a session
 * are one page.
 *
 * NO SUB-SECTION CHIPS. `docs/REUSABLE-PATTERNS.md` §16 puts the threshold at
 * about five cards in a row; the biggest row here holds four. A
 * sub-navigation over four things costs more than it saves, and the chips would
 * be the hand-written list resolved against another source this repo has been
 * bitten by three times.
 *
 * It takes the mode's sessions as a prop rather than filtering the journal
 * itself. `sessionsInMode` is the only sanctioned way to ask what mode a
 * session is, the view already called it, and a second caller here would be a
 * second opinion about the thing `domain/activities.ts` exists to make
 * un-disagreeable.
 */
export function FitnessReview({ sessions, mode, unit, panel, onPanel }: {
  /** This mode's sessions, newest first. */
  sessions: Workout[]
  mode: Mode
  unit: DistanceUnit
  /**
   * Which row is open. Owned by the view, because zone 1's next-step sentence
   * is a shortcut INTO a row and a button that cannot reach the state it names
   * is a button that lies.
   */
  panel: string
  onPanel: (id: string) => void
}) {
  const today = todayISO()
  /**
   * A WAY BACK TO THE ENTRIES, from the figure that made you look.
   *
   * Every card in this review is read-only, and the sessions underneath them
   * were a section away in a list of everything. Clicking a weekday or an
   * activity opens Sessions filtered to exactly those rows, where the editor
   * and × already are (`docs/REUSABLE-PATTERNS.md` §20).
   *
   * Not sticky and not in the URL: it is a narrowing you do while reading, not
   * a place you return to. It clears when you pick another row from the bar,
   * because a filter you cannot see is a list that looks wrong.
   */
  const [focus, setFocus] = useState<{ kind: 'weekday' | 'activity'; value: string } | null>(null)
  const pick = (kind: 'weekday' | 'activity') => (value: string) => { setFocus({ kind, value }); onPanel('sessions') }
  const shown = focus
    ? sessions.filter((w) => (focus.kind === 'weekday'
      ? WEEKDAYS[fromISODay(w.date).getDay()] === focus.value
      : w.activity === focus.value))
    : sessions
  const focusLabel = focus && (focus.kind === 'weekday' ? `${focus.value} sessions` : labelOf(focus.value))
  /* THE LAST THREE, AND THE REST ONE CLICK AWAY. `HISTORY_CAP` is 3 and the
     affordance carries the total (`Show all (17)`), because a history
     collapsed to three with an unlabelled button cannot be told from a history
     that only ever had three. The cap lives here rather than in `History`
     because the button lives in the panel header, which is this component's —
     the same split `components/homeworkout/Review.tsx` uses. */
  const history = useCappedList(shown)

  // One pass each over a list of sessions, and `sessions` is a fresh array
  // every render — see the no-`useMemo` note in `lib/fitnessReview.ts`.
  const weeks = weeklyLoad(sessions, 8, today)
  const pace = cadence(sessions, 8, today)
  const mix = activityMix(sessions)
  const weekdays = weekdayLoad(sessions)
  const bests = bestsByActivity(sessions, unit)
  const milestones = fitnessMilestones(sessions, unit)
  const time = totalTime(sessions)
  const heat = sessions.map((s) => ({ date: s.date, value: s.durationMin ?? 0 }))
  // The headline best for whatever activity dominates this mode, which is what
  // the strip had before — kept, because a strip of three is an orientation and
  // the per-activity table in Bests is the detail.
  const best = bestOf(sessions, mix[0]?.activity ?? '', unit)
  const noun = mode === 'sport' ? 'game' : 'session'

  const current = FITNESS_PANELS.find((p) => p.id === panel) ?? FITNESS_PANELS[1]

  return (
    <section className="mt-2">
      {/* `sr-only`: the bar under it names every row, so a grey "The record"
          above it is furniture — and with the log hidden it is furniture 1110px
          wide. The heading stays for the document outline. */}
      <h2 className="sr-only">The record</h2>
      <div className="@container/page">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-y-3">
          <SectionRail
            label="Fitness record"
            groups={FITNESS_PANELS.map((g) => ({ id: g.id, label: g.label }))}
            value={panel}
            onChange={(id: string | null) => { onPanel(id ?? 'sessions'); setFocus(null) }}
            railAt="never"
          />
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-baseline gap-x-3 border-b border-line pb-1.5">
              <h3 className="flex items-center gap-2 text-heading font-medium text-fg-1">
                <Icon as={current.icon} size="md" style={{ color: onRaised(current.color) }} />
                {current.label}
              </h3>
              <p className="text-label text-fg-2">{current.blurb}</p>
              {panel === 'sessions' && (
                <span className="ml-auto flex flex-wrap items-center gap-2">
                  {/* The filter states itself and comes off in one tap. A list
                      that is quietly short reads as broken rather than as
                      filtered. */}
                  {focusLabel && (
                    <button
                      type="button"
                      onClick={() => setFocus(null)}
                      className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-ink-2 px-2.5 py-0.5 text-label text-fg-1 transition-colors hover:border-line-strong"
                    >
                      {focusLabel} · {shown.length} of {sessions.length}
                      <span aria-hidden>×</span>
                      <span className="sr-only">Clear this filter</span>
                    </button>
                  )}
                  <ShowMore list={history} />
                </span>
              )}
            </div>

            {panel === 'sessions' && <FitnessHistory list={history} unit={unit} />}

            {panel === 'volume' && (<>
              <SummaryStrip items={[
                { label: mode === 'sport' ? 'Games' : 'Sessions', value: sessions.length, empty: sessions.length === 0 },
                { label: 'Total time', value: time.value, empty: time.empty },
                { label: best.label, value: best.value, empty: best.empty },
              ]} />
              <div className="mt-4">
                <StatGrid>
                  <WeeklyLoadCard rows={weeks} scope={mode === 'sport' ? 'Games' : 'Cardio sessions'} />
                  <CadenceCard cadence={pace} noun={noun} />
                </StatGrid>
              </div>
              {/* `fluid` and half a year: a 188×107px table in a 708px column
                  left ~520px of dead space beside it. Fluid cells divide
                  whatever column they are given, so 26 columns land at ~23px
                  here and ~10px on a phone with no breakpoint. */}
              <div className="mt-4">
                <CalendarHeatmap ranges storageKey="fitness" fluid data={heat} unit="min" />
                {sessions.length === 0 && <EmptyFrame>Log a {noun} and the calendar starts filling in.</EmptyFrame>}
              </div>
            </>)}

            {panel === 'bests' && (<>
              <StatGrid>
                {bests.length > 0 && <BestsCard bests={bests} />}
                <MilestonesCard milestones={milestones} />
              </StatGrid>
              {bests.length === 0 && (
                <EmptyFrame>
                  No best to state yet — a run needs a distance and a duration together, everything else needs one logged {noun}.
                </EmptyFrame>
              )}
            </>)}

            {panel === 'mix' && (<>
              <StatGrid>
                {mix.length > 0 && <ActivityMixCard rows={mix} unit={unit} onPick={pick('activity')} />}
                <WeekdayLoadCard rows={weekdays} onPick={pick('weekday')} />
              </StatGrid>
              {mix.length === 0 && <EmptyFrame>Log a {noun} and this says which activities and which days it goes to.</EmptyFrame>}
            </>)}
          </div>
        </div>
      </div>
    </section>
  )
}
