import { ArrowClockwise, CaretDown, CaretUp, Sword } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { cat, catA } from '../lib/colors'
import { todayISO } from '../lib/date'
import { missesFor, penaltyFor, scaleTask, TIER_META, PENALTIES, type PenaltyTier } from '../lib/penalties'
import { Card, Pill } from './ui'

/**
 * Make-up work surfaced when yesterday's tasks/habits/challenges were skipped.
 * Tier scales with how much slipped; the drill is a stable daily pick you can
 * re-roll. Dismissible for the day. Hidden when nothing was missed.
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
    <Card
      /* "Make-up work", not "Training penalty", and not "pay the toll". Loss
         framing outperforms reward framing for about a week and then loses
         badly, because the app becomes the thing that punishes you and you
         stop opening it. Same mechanic, same tiers, same drills — it just
         stops taking an adversarial stance toward the person using it. */
      title={<span className="inline-flex items-center gap-2"><Icon as={Sword} size="md" style={{ color: cat(meta.color) }} /> Make-up work</span>}
      subtitle={open ? 'Yesterday left something undone — here’s how to square it.' : <span style={{ color: cat(meta.color) }}>{penalty.title}: {task}</span>}
      help="Built from what yesterday actually missed: skipped habits, overdue tasks and unfinished challenge days. The more that slipped, the bigger the make-up. Re-roll for a different one, or dismiss it for the day."
      right={
        <span className="inline-flex items-center gap-2">
          <Pill color={meta.color} className="font-medium">{meta.label}</Pill>
          <button onClick={() => setOpen((o) => !o)} aria-label={open ? 'Collapse' : 'Expand'} className="text-fg-2 hover:text-fg-1">
            {open ? <Icon as={CaretUp} size="md" /> : <Icon as={CaretDown} size="md" />}
          </button>
        </span>
      }
    >
      {open && (
        <>
          <ul className="mb-3 space-y-0.5 text-body text-fg-2">
            {report.items.map((it, i) => (
              <li key={i} className="flex gap-2"><span className="text-fg-2">·</span>{it}</li>
            ))}
          </ul>
          <div className="rounded-xl border p-3" style={{ borderColor: catA(meta.color, 'edge'), background: catA(meta.color, 'quiet') }}>
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
              Done / dismiss
            </button>
          </div>
        </>
      )}
    </Card>
  )
}
