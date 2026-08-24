import { Lock } from '@/components/icons'
import { Icon } from '@/components/Icon'
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
    <Card band title="Achievements" subtitle={`${earned.size} of ${ACHIEVEMENTS.length} unlocked`}>
      {/* Two columns, never three. At three the tile is ~120px inside this
          card's column, and `truncate` turned every badge into "First w…",
          "Centur…", "Unbro…" — a wall of ellipses that names none of them.
          A badge you cannot read is not a reward.

          The label wraps instead of truncating (they are two or three words),
          and the description is clamped to two lines rather than one, so the
          tile grows a little instead of hiding what it is for. */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ACHIEVEMENTS.map((a) => {
          const got = earned.has(a.id)
          return (
            <div
              key={a.id}
              title={a.desc}
              className={`flex items-start gap-2 rounded-none border p-2.5 transition-colors ${got ? '' : 'opacity-50'}`}
              style={{ borderColor: got ? cat(a.color) : cat('surface0'), background: got ? cat(a.color) + '14' : 'transparent' }}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-none text-heading" style={{ background: got ? cat(a.color) + '22' : cat('surface0') }}>
                {got ? a.emoji : <Icon as={Lock} size="sm" className="text-fg-2" />}
              </span>
              <div className="min-w-0">
                <p className="text-body leading-snug font-medium" style={{ color: got ? cat('text') : cat('overlay0') }}>{a.label}</p>
                <p className="line-clamp-2 text-micro leading-snug text-fg-2">{a.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
