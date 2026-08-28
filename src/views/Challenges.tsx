import { Archive, CaretRight, Flame, Plus, Trash, Trophy, X } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { Card, Empty, Input, Segmented } from '../components/ui'
import { Button } from '../components/ui/button'
import { Switch } from '../components/ui/switch'
import { Page } from '../components/shell/Page'
import { addDays, dayDiff, todayISO } from '../lib/date'
import { cat, onAccent } from '../lib/colors'
import type { Challenge } from '../lib/types'
import { useConfirm } from '../components/ConfirmDialog'
import { QuietSection } from '../components/CollapsibleSection'
import {
  CHALLENGE_PRESETS, isDayComplete, progressDay, percentComplete,
  streakBeforeToday, completedDays, isFinished, rulesDoneOn, longestStreak, elapsedDay,
} from '../lib/challenges'

export function Challenges() {
  const { data, addChallenge } = useJournal()
  const [creating, setCreating] = useState(false)
  const active = (data.challenges ?? []).filter((c) => !c.archived)
  const archived = (data.challenges ?? []).filter((c) => c.archived)

  return (
    <Page className="gap-0 sm:gap-0">
      <Card band
        title="Challenges"
        subtitle="Fixed-length discipline challenges, 75 Hard, 90-day & more"
        right={
          <Button variant="secondary" onClick={() => setCreating((v) => !v)} className="inline-flex items-center gap-1.5">
            {creating ? <Icon as={X} size="sm" /> : <Icon as={Plus} size="sm" />} {creating ? 'Cancel' : 'New challenge'}
          </Button>
        }
      >
        {creating && <NewChallengeForm onCreate={(c) => { addChallenge(c); setCreating(false) }} />}
        {!creating && active.length === 0 && (
          <Empty>No active challenge. Start one · pick 75 Hard, 90-day, or build your own.</Empty>
        )}
      </Card>

      {active.length > 0 && (
        <div className="grid items-start gap-5 lg:grid-cols-2">
          {active.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
        </div>
      )}

      {archived.length > 0 && (
        <QuietSection
          title={<>Completed &amp; archived</>}
          subtitle={`${archived.length} past challenge${archived.length === 1 ? '' : 's'}`}
        >
            <Card band title="Completed & archived" subtitle="Your past challenges">
              <ul className="space-y-2 text-body">
                {archived.map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded-none border border-line bg-background px-3 py-2">
                    <span className="text-fg-1"><Icon as={Trophy} size="sm" className="mr-1 inline text-yellow" />{c.name} · {c.durationDays} days</span>
                    <span className="text-label text-fg-2">{completedDays(data, c, todayISO())} days done</span>
                  </li>
                ))}
              </ul>
            </Card>
        </QuietSection>
      )}
    </Page>
  )
}

