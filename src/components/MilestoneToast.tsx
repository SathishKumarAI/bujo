import { useEffect, useRef, useState } from 'react'
import { useJournal } from '../store'
import { todayISO } from '../lib/date'
import { habitStreak, cleanStreak } from '../lib/stats'
import { isStreakMilestone, milestoneLabel, milestoneEmoji } from '../lib/milestones'
import { cat } from '../lib/colors'

interface Celebration { habit: string; streak: number }

/**
 * Mounts globally (in the shell) and celebrates the moment any habit's streak
 * crosses a milestone (7, 30, 100… days) — the lovable.dev "milestone
 * celebration" mechanic. Watches streaks across renders via a ref so it fires
 * once, on the crossing, regardless of which view logged the habit.
 */
export function MilestoneToast() {
  const { data } = useJournal()
  const prev = useRef<Record<string, number> | null>(null)
  const [party, setParty] = useState<Celebration | null>(null)

  useEffect(() => {
    const today = todayISO()
    const next: Record<string, number> = {}
    let hit: Celebration | null = null
    for (const h of data.habits) {
      const s = h.avoid ? cleanStreak(data, h.id, today) : habitStreak(data, h.id, today)
      next[h.id] = s
      // Skip the very first pass (prev == null) so existing streaks don't fire on load.
      const was = prev.current ? (prev.current[h.id] ?? 0) : s
      if (s > was && isStreakMilestone(s)) hit = { habit: h.name, streak: s }
    }
    prev.current = next
    // Defer out of the effect body to avoid a synchronous cascading render.
    if (hit) queueMicrotask(() => setParty(hit))
  }, [data])

  useEffect(() => {
    if (!party) return
    const t = setTimeout(() => setParty(null), 3400)
    return () => clearTimeout(t)
  }, [party])

  if (!party) return null
  const emoji = milestoneEmoji(party.streak)
  return (
    <div className="pointer-events-none fixed inset-0 z-[100] grid place-items-center" role="status" aria-live="polite">
      <div className="celebrate-pop flex flex-col items-center gap-1 rounded-2xl border border-surface1 bg-mantle/95 px-7 py-5 text-center shadow-2xl backdrop-blur">
        <div className="flex gap-1 text-3xl">
          <span className="celebrate-confetti" style={{ animationDelay: '0ms' }}>{emoji}</span>
          <span className="text-4xl">{emoji}</span>
          <span className="celebrate-confetti" style={{ animationDelay: '120ms' }}>{emoji}</span>
        </div>
        <p className="font-display text-xl text-text">{milestoneLabel(party.streak)}!</p>
        <p className="text-sm" style={{ color: cat('peach') }}>{party.habit} · keep it going</p>
      </div>
    </div>
  )
}
