import { useState, type ReactNode } from 'react'
import { Archive, CaretDown, Check, ListChecks, Plus, SlidersHorizontal, Trash, Trophy } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Cells, Cell } from '../ui/cells'
import { Sheet } from '../ui/sheet'
import { DayStrip } from '../ui/dayStrip'
import { useConfirm } from '../ConfirmDialog'
import { useJournal } from '../../store'
import { addDays, dayDiff, prettyDay } from '../../lib/date'
import { cat } from '../../lib/colors'
import type { Challenge } from '../../lib/types'
import {
  completedDays, elapsedDay, isDayComplete, isFinished, missedDays, nextStep, percentComplete,
  ruleCompletion, rulesDoneOn, streakBeforeToday,
} from '../../lib/challenges'

/**
 * CHALLENGES ON A PHONE — Nutrition's and Program's shape.
 *
 * OWNS: the phone drawing. A select for the challenge when more than one is
 * running; the shared `DayStrip` for the day being ticked (each chip says if
 * it was complete; arrows reach any past week); one scoreboard (day n of N, the next-step sentence, done /
 * missed / streak); one row per rule with a tap-to-tick circle and its record
 * so far ("8 of 10 days"), opening in place to "what was it"; a dock with
 * Manage (archive, delete, every past day, a new challenge) and "Tick all".
 * DOES NOT OWN: any arithmetic (`lib/challenges.ts`) or the note editor, the
 * day calendar and the new-challenge form, which the view hands in — the
 * desktop draws the same three.
 *
 * Owner ask, 2026-10-30: "make the same changes … in the mobile version of
 * this page as well" — after Nutrition went to this shape (#477).
 */
