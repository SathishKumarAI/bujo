import { SectionRail, SummaryStrip, CalendarHeatmap, EmptyFrame, PanelGrid, PanelCard, Tag } from '../page'
import { Button } from '../ui/button'
import { ShowMore } from '../ShowMore'
import { useStickyState } from '../../lib/useStickyState'
import { prettyDay } from '../../lib/date'
import { HOME_EXERCISES, type HomeExercise } from '../../lib/homeExercises'
import type { CappedList } from '../../lib/useCappedList'
import type { Workout } from '../../lib/types'
import { ExerciseLibrary } from './ExerciseLibrary'
import { Programming, Equipment, Sources } from './Manual'

/**
 * ZONE 3 · the whole review zone, behind ONE bar.
 *
 * It was four peer sections — Analytics, History, the catalogue, and a Manual
 * that carried **its own twelve-row `SectionRail`** at the bottom of the page.
 * Two navigations on one page, which `docs/PAGE-SHAPE.md` and the Pull-ups pass
 * both arrive at the same answer for: **a review zone has one navigation in
 * it.** A section next to a rail is a rail row, or it belongs on another page.
 *
 * Same instrument and same shape as `views/Pullups.tsx` — `railAt="never"`, so
 * it is a horizontal bar above the panel at every width rather than a left-hand
 * column, because the rows are few and short.
 *
 * **Five rows, not fourteen.** History and the catalogue are two; the manual
 * had twelve. The nine of those twelve that are *movement families* are not
 * peers of "Sources" — they are a facet of the catalogue, and the catalogue
 * already filters on `family` through `filterExercises`. So the family chapter
 * now renders inside Movements when you pick that family, which is where you
 * are standing when you want it, and `chapterFor()` finally has a call site.
 * Nine rail rows deleted and nothing lost.
 *
 * That is also what makes a horizontal bar possible at all: fourteen chips is
 * the 1085px strip in a 730px box that CLAUDE.md already records, and five fit.
 *
 * Ordered for someone who has just trained: History first, because the page's
 * act is in zone 2 and the first question after logging is "what does that make
 * this week look like". Reference last, in the order it gets consulted.
 */
const HW_PANELS = [
  { id: 'history', label: 'History', blurb: 'Sessions, the calendar and what you logged' },
  { id: 'movements', label: 'Movements', blurb: `${HOME_EXERCISES.length} exercises · pick a family for its chapter` },
  { id: 'programming', label: 'How to train', blurb: 'Sets, reps, rest — and getting harder without a rack' },
  { id: 'equipment', label: 'Equipment', blurb: 'In the order it is worth buying' },
  { id: 'sources', label: 'Sources', blurb: 'Every claim in the manual, traced' },
] as const

export function Review({ sessions, history, heat, totalExercises, onAdd, onRemove }: {
  sessions: Workout[]
  history: CappedList<Workout>
  heat: { date: string; value: number }[]
  totalExercises: number
  onAdd: (ex: HomeExercise) => void
  onRemove: (id: string) => void
}) {
  const [panel, setPanel] = useStickyState<string>(
    'homeworkout.panel', 'history', HW_PANELS.map((p) => p.id),
  )
  const current = HW_PANELS.find((p) => p.id === panel) ?? HW_PANELS[0]

  return (
    <section>
      {/* Container on the outer div, grid on the inner: an element cannot query
          itself. Phone column spelled out, or the chip row's min-content sizes
          the only implicit track and the page scrolls sideways. Both traps are
          in docs/PAGE-SHAPE.md and both have been hit on this page before. */}
      <div className="@container/page">
        {/* One column: the bar is a ROW of this grid, not a column of it. */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-y-3">
          <SectionRail
            label="Home workout sections"
            railAt="never"
            groups={HW_PANELS.map((p) => ({ id: p.id, label: p.label }))}
            value={panel}
            onChange={(id: string | null) => setPanel(id ?? 'history')}
          />
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-baseline gap-x-3 border-b border-line pb-1.5">
              <h2 className="text-heading font-medium text-fg-1">{current.label}</h2>
              <p className="text-label text-fg-2">{current.blurb}</p>
              {panel === 'history' && <span className="ml-auto"><ShowMore list={history} /></span>}
            </div>

            {panel === 'history' && (
              <>
                <SummaryStrip items={[
                  { label: 'Sessions', value: sessions.length, empty: sessions.length === 0 },
                  { label: 'Exercises logged', value: totalExercises, empty: sessions.length === 0 },
                  { label: 'Movements available', value: HOME_EXERCISES.length },
                ]} />
                <div className="mt-3">
                  <CalendarHeatmap ranges storageKey="homeworkout" fluid data={heat} unit="exercises" label="Home-workout exercises per day" />
                </div>
                {sessions.length === 0 ? (
                  <div className="mt-3"><EmptyFrame>Log a session and it appears here, newest first.</EmptyFrame></div>
                ) : (
                  /* A session is a named item with a figure beside the name and
                     a short body — the card this page now uses everywhere else.
                     It was a `border-b` list whose contents were behind a
                     disclosure, so reading what you actually did took a click
                     per session; at three rows there is nothing to save by
                     hiding six lines of text. */
                  <div className="mt-3">
                    <PanelGrid>
                      {history.shown.map((w) => (
                        <PanelCard
                          key={w.id}
                          title={prettyDay(w.date)}
                          right={
                            <span className="flex items-center gap-2">
                              <Tag>{w.sets.length} exercise{w.sets.length === 1 ? '' : 's'}</Tag>
                              {w.durationMin != null && <Tag>{w.durationMin}m</Tag>}
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => onRemove(w.id)}
                                aria-label={`Delete home workout on ${prettyDay(w.date)}`}
                                className="text-fg-2 reveal hover:text-red"
                              >×</Button>
                            </span>
                          }
                        >
                          <ul className="space-y-0.5 text-label text-fg-2">
                            {w.sets.map((line, i) => <li key={i} className="pl-3 -indent-3">· {line}</li>)}
                          </ul>
                          {w.notes && <p className="mt-2 border-t border-line pt-2 text-label text-fg-2 italic">“{w.notes}”</p>}
                        </PanelCard>
                      ))}
                    </PanelGrid>
                  </div>
                )}
              </>
            )}

            {panel === 'movements' && <ExerciseLibrary onAdd={onAdd} />}
            {panel === 'programming' && <Programming />}
            {panel === 'equipment' && <Equipment />}
            {panel === 'sources' && <Sources />}
          </div>
        </div>
      </div>
    </section>
  )
}
