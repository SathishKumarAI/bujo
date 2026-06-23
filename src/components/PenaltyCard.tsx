import { useState } from 'react'
import { Swords, RotateCw, ChevronUp, ChevronDown } from 'lucide-react'
import { useJournal } from '../store'
import { cat } from '../lib/colors'
import { todayISO } from '../lib/date'
import { missesFor, penaltyFor, scaleTask, TIER_META, PENALTIES, type PenaltyTier } from '../lib/penalties'
import { Card } from './ui'

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
          <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: cat(meta.color) + '22', color: cat(meta.color) }}>{meta.label}</span>
          <button onClick={() => setOpen((o) => !o)} aria-label={open ? 'Collapse' : 'Expand'} className="text-overlay0 hover:text-text">
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </span>
      }
    >
      {open && (
        <>
          <ul className="mb-3 space-y-0.5 text-sm text-subtext0">
            {report.items.map((it, i) => (
              <li key={i} className="flex gap-2"><span className="text-overlay0">·</span>{it}</li>
            ))}
          </ul>
          <div className="rounded-xl border p-3" style={{ borderColor: cat(meta.color) + '55', background: cat(meta.color) + '11' }}>
            <p className="font-display text-lg font-semibold" style={{ color: cat(meta.color) }}>{penalty.title}</p>
            <p className="text-sm text-text">{task} <span className="text-xs text-overlay0">· {level}</span></p>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <button onClick={() => setReroll((r) => r + 1)} className="inline-flex items-center gap-1 text-subtext1 hover:text-text">
              <RotateCw size={13} /> Re-roll
            </button>
            <button
              onClick={() => { localStorage.setItem(dismissKey, '1'); setDismissed(true) }}
              className="ml-auto text-overlay0 hover:text-text"
            >
              Served it / dismiss
            </button>
          </div>
        </>
      )}
    </Card>
  )
}