export function ChallengesPhone({ active, focused, onFocus, today, note, calendar, newForm, archived }: {
  active: Challenge[]
  focused: Challenge | undefined
  onFocus: (id: string) => void
  today: string
  /** The "what was it" field under a ticked rule, for a day. */
  note: (index: number, day: string) => ReactNode
  /** Every day of the challenge, as the desktop draws it; picking one closes the sheet. */
  calendar: (picked: string, onPick: (d: string) => void) => ReactNode
  /** The new-challenge form; `done` closes its sheet. */
  newForm: (done: () => void) => ReactNode
  archived: ReactNode
}) {
  const { data, toggleChallengeRule, updateChallenge, removeChallenge } = useJournal()
  const confirm = useConfirm()
  const [day, setDay] = useState(today)
  const [open, setOpen] = useState<number | null>(null)
  const [manage, setManage] = useState(false)
  const [creating, setCreating] = useState(false)

  if (!focused) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="sr-only">Challenges</h1>
        <Cells title="Start a challenge">
          <Cell icon={Plus} title="New challenge" subtitle="75 Hard, 90-day, or your own rules" onPress={() => setCreating(true)} />
        </Cells>
        {archived}
        <Sheet open={creating} onOpenChange={setCreating} title="New challenge">{newForm(() => setCreating(false))}</Sheet>
      </div>
    )
  }

  const c = focused
  // The day being ticked can never sit outside the challenge.
  const start = c.startDate
  const end = addDays(start, c.durationDays - 1)
  const d = dayDiff(start, day) < 0 ? start : dayDiff(day, end) < 0 ? end : day
  const notStarted = dayDiff(start, today) < 0
  const ahead = dayDiff(d, today) < 0
  const done = rulesDoneOn(data, c.id, d)
  const records = ruleCompletion(data, c, today)
  const allDone = c.rules.length > 0 && done.length >= c.rules.length
  const streak = streakBeforeToday(data, c, today) + (isDayComplete(data, c, today) ? 1 : 0)
  const n = dayDiff(start, d) + 1
  const dayName = d === today ? 'Today' : d === addDays(today, -1) ? 'Yesterday' : prettyDay(d)
  // Ticks only. At "Day n done" it is a state, not a toggle: one tap on a
  // button saying done must not untick five rules — a rule's own circle does that.
  const tickAll = () => c.rules.forEach((_, i) => { if (!done.includes(i)) toggleChallengeRule(c.id, d, i) })
  const pick = (x: string) => { setDay(x); setOpen(null) }

  return (
    <div className="flex flex-col gap-4 pb-2">
      <h1 className="sr-only">Challenges</h1>

      {active.length > 1 && (
        <label className="select-pill">
          <span className="sr-only">Challenge</span>
          <select value={c.id} onChange={(e) => { onFocus(e.target.value); setOpen(null) }}>
            {active.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
          <Icon as={CaretDown} size="sm" className="pointer-events-none text-fg-2" />
        </label>
      )}

      {!notStarted && (
        <DayStrip value={d} onChange={pick} today={today} label="Day to tick" min={start} max={dayDiff(end, today) > 0 ? end : today}
          mark={(x) => isDayComplete(data, c, x)
            ? <span style={{ color: cat('green') }}><Icon as={Check} size="sm" /><span className="sr-only"> every rule ticked</span></span>
            : <>{rulesDoneOn(data, c.id, x).length}/{c.rules.length}<span className="sr-only"> rules ticked</span></>} />
      )}

      {/* THE SCOREBOARD: where you are, what to do, and the three counts that
          add up to it (done + missed + today = day n). */}
      <section aria-label={`${c.name} so far`} className="cells px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className="score-num text-fg-1">{notStarted ? 0 : elapsedDay(c, today)}</span>
          <span className="min-w-0 truncate text-label text-fg-2">of {c.durationDays} days · {c.name}{c.strict ? ' · strict' : ''}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-pill bg-ink-2" role="progressbar" aria-label="Days complete" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentComplete(data, c, today)}>
          <div className="h-full rounded-pill bg-green transition-[width]" style={{ width: `${percentComplete(data, c, today)}%` }} />
        </div>
        <p className="mt-1.5 text-label text-fg-2">{nextStep(data, c, today).text}</p>
        <div className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-3">
          {([['Done', completedDays(data, c, today)], ['Missed', missedDays(data, c, today)], ['Streak', streak]] as const).map(([label, v]) => (
            <div key={label}>
              <span className="block text-label text-fg-2">{label}</span>
              <span className="block text-heading font-semibold text-fg-1 tabular-nums">{v}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ONE ROW PER RULE: tap the circle to tick; tap the row to say what it was. */}
      {isFinished(data, c, today) && d === today ? (
        <Cells title="Finished">
          <Cell icon={Trophy} tone="green" title={`${c.durationDays} days done`} subtitle="Archive it to close it out" onPress={() => updateChallenge(c.id, { archived: true })} label="Archive" />
        </Cells>
      ) : (
        <Cells title={notStarted ? 'Rules' : `Day ${n} · ${dayName}`} aside={notStarted ? `starts ${prettyDay(start)}` : `${done.length} of ${c.rules.length}`}>
          {c.rules.length === 0 && <p className="cell text-label text-fg-2">No rules, so every day counts as done.</p>}
          {c.rules.map((rule, i) => {
            const on = done.includes(i)
            const isOpen = open === i && on
            const r = records[i]
            return (
              <div key={i} className="lift-row" data-done={on || undefined}>
                <div className="flex items-center gap-1 pr-3">
                  <button type="button" className="check-circle ml-1" aria-pressed={on} disabled={notStarted || ahead}
                    aria-label={`${rule}: ${on ? 'done, tap to untick' : 'tap when done'}`} onClick={() => toggleChallengeRule(c.id, d, i)}>
                    <span aria-hidden><Icon as={Check} size="md" /></span>
                  </button>
                  <button type="button" className="min-w-0 flex-1 py-2.5 text-left" aria-expanded={on ? isOpen : undefined} disabled={!on}
                    onClick={() => setOpen(isOpen ? null : i)}>
                    <span className={`block text-body font-medium ${on ? 'text-fg-2' : 'text-fg-1'}`}>{rule}</span>
                    {r && <span className="block text-label text-fg-2">{r.done} of {r.of} days{on && ' · tap to say what it was'}</span>}
                  </button>
                  {on && <Icon as={CaretDown} size="sm" className={`shrink-0 text-fg-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
                </div>
                {isOpen && <div className="px-3 pb-3">{note(i, d)}</div>}
              </div>
            )
          })}
        </Cells>
      )}

      <div className="log-dock">
        <button type="button" className="round-btn" aria-label="Manage challenge" onClick={() => setManage(true)}>
          <Icon as={SlidersHorizontal} size="md" />
        </button>
        {!notStarted && c.rules.length > 0 && (
          <button type="button" className="cta cta-compact" disabled={allDone} onClick={tickAll}>
            <Icon as={allDone ? Check : ListChecks} size="md" />{allDone ? `Day ${n} done` : `Tick all · ${done.length}/${c.rules.length}`}
          </button>
        )}
      </div>

      <Sheet open={manage} onOpenChange={setManage} title={c.name} description={`Day ${notStarted ? 0 : elapsedDay(c, today)} of ${c.durationDays}`}>
        <div className="flex flex-col gap-4">
          <Cells>
            <Cell icon={Plus} title="New challenge" onPress={() => { setManage(false); setCreating(true) }} />
            <Cell icon={Archive} tone="overlay1" title="Archive" subtitle="Keep it, stop ticking it" onPress={() => { updateChallenge(c.id, { archived: true }); setManage(false) }} />
            <Cell icon={Trash} tone="red" title="Delete" subtitle="With its log and streak" onPress={async () => {
              if (await confirm({
                title: `Delete the “${c.name}” challenge?`,
                description: 'Its progress log and streak are deleted with it. This cannot be undone.',
                confirmLabel: 'Delete challenge', destructive: true,
              })) { removeChallenge(c.id); setManage(false) }
            }} />
          </Cells>
          {/* Every day of the challenge: tap one to tick or fix it. */}
          {calendar(d, (x) => { pick(x); setManage(false) })}
          {archived}
        </div>
      </Sheet>
      <Sheet open={creating} onOpenChange={setCreating} title="New challenge">{newForm(() => setCreating(false))}</Sheet>
    </div>
  )
}
