import { Target } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Pill } from '../ui'
import { Button } from '../ui/button'
import { useNav } from '../shell/nav'
import { fromISODay, todayISO } from '../../lib/date'
import { ACADEMY_DRILLS, DRILL_FIXES } from '../../lib/pickleballAcademy'
import { PracticeTick } from '../coaching/PracticeTick'
import { VideoLink } from '../VideoLink'
import { drillQuery } from '../../lib/video'

/**
 * TODAY'S DRILL — one row of the orient block, not a card in the record.
 *
 * It was pinned above the review bar, where it read as the first panel: the
 * strip, the bar and the Sessions heading stacked into one grey run, reported
 * as *"the sessions look completely collapsed into"* the drill. It is not part
 * of the record at all — it is a thing to do today, which is what zone 1 is
 * for. Up there it shares the orient block with the sentence and the totals,
 * and the review starts with its own bar.
 *
 * One drill out of Coaching's twenty-one, chosen by the date so it is stable
 * for the day, with `from Coaching` naming where it comes from and the tick
 * writing into the same `settings.practiceLog` key the manual uses — drill it
 * here or there and it is one record.
 *
 * Two columns once the container clears **40rem**, not 58: with the log column
 * beside it (`actTop`) the orient block is 678px at a 1440 viewport, not 1110,
 * and the old threshold left the drill stacked at 140px. At 40rem it splits
 * into 288 + 366 and comes back to 90px. The threshold follows where the block
 * actually is, which is a thing only measurement can tell you.
 *
 * What you are doing on the left, why on the right. Stacked it is four short lines with half a page of nothing
 * beside them. The container is declared by the caller (`Page`'s orient
 * block) — a container query against a missing container matches nothing, at
 * any width, silently, which this repo has now hit three times.
 */
export function TodayDrill() {
  const nav = useNav()
  const today = todayISO()
  const drill = ACADEMY_DRILLS[(fromISODay(today).getDate() + fromISODay(today).getMonth() * 3) % ACADEMY_DRILLS.length]

  return (
    <section aria-label="Today's drill" className="grid gap-x-6 gap-y-2 border-t border-line pt-2.5 @min-[40rem]/orient:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <h2 className="inline-flex items-center gap-1.5 text-label font-medium text-fg-1">
            <Icon as={Target} size="sm" className="text-mauve" /> Today&apos;s drill
          </h2>
          <PracticeTick kind="drill" name={drill.name} className="ml-auto" />
        </div>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-body font-medium text-fg-1">{drill.name}</span>
          <Pill color="mauve" size="micro" className="px-2">{drill.skill}</Pill>
          <VideoLink name={drill.name} query={drillQuery(drill.name)} label="Watch how" />
        </p>
        <Button variant="ghost" onClick={() => nav('coaching')} title={`${ACADEMY_DRILLS.length} more drills, the warm-up and the twelve-week program, in Coaching`} className="mt-1 h-auto max-w-full truncate p-0 text-label text-fg-2 hover:text-fg-1 hover:no-underline">
          {/* Shortened once the block shares its row with the log: at 288px
              the old label ran past its column and butted against the "why"
              beside it, which reads as one run-on line rather than two
              columns. The full sentence survives as the title. */}
          {ACADEMY_DRILLS.length} more in Coaching →
        </Button>
      </div>
      <div className="min-w-0">
        {/* The complaint, not the category — and first, because it is the line
            that tells you whether today's drill is your problem. Rendered only
            when the group has one: a lookup that silently returns undefined is
            the trap `pickleballAcademy.test.ts` guards, and an empty line here
            would read as a missing sentence rather than an absent key. */}
        {DRILL_FIXES[drill.skill] && (
          <p className="text-label text-fg-1"><span className="text-fg-2">Fixes · </span>{DRILL_FIXES[drill.skill]}</p>
        )}
        <p className="mt-1 text-label text-fg-2">{drill.how}</p>
      </div>
    </section>
  )
}
