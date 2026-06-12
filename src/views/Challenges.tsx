import { useState } from 'react'
import { Flame, Plus, Trophy, Archive, Trash2, X } from 'lucide-react'
import { useJournal } from '../store'
import { Button, Card, Empty, Input, Segmented } from '../components/ui'
import { Switch } from '../components/ui/switch'
import { Page } from '../components/shell/Page'
import { addDays, dayDiff, todayISO } from '../lib/date'
import { cat } from '../lib/colors'
import type { Challenge } from '../lib/types'
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
    <Page>
      <Card
        title="Challenges"
        subtitle="Fixed-length discipline challenges — 75 Hard, 90-day & more"
        right={
          <Button variant="primary" onClick={() => setCreating((v) => !v)} className="inline-flex items-center gap-1.5">
            {creating ? <X size={14} /> : <Plus size={14} />} {creating ? 'Cancel' : 'New challenge'}
          </Button>
        }
      >
        {creating && <NewChallengeForm onCreate={(c) => { addChallenge(c); setCreating(false) }} />}
        {!creating && active.length === 0 && (
          <Empty>No active challenge. Start one — pick 75 Hard, 90-day, or build your own.</Empty>
        )}
      </Card>

      {active.map((c) => <ChallengeCard key={c.id} challenge={c} />)}

      {archived.length > 0 && (
        <Card title="Completed & archived" subtitle="Your past challenges">
          <ul className="space-y-2 text-sm">
            {archived.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                <span className="text-subtext1"><Trophy size={14} className="mr-1 inline text-yellow" />{c.name} · {c.durationDays} days</span>
                <span className="text-xs text-overlay0">{completedDays(data, c, todayISO())} days done</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </Page>
  )
}

function ChallengeCard({ challenge: c }: { challenge: Challenge }) {
  const { data, toggleChallengeRule, updateChallenge, removeChallenge } = useJournal()
  const today = todayISO()
  const day = progressDay(data, c, today)
  const pct = percentComplete(data, c, today)
  const streak = streakBeforeToday(data, c, today) + (isDayComplete(data, c, today) ? 1 : 0)
  const todayDone = rulesDoneOn(data, c.id, today)
  const finished = isFinished(data, c, today)
  const notStarted = dayDiff(c.startDate, today) < 0

  return (
    <Card
      title={<span className="flex items-center gap-2">{c.name}{c.strict && <span className="rounded-full bg-red/15 px-2 py-0.5 text-[10px] font-medium text-red">strict · resets on a miss</span>}</span>}
      subtitle={notStarted ? `Starts ${c.startDate}` : `Day ${day} of ${c.durationDays}`}
      right={
        <div className="flex items-center gap-1">
          <span className="mr-1 inline-flex items-center gap-1 text-xs text-peach" title="Current streak"><Flame size={13} />{streak}</span>
          <Button onClick={() => updateChallenge(c.id, { archived: true })} aria-label="Archive challenge" title="Archive"><Archive size={14} /></Button>
          <Button variant="danger" onClick={() => { if (confirm(`Delete the "${c.name}" challenge and its log?`)) removeChallenge(c.id) }} aria-label="Delete challenge"><Trash2 size={14} /></Button>
        </div>
      }
    >
      {finished && (
        <p className="mb-3 flex items-center gap-1.5 rounded-lg border border-green/30 bg-green/10 px-3 py-2 text-sm text-green">
          <Trophy size={15} /> Challenge complete — {c.durationDays} days done. Archive it to celebrate.
        </p>
      )}

      {/* Progress — ring + bar + headline stats (whole numbers, no fractions). */}
      <div className="mb-4 flex items-center gap-4">
        <ProgressRing pct={pct} />
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between text-xs text-overlay0">
            <span>{completedDays(data, c, today)} of {c.durationDays} days done</span>
            <span>{Math.max(0, c.durationDays - completedDays(data, c, today))} to go</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface0">
            <div className="h-full rounded-full transition-[width]" style={{ width: `${pct}%`, background: cat(pct >= 100 ? 'green' : 'mauve') }} />
          </div>
          <div className="mt-2 flex gap-4 text-xs">
            <span className="text-peach">🔥 {streak} streak</span>
            <span className="text-subtext0">Day {day} of {c.durationDays}</span>
          </div>
        </div>
      </div>

      {/* Two-grid: check-in + stats (left) · calendar (right) */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          {/* Today's check-in */}
          {!notStarted && !finished && (
            <div>
              <p className="mb-2 text-sm font-medium text-subtext1">Today’s rules <span className="text-overlay0">({todayDone.length}/{c.rules.length})</span></p>
              <ul className="space-y-1.5">
                {c.rules.map((rule, i) => {
                  const ruleDone = todayDone.includes(i)
                  return (
                    <li key={i}>
                      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                        <span className={ruleDone ? 'text-overlay1 line-through' : 'text-subtext1'}>{rule}</span>
                        <Switch checked={ruleDone} onCheckedChange={() => toggleChallengeRule(c.id, today, i)} />
                      </label>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* Stats block */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <Stat label="Current streak" value={`${streak}`} icon="🔥" color="peach" />
            <Stat label="Best streak" value={`${longestStreak(data, c, today)}`} icon="🏅" color="yellow" />
            <Stat label="Days left" value={`${Math.max(0, c.durationDays - completedDays(data, c, today))}`} color="blue" />
            <Stat label="Elapsed" value={`${elapsedDay(c, today)}/${c.durationDays}`} color="mauve" />
          </div>
        </div>

        {/* Calendar grid — grouped into weeks of 7 for readability. */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-subtext1">Calendar</p>
            <div className="flex items-center gap-3 text-[10px] text-overlay0">
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
                  title={`Day ${i + 1} · ${d}${complete ? ' · done' : past ? ' · missed' : isToday ? ' · today' : ''}`}
                  className="grid h-7 w-7 place-items-center rounded text-[9px]"
                  style={{ background: bg, border: isToday ? `1.5px solid ${cat('mauve')}` : `1px solid ${cat('surface0')}`, color: complete ? cat('crust') : cat('overlay0') }}
                >
                  {i + 1}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </Card>
  )
}

function Stat({ label, value, icon, color }: { label: string; value: string; icon?: string; color: string }) {
  return (
    <div className="rounded-lg border border-surface0 bg-background py-2">
      <div className="text-lg font-bold" style={{ color: cat(color) }}>{icon && <span className="mr-1">{icon}</span>}{value}</div>
      <div className="text-[10px] text-overlay0">{label}</div>
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
      <text x="34" y="38" textAnchor="middle" className="fill-text font-bold" fontSize="15">{pct}%</text>
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
    <div className="mb-2 space-y-3 rounded-lg border border-border bg-background p-4">
      <div>
        <p className="mb-1.5 text-xs text-overlay0">Preset</p>
        <Segmented
          value={presetName}
          onChange={choosePreset}
          options={CHALLENGE_PRESETS.map((p) => ({ value: p.name, label: p.name }))}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm text-subtext1">Name<Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My challenge" className="mt-1" /></label>
        <label className="block text-sm text-subtext1">Days<Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1" /></label>
        <label className="block text-sm text-subtext1">Start<Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" /></label>
      </div>
      <label className="block text-sm text-subtext1">
        Daily rules (one per line)
        <textarea
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          rows={4}
          placeholder={'Two 45-min workouts\nDrink water\nRead 10 pages'}
          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-text placeholder:text-overlay0 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        />
      </label>
      <label className="flex cursor-pointer items-center justify-between text-sm text-subtext1">
        <span>Strict — missing a day resets to Day 1 (75 Hard rule)</span>
        <Switch checked={strict} onCheckedChange={setStrict} />
      </label>
      <Button variant="primary" onClick={submit} className="w-full">Start challenge</Button>
    </div>
  )
}
