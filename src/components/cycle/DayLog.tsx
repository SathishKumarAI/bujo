import { useCappedList } from '../../lib/useCappedList'
import { ShowMore } from '../ShowMore'
import { prettyDay } from '../../lib/date'
import type { CyclePoint } from '../../lib/types'

/**
 * EVERY DAY YOU LOGGED, AND EVERYTHING YOU PUT ON IT.
 *
 * WHAT THIS FILE OWNS: one row per logged day, and which of that day's fields
 * are worth drawing.
 * WHAT IT DOES NOT OWN: the fields themselves (`DayMore` writes them), or
 * which day is selected (the page does).
 *
 * ── Why it exists ────────────────────────────────────────────────────────
 *
 * Reported as *"other details, same like logs, need to be maintained"*, and
 * the record bears it out. `CyclePoint` carries **fourteen** things a person
 * can put on a day — temperature, flags, flow, mucus, an LH test, intimacy,
 * drive, mood, energy, mood tags, cravings, symptoms, a note, and whether the
 * reading was disturbed. The month list drew four of them: the date, the
 * cycle day, the temperature and a dot per flag.
 *
 * So ten fields could be filled in and never seen again. Every averaging card
 * on this page reads them — `moodByPhase`, `driveByPhase`, the symptom grid —
 * but an average is not the record, and the day itself was unreachable once
 * it scrolled out of the month. Same shape as Challenges' rule notes, which
 * had one reader bound to `today`: the capability was there, the way back was
 * not.
 *
 * ── The rules that keep it honest ────────────────────────────────────────
 *
 * **Absent is not "no".** A day with no mucus recorded is not a dry day, and
 * `types.ts` says so at length. A field that was never filled draws nothing
 * at all rather than a zero, a dash or an empty chip — the row is what you
 * recorded, not a form with gaps in it.
 *
 * **Only days with something on them.** A row per calendar day would be 30
 * rows of which 8 say anything; the month list is already the calendar view,
 * and this is the record.
 *
 * **The row is the way back in.** Pressing it selects that day in the editor
 * — and moves the month cursor to it — which is the only way to correct a
 * field once the day has passed (`docs/USER-CONTROL.md`). Its accessible name
 * is its own text, not a tidier summary: see the comment on the button.
 */
export function DayLog({ entries, unit, cycleDayOf, today, selected, onPick }: {
  /** The whole log. Filtered and sorted here — newest first. */
  entries: CyclePoint[]
  unit: string
  cycleDayOf: (date: string) => number | null
  today: string
  selected: string
  onPick: (date: string) => void
}) {
  const logged = entries
    .filter((e) => e.date <= today && hasSomething(e))
    .sort((a, b) => b.date.localeCompare(a.date))
  const list = useCappedList(logged, 10)

  if (logged.length === 0) {
    return (
      <p className="text-body text-fg-2">
        Nothing logged yet. Flag a day in the editor and it appears here with everything you put on it.
      </p>
    )
  }

  return (
    <div>
      <ul className="space-y-1.5">
        {list.shown.map((e) => {
          const n = cycleDayOf(e.date)
          const isSel = e.date === selected
          return (
            <li key={e.date}>
              <button
                type="button"
                onClick={() => onPick(e.date)}
                aria-pressed={isSel}
                /* NO `aria-label`. The row's own text IS its name, and a
                   shorter label would be a `label-content-name-mismatch`
                   (WCAG 2.5.3) — the rule compares the name against what is
                   DRAWN, and the drawn row carries the whole day. Caught by
                   `a11y:panels` on the run that armed this row, which is why
                   a new row and its gate entry go in one commit. */
                className={`flex w-full flex-wrap items-baseline gap-x-2 gap-y-1 rounded-card border px-3 py-2 text-left transition-colors ${
                  /* SELECTED IS A BORDER, not a lighter fill. `bg-ink-3`
                     under `fg-2` measures **3.83:1** in mocha — under the 4.5
                     floor, and found by the same gate run. A state ramp
                     belongs in the border, which is a graphic at 3:1 rather
                     than text at 4.5; the fill stays the one the text was
                     solved against. */
                  isSel ? 'border-line-strong bg-ink-2' : 'border-transparent bg-ink-2 hover:border-line'
                }`}
              >
                <span className="text-body text-fg-1">{prettyDay(e.date)}</span>
                {n != null && <span className="num shrink-0 text-label text-fg-2">day {n}</span>}
                {e.date === today && <span className="shrink-0 text-label text-fg-2">today</span>}
                {e.temp != null && (
                  <span className="num shrink-0 text-label text-fg-1">
                    {e.temp}°{unit}
                    {/* A disturbed reading is still a reading; it is the
                        detection engine that ignores it, not the record. */}
                    {e.tempDisturbed && <span className="ml-1 text-fg-2">disturbed</span>}
                  </span>
                )}
                <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                  {details(e).map((d) => (
                    <span key={d} className="text-label text-fg-2">{d}</span>
                  ))}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <ShowMore list={list} className="mt-2" />
    </div>
  )
}

/** Did the reader put anything on this day at all? */
function hasSomething(e: CyclePoint): boolean {
  return e.flags.length > 0 || e.temp != null || e.note != null || e.drive != null
    || e.flow != null || e.mucus != null || e.lh != null || e.intimacy != null
    || e.mood != null || e.energy != null
    || (e.moodTags?.length ?? 0) > 0 || (e.cravings?.length ?? 0) > 0 || (e.symptoms?.length ?? 0) > 0
}

/**
 * The day's fields as short phrases, in the order they are asked for in the
 * editor — so the row reads back the way it was written.
 *
 * Each is `label value`, never a bare number: `3` on its own says nothing,
 * and this row sits beside four other numbers. A 1–5 rating carries its scale
 * (`mood 3/5`) because the scale is the half that makes it readable.
 */
function details(e: CyclePoint): string[] {
  const out: string[] = []
  if (e.flags.length > 0) out.push(e.flags.join(' · '))
  if (e.flow) out.push(`flow ${e.flow.replace('-', ' ')}`)
  if (e.mucus) out.push(`mucus ${e.mucus.replace('-', ' ')}`)
  if (e.lh && e.lh !== 'not-taken') out.push(`LH ${e.lh}`)
  if (e.intimacy && e.intimacy !== 'none') out.push(`intimacy ${e.intimacy}`)
  if (e.drive != null) out.push(`drive ${e.drive}/5`)
  if (e.mood != null) out.push(`mood ${e.mood}/5`)
  if (e.energy != null) out.push(`energy ${e.energy}/5`)
  if (e.moodTags?.length) out.push(e.moodTags.join(' · '))
  if (e.symptoms?.length) out.push(e.symptoms.join(' · '))
  if (e.cravings?.length) out.push(`craving ${e.cravings.join(' · ')}`)
  if (e.note) out.push(`“${e.note}”`)
  return out
}
