import { Lock } from 'lucide-react'
import { useJournal } from '../store'
import { Card } from './ui'
import { cat } from '../lib/colors'
import { ACHIEVEMENTS, earnedAchievements } from '../lib/achievements'

/**
 * Achievement badges (HarambeFit-inspired). Earned badges light up in their
 * colour; locked ones are dimmed with a padlock. Everything is derived from
 * existing journal data · no new state.
 */
export function AchievementsCard() {
  const { data } = useJournal()
  const earned = new Set(earnedAchievements(data).map((a) => a.id))
  return (
    <Card title="Achievements" subtitle={`${earned.size} of ${ACHIEVEMENTS.length} unlocked`}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ACHIEVEMENTS.map((a) => {
          const got = earned.has(a.id)
          return (
            <div
              key={a.id}
              title={a.desc}
              className={`flex items-center gap-2 rounded-xl border p-2.5 transition-colors ${got ? '' : 'opacity-50'}`}
              style={{ borderColor: got ? cat(a.color) : cat('surface0'), background: got ? cat(a.color) + '14' : 'transparent' }}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-lg" style={{ background: got ? cat(a.color) + '22' : cat('surface0') }}>
                {got ? a.emoji : <Lock size={13} className="text-overlay0" />}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium" style={{ color: got ? cat('text') : cat('overlay0') }}>{a.label}</p>
                <p className="truncate text-[10px] text-overlay0">{a.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
