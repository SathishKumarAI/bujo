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
  streakBeforeToday, completedDays, isFinished, rulesDoneOn,
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

      {/* Progress meter — whole-number percent, no fractions. */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-xs text-overlay0">
          <span>{pct}% complete</span>
          <span>{completedDays(data, c, today)} of {c.durationDays} days</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface0">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cat('mauve') }} />
        </div>
      </div>

      {/* Today's check-in */}
      {!notStarted && !finished && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-subtext1">Today’s rules</p>
          <ul className="space-y-1.5">
            {c.rules.map((rule, i) => {
              const done = todayDone.includes(i)
              return (
                <li key={i}>
                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <span className={done ? 'text-overlay1 line-through' : 'text-subtext1'}>{rule}</span>
                    <Switch checked={done} onCheckedChange={() => toggleChallengeRule(c.id, today, i)} />
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Day grid */}
      <div>
        <p className="mb-2 text-sm font-medium text-subtext1">Progress</p>
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: c.durationDays }).map((_, i) => {
            const d = addDays(c.startDate, i)
            const complete = isDayComplete(data, c, d)
            const isToday = d === today
            const past = dayDiff(d, today) > 0
            const bg = complete ? cat('green') : isToday ? 'transparent' : past ? cat('surface0') : cat('mantle')
            return (
              <span
                key={d}
                title={`Day ${i + 1} · ${d}${complete ? ' · done' : past ? ' · missed' : ''}`}
                className="grid h-6 w-6 place-items-center rounded text-[9px]"
                style={{ background: bg, border: isToday ? `1.5px solid ${cat('mauve')}` : `1px solid ${cat('surface0')}`, color: complete ? cat('crust') : cat('overlay0') }}
              >
                {i + 1}
              </span>
            )
          })}
        </div>
      </div>
    </Card>
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
