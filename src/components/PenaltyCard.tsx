import { useState } from 'react'
import { Swords, RotateCw, ChevronUp, ChevronDown } from 'lucide-react'
import { useJournal } from '../store'
import { cat } from '../lib/colors'
import { todayISO } from '../lib/date'
import { missesFor, penaltyFor, scaleTask, TIER_META, PENALTIES, type PenaltyTier } from '../lib/penalties'
import { CARD, Card, Pill } from './ui'

/**
 * Anime-style "training penalty" surfaced when yesterday's tasks/habits/challenges
 * were skipped. Tier scales with how badly you slipped; the drill is a stable
 * daily pick you can re-roll. Dismissible for the day. Hidden when nothing missed.
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
      title={<span className="inline-flex items-center gap-2"><Swords size={18} style={{ color: cat(meta.color) }} /> Training penalty</span>}
      subtitle={open ? 'You skipped something yesterday · pay the toll.' : <span style={{ color: cat(meta.color) }}>{penalty.title}: {task}</span>}
      right={
        <span className="inline-flex items-center gap-2">
          <Pill color={meta.color} className="font-medium">{meta.label}</Pill>
          {/* Hand-rolled header, so it borrows Card's header-button target
              rather than shipping another bare 18px icon. */}
          <button onClick={() => setOpen((o) => !o)} aria-label={open ? 'Collapse training penalty' : 'Expand training penalty'} className={CARD.headerButton}>
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
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
          <div className="rounded-xl border p-3" style={{ borderColor: cat(meta.color) + '55', background: cat(meta.color) + '11' }}>
            <p className="font-display text-heading font-medium" style={{ color: cat(meta.color) }}>{penalty.title}</p>
            <p className="text-body text-fg-1">{task} <span className="text-label text-fg-2">{level}</span></p>
          </div>
          <div className="mt-3 flex items-center gap-3 text-label">
            <button onClick={() => setReroll((r) => r + 1)} className="inline-flex items-center gap-1 text-fg-1 hover:text-fg-1">
              <RotateCw size={13} /> Re-roll
            </button>
            <button
              onClick={() => { localStorage.setItem(dismissKey, '1'); setDismissed(true) }}
              className="ml-auto text-fg-2 hover:text-fg-1"
            >
              Served it / dismiss
            </button>
          </div>
        </>
      )}
    </Card>
  )
}
