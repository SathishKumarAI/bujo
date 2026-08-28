import { Archive, Plus, Trash, Trophy, X } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { Card, Input, Segmented } from '../components/ui'
import { Button } from '../components/ui/button'
import { Switch } from '../components/ui/switch'
import { Checkbox } from '../components/ui/checkbox'
import { PageLayout, StatBar, SummaryStrip, EmptyFrame } from '../components/page'
import { addDays, dayDiff, todayISO } from '../lib/date'
import { cat, onAccent } from '../lib/colors'
import type { Challenge, JournalData } from '../lib/types'
import { useConfirm } from '../components/ConfirmDialog'
import { QuietSection } from '../components/CollapsibleSection'
import {
  CHALLENGE_PRESETS, isDayComplete, percentComplete, missedDays,
  streakBeforeToday, completedDays, isFinished, rulesDoneOn, longestStreak, elapsedDay,
} from '../lib/challenges'

/**
 * CHALLENGES · fixed-length disciplines (75 Hard, 90-day, custom), on the
 * three-zone page contract.
 *
 * 1. ORIENT — the focused challenge in four facts. When more than one is
 *    running, a segmented control picks which; it filters all three zones.
 * 2. ACT — today's rules. This is the whole job of the page and it used to be
 *    third on the screen, under the report on having done it.
 * 3. REVIEW — three tiles that add up, then the calendar, then the archive.
 *
 * ── What was deleted, and why ────────────────────────────────────────────────
 *
 * The page used to state its progress five ways with four denominators, from a
 * single screen: `Day 4 of 75`, `5 of 75 days done`, `70 to go`, `7%`,
 * `70 Days left`, `9/75 Elapsed`. Each was correct under its own definition and
 * the page named none of them, so 4, 5, 9 and 70 read as four contradictory
 * counts of the same thing.
 *
 * Now every number on the page belongs to one arithmetic:
 *
 *     days done + days missed + today = the day you are on = `elapsedDay`
 *
 * `progressDay` is gone from the app entirely (it was `streak + 1` on a strict
 * challenge, which is the streak said twice). The strict reset story is told by
 * the streak fact and the pill, which is where it was always legible.
 *
 * Also gone: the progress ring and the progress bar — both restated the percent
 * printed beside them, and the calendar shows the same shape with the dates
 * attached. `Days left` (duration − completed) is gone, because it counted a
 * different thing from `Day n of N` and was the number that made the set read
 * as broken.
 */
export function Challenges() {
  const { data, addChallenge } = useJournal()
  const [creating, setCreating] = useState(false)
  const [focusId, setFocusId] = useState<string | null>(null)
  const all = data.challenges ?? []
  const active = all.filter((c) => !c.archived)
  const archived = all.filter((c) => c.archived)

  // Fall back to the first active challenge rather than trusting the stored id:
  // the focused one can be archived or deleted out from under this state, and a
  // dangling id would render an empty page with no way back.
  const focused = active.find((c) => c.id === focusId) ?? active[0]
  const today = todayISO()

  return (
    <PageLayout
      tier={1180}
      zone1={focused && <StatBar
        mode={active.length > 1 ? focused.id : undefined}
        onModeChange={active.length > 1 ? setFocusId : undefined}
        segments={active.length > 1 ? active.map((c) => ({ value: c.id, label: c.name })) : undefined}
        facts={orientFacts(data, focused, today)}
      />}
      zone2={
        creating ? (
          <Card band hideInfo title="New challenge" right={
            <Button variant="ghost" size="icon-sm" onClick={() => setCreating(false)} aria-label="Cancel new challenge">
              <Icon as={X} size="sm" />
            </Button>
          }>
            <NewChallengeForm onCreate={(c) => { addChallenge(c); setCreating(false) }} />
          </Card>
        ) : focused ? (
          <TodayCard challenge={focused} />
        ) : (
          <Card band hideInfo title="Start a challenge" subtitle="75 Hard, 90-day, or your own rules">
            <p className="mb-3 text-body text-fg-2">
              A challenge is a fixed number of days and a short list of rules you tick off each one.
            </p>
            <Button variant="primary" size="lg" className="w-full" onClick={() => setCreating(true)}>
              <Icon as={Plus} size="sm" /> New challenge
            </Button>
          </Card>
        )
      }
      zone3={<>
        <SummaryStrip items={reviewTiles(data, focused, today)} />

        {focused
          ? <ChallengeCalendar challenge={focused} today={today} />
          : <EmptyFrame>Your day grid fills in here once a challenge is running.</EmptyFrame>}

        {focused && !creating && (
          <div className="border-t border-line pt-3">
            <Button variant="ghost" size="sm" onClick={() => setCreating(true)}>
              <Icon as={Plus} size="sm" /> New challenge
            </Button>
          </div>
        )}

        {archived.length > 0 && (
          <QuietSection
            title={<>Completed &amp; archived</>}
            subtitle={`${archived.length} past challenge${archived.length === 1 ? '' : 's'}`}
          >
            <ul className="space-y-2 text-body">
              {archived.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-none border border-line bg-background px-3 py-2">
                  <span className="text-fg-1">
                    <Icon as={Trophy} size="sm" className="mr-1 inline text-fg-2" />{c.name} · {c.durationDays} days
                  </span>
                  <span className="text-label text-fg-2">{completedDays(data, c, today)} days done</span>
                </li>
              ))}
            </ul>
          </QuietSection>
        )}
      </>}
    />
  )
}

