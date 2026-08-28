import { Plus } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card } from '../components/ui'
import { Button } from '../components/ui/button'
import { PageLayout, StatBar } from '../components/page'
import { DayAnatomy, DayChecklist, ProgramMap, useProgram } from '../components/program'
import { useNav } from '../components/shell/nav'
import { setPendingSession } from '../lib/pendingSession'

/**
 * The 12-Week Hypertrophy Block · a Body tab of its own.
 *
 * It used to be one line inside Strength's "Program & progress" fold, which
 * meant a twelve-week commitment lived two clicks down a page whose job is
 * logging today's sets. A program you follow six days a week for three months
 * is a destination, the same argument that made Pickleball a tab.
 *
 * **Only the tracker moved.** `ProgressPhotos` shared that fold and stayed in
 * Strength: it is not program data, and quietly relocating a feature while
 * moving its neighbour is how content goes missing in a refactor.
 *
 * On the three-zone contract:
 * - ORIENT · what today is, how big it is, and how far through the block you are.
 * - ACT    · the session panel — load the day into the logger, tick it all off,
 *            and see what the day works while you scroll the list.
 * - REVIEW · the program map and the day's exercises.
 *
 * The checklist is REVIEW rather than ACT for the reason Pull-ups already
 * settled: a twelve-week plan you tick off and read your position in is
 * reviewing, and it needs the 62% column — "Superset: tri skull crusher + bi
 * hammer curls" does not fit the 380px act column at any width.
 *
 * Before this the page was a single `Card` in the 820 tier: 820px of content in
 * a 1392px container at 1440, with the body map below the fold and 572px of the
 * page empty beside it.
 *
 * The pull-up program keeps its own home in `views/Pullups.tsx` — same hook,
 * same children, arranged as one card by `components/program/ProgramTracker`.
 */
export function Program() {
  const navigate = useNav()
  const s = useProgram('hyper12')

  // The day the PROGRAM says you are on, which is only the day on screen until
  // you start browsing. Read off `days` rather than `cur` — `cur` follows the
  // grid, so "Next up: Legs" would have renamed itself the moment you clicked
  // a push day to see what was in it.
  const up = s.days.find((d) => d.week === s.resume.week && d.day === s.resume.day) ?? s.days[0]

  const facts = [
    {
      // The one fact that changes what you do next, and the only one that is a
      // destination: tapping it is the "Continue" affordance the old card had
      // to spend a row on.
      label: s.browsing ? 'Next up' : 'Today',
      value: `${up.focus} · day ${up.day}`,
      prose: true,
      onClick: s.browsing ? () => s.goTo(s.resume.week, s.resume.day) : undefined,
    },
    // "7 lifts · 22 sets" is 17 characters in a fact that gets a 160px half-row
    // on a phone, and it truncated to "22 s…". The lift count is the
    // denominator of the fact beside it, so this keeps the number that is not
    // already on screen; the session panel spells both out.
    { label: 'This session', value: `${s.stats.sets} sets` },
    { label: 'Day', value: `${s.curDoneCount}/${s.cur.exercises.length} done` },
    { label: 'Block', value: `${s.totalDays - s.doneCount} days left` },
  ]

  return (
    <PageLayout
      tier={1180}
      zone1={<StatBar facts={facts} />}
      zone2={
        <Card
          band
          hideInfo
          title={`${s.unit} ${s.week} · day ${s.day}`}
          subtitle={`${s.cur.focus} · ${s.stats.exercises} lifts · ${s.stats.sets} sets`}
        >
          <div className="flex flex-wrap gap-2">
            {/* The logger lives on another tab, and its rows are local state,
                so this hands the day's lifts over and follows them there. See
                `lib/pendingSession`. */}
            <Button
              onClick={() => {
                setPendingSession(s.cur.exercises.map((e) => e.name))
                navigate('gym')
              }}
              className="press-3d rounded-control inline-flex items-center gap-1.5"
            >
              <Icon as={Plus} size="sm" /> Load into session
            </Button>
            <Button variant="secondary" onClick={s.toggleAll} className="rounded-control">
              {s.allCurDone ? 'Uncheck all' : 'Mark all done'}
            </Button>
          </div>

          {s.p.note && (
            <p className="mt-3 rounded-card border border-line bg-ink-0 px-3 py-2 text-label text-fg-2">{s.p.note}</p>
          )}

          {/* The map is in the ACT column because choosing the day *is* the act
              — and because this column is sticky (`PageLayout` engages it while
              the column fits the viewport), so the navigator follows you down a
              seven-lift list instead of scrolling away above it. */}
          <div className="mt-4 border-t border-line pt-4">
            <ProgramMap s={s} />
          </div>
        </Card>
      }
      zone3={
        <>
          <section aria-label={`${s.unit} ${s.week}, day ${s.day} exercises`}>
            <div className="mb-1 flex items-baseline justify-between gap-3 border-b border-line pb-1">
              <h2 className="text-label text-fg-2">{s.cur.focus} · day {s.day}</h2>
              <span className="num text-label text-fg-2">{s.curDoneCount}/{s.cur.exercises.length} done</span>
            </div>
            <DayChecklist s={s} />
          </section>
          {/* Last, deliberately. The body map is 317px and it is reference, not
              a step — above the checklist it pushed the seven things you came
              to tick off off a phone screen entirely. */}
          <DayAnatomy day={s.cur} />
        </>
      }
    />
  )
}
