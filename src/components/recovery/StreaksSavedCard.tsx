import { ShieldCheck } from 'lucide-react'
import { Card } from '../ui'
import { cat } from '../../lib/colors'
import type { streaksSaved } from '../../lib/urge'

type Saved = ReturnType<typeof streaksSaved>

/** Streak-saved counter (#334) · resisted urges reframed as streaks protected. */
export function StreaksSavedCard({ saved }: { saved: Saved }) {
  return (
    <Card title={<span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-green" /> Streaks you saved</span>} subtitle="Every resisted urge was a reset that didn’t happen" help="Each urge you surfed was a moment that could have become a reset. Counting them reframes resistance as progress protected — not just willpower spent, but streaks kept alive.">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-4xl font-extrabold leading-none" style={{ color: cat('green') }}>{saved.saved}</div>
          <div className="mt-1 text-[11px] uppercase tracking-wide text-overlay0">urges resisted</div>
        </div>
        <p className="flex-1 text-sm text-subtext0">
          That’s <strong style={{ color: cat('green') }}>{saved.saved} streak{saved.saved === 1 ? '' : 's'}</strong> you might have lost.
          {saved.savedToday > 0 && <> <span className="text-overlay1">{saved.savedToday} saved today</span> · keep the count climbing.</>}
        </p>
      </div>
    </Card>
  )
}