/**
 * The three counts that partition the elapsed window, so the strip is an
 * arithmetic rather than a pile: done + missed + (today, if still open) is the
 * day you are on. `Days left` used to sit here as duration − completed, which
 * counts from a different origin and is why the old set never added up.
 */
function reviewTiles(data: JournalData, c: Challenge | undefined, today: string) {
  if (!c) {
    return [
      { label: 'Days done', value: 0, empty: true },
      { label: 'Days missed', value: 0, empty: true },
      { label: 'Best streak', value: 0, empty: true },
    ]
  }
  return [
    { label: 'Days done', value: completedDays(data, c, today) },
    { label: 'Days missed', value: missedDays(data, c, today) },
    { label: 'Best streak', value: longestStreak(data, c, today) },
  ]
}

/** Zone 1. Four facts, each of which changes what you do in the next minute. */
function orientFacts(data: JournalData, c: Challenge, today: string) {
  const notStarted = dayDiff(c.startDate, today) < 0
  const finished = isFinished(data, c, today)
  const done = rulesDoneOn(data, c.id, today)
  const streak = streakBeforeToday(data, c, today) + (isDayComplete(data, c, today) ? 1 : 0)
  return [
    {
      label: 'Today',
      value: notStarted ? 'Not started' : finished ? 'Complete' : `${done.length} of ${c.rules.length} rules`,
      prose: notStarted || finished,
    },
    { label: 'Day', value: `${elapsedDay(c, today)} of ${c.durationDays}` },
    { label: 'Streak', value: streak },
    { label: 'Complete', value: `${percentComplete(data, c, today)}%` },
  ]
}