function ChallengeCard({ challenge: c }: { challenge: Challenge }) {
  const confirm = useConfirm()
  const { data, toggleChallengeRule, updateChallenge, removeChallenge } = useJournal()
  // Open by default, like every other fold in the app. This one is hand-rolled
  // (a caret button, not one of the three collapse primitives), which is why the
  // sweep that opened the rest walked straight past it.
  const [calOpen, setCalOpen] = useState(true)
  const today = todayISO()
  const day = progressDay(data, c, today)
  const pct = percentComplete(data, c, today)
  const streak = streakBeforeToday(data, c, today) + (isDayComplete(data, c, today) ? 1 : 0)
  const todayDone = rulesDoneOn(data, c.id, today)
  const finished = isFinished(data, c, today)
  const notStarted = dayDiff(c.startDate, today) < 0

  return (
    <Card band
      title={<span className="flex items-center gap-2">{c.name}{c.strict && <span className="rounded-none bg-red/15 px-2 py-0.5 text-micro font-medium text-red">strict · resets on a miss</span>}</span>}
      subtitle={notStarted ? `Starts ${c.startDate}` : `Day ${day} of ${c.durationDays}`}
      right={
        <div className="flex items-center gap-1">
          <span className="mr-1 inline-flex items-center gap-1 text-label text-peach" title="Current streak"><Icon as={Flame} size="sm" />{streak}</span>
          <Button variant="ghost" size="icon-sm" onClick={() => updateChallenge(c.id, { archived: true })} aria-label="Archive challenge" title="Archive"><Icon as={Archive} size="sm" /></Button>
          <Button variant="ghost" size="icon-sm" onClick={async () => { if (await confirm({
            title: `Delete the “${c.name}” challenge?`,
            description: 'Its progress log and streak are deleted with it. This cannot be undone.',
            confirmLabel: 'Delete challenge', destructive: true,
          })) removeChallenge(c.id) }} aria-label="Delete challenge" className="text-red hover:text-red"><Icon as={Trash} size="sm" /></Button>
        </div>
      }
    >
      {finished && (
        <p className="mb-3 flex items-center gap-1.5 rounded-none border border-green/30 bg-green/10 px-3 py-2 text-body text-green">
          <Icon as={Trophy} size="sm" /> Challenge complete · {c.durationDays} days done. Archive it to celebrate.
        </p>
      )}

      {/* Progress · ring + bar + headline stats (whole numbers, no fractions). */}
      <div className="mb-4 flex items-center gap-4">
        <ProgressRing pct={pct} />
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between text-label text-fg-2">
            <span>{completedDays(data, c, today)} of {c.durationDays} days done</span>
            <span>{Math.max(0, c.durationDays - completedDays(data, c, today))} to go</span>
          </div>
          <div className="h-2 overflow-hidden rounded-none bg-ink-2">
            <div className="h-full rounded-none transition-[width]" style={{ width: `${pct}%`, background: cat(pct >= 100 ? 'green' : 'mauve') }} />
          </div>
          <div className="mt-2 flex gap-4 text-label">
            <span className="inline-flex items-center gap-1 text-peach"><Icon as={Flame} size="sm" /> {streak} streak</span>
            {/* Say WHICH day this is. For a strict challenge `progressDay` is
                the current run (streak + 1), so the card was showing "Day 5",
                "7 of 75 days done" and "Elapsed 9/75" together and reading as
                three contradictory counts of the same thing. They are three
                different facts; only the label was missing. */}
            <span className="text-fg-2" title={c.strict ? 'Days since your last reset' : 'Days since the challenge started'}>
              Day {day} of {c.durationDays}{c.strict ? ' · since last reset' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Today's check-in */}
      {!notStarted && !finished && (
        <div className="mb-4">
          <p className="mb-2 text-body font-medium text-fg-1">Today’s rules <span className="text-fg-2">({todayDone.length}/{c.rules.length})</span></p>
          <ul className="space-y-1.5">
            {c.rules.map((rule, i) => {
              const ruleDone = todayDone.includes(i)
              return (
                <li key={i}>
                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-none border border-line bg-background px-3 py-2 text-body">
                    <span className={ruleDone ? 'text-fg-2 line-through' : 'text-fg-1'}>{rule}</span>
                    <Switch checked={ruleDone} onCheckedChange={() => toggleChallengeRule(c.id, today, i)} />
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Stats block */}
      <div className="mb-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
        <Stat label="Current streak" value={`${streak}`} icon="" color="peach" />
        <Stat label="Best streak" value={`${longestStreak(data, c, today)}`} icon="" color="yellow" />
        <Stat label="Days left" value={`${Math.max(0, c.durationDays - completedDays(data, c, today))}`} color="blue" />
        <Stat label="Elapsed" value={`${elapsedDay(c, today)}/${c.durationDays}`} color="mauve" />
      </div>

      {/* Calendar grid · collapsed by default so the daily check-in stays prominent. */}
      <div>
        <button
          type="button"
          onClick={() => setCalOpen((o) => !o)}
          aria-expanded={calOpen}
          className="flex w-full items-center gap-1.5 text-body font-medium text-fg-1 hover:text-fg-1"
        >
          <span className="caret-turn caret-turn-quarter inline-flex text-fg-2" data-open={calOpen}><Icon as={CaretRight} size="sm" /></span>
          Calendar
        </button>
        {calOpen && (
          <div className="collapse-in">
            <div className="mt-2 mb-2 flex items-center justify-end">
              <div className="flex items-center gap-3 text-micro text-fg-2">
                <span className="inline-flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded" style={{ background: cat('green') }} /> done</span>
                <span className="inline-flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded" style={{ background: cat('surface0') }} /> missed</span>
                <span className="inline-flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded border" style={{ borderColor: cat('mauve') }} /> today</span>
              </div>
            </div>
            <div className="grid w-fit grid-cols-7 gap-1">
              {Array.from({ length: c.durationDays }).map((_, i) => {
                const d = addDays(c.startDate, i)
                const complete = isDayComplete(data, c, d)
                const isToday = d === today
                const past = dayDiff(d, today) > 0
                const bg = complete ? cat('green') : isToday ? 'transparent' : past ? cat('surface0') : cat('mantle')
                return (
                  <span
                    key={d}
                    title={`Day ${i + 1}, ${d}${complete ? ', done' : past ? ', missed' : isToday ? ', today' : ''}`}
                    className="grid h-7 w-7 place-items-center rounded text-micro"
                    style={{ background: bg, border: isToday ? `1.5px solid ${cat('mauve')}` : `1px solid ${cat('surface0')}`, color: complete ? onAccent(cat('green')) : cat('subtext0') }}
                  >
                    {i + 1}
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

function Stat({ label, value, icon, color }: { label: string; value: string; icon?: string; color: string }) {
  return (
    <div className="rounded-none border border-line bg-background py-2">
      <div className="text-heading font-medium" style={{ color: cat(color) }}>{icon && <span className="mr-1">{icon}</span>}{value}</div>
      <div className="text-micro text-fg-2">{label}</div>
    </div>
  )
}

/** Circular progress ring with a whole-number percent label. */
function ProgressRing({ pct }: { pct: number }) {
  const r = 26
  const circ = 2 * Math.PI * r
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" className="shrink-0">
      <circle cx="34" cy="34" r={r} fill="none" stroke={cat('surface0')} strokeWidth="6" />
      <circle cx="34" cy="34" r={r} fill="none" stroke={cat(pct >= 100 ? 'green' : 'mauve')} strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} transform="rotate(-90 34 34)" />
      <text x="34" y="38" textAnchor="middle" className="fill-text font-medium" fontSize="15">{pct}%</text>
    </svg>
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
    <div className="mb-2 space-y-3 rounded-none border border-line bg-background p-4">
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
          className="mt-1 w-full rounded-none border border-input bg-background px-3 py-2 text-body text-fg-1 placeholder:text-fg-2 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        />
      </label>
      <label className="flex cursor-pointer items-center justify-between text-body text-fg-1">
        <span>Strict · missing a day resets to Day 1 (75 Hard rule)</span>
        <Switch checked={strict} onCheckedChange={setStrict} />
      </label>
      <Button variant="secondary" size="lg" onClick={submit} className="w-full">Start challenge</Button>
    </div>
  )
}
