import { ArrowClockwise, Sword } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { cat } from '../lib/colors'
import { todayISO } from '../lib/date'
import { missesFor, penaltyFor, scaleTask, TIER_META, PENALTIES, type PenaltyTier } from '../lib/penalties'
import { Card, Pill } from './ui'

/**
 * MAKE-UP WORK · a drill offered when yesterday's tasks, habits or challenges
 * were skipped. Tier scales with how much was missed; the drill is a stable
 * daily pick you can re-roll. Dismissible for the day, hidden when nothing was
 * missed.
 *
 * **The mechanic is unchanged; the frame is not.** This was "Training penalty",
 * and loss framing does beat reward framing — for about a week. After that the
 * app is the thing that punishes you for a bad Tuesday, and the way people stop
 * being punished by an app is by not opening it. "Make-up work" asks for the
 * same set of push-ups without the app taking an adversarial stance toward the
 * person using it.
 *
 * The storage key, the `penalties` module and `settings.penaltyLevel` keep
 * their names: renaming them would migrate data to change a word on screen.
 */
export function PenaltyCard() {
  const { data } = useJournal()
  const today = todayISO()
  const report = missesFor(data, today)
  const dismissKey = `bujo:penalty-dismissed:${today}`
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(dismissKey) === '1')
  const [reroll, setReroll] = useState(0)
  const [open, setOpen] = useState(false) // compact by default · it's a nudge, not the main event

  if (!report.tier || dismissed) return null
  const tier: PenaltyTier = report.tier
  const meta = TIER_META[tier]
  const level = data.settings.penaltyLevel ?? 'beginner'
  // Base daily pick, then step through the tier's pool on each re-roll.
  const pool = PENALTIES.filter((p) => p.tier === tier)
  const base = penaltyFor(tier, today)
  const idx = (pool.findIndex((p) => p.id === base.id) + reroll) % pool.length
  const penalty = pool[idx]
  const task = scaleTask(penalty.task, level) // doable for the user's chosen level

  return (
    <Card band
      title={<span className="inline-flex items-center gap-2"><Icon as={Sword} size="md" style={{ color: cat(meta.color) }} /> Make-up work</span>}
      subtitle={open ? 'Yesterday left something undone · here is the catch-up.' : <span style={{ color: cat(meta.color) }}>{penalty.title}: {task}</span>}
      right={<Pill color={meta.color} className="font-medium">{meta.label}</Pill>}
      hideInfo
      collapsible
      open={open}
      onOpenChange={setOpen}
    >
      <ul className="mb-3 space-y-0.5 text-body text-fg-2">
        {report.items.map((it, i) => (
          <li key={i} className="flex gap-2"><span className="text-fg-2">·</span>{it}</li>
        ))}
      </ul>
      <div className="rounded-card border p-3" style={{ borderColor: cat(meta.color) + '55', background: cat(meta.color) + '11' }}>
        <p className="font-display text-heading font-medium" style={{ color: cat(meta.color) }}>{penalty.title}</p>
        <p className="text-body text-fg-1">{task} <span className="text-label text-fg-2">{level}</span></p>
      </div>
      <div className="mt-3 flex items-center gap-3 text-label">
        <button onClick={() => setReroll((r) => r + 1)} className="inline-flex items-center gap-1 text-fg-1 hover:text-fg-1">
          <Icon as={ArrowClockwise} size="sm" /> Re-roll
        </button>
        <button
          onClick={() => { localStorage.setItem(dismissKey, '1'); setDismissed(true) }}
          className="ml-auto text-fg-2 hover:text-fg-1"
        >
          Done it / dismiss
        </button>
      </div>
    </Card>
  )
}
