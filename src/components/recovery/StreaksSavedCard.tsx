import { ShieldCheck } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card } from '../ui'
import { cat } from '../../lib/colors'
import type { streaksSaved } from '../../lib/urge'

type Saved = ReturnType<typeof streaksSaved>

/** Streak-saved counter (#334) · resisted urges reframed as streaks protected. */
export function StreaksSavedCard({ saved }: { saved: Saved }) {
  return (
    <Card hideInfo title={<span className="inline-flex items-center gap-2"><Icon as={ShieldCheck} size="md" className="text-green" /> Streaks you saved</span>} subtitle="Every resisted urge was a reset that didn’t happen">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-display font-medium leading-none" style={{ color: cat('green') }}>{saved.saved}</div>
          <div className="mt-1 text-caption uppercase tracking-wide text-fg-2">urges resisted</div>
        </div>
        <p className="flex-1 text-body text-fg-2">
          That’s <strong style={{ color: cat('green') }}>{saved.saved} streak{saved.saved === 1 ? '' : 's'}</strong> you might have lost.
          {saved.savedToday > 0 && <> <span className="text-fg-2">{saved.savedToday} saved today</span> · keep the count climbing.</>}
        </p>
      </div>
    </Card>
  )
}