/** Zone 2 · the act. Tick today's rules; nothing else. */
function TodayCard({ challenge: c }: { challenge: Challenge }) {
  const confirm = useConfirm()
  const { data, toggleChallengeRule, updateChallenge, removeChallenge } = useJournal()
  const today = todayISO()
  const done = rulesDoneOn(data, c.id, today)
  const finished = isFinished(data, c, today)
  const notStarted = dayDiff(c.startDate, today) < 0

  return (
    <Card band hideInfo
      title={
        <span className="flex flex-wrap items-center gap-2">
          {c.name}
          {/* Neutral, not red. The contract spends a page's one accent on the
              primary button; a status pill that fills with a hue competes with
              it. The six words carry the stake on their own — which is why the
              copy is unchanged. */}
          {c.strict && (
            <span className="rounded-pill border border-line px-2 py-0.5 text-micro font-medium text-fg-2">
              strict · resets on a miss
            </span>
          )}
        </span>
      }
      subtitle={notStarted ? `Starts ${c.startDate}` : finished ? 'Finished' : `${done.length} of ${c.rules.length} done`}
      right={
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => updateChallenge(c.id, { archived: true })} aria-label="Archive challenge" title="Archive">
            <Icon as={Archive} size="sm" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Delete challenge" className="text-danger-text"
            onClick={async () => {
              if (await confirm({
                title: `Delete the “${c.name}” challenge?`,
                description: 'Its progress log and streak are deleted with it. This cannot be undone.',
                confirmLabel: 'Delete challenge', destructive: true,
              })) removeChallenge(c.id)
            }}>
            <Icon as={Trash} size="sm" />
          </Button>
        </div>
      }
    >
      {finished ? (
        <p className="flex items-center gap-1.5 rounded-none border border-line bg-ink-2 px-3 py-2 text-body text-fg-1">
          <Icon as={Trophy} size="sm" /> {c.durationDays} days done. Archive it to close it out.
        </p>
      ) : notStarted ? (
        <p className="text-body text-fg-2">Nothing to tick yet · day 1 is {c.startDate}.</p>
      ) : c.rules.length === 0 ? (
        <p className="text-body text-fg-2">This challenge has no rules, so every day counts as done.</p>
      ) : (
        <ul className="space-y-1.5">
          {c.rules.map((rule, i) => {
            const ruleDone = done.includes(i)
            return (
              <li key={i}>
                {/* A checkbox, not a switch. Ticking a rule for today records
                    that a thing happened on a date; a switch says a setting is
                    on from now until you change it. `min-h-11` because the
                    whole row is the target (WCAG 2.5.5) — the 20px box is the
                    mark, not the hit area. */}
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-none border border-line bg-background px-3 py-2 text-body">
                  <Checkbox checked={ruleDone} onCheckedChange={() => toggleChallengeRule(c.id, today, i)} />
                  <span className={ruleDone ? 'text-fg-2 line-through' : 'text-fg-1'}>{rule}</span>
                </label>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

/**
 * Zone 3's signature visual · one numbered cell per day of the challenge.
 *
 * Not `CalendarHeatmap`/`DayGrid`: those are week-columned trailing windows and
 * carry no text in a cell. A challenge is a sequence from day 1 to day N and
 * the day *number* is the thing people count in — "I'm on day 43" — so the
 * numbers stay and the grid runs in challenge order, not calendar order.
 *
 * Each cell carries its state as hidden text as well as colour. The old grid
 * put it in a `title` only, which is skipped outright on touch and by several
 * screen-reader pairings — the state was conveyed by colour alone.
 *
 * Always renders, including before the start date: an empty grid says "this is
 * where your 75 days will be", which is worth more than the space it costs.
 */
function ChallengeCalendar({ challenge: c, today }: { challenge: Challenge; today: string }) {
  const { data } = useJournal()
  return (
    // `w-fit`, so the heading and the legend sit over the grid rather than at
    // the far edge of a 700px review column. The grid is ~290px wide and the
    // column is not; justifying to the column put the legend a third of a
    // screen away from the colours it names.
    <div className="w-fit">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="text-label font-medium text-fg-1">Calendar</p>
        <div className="flex items-center gap-3 text-micro text-fg-2" aria-hidden="true">
          <span className="inline-flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: cat('mauve') }} /> done</span>
          <span className="inline-flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: cat('surface0') }} /> missed</span>
          <span className="inline-flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-[2px] border" style={{ borderColor: cat('mauve') }} /> today</span>
        </div>
      </div>
      <ul className="grid w-fit grid-cols-7 gap-1">
        {Array.from({ length: c.durationDays }).map((_, i) => {
          const d = addDays(c.startDate, i)
          const complete = isDayComplete(data, c, d)
          const isToday = d === today
          const past = dayDiff(d, today) > 0
          const state = complete ? 'done' : isToday ? 'today' : past ? 'missed' : 'to come'
          const bg = complete ? cat('mauve') : isToday ? 'transparent' : past ? cat('surface0') : cat('mantle')
          return (
            <li
              key={d}
              // 34px, not the old 28px: seven of these plus gaps is 286px, which
              // still fits a 390px phone, and the day number is the thing people
              // count in — "I'm on day 43" — so it should be readable at a
              // glance rather than a 10px tick.
              className="grid h-[34px] w-[34px] place-items-center rounded-[2px] text-label"
              style={{
                background: bg,
                border: isToday ? `1.5px solid ${cat('mauve')}` : `1px solid ${cat('surface0')}`,
                color: complete ? onAccent(cat('mauve')) : cat('subtext0'),
              }}
            >
              {i + 1}
              <span className="sr-only">{` · day ${i + 1}, ${d}, ${state}`}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function NewChallengeForm({ onCreate }: { onCreate: (c: Omit<Challenge, 'id'>) => void }) {
  const [presetName, setPresetName] = useState(CHALLENGE_PRESETS[0].name)
  const preset = CHALLENGE_PRESETS.find((p) => p.name === presetName)!
  const [name, setName] = useState(preset.name)
  const [duration, setDuration] = useState(String(preset.durationDays))
  const [strict, setStrict] = useState(preset.strict)
  const [rules, setRules] = useState(preset.rules.join('\n'))
  const [startDate, setStartDate] = useState(todayISO())

  function choosePreset(pn: string) {
    const p = CHALLENGE_PRESETS.find((x) => x.name === pn)!
    setPresetName(pn)
    setName(p.name === 'Custom' ? '' : p.name)
    setDuration(String(p.durationDays))
    setStrict(p.strict)
    setRules(p.rules.join('\n'))
  }

  function submit() {
    const ruleList = rules.split('\n').map((r) => r.trim()).filter(Boolean)
    if (!name.trim() || ruleList.length === 0 || !Number(duration)) return
    onCreate({ name: name.trim(), durationDays: Number(duration), startDate, rules: ruleList, strict })
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-label text-fg-2">Preset</p>
        <Segmented
          value={presetName}
          onChange={choosePreset}
          options={CHALLENGE_PRESETS.map((p) => ({ value: p.name, label: p.name }))}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-body text-fg-1">Name<Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My challenge" className="mt-1" /></label>
        <label className="block text-body text-fg-1">Days<Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1" /></label>
        <label className="block text-body text-fg-1">Start<Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" /></label>
      </div>
      <label className="block text-body text-fg-1">
        Daily rules (one per line)
        <textarea
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          rows={4}
          placeholder={'Two 45-min workouts\nDrink water\nRead 10 pages'}
          className="mt-1 w-full rounded-control border border-input bg-background px-3 py-2 text-body text-fg-1 placeholder:text-fg-2 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        />
      </label>
      <label className="flex cursor-pointer items-center justify-between text-body text-fg-1">
        <span>Strict · missing a day resets to day 1 (the 75 Hard rule)</span>
        <Switch checked={strict} onCheckedChange={setStrict} />
      </label>
      <Button variant="primary" size="lg" onClick={submit} className="w-full">Start challenge</Button>
    </div>
  )
}
